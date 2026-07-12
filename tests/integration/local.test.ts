import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { afterAll, beforeAll, expect, it } from "vitest";

let server: http.Server;
let url: string;

beforeAll(async () => {
  server = http.createServer((_request, response) => {
    response.setHeader("content-type", "text/html");
    response.end("<!doctype html><html lang='en'><head><title>Fixture Product</title><meta name='description' content='Local fixture'></head><body><main><h1>A clearer product promise</h1><button>Start</button></main></body></html>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No fixture address");
  url = `http://127.0.0.1:${address.port}`;
});

afterAll(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

it("collects local page and Lighthouse evidence", async () => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "ai-critic-"));
  const journeyFile = path.join(output, "journey-spec.json");
  await fs.writeFile(journeyFile, JSON.stringify({
    name: "Find the first action", persona: "A first-time student", scenario: "Needs help now", goal: "Find how to start", successCriteria: ["See the start action"], viewport: "mobile",
    steps: [
      { name: "Arrive", action: "goto", path: "/" },
      { name: "Find start", action: "assertText", text: "Start" },
      { name: "Record decision point", action: "screenshot", note: "Is the next action clear?" }
    ]
  }));
  const child = spawn(process.execPath, ["--import", "tsx", "src/cli.ts", url, "--output", output, "--desktop-only", "--journey", journeyFile], { cwd: path.resolve(import.meta.dirname, "../.."), stdio: "pipe" });
  const exitCode = await new Promise<number | null>((resolve) => child.on("close", resolve));
  expect(exitCode).toBe(0);
  const manifest = JSON.parse(await fs.readFile(path.join(output, "manifest.json"), "utf8"));
  const pageData = JSON.parse(await fs.readFile(path.join(output, "page-data.json"), "utf8"));
  expect(manifest.artifacts.screenshots.desktop).toBe("screenshots/desktop.png");
  expect(manifest.artifacts.journey).toBe("journey.json");
  expect(pageData.captures[0].title).toBe("Fixture Product");
  await expect(fs.stat(path.join(output, "screenshots", "desktop.png"))).resolves.toBeTruthy();
  await expect(fs.readFile(path.join(output, "lighthouse.json"), "utf8")).resolves.toContain("performance");
  const journey = JSON.parse(await fs.readFile(path.join(output, "journey.json"), "utf8"));
  expect(journey.status).toBe("completed");
  expect(journey.steps).toHaveLength(3);
  await expect(fs.readFile(path.join(output, "journey.md"), "utf8")).resolves.toContain("A first-time student");
}, 60_000);
