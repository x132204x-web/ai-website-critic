#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import { chromium } from "playwright";
import { runJourney } from "./journey.js";
import { artifactPaths, normalizeLighthouseResult, renderEvidence, renderJourneyEvidence, validateJourneySpec, validateUrl } from "./lib.js";
import type { JourneySpec, LighthouseSummary, PageCapture, ViewportName } from "./types.js";

interface Options { url: URL; output: string; timeout: number; viewports: ViewportName[]; journeyFile?: string }

function usage(): never {
  console.error("Usage: npm run audit -- <url> [--output <dir>] [--journey <spec.json>] [--desktop-only|--mobile-only] [--timeout <ms>]");
  process.exit(1);
}

export function parseArgs(args: string[]): Options {
  if (!args.length || args.includes("--help")) usage();
  const url = validateUrl(args[0]);
  let output = path.resolve("audits", `${url.hostname}-${new Date().toISOString().replaceAll(":", "-")}`);
  let timeout = 30_000;
  let viewports: ViewportName[] = ["desktop", "mobile"];
  let journeyFile: string | undefined;
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--output") output = path.resolve(args[++i] ?? usage());
    else if (arg === "--journey") journeyFile = path.resolve(args[++i] ?? usage());
    else if (arg === "--timeout") {
      timeout = Number(args[++i]);
      if (!Number.isFinite(timeout) || timeout <= 0) throw new Error("--timeout must be a positive number");
    } else if (arg === "--desktop-only") viewports = ["desktop"];
    else if (arg === "--mobile-only") viewports = ["mobile"];
    else throw new Error(`Unknown option: ${arg}`);
  }
  return { url, output, timeout, viewports, journeyFile };
}

async function capture(browser: Awaited<ReturnType<typeof chromium.connectOverCDP>>, name: ViewportName, url: string, file: string, timeout: number): Promise<PageCapture> {
  const viewport = name === "desktop"
    ? { width: 1440, height: 1000, deviceScaleFactor: 1, isMobile: false }
    : { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true };
  const result: PageCapture = { name, requestedUrl: url, viewport, consoleIssues: [], requestFailures: [] };
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.deviceScaleFactor, isMobile: viewport.isMobile });
  const page = await context.newPage();
  page.on("console", (msg) => { if (["error", "warning"].includes(msg.type())) result.consoleIssues.push({ type: msg.type(), text: msg.text() }); });
  page.on("requestfailed", (request) => result.requestFailures.push({ url: request.url(), method: request.method(), error: request.failure()?.errorText ?? "Unknown failure" }));
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout });
    result.finalUrl = page.url();
    result.title = await page.title();
    await page.screenshot({ path: file, fullPage: true });
    result.screenshot = path.relative(path.dirname(path.dirname(file)), file);
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  } finally { await context.close(); }
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const journeySpec: JourneySpec | undefined = options.journeyFile
    ? validateJourneySpec(JSON.parse(await fs.readFile(options.journeyFile, "utf8")))
    : undefined;
  const paths = artifactPaths(options.output, options.viewports, Boolean(journeySpec));
  await fs.mkdir(path.join(options.output, "screenshots"), { recursive: true });
  let chrome: Awaited<ReturnType<typeof launch>> | undefined;
  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;
  const pages: PageCapture[] = [];
  let lighthouseSummary: LighthouseSummary = { requestedUrl: options.url.href, fetchedAt: new Date().toISOString(), scores: {}, findings: [] };
  try {
    chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"] });
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
    for (const name of options.viewports) pages.push(await capture(browser, name, options.url.href, paths.screenshots[name], options.timeout));
    if (journeySpec && paths.journey && paths.journeyEvidence) {
      const result = await runJourney(browser, options.url.href, journeySpec, options.output, options.timeout);
      await fs.writeFile(paths.journey, JSON.stringify(result, null, 2));
      await fs.writeFile(paths.journeyEvidence, renderJourneyEvidence(result));
    }
    try {
      const raw = await lighthouse(options.url.href, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        maxWaitForLoad: options.timeout,
        onlyCategories: ["performance", "accessibility", "seo", "best-practices"]
      });
      lighthouseSummary = normalizeLighthouseResult(raw, options.url.href);
    } catch (error) {
      lighthouseSummary.error = error instanceof Error ? error.message : String(error);
    }
  } finally {
    await browser?.close().catch(() => undefined);
    try { chrome?.kill(); } catch { /* Chrome may already have exited. */ }
  }
  await fs.writeFile(paths.pageData, JSON.stringify({ requestedUrl: options.url.href, captures: pages }, null, 2));
  await fs.writeFile(paths.lighthouse, JSON.stringify(lighthouseSummary, null, 2));
  await fs.writeFile(paths.evidence, renderEvidence(options.url.href, pages, lighthouseSummary));
  await fs.writeFile(paths.manifest, JSON.stringify({ version: 2, requestedUrl: options.url.href, createdAt: new Date().toISOString(), artifacts: { pageData: "page-data.json", lighthouse: "lighthouse.json", evidence: "evidence.md", ...(journeySpec ? { journey: "journey.json", journeyEvidence: "journey.md" } : {}), screenshots: Object.fromEntries(options.viewports.map((name) => [name, `screenshots/${name}.png`])) } }, null, 2));
  console.log(`Audit evidence written to ${options.output}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
