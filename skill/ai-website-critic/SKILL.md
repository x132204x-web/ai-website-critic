---
name: ai-website-critic
description: Review public websites as an evidence-led senior product designer and UX expert. Use when Codex or Claude Code is asked to critique, audit, evaluate, redesign, or improve a website, landing page, product positioning, visual hierarchy, usability, conversion flow, accessibility, SEO, or performance from a URL and screenshots.
---

# AI Website Critic

Evaluate whether the website helps a real person complete a meaningful task, not merely whether it passes automated checks.

## Run the audit

1. Confirm the user supplied an HTTP(S) URL. Treat every complete website review as a user-journey review, including marketing sites and public homepages. Never substitute a static page critique for a journey report.
2. Read [prompts/journey.md](prompts/journey.md). Define a concrete persona, situation, goal, concerns, success criteria, and 3–8 meaningful moments.
3. Create a journey JSON matching the repository example or run `npm run journey:init -- <journey.json>`, then run `npm run journey:validate -- <journey.json>`. Prefer structured role, label, text, or test-id locators over fragile CSS. Use `valueFromEnv` for approved test credentials; its value is masked and redacted by default. Do not automate purchases, destructive actions, external messages, or production data changes without explicit authorization.
4. Locate this skill's repository root. Run `npm ci` and `npx playwright install chromium` only when dependencies are missing.
5. Run `npm run audit -- <url> --journey <journey.json> --output <audit-directory>`. Choose `--journey-viewport` when the journey must differ from a single page-capture viewport. Use `--page-only` only when gathering supplementary evidence; do not produce a final review from page-only evidence.
6. Read `manifest.json` first. If its status is `partial` or `failed`, state the limitation. Then read all available artifacts, including `journey.json` and `journey.md`, and inspect every screenshot visually.
7. Read [prompts/critic.md](prompts/critic.md) before analyzing and [prompts/report.md](prompts/report.md) before writing.
8. Write the completed review from [assets/report-template.md](assets/report-template.md). Replace every placeholder and remove empty sections.

If a journey step fails, treat the failure as evidence, preserve later steps as skipped, and explain the limitation. Never invent a score, interaction, page state, user feeling, or visual observation.

## Evaluate in this order

1. Product positioning: audience, promise, differentiation, message comprehension.
2. Conversion path: primary action, motivation, objection handling, continuity.
3. Visual hierarchy: attention order, typography, spacing, contrast, composition.
4. Information architecture and usability: navigation, scanning, cognitive load, mobile behavior.
5. Trust and accessibility: credibility, feedback, legibility, inclusive use.
6. Technical quality: Lighthouse metrics, console issues, failed requests, responsiveness.

## Apply evidence discipline

- Label direct screenshot, page, or Lighthouse evidence as **Observed**.
- Label conclusions about likely user behavior or business impact as **Inference**.
- Cite the viewport and artifact for visual findings; cite the audit name or score for technical findings.
- Treat aesthetics as supporting comprehension, trust, and intent—not as taste alone.
- Acknowledge strengths worth preserving before proposing changes.
- Separate **browser fact**, **likely user question**, and **design inference**. A simulated persona is an evaluation lens, not a real research participant.

## Prioritize findings

- **P0 — blocker**: blocks the primary task, causes severe accessibility/security/trust harm, or makes the product unusable. Use rarely and only with direct evidence.
- **P1 — high impact**: materially harms comprehension, confidence, conversion, or a core user journey for many users.
- **P2 — meaningful improvement**: creates recurring friction or inconsistency but does not block the primary task.
- **P3 — polish**: limited-impact refinement. Omit P3 items when they distract from more important work.

Never inflate severity. State explicitly when no P0 issue was found. Sort findings by priority, then expected impact.

For every substantive finding, explicitly include:

1. **What is wrong** — the precise issue and evidence.
2. **Why it matters** — user or business consequence; mark inference as such.
3. **How to improve** — a specific design or content direction, not a vague instruction.

Make the report scannable: begin with a highlighted verdict and a 3–5 row priority table; bold the priority, finding title, key metric, and recommended action. Keep the main report concise, moving supporting detail into the finding evidence rather than repeating it across sections.

Do not claim affiliation with or imitate Apple, Linear, Stripe, Vercel, or any other company. Use the rigor, restraint, clarity, and product thinking expected from excellent contemporary design teams.
