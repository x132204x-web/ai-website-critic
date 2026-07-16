# AI Website Critic

AI Website Critic is an evidence-led website-review Skill for Codex and Claude Code. It follows a real user journey, captures browser and Lighthouse evidence, then gives the reviewing agent the material needed to write a concise product-design critique.

It is a reusable Skill, not a hosted SaaS product. The command line collects deterministic evidence; the agent reads that evidence and writes the final critique. No separate LLM API key is required.

## Install

Requirements: Node.js 20+, npm, and Chromium for Playwright.

```sh
git clone https://github.com/x132204x-web/ai-website-critic.git
cd ai-website-critic
npm ci
npx playwright install chromium
```

Install for Codex (a link is the default and makes upgrades immediate):

```sh
npm run install:codex
npm run install:codex -- --check
```

Install for Claude Code in the current project:

```sh
npm run install:claude
```

Use `--copy` for a standalone copy, `--force` only to replace an existing installation, and `--project <path>` to target another Claude project. These Node-based commands work on macOS, Linux, and Windows.

## Use

Ask an agent:

```text
Use $ai-website-critic to review https://example.com and produce an evidence-based product design critique.
```

Create and validate a journey before a complete review:

```sh
npm run journey:init -- my-journey.json
npm run journey:validate -- my-journey.json
npm run audit -- https://example.com --journey my-journey.json --output audits/example
```

Use `--page-only` only for supplementary screenshot and Lighthouse evidence; it is not a substitute for a complete user-journey review.

### Useful options

```text
--desktop-only / --mobile-only  Capture one page viewport and use it for the journey
--journey-viewport <profile>    Explicitly choose desktop or mobile for the journey
--lighthouse <mode>             mobile, desktop, both, or off
--timeout <ms>                  Navigation and action timeout (default: 30000)
--output <dir>                  Artifact directory
--quiet                         Print only the final result
--help / --version              Inspect the installed interface
```

The journey viewport precedence is explicit flag, single capture viewport, journey-file viewport, then mobile. `--help` exits with code 0. Audit exit codes are 0 for a complete run, 1 for usage/preflight errors, and 2 when partial evidence was retained after a failed stage.

## Journey format and privacy

Start with [examples/journey.example.json](examples/journey.example.json); editors can use [schemas/journey.schema.json](schemas/journey.schema.json) for completion and validation. Existing CSS `selector` values continue to work. New structured locators are more durable:

```json
{ "action": "click", "locator": { "by": "role", "role": "button", "name": "Start" } }
```

`locator.by` supports `css`, `role`, `label`, `placeholder`, `text`, and `testId`. Do not combine `selector` and `locator` in one step.

For approved test credentials, use `valueFromEnv`. Environment values are sensitive by default: they are masked in step screenshots and redacted from URLs, console output, errors, and generated evidence. Set `sensitive: true` when a literal `value` also needs masking. Never use production credentials or automate purchases, destructive actions, external messages, or production-data changes without explicit authorization.

## Evidence

Every run writes `manifest.json` (v3), `page-data.json`, `lighthouse.json`, `evidence.md`, and screenshots. Journey runs also write `journey.json`, `journey.md`, and a screenshot for every attempted step—including a failed step. Manifest v3 records stage state, durations, selected viewports, Lighthouse profiles, and whether the overall result is complete, partial, or failed.

The collector uses `domcontentloaded` plus a bounded settle period instead of requiring a fully idle network, so polling and streaming pages do not incorrectly look broken. Browser diagnostics in Markdown are redacted and limited to the most relevant entries; machine-readable JSON remains available for deeper inspection.

## Development

```sh
npm run check
npm run test:integration
npm audit
python3 /path/to/skill-creator/scripts/quick_validate.py skill/ai-website-critic
```

The integration suite uses a local fixture; it does not need a public website. Raw third-party audits remain gitignored under `audits/`.

## Scope

The tool captures evidence. The Skill uses the evidence and its report template to produce the final UX critique with observed facts clearly separated from inference. It does not crawl without bounds, make purchases, export HTML/PDF, or connect to external LLM APIs.

## License

MIT
