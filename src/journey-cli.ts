#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateJourneySpec } from "./lib.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function usage(): never { throw new Error("Usage: journey:init [path] [--force] | journey:validate <path>"); }
async function init(args: string[]) {
  const force = args.includes("--force"), positional = args.filter((arg) => arg !== "--force"); if (positional.length > 1) usage();
  const target = path.resolve(positional[0] ?? "journey.json"), template = JSON.parse(await fs.readFile(path.join(root, "examples", "journey.example.json"), "utf8"));
  if (!force) await fs.access(target).then(() => { throw new Error(`${target} already exists. Use --force to replace it.`); }).catch((error) => { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; });
  await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, `${JSON.stringify(template, null, 2)}\n`); console.log(`Journey template written to ${target}`);
}
async function validate(args: string[]) { if (args.length !== 1) usage(); const spec = validateJourneySpec(JSON.parse(await fs.readFile(path.resolve(args[0]), "utf8"))); console.log(`Valid journey: ${spec.name} (${spec.steps.length} steps, ${spec.viewport ?? "default"} viewport)`); }
async function main() { const [command, ...args] = process.argv.slice(2); if (command === "init") await init(args); else if (command === "validate") await validate(args); else usage(); }
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
