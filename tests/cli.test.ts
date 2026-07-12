import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/cli.js";

describe("review mode", () => {
  it("requires a journey for a complete review", () => {
    expect(() => parseArgs(["https://example.com"])).toThrow("requires --journey");
  });

  it("allows explicit evidence-only collection", () => {
    expect(parseArgs(["https://example.com", "--page-only"]).pageOnly).toBe(true);
  });

  it("rejects conflicting modes", () => {
    expect(() => parseArgs(["https://example.com", "--page-only", "--journey", "journey.json"])).toThrow("either --journey or --page-only");
  });
});
