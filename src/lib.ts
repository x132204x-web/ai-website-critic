import path from "node:path";
import type { LighthouseFinding, LighthouseSummary, PageCapture, ViewportName } from "./types.js";

export function validateUrl(input: string): URL {
  let url: URL;
  try { url = new URL(input); } catch { throw new Error(`Invalid URL: ${input}`); }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("URL must use http:// or https://");
  }
  return url;
}

export function artifactPaths(output: string, viewports: ViewportName[]) {
  return {
    manifest: path.join(output, "manifest.json"),
    pageData: path.join(output, "page-data.json"),
    lighthouse: path.join(output, "lighthouse.json"),
    evidence: path.join(output, "evidence.md"),
    screenshots: Object.fromEntries(viewports.map((name) => [name, path.join(output, "screenshots", `${name}.png`)]))
  };
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
