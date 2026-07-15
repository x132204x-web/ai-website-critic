# AI Website Critic

AI Website Critic is an evidence-led website review skill for Codex and Claude Code. It guides an agent through a realistic user journey, combining scripted Playwright interactions, screenshots, browser diagnostics, and Lighthouse metrics to explain where a person succeeds, hesitates, or gets blocked.

It is a reusable skill, not a SaaS product. No separate LLM API key is required.

## At a glance

- Review a website through a defined user journey rather than a generic checklist
- Capture desktop and mobile evidence, browser diagnostics, and Lighthouse metrics
- Produce a concise critique with direct evidence, product reasoning, and prioritized next steps

## What it produces

- Full-page desktop and mobile screenshots
- A chronological, task-based user journey with a concrete persona and success criteria
- Per-step screenshots, URLs, timing, failures, and skipped steps
- Page title, final URL, console warnings/errors, and failed requests
- Lighthouse performance, accessibility, SEO, and best-practices scores
- A compact evidence packet for the reviewing agent
- A professional Markdown critique explaining what is wrong, why it matters, and how to improve it

## Requirements

- Node.js 20 or newer
- npm
- Codex or Claude Code with image-reading capability

## Install

```sh
git clone https://github.com/x132204x-web/ai-website-critic.git
cd ai-website-critic
npm install
npx playwright install chromium
```

Install the skill for Codex:

```sh
mkdir -p ~/.codex/skills
ln -s "$(pwd)/skill/ai-website-critic" ~/.codex/skills/ai-website-critic
```

Install it for Claude Code at the project level:

```sh
mkdir -p .claude/skills
ln -s "$(pwd)/skill/ai-website-critic" .claude/skills/ai-website-critic
```

Copy the folder instead if you do not want a symbolic link.

## Use

Ask your agent:

```text
Use $ai-website-critic to review https://example.com and produce a product design critique.
```

Every complete review requires a journey. Copy [examples/journey.example.json](examples/journey.example.json), then tailor the persona, scenario, success criteria, and steps:

```sh
npm run audit -- https://example.com --journey my-journey.json --output audits/example
```

For screenshot and Lighthouse evidence without a complete review:

```sh
npm run audit -- https://example.com --page-only --output audits/example-evidence
```

Options:

```text
--desktop-only        Capture only the desktop viewport
--mobile-only         Capture only the mobile viewport
--timeout <ms>        Set navigation timeout (default: 30000)
--output <directory>  Choose the artifact directory
--journey <file>      Run a scripted user journey from JSON
--page-only           Collect static evidence without producing a complete review
```

The output contains `manifest.json`, `page-data.json`, `lighthouse.json`, `evidence.md`, and viewport images under `screenshots/`. Journey mode also creates `journey.json`, `journey.md`, and step screenshots under `screenshots/journey/`. Partial evidence is retained when one stage fails.

Journey actions are `goto`, `click`, `fill`, `waitFor`, `assertText`, and `screenshot`. For test-account credentials, use `valueFromEnv` in the JSON and provide the environment variable at runtime. Secret values are never written to journey evidence.

## Design principles

- Product judgment over checklist compliance
- Real tasks and chronological user moments over detached page commentary
- Browser facts separated from likely user questions and design inference
- Direct evidence separated from inference
- Strengths preserved, not ignored
- Consequential findings prioritized over exhaustive nitpicks
- P0–P3 priority labels with highlighted action summaries
- Concrete “what / why / how” recommendations
- No imitation of or claimed affiliation with any named design company

## Development

```sh
npm run typecheck
npm test
npm run test:integration
python3 /path/to/skill-creator/scripts/quick_validate.py skill/ai-website-critic
```

The integration test uses a local fixture and does not require a public website. See [example-report.md](example-report.md) for the expected review style; its evidence is explicitly fictional.

Four dated, journey-based public-site trials are available in [trial-results](trial-results/README.md). Their raw third-party screenshots remain local and gitignored.

## Scope

Every complete review requires a deliberate multi-step journey, including public marketing pages. Test-account flows are supported when credentials are supplied through environment variables. Unbounded crawling, purchases, destructive production actions, HTML/PDF export, and external LLM API adapters remain out of scope.

## License

MIT
