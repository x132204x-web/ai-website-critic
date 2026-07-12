---
name: ai-website-critic
description: Review public websites as an evidence-led senior product designer and UX expert. Use when Codex or Claude Code is asked to critique, audit, evaluate, redesign, or improve a website, landing page, product positioning, visual hierarchy, usability, conversion flow, accessibility, SEO, or performance from a URL and screenshots.
---

# AI Website Critic

Evaluate whether the website is a good product, not merely whether it passes automated checks.

## Run the audit

1. Confirm the user supplied a public HTTP(S) URL. State that authenticated and multi-page flows are outside this skill's default scope.
2. Locate this skill's repository root. Run `npm install` and `npx playwright install chromium` only when dependencies are missing.
3. Run `npm run audit -- <url> --output <audit-directory>`. Add viewport or timeout flags only when needed.
4. Read `manifest.json`, `page-data.json`, `lighthouse.json`, and `evidence.md`.
5. Inspect every screenshot visually. Never infer visual quality from Lighthouse alone.
6. Read [prompts/critic.md](prompts/critic.md) before analyzing. Read [prompts/report.md](prompts/report.md) before writing.
7. Write the completed review from [assets/report-template.md](assets/report-template.md). Replace every placeholder and remove empty sections.

If capture or Lighthouse fails, retain successful artifacts, state the limitation, and continue only when enough direct evidence remains. Never invent a score, interaction, page state, or visual observation.

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

## Prioritize findings

- **Critical**: blocks the main task, makes the offer unintelligible, or creates serious accessibility/trust risk.
- **High**: materially harms comprehension, confidence, or conversion for many users.
- **Medium**: creates friction or inconsistency but does not block the main task.
- **Low**: polish opportunity with limited product impact.

For every substantive finding, explicitly include:

1. **What is wrong** — the precise issue and evidence.
2. **Why it matters** — user or business consequence; mark inference as such.
3. **How to improve** — a specific design or content direction, not a vague instruction.

Do not claim affiliation with or imitate Apple, Linear, Stripe, Vercel, or any other company. Use the rigor, restraint, clarity, and product thinking expected from excellent contemporary design teams.
