import path from "node:path";
import { describe, expect, it } from "vitest";
import { artifactPaths, normalizeLighthouseResult, renderEvidence, validateUrl } from "../src/lib.js";

describe("validateUrl", () => {
  it("accepts HTTP(S)", () => expect(validateUrl("https://example.com/a").hostname).toBe("example.com"));
  it.each(["example.com", "ftp://example.com", "not a url"])("rejects %s", (value) => expect(() => validateUrl(value)).toThrow());
});

it("builds stable artifact paths", () => {
  const paths = artifactPaths("/tmp/audit", ["desktop", "mobile"]);
  expect(paths.manifest).toBe(path.join("/tmp/audit", "manifest.json"));
  expect(paths.screenshots.mobile).toBe(path.join("/tmp/audit", "screenshots", "mobile.png"));
});

it("normalizes scores and prioritizes failed audits", () => {
  const result = normalizeLighthouseResult({ categories: { performance: { score: .82 }, accessibility: { score: .91 }, seo: { score: 1 }, "best-practices": { score: null } }, audits: {
    minor: { id: "minor", title: "Minor", score: .8 },
    major: { id: "major", title: "Major", score: .2, displayValue: "slow" },
    pass: { id: "pass", title: "Pass", score: 1 }
  }, finalDisplayedUrl: "https://example.com/final", fetchTime: "2026-01-01" }, "https://example.com");
  expect(result.scores).toEqual({ performance: 82, accessibility: 91, seo: 100, "best-practices": null });
  expect(result.findings.map((item) => item.id)).toEqual(["major", "minor"]);
});

it("renders explicit evidence language", () => {
  const markdown = renderEvidence("https://example.com", [], { requestedUrl: "https://example.com", fetchedAt: "now", scores: { performance: 90 }, findings: [] });
  expect(markdown).toContain("Deterministic evidence only");
  expect(markdown).toContain("| performance | 90 |");
});
