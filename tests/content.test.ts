import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("published trial reports", () => {
  const files = fs.readdirSync(path.join(root, "trial-results")).filter((name) => name.endsWith(".md") && name !== "README.md");

  it("keeps every trial journey-based", () => {
    expect(files.sort()).toEqual(["finalace.md", "linear.md", "stripe.md", "vercel.md"]);
    for (const file of files) {
      const report = fs.readFileSync(path.join(root, "trial-results", file), "utf8");
      expect(report, file).toMatch(/(Who are we following\?|这次我们代入谁？)/);
      expect(report, file).toMatch(/(Journey at a glance|旅程一览)/);
      expect(report, file).toMatch(/\*\*P[0-3]\*\*/);
      expect(report, file).not.toContain("## Scorecard");
      expect(report, file).not.toContain("## 评分卡");
    }
  });

  it("ships a reusable journey spec for every external trial", () => {
    for (const site of ["linear", "vercel", "stripe"]) {
      const spec = JSON.parse(fs.readFileSync(path.join(root, "examples", "trials", `${site}.json`), "utf8"));
      expect(spec.persona).toBeTruthy();
      expect(spec.scenario).toBeTruthy();
      expect(spec.goal).toBeTruthy();
      expect(spec.steps.length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("published Skill metadata", () => {
  it("keeps the Skill trigger and UI metadata aligned", () => {
    const skill = fs.readFileSync(path.join(root, "skill", "ai-website-critic", "SKILL.md"), "utf8");
    const agent = fs.readFileSync(path.join(root, "skill", "ai-website-critic", "agents", "openai.yaml"), "utf8");
    expect(skill).toMatch(/^---\nname: ai-website-critic\ndescription: .+\n---/);
    expect(agent).toContain('display_name: "AI Website Critic"');
    expect(agent).toContain("$ai-website-critic");
    expect(fs.existsSync(path.join(root, "schemas", "journey.schema.json"))).toBe(true);
  });
});
