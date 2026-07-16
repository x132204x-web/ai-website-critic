#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import { chromium, type Page } from "playwright";
import { runJourney } from "./journey.js";
import { artifactPaths, normalizeLighthouseResult, renderEvidence, renderJourneyEvidence, validateJourneySpec, validateUrl } from "./lib.js";
import { Redactor, explainError } from "./privacy.js";
import type { AuditManifest, AuditStatus, JourneySpec, LighthouseProfile, LighthouseSummary, PageCapture, StageResult, ViewportName } from "./types.js";
import { TOOL_VERSION } from "./version.js";

export interface AuditOptions { kind: "audit"; url: URL; output: string; timeout: number; viewports: ViewportName[]; journeyFile?: string; journeyViewport?: ViewportName; lighthouseProfiles: LighthouseProfile[]; pageOnly: boolean; quiet: boolean }
export type ParsedCommand = AuditOptions | { kind: "help" } | { kind: "version" };
export class UsageError extends Error {}
export const HELP = `AI Website Critic ${TOOL_VERSION}\n\nUsage:\n  npm run audit -- <url> --journey <spec.json> [options]\n  npm run audit -- <url> --page-only [options]\n\nOptions:\n  --output <dir>                 Artifact directory\n  --timeout <ms>                 Navigation/action timeout (default: 30000)\n  --desktop-only                 Capture desktop only; also sets journey viewport\n  --mobile-only                  Capture mobile only; also sets journey viewport\n  --journey-viewport <profile>   Override journey viewport: mobile or desktop\n  --lighthouse <profiles>        mobile, desktop, both, or off (default: mobile)\n  --quiet                        Print only the final result\n  --help                         Show help and exit successfully\n  --version                      Show version and exit successfully\n\nExit codes: 0 complete, 1 usage/preflight error, 2 partial or failed audit.`;

function valueAfter(args: string[], i: number, option: string): string { const value = args[i + 1]; if (!value || value.startsWith("--")) throw new UsageError(`${option} requires a value`); return value; }
export function parseArgs(args: string[]): ParsedCommand {
  if (args.includes("--help")) return { kind: "help" };
  if (args.includes("--version")) return { kind: "version" };
  if (!args.length) throw new UsageError("A URL is required. Run with --help for usage.");
  const url = validateUrl(args[0]);
  let output = path.resolve("audits", `${url.hostname}-${new Date().toISOString().replaceAll(":", "-")}`);
  let timeout = 30_000, journeyFile: string | undefined, journeyViewport: ViewportName | undefined, pageOnly = false, quiet = false, desktop = false, mobile = false;
  let lighthouseProfiles: LighthouseProfile[] = ["mobile"];
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--output") output = path.resolve(valueAfter(args, i++, arg));
    else if (arg === "--journey") journeyFile = path.resolve(valueAfter(args, i++, arg));
    else if (arg === "--page-only") pageOnly = true;
    else if (arg === "--quiet") quiet = true;
    else if (arg === "--timeout") { timeout = Number(valueAfter(args, i++, arg)); if (!Number.isFinite(timeout) || timeout <= 0) throw new UsageError("--timeout must be a positive number"); }
    else if (arg === "--desktop-only") desktop = true;
    else if (arg === "--mobile-only") mobile = true;
    else if (arg === "--journey-viewport") { const v = valueAfter(args, i++, arg); if (v !== "desktop" && v !== "mobile") throw new UsageError("--journey-viewport must be desktop or mobile"); journeyViewport = v; }
    else if (arg === "--lighthouse") { const v = valueAfter(args, i++, arg); if (v === "both") lighthouseProfiles = ["mobile", "desktop"]; else if (v === "off") lighthouseProfiles = []; else if (v === "mobile" || v === "desktop") lighthouseProfiles = [v]; else throw new UsageError("--lighthouse must be mobile, desktop, both, or off"); }
    else throw new UsageError(`Unknown option: ${arg}`);
  }
  if (desktop && mobile) throw new UsageError("Use either --desktop-only or --mobile-only, not both");
  if (journeyFile && pageOnly) throw new UsageError("Use either --journey or --page-only, not both");
  if (!journeyFile && !pageOnly) throw new UsageError("A complete review requires --journey. Use --page-only only for evidence collection.");
  return { kind: "audit", url, output, timeout, viewports: desktop ? ["desktop"] : mobile ? ["mobile"] : ["desktop", "mobile"], journeyFile, journeyViewport, lighthouseProfiles, pageOnly, quiet };
}
export function resolveJourneyViewport(options: Pick<AuditOptions, "journeyViewport" | "viewports">, spec?: JourneySpec): ViewportName { return options.journeyViewport ?? (options.viewports.length === 1 ? options.viewports[0] : spec?.viewport ?? "mobile"); }
function report(options: AuditOptions, message: string) { if (!options.quiet) console.log(`[ai-website-critic] ${message}`); }
async function settle(page: Page, timeout: number) { await page.waitForLoadState("networkidle", { timeout: Math.min(timeout, 1500) }).catch(() => undefined); await page.waitForTimeout(250); }

