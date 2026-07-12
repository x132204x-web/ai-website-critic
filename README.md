# AI Website Critic

AI Website Critic gives coding agents an evidence-led workflow for reviewing websites like senior product designers. It combines Playwright screenshots and browser diagnostics with Lighthouse metrics, then lets the agent's own multimodal model judge product positioning, hierarchy, UX, conversion, and visual quality.

It is a reusable skill, not a SaaS product. No separate LLM API key is required.

## What it produces

- Full-page desktop and mobile screenshots
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

The skill will run the collector. You can also collect evidence directly:

```sh
npm run audit -- https://example.com --output audits/example
```

Options:

```text
--desktop-only        Capture only the desktop viewport
--mobile-only         Capture only the mobile viewport
--timeout <ms>        Set navigation timeout (default: 30000)
--output <directory>  Choose the artifact directory
```

The output contains `manifest.json`, `page-data.json`, `lighthouse.json`, `evidence.md`, and viewport images under `screenshots/`. Partial evidence is retained when one stage fails.

## Design principles

- Product judgment over checklist compliance
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

Three dated, evidence-based public-site trials are available in [trial-results](trial-results/README.md). Their raw third-party screenshots remain local and gitignored.

## Scope

The first release audits one public page. Authenticated journeys, multi-page crawling, scripted user flows, HTML/PDF export, and external LLM API adapters are intentionally out of scope.

## License

MIT
