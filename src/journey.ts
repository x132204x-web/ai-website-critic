import fs from "node:fs/promises";
import path from "node:path";
import type { Browser, Locator, Page } from "playwright";
import { Redactor, explainError } from "./privacy.js";
import type { JourneyResult, JourneySpec, JourneyStepSpec, JourneyStepResult, RequestFailure, StructuredLocator, ViewportName } from "./types.js";

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "step";

export interface JourneyRunOptions { viewport: ViewportName; redactor: Redactor; onProgress?: (message: string) => void }

export function locatorFor(page: Page, step: JourneyStepSpec): Locator {
  if (step.selector) return page.locator(step.selector).first();
  if (!step.locator) throw new Error(`Step "${step.name}" requires selector or locator`);
  return structuredLocator(page, step.locator).first();
}

function structuredLocator(page: Page, locator: StructuredLocator): Locator {
  if (locator.by === "css") return page.locator(locator.value);
  if (locator.by === "role") return page.getByRole(locator.role as Parameters<Page["getByRole"]>[0], { name: locator.name, exact: locator.exact });
  if (locator.by === "label") return page.getByLabel(locator.value, { exact: locator.exact });
  if (locator.by === "placeholder") return page.getByPlaceholder(locator.value, { exact: locator.exact });
  if (locator.by === "text") return page.getByText(locator.value, { exact: locator.exact });
  return page.getByTestId(locator.value);
}

async function settle(page: Page, timeout: number): Promise<void> {
  await page.waitForLoadState("domcontentloaded", { timeout: Math.min(timeout, 2_000) }).catch(() => undefined);
  await page.waitForLoadState("networkidle", { timeout: Math.min(timeout, 1_500) }).catch(() => undefined);
  await page.waitForTimeout(250);
}

async function act(page: Page, baseUrl: string, step: JourneyStepSpec, timeout: number, redactor: Redactor, masks: Locator[]) {
  if (step.action === "goto") { await page.goto(new URL(step.path ?? "/", baseUrl).href, { waitUntil: "domcontentloaded", timeout }); await settle(page, timeout); }
  else if (step.action === "click") { await locatorFor(page, step).click({ timeout }); await settle(page, timeout); }
  else if (step.action === "fill") {
    const value = step.valueFromEnv ? process.env[step.valueFromEnv] : step.value;
    if (value === undefined) throw new Error(`Missing environment variable ${step.valueFromEnv}`);
    const sensitive = step.sensitive ?? Boolean(step.valueFromEnv);
    if (sensitive) redactor.add(value);
    const locator = locatorFor(page, step);
    await locator.fill(value, { timeout });
    if (sensitive) masks.push(locator);
    await settle(page, timeout);
  } else if (step.action === "waitFor") await locatorFor(page, step).waitFor({ state: "visible", timeout });
  else if (step.action === "assertText") await (step.locator ? locatorFor(page, step) : page.getByText(step.text!, { exact: false }).first()).waitFor({ state: "visible", timeout });
}

export async function runJourney(browser: Browser, baseUrl: string, spec: JourneySpec, output: string, timeout: number, options: JourneyRunOptions): Promise<JourneyResult> {
  const viewport = options.viewport === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
  const context = await browser.newContext({ viewport, isMobile: options.viewport === "mobile", hasTouch: options.viewport === "mobile", deviceScaleFactor: options.viewport === "mobile" ? 2 : 1 });
  const page = await context.newPage();
  const consoleIssues: JourneyResult["consoleIssues"] = [];
  const requestFailures: RequestFailure[] = [];
  page.on("console", (msg) => { if (["error", "warning"].includes(msg.type())) consoleIssues.push({ type: msg.type(), text: options.redactor.redact(msg.text()) ?? "" }); });
  page.on("requestfailed", (request) => requestFailures.push({ url: options.redactor.redact(request.url()) ?? "[REDACTED]", method: request.method(), error: options.redactor.redact(request.failure()?.errorText ?? "Unknown failure") ?? "Unknown failure" }));
  const startedAt = new Date().toISOString();
  const results: JourneyStepResult[] = [];
  const screenshotDir = path.join(output, "screenshots", "journey");
  await fs.mkdir(screenshotDir, { recursive: true });
  const masks: Locator[] = [];
  let failed = false;
  try {
    for (let i = 0; i < spec.steps.length; i++) {
      const step = spec.steps[i];
      options.onProgress?.(`Journey ${i + 1}/${spec.steps.length}: ${step.name}`);
      if (failed) { results.push({ index: i + 1, name: step.name, action: step.action, status: "skipped", startedAt: new Date().toISOString(), durationMs: 0, url: options.redactor.redact(page.url()) ?? "", note: step.note }); continue; }
      const start = Date.now();
      const result: JourneyStepResult = { index: i + 1, name: step.name, action: step.action, status: "completed", startedAt: new Date().toISOString(), durationMs: 0, url: options.redactor.redact(page.url()) ?? "", note: step.note };
      const file = path.join(screenshotDir, `${String(i + 1).padStart(2, "0")}-${slug(step.name)}.png`);
      try { await act(page, baseUrl, step, timeout, options.redactor, masks); }
      catch (error) { result.status = "failed"; result.error = explainError(error, options.redactor); failed = true; }
      try { await page.screenshot({ path: file, fullPage: true, mask: masks, maskColor: "#111827" }); result.screenshot = path.relative(output, file); }
      catch (error) { result.status = "failed"; result.error ??= `Screenshot failed: ${explainError(error, options.redactor)}`; failed = true; }
      result.url = options.redactor.redact(page.url()) ?? "";
      result.title = options.redactor.redact(await page.title().catch(() => ""));
      result.durationMs = Date.now() - start;
      results.push(result);
    }
  } finally { await context.close(); }
  return { spec: { name: spec.name, persona: spec.persona, scenario: spec.scenario, goal: spec.goal, successCriteria: spec.successCriteria, viewport: options.viewport }, startedAt, completedAt: new Date().toISOString(), status: failed ? "failed" : "completed", steps: results, consoleIssues: consoleIssues.map((item) => ({ ...item, text: options.redactor.redact(item.text) ?? "" })), requestFailures };
}
