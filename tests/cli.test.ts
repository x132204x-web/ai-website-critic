import { describe, expect, it, vi } from "vitest";
import { main, parseArgs, resolveJourneyViewport } from "../src/cli.js";

describe("CLI", () => {
  it("requires a journey for a complete review", () => expect(() => parseArgs(["https://example.com"])).toThrow("requires --journey"));
  it("allows explicit evidence-only collection", () => { const command = parseArgs(["https://example.com", "--page-only"]); expect(command.kind).toBe("audit"); if (command.kind === "audit") expect(command.pageOnly).toBe(true); });
  it("rejects conflicting modes and viewport flags", () => { expect(() => parseArgs(["https://example.com", "--page-only", "--journey", "journey.json"])).toThrow("either --journey or --page-only"); expect(() => parseArgs(["https://example.com", "--page-only", "--desktop-only", "--mobile-only"])).toThrow("either --desktop-only or --mobile-only"); });
  it("parses Lighthouse profiles and explicit journey viewport", () => { const command = parseArgs(["https://example.com", "--page-only", "--lighthouse", "both", "--journey-viewport", "desktop"]); if (command.kind !== "audit") throw new Error("Expected audit"); expect(command.lighthouseProfiles).toEqual(["mobile", "desktop"]); expect(command.journeyViewport).toBe("desktop"); });
  it("uses explicit, single capture, spec, then default viewport precedence", () => { expect(resolveJourneyViewport({ journeyViewport: "desktop", viewports: ["desktop", "mobile"] }, { viewport: "mobile" } as never)).toBe("desktop"); expect(resolveJourneyViewport({ viewports: ["desktop"] }, { viewport: "mobile" } as never)).toBe("desktop"); expect(resolveJourneyViewport({ viewports: ["desktop", "mobile"] }, { viewport: "desktop" } as never)).toBe("desktop"); expect(resolveJourneyViewport({ viewports: ["desktop", "mobile"] })).toBe("mobile"); });
  it("returns success for help", async () => { const log = vi.spyOn(console, "log").mockImplementation(() => undefined); await expect(main(["--help"])).resolves.toBe(0); expect(log).toHaveBeenCalledWith(expect.stringContaining("Exit codes")); log.mockRestore(); });
});
