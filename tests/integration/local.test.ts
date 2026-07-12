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
  const child = spawn(process.execPath, ["--import", "tsx", "src/cli.ts", url, "--output", output, "--desktop-only"], { cwd: path.resolve(import.meta.dirname, "../.."), stdio: "pipe" });
  const exitCode = await new Promise<number | null>((resolve) => child.on("close", resolve));
  expect(exitCode).toBe(0);
  const manifest = JSON.parse(await fs.readFile(path.join(output, "manifest.json"), "utf8"));
  const pageData = JSON.parse(await fs.readFile(path.join(output, "page-data.json"), "utf8"));
  expect(manifest.artifacts.screenshots.desktop).toBe("screenshots/desktop.png");
  expect(pageData.captures[0].title).toBe("Fixture Product");
  await expect(fs.stat(path.join(output, "screenshots", "desktop.png"))).resolves.toBeTruthy();
  await expect(fs.readFile(path.join(output, "lighthouse.json"), "utf8")).resolves.toContain("performance");
}, 60_000);