async function capture(browser: Awaited<ReturnType<typeof chromium.connectOverCDP>>, name: ViewportName, url: string, file: string, timeout: number, redactor: Redactor): Promise<PageCapture> {
  const viewport = name === "desktop" ? { width: 1440, height: 1000, deviceScaleFactor: 1, isMobile: false } : { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true };
  const result: PageCapture = { name, requestedUrl: redactor.redact(url) ?? url, viewport, consoleIssues: [], requestFailures: [] };
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.deviceScaleFactor, isMobile: viewport.isMobile, hasTouch: viewport.isMobile });
  const page = await context.newPage();
  page.on("console", (msg) => { if (["error", "warning"].includes(msg.type())) result.consoleIssues.push({ type: msg.type(), text: redactor.redact(msg.text()) ?? "" }); });
  page.on("requestfailed", (request) => result.requestFailures.push({ url: redactor.redact(request.url()) ?? "[REDACTED]", method: request.method(), error: redactor.redact(request.failure()?.errorText ?? "Unknown failure") ?? "Unknown failure" }));
  try { await page.goto(url, { waitUntil: "domcontentloaded", timeout }); await settle(page, timeout); result.finalUrl = redactor.redact(page.url()); result.title = redactor.redact(await page.title()); await page.screenshot({ path: file, fullPage: true }); result.screenshot = path.relative(path.dirname(path.dirname(file)), file); }
  catch (error) { result.error = explainError(error, redactor); result.finalUrl = redactor.redact(page.url()); result.title = redactor.redact(await page.title().catch(() => "")); await page.screenshot({ path: file, fullPage: true }).then(() => { result.screenshot = path.relative(path.dirname(path.dirname(file)), file); }).catch(() => undefined); }
  finally { await context.close(); }
  return result;
}
async function collectLighthouse(url: string, port: number, timeout: number, profile: LighthouseProfile, redactor: Redactor): Promise<LighthouseSummary> {
  try { const raw = await lighthouse(url, { port, output: "json", logLevel: "error", maxWaitForLoad: timeout, onlyCategories: ["performance", "accessibility", "seo", "best-practices"] }, profile === "desktop" ? desktopConfig : undefined); return normalizeLighthouseResult(raw, redactor.redact(url) ?? url, profile); }
  catch (error) { return { requestedUrl: redactor.redact(url) ?? url, profile, fetchedAt: new Date().toISOString(), scores: {}, findings: [], error: explainError(error, redactor) }; }
}
function makeStage(status: StageResult["status"], start: number, error?: string): StageResult { return { status, durationMs: Date.now() - start, ...(error ? { error } : {}) }; }
function auditStatus(manifest: AuditManifest): AuditStatus { const stages = [...Object.values(manifest.stages.captures), ...Object.values(manifest.stages.lighthouse), ...(manifest.stages.journey ? [manifest.stages.journey] : [])].filter(Boolean) as StageResult[]; const complete = stages.filter((s) => s.status === "complete").length; return stages.some((s) => s.status === "failed") ? complete ? "partial" : "failed" : "complete"; }

