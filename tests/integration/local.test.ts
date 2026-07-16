import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { afterAll, beforeAll, expect, it } from "vitest";

let server: http.Server;
let url: string;
const root = path.resolve(import.meta.dirname, "../..");

beforeAll(async () => {
  server = http.createServer((request, response) => {
    if (request.url === "/hang") { response.writeHead(200); response.write("open"); setTimeout(() => response.end(), 3_000); return; }
    response.setHeader("content-type", "text/html");
    response.end(`<!doctype html><title>Fixture Product</title><label>Email <input name="email"></label><button>Start</button><script>fetch('/hang').catch(()=>{});document.querySelector('input').addEventListener('input',e=>console.warn(e.target.value));</script>`);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No fixture address");
  url = `http://127.0.0.1:${address.port}`;
});
afterAll(() => { server.closeAllConnections(); return new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); });

function run(args: string[], env: NodeJS.ProcessEnv = {}): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const child = spawn(process.execPath, ["--import", "tsx", "src/cli.ts", ...args], { cwd: root, env: { ...process.env, ...env }, stdio: "pipe" });
  let stdout = "", stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  return new Promise((resolve) => child.on("close", (code) => resolve({ code, stdout, stderr })));
}

it("collects long-polling evidence and redacts sensitive values", async () => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "ai-critic-"));
  const journeyFile = path.join(output, "journey-spec.json");
  await fs.writeFile(journeyFile, JSON.stringify({ name: "Find action", persona: "Student", scenario: "Needs help", goal: "Start", successCriteria: ["See button"], viewport: "mobile", steps: [{ name: "Arrive", action: "goto", path: "/" }, { name: "Enter email", action: "fill", locator: { by: "label", value: "Email" }, valueFromEnv: "TEST_SECRET" }, { name: "Find start", action: "assertText", locator: { by: "role", role: "button", name: "Start" } }] }));
  const result = await run([url, "--output", output, "--desktop-only", "--journey", journeyFile], { TEST_SECRET: "private+a@example.com" });
  expect(result.code, result.stderr).toBe(0);
  expect(result.stdout).toContain("COMPLETE");
  const manifest = JSON.parse(await fs.readFile(path.join(output, "manifest.json"), "utf8"));
  const journey = await fs.readFile(path.join(output, "journey.json"), "utf8");
  expect(manifest.version).toBe(3);
  expect(manifest.configuration.journeyViewport).toBe("desktop");
  expect(journey).not.toContain("private+a@example.com");
  await expect(fs.stat(path.join(output, "screenshots", "journey", "02-enter-email.png"))).resolves.toBeTruthy();
}, 90_000);

it("returns exit code 2 and saves a failure screenshot", async () => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "ai-critic-failure-"));
  const journeyFile = path.join(output, "journey-spec.json");
  await fs.writeFile(journeyFile, JSON.stringify({ name: "Fail", persona: "Visitor", scenario: "Check", goal: "Find copy", successCriteria: ["See copy"], steps: [{ name: "Arrive", action: "goto", path: "/" }, { name: "Missing claim", action: "assertText", text: "This text is absent" }] }));
  const result = await run([url, "--output", output, "--desktop-only", "--journey", journeyFile, "--lighthouse", "off", "--timeout", "1000"]);
  expect(result.code).toBe(2);
  const journey = JSON.parse(await fs.readFile(path.join(output, "journey.json"), "utf8"));
  expect(journey.steps[1].status).toBe("failed");
  expect(journey.steps[1].screenshot).toBe("screenshots/journey/02-missing-claim.png");
  await expect(fs.stat(path.join(output, journey.steps[1].screenshot))).resolves.toBeTruthy();
}, 30_000);
