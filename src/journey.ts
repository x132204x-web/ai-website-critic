import fs from "node:fs/promises";
import path from "node:path";
import type { Browser, Page } from "playwright";
import type { JourneyResult, JourneySpec, JourneyStepResult } from "./types.js";

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "step";

async function act(page: Page, baseUrl: string, step: JourneySpec["steps"][number], timeout: number) {
  if (step.action === "goto") await page.goto(new URL(step.path ?? "/", baseUrl).href, { waitUntil: "networkidle", timeout });
  else if (step.action === "click") await page.locator(step.selector!).first().click({ timeout });
  else if (step.action === "fill") {
    const value = step.valueFromEnv ? process.env[step.valueFromEnv] : step.value;
    if (value === undefined) throw new Error(`Missing environment variable ${step.valueFromEnv}`);
    await page.locator(step.selector!).first().fill(value, { timeout });
  } else if (step.action === "waitFor") await page.locator(step.selector!).first().waitFor({ state: "visible", timeout });
  else if (step.action === "assertText") await page.getByText(step.text!, { exact: false }).first().waitFor({ state: "visible", timeout });
  else if (step.action === "screenshot") return;
  await page.waitForTimeout(250);
}

export async function runJourney(browser: Browser, baseUrl: string, spec: JourneySpec, output: string, timeout: number): Promise<JourneyResult> {
  const viewport = spec.viewport === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
  const context = await browser.newContext({ viewport, isMobile: spec.viewport === "mobile", deviceScaleFactor: spec.viewport === "mobile" ? 2 : 1 });
  const page = await context.newPage();
  const consoleIssues: JourneyResult["consoleIssues"] = [];
  const requestFailures: JourneyResult["requestFailures"] = [];
  page.on("console", (msg) => { if (["error", "warning"].includes(msg.type())) consoleIssues.push({ type: msg.type(), text: msg.text() }); });
  page.on("requestfailed", (request) => requestFailures.push({ url: request.url(), method: request.method(), error: request.failure()?.errorText ?? "Unknown failure" }));
  const startedAt = new Date().toISOString();
  const results: JourneyStepResult[] = [];
  const screenshotDir = path.join(output, "screenshots", "journey");
  await fs.mkdir(screenshotDir, { recursive: true });
  let failed = false;
  for (let i = 0; i < spec.steps.length; i++) {
    const step = spec.steps[i];
    if (failed) {
      results.push({ index: i + 1, name: step.name, action: step.action, status: "skipped", startedAt: new Date().toISOString(), durationMs: 0, url: page.url(), note: step.note });
      continue;
    }
    const start = Date.now();
    const result: JourneyStepResult = { index: i + 1, name: step.name, action: step.action, status: "completed", startedAt: new Date().toISOString(), durationMs: 0, url: page.url(), note: step.note };
    try {
      await act(page, baseUrl, step, timeout);
      const file = path.join(screenshotDir, `${String(i + 1).padStart(2, "0")}-${slug(step.name)}.png`);
      await page.screenshot({ path: file, fullPage: true });
      result.screenshot = path.relative(output, file);
      result.url = page.url();
      result.title = await page.title();
    } catch (error) {
      result.status = "failed";
      result.error = error instanceof Error ? error.message : String(error);
      result.url = page.url();
      failed = true;
    }
    result.durationMs = Date.now() - start;
    results.push(result);
  }
  await context.close();
  return { spec: { name: spec.name, persona: spec.persona, scenario: spec.scenario, goal: spec.goal, successCriteria: spec.successCriteria, viewport: spec.viewport }, startedAt, completedAt: new Date().toISOString(), status: failed ? "failed" : "completed", steps: results, consoleIssues, requestFailures };
}