export async function runAudit(options: AuditOptions): Promise<AuditStatus> {
  const began = Date.now(), createdAt = new Date().toISOString();
  const spec = options.journeyFile ? validateJourneySpec(JSON.parse(await fs.readFile(options.journeyFile, "utf8"))) : undefined;
  const journeyViewport = spec ? resolveJourneyViewport(options, spec) : undefined;
  const executable = chromium.executablePath();
  await fs.access(executable).catch(() => { throw new Error(`Browser executable not found at ${executable}. Run npx playwright install chromium.`); });
  const paths = artifactPaths(options.output, options.viewports, Boolean(spec));
  await fs.mkdir(path.join(options.output, "screenshots"), { recursive: true });
  const redactor = new Redactor(), pages: PageCapture[] = [], lighthouseResults: Partial<Record<LighthouseProfile, LighthouseSummary>> = {};
  let journey: Awaited<ReturnType<typeof runJourney>> | undefined;
  const manifest: AuditManifest = { version: 3, toolVersion: TOOL_VERSION, requestedUrl: options.url.href, createdAt, completedAt: createdAt, durationMs: 0, status: "failed", configuration: { viewports: options.viewports, journeyViewport, lighthouseProfiles: options.lighthouseProfiles }, stages: { captures: {}, lighthouse: {} }, artifacts: { pageData: "page-data.json", lighthouse: "lighthouse.json", evidence: "evidence.md", ...(spec ? { journey: "journey.json", journeyEvidence: "journey.md" } : {}), screenshots: Object.fromEntries(options.viewports.map((name) => [name, `screenshots/${name}.png`])) } };
  const persist = async () => { manifest.completedAt = new Date().toISOString(); manifest.durationMs = Date.now() - began; manifest.status = auditStatus(manifest); await fs.writeFile(paths.pageData, JSON.stringify({ version: 2, requestedUrl: redactor.redact(options.url.href), captures: pages }, null, 2)); await fs.writeFile(paths.lighthouse, JSON.stringify({ version: 2, profiles: lighthouseResults }, null, 2)); await fs.writeFile(paths.evidence, renderEvidence(options.url.href, pages, lighthouseResults, redactor)); if (journey && paths.journey && paths.journeyEvidence) { await fs.writeFile(paths.journey, JSON.stringify(journey, null, 2)); await fs.writeFile(paths.journeyEvidence, renderJourneyEvidence(journey)); } await fs.writeFile(paths.manifest, JSON.stringify(manifest, null, 2)); };
  report(options, `Preflight complete. Output: ${options.output}`);
  let chrome: Awaited<ReturnType<typeof launch>> | undefined; let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;
  try {
    chrome = await launch({ chromePath: executable, chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"] }); browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
    for (const name of options.viewports) { report(options, `Capturing ${name} page`); const start = Date.now(); const page = await capture(browser, name, options.url.href, paths.screenshots[name], options.timeout, redactor); pages.push(page); manifest.stages.captures[name] = makeStage(page.error ? "failed" : "complete", start, page.error); await persist(); }
    if (spec) { const start = Date.now(); report(options, `Running ${journeyViewport} journey`); journey = await runJourney(browser, options.url.href, spec, options.output, options.timeout, { viewport: journeyViewport!, redactor, onProgress: (message) => report(options, message) }); const error = journey.status === "failed" ? "One or more journey steps failed. Review journey.md and the failure screenshot." : undefined; manifest.stages.journey = makeStage(error ? "failed" : "complete", start, error); await persist(); }
    for (const profile of options.lighthouseProfiles) { report(options, `Running Lighthouse (${profile})`); const start = Date.now(); const summary = await collectLighthouse(options.url.href, chrome.port, options.timeout, profile, redactor); lighthouseResults[profile] = summary; manifest.stages.lighthouse[profile] = makeStage(summary.error ? "failed" : "complete", start, summary.error); await persist(); }
  } finally { await browser?.close().catch(() => undefined); try { chrome?.kill(); } catch {} }
  await persist(); console.log(`${manifest.status.toUpperCase()}: audit evidence written to ${options.output}`); return manifest.status;
}
export async function main(args = process.argv.slice(2)): Promise<number> { try { const command = parseArgs(args); if (command.kind === "help") { console.log(HELP); return 0; } if (command.kind === "version") { console.log(TOOL_VERSION); return 0; } return (await runAudit(command)) === "complete" ? 0 : 2; } catch (error) { console.error(explainError(error)); return 1; } }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().then((code) => { process.exitCode = code; });
