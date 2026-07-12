import path from "node:path";
import type { JourneyResult, JourneySpec, LighthouseFinding, LighthouseSummary, PageCapture, ViewportName } from "./types.js";

export function validateUrl(input: string): URL {
  let url: URL;
  try { url = new URL(input); } catch { throw new Error(`Invalid URL: ${input}`); }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("URL must use http:// or https://");
  }
  return url;
}

export function artifactPaths(output: string, viewports: ViewportName[], hasJourney = false) {
  return {
    manifest: path.join(output, "manifest.json"),
    pageData: path.join(output, "page-data.json"),
    lighthouse: path.join(output, "lighthouse.json"),
    evidence: path.join(output, "evidence.md"),
    screenshots: Object.fromEntries(viewports.map((name) => [name, path.join(output, "screenshots", `${name}.png`)])),
    ...(hasJourney ? { journey: path.join(output, "journey.json"), journeyEvidence: path.join(output, "journey.md") } : {})
  };
}

export function validateJourneySpec(input: unknown): JourneySpec {
  const spec = input as Partial<JourneySpec>;
  if (!spec || typeof spec !== "object") throw new Error("Journey spec must be a JSON object");
  for (const field of ["name", "persona", "scenario", "goal"] as const) {
    if (typeof spec[field] !== "string" || !spec[field]?.trim()) throw new Error(`Journey spec requires ${field}`);
  }
  if (!Array.isArray(spec.successCriteria) || !spec.successCriteria.length) throw new Error("Journey spec requires successCriteria");
  if (!Array.isArray(spec.steps) || !spec.steps.length) throw new Error("Journey spec requires steps");
  const actions = new Set(["goto", "click", "fill", "waitFor", "assertText", "screenshot"]);
  spec.steps.forEach((step, index) => {
    if (!step?.name || !actions.has(step.action)) throw new Error(`Invalid journey step at index ${index}`);
    if (["click", "fill", "waitFor"].includes(step.action) && !step.selector) throw new Error(`Step ${index + 1} requires selector`);
    if (step.action === "fill" && !step.value && !step.valueFromEnv) throw new Error(`Fill step ${index + 1} requires value or valueFromEnv`);
    if (step.action === "assertText" && !step.text) throw new Error(`Assert step ${index + 1} requires text`);
  });
  if (spec.viewport && !["desktop", "mobile"].includes(spec.viewport)) throw new Error("Journey viewport must be desktop or mobile");
  return spec as JourneySpec;
}

export function renderJourneyEvidence(result: JourneyResult): string {
  const criteria = result.spec.successCriteria.map((item) => `- ${item}`).join("\n");
  const rows = result.steps.map((step) => `| ${step.index} | ${escapeCell(step.name)} | ${step.status} | ${step.durationMs} | ${escapeCell(step.url)} | ${escapeCell(step.screenshot)} | ${escapeCell(step.error)} |`).join("\n");
  return `# User Journey Evidence\n\n> This file records browser actions and outcomes. User thoughts and emotions remain hypotheses until validated through research.\n\n## Participant frame\n\n- **Persona:** ${result.spec.persona}\n- **Scenario:** ${result.spec.scenario}\n- **Goal:** ${result.spec.goal}\n- **Journey status:** ${result.status}\n\n## Success criteria\n\n${criteria}\n\n## Timeline\n\n| Step | Moment | Status | Duration (ms) | URL | Screenshot | Error |\n| ---: | --- | --- | ---: | --- | --- | --- |\n${rows}\n\n## Runtime signals\n\n- Console issues: ${result.consoleIssues.length}\n- Failed requests: ${result.requestFailures.length}\n`;
}

export function normalizeLighthouseResult(raw: any, requestedUrl: string): LighthouseSummary {
  const lhr = raw?.lhr ?? raw;
  if (!lhr?.categories || !lhr?.audits) throw new Error("Lighthouse returned no usable report");
  const scores: Record<string, number | null> = {};
  for (const id of ["performance", "accessibility", "seo", "best-practices"]) {
    const value = lhr.categories[id]?.score;
    scores[id] = typeof value === "number" ? Math.round(value * 100) : null;
  }
  const findings: LighthouseFinding[] = Object.values(lhr.audits)
    .filter((audit: any) => audit?.scoreDisplayMode !== "notApplicable" && typeof audit?.score === "number" && audit.score < 0.9)
    .map((audit: any) => ({
      id: audit.id,
      title: audit.title,
      score: audit.score,
      ...(audit.displayValue ? { displayValue: audit.displayValue } : {}),
      ...(audit.description ? { description: audit.description } : {})
    }))
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 25);
  return { requestedUrl, finalUrl: lhr.finalDisplayedUrl ?? lhr.finalUrl, fetchedAt: lhr.fetchTime ?? new Date().toISOString(), scores, findings };
}

const escapeCell = (value: unknown) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");

export function renderEvidence(url: string, pages: PageCapture[], lighthouse: LighthouseSummary): string {
  const scoreRows = Object.entries(lighthouse.scores).map(([key, value]) => `| ${key} | ${value ?? "Unavailable"} |`).join("\n");
  const pageSections = pages.map((page) => `### ${page.name}\n\n- Final URL: ${page.finalUrl ?? "Unavailable"}\n- Title: ${page.title ?? "Unavailable"}\n- Viewport: ${page.viewport.width}×${page.viewport.height}\n- Screenshot: ${page.screenshot ?? "Unavailable"}\n- Console issues: ${page.consoleIssues.length}\n- Failed requests: ${page.requestFailures.length}${page.error ? `\n- Capture error: ${page.error}` : ""}`).join("\n\n");
  const findings = lighthouse.findings.length
    ? lighthouse.findings.map((item) => `| ${escapeCell(item.title)} | ${item.score === null ? "—" : Math.round(item.score * 100)} | ${escapeCell(item.displayValue)} |`).join("\n")
    : "| None reported | — | — |";
  return `# Website Audit Evidence\n\n> Deterministic evidence only. Design conclusions must be made by the reviewing agent after inspecting the screenshots.\n\n- Requested URL: ${url}\n- Collected: ${new Date().toISOString()}\n\n## Lighthouse scores\n\n| Category | Score / 100 |\n| --- | ---: |\n${scoreRows}\n${lighthouse.error ? `\nLighthouse error: ${lighthouse.error}\n` : ""}\n## Captures\n\n${pageSections}\n\n## Highest-priority Lighthouse findings\n\n| Finding | Score / 100 | Value |\n| --- | ---: | --- |\n${findings}\n`;
}
