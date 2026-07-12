# Vercel User Journey Review

**Reviewed:** July 12, 2026
**Journey:** A technical founder evaluates Vercel for an AI product
**Device:** Mobile, 390×844
**Tested path:** Homepage → agent proof → scale proof → Deploy Now → new project

## Who are we following?

**Noah is a technical founder preparing to ship an AI application.** It needs agents, background work, and unpredictable scaling. He already associates Vercel with frontend deployment but is unsure whether “Agentic Infrastructure” covers his production workload.

His goal is to understand the new claim, find credible technical proof, and reach a first deployment step.

> This is a simulated journey, not user research. Browser actions are facts; likely questions and business effects are inferences.

## Bottom line

> **Vercel turns a bold category statement into credible customer and scale proof, then provides an unusually direct “Deploy Now” handoff. The weak point is translation: technical labels tell Noah what the infrastructure contains, but not always which operational headache each capability removes.**
>
> **Most important action:** Add one plain-language consequence to each technical proof block—capability, changed workflow, and outcome.

**No P0 issue was found.** All 6 journey steps completed, and “Deploy Now” reached a usable new-project screen.

## Priority snapshot

| Priority | What Noah runs into | Why it matters | Recommended action |
| --- | --- | --- | --- |
| **P1** | Mobile zoom is restricted | Users who need magnification lose control | Restore browser zoom |
| **P1** | Technical proof requires interpretation | Buyers may understand features but not value | Connect each capability to an operational outcome |
| **P2** | The sparse page still carries avoidable runtime cost | Felt quality trails the infrastructure promise | Reduce redirects and unused client assets |

## Journey at a glance

| Moment | What Noah is trying to do | Experience | State |
| --- | --- | --- | --- |
| Arrive | Decide what “Agentic Infrastructure” means | Memorable category claim, limited initial explanation | **Clear but broad** |
| Check agent support | See whether this is more than deployment branding | Notion example and agent-specific features provide proof | **Convincing** |
| Check scale | Judge production readiness | Zapier scale story connects infrastructure to volume | **Convincing** |
| Start deployment | See what commitment is required | “Deploy Now” opens a new-project experience | **Very clear** |

## What worked well

- The hero is memorable and avoids generic AI imagery.
- Named customer examples do the explanation work rather than acting as a decorative logo wall.
- The mobile page preserves the same proof sequence as desktop.
- “Deploy Now” lands directly on “Let’s build something new,” with repository import, drag-and-drop, and templates visible.

## Journey replay

### 1. Noah understands the direction before the details

**Browser fact:** The hero says “Agentic Infrastructure,” “For coding agents,” and offers “Deploy Now” and “Talk to Sales.”

**Likely user question:** “Does this replace only hosting, or also the orchestration and runtime my agents need?”

The category is clear, but the exact boundary is intentionally compressed. Noah needs the customer sections to understand the product.

### 2. Customer proof makes the category credible

**Browser fact:** The journey verifies “Build agents on infrastructure that thinks like them” and “Ship apps that scale from zero to millions instantly,” paired with Notion and Zapier examples.

**Likely user question:** “Which Vercel capability created that outcome?”

The page lists durable orchestration, sandboxed environments, AI model gateway, global delivery, and related features. These are credible to a technical audience, but the causal explanation remains terse.

### 3. The deploy handoff is exceptionally direct

**Browser fact:** Clicking “Deploy Now” reached `/new`, titled “New Project,” with “Let’s build something new,” repository import, file upload, and templates. All journey steps completed.

**Likely user question:** “Can I try this with an existing repository right now?”

The page answers yes without forcing a sales conversation or a long setup explanation.

## Priority findings

### **[P1] Some users cannot enlarge the dense technical content**

**What happened:** Lighthouse found a viewport setting that disables or restricts user scaling.

**Likely user question:** “Why can’t I zoom this small technical text?”

**Why it matters:** This removes a basic accessibility control precisely where compact labels require careful reading.

**Recommended change:** Remove restrictive `user-scalable` or maximum-scale settings and test the journey at 200% and 400% zoom.

### **[P1] Noah sees capabilities before their practical consequences**

**What happened:** Proof blocks use labels such as durable orchestration, sandboxed environments, and AI model gateway with limited explanation of changed developer work.

**Likely user question:** “Which failure mode or engineering task does this remove for me?”

**Recommended change:** Add one short causal sentence to every proof block: “Because Vercel provides X, your team no longer needs to Y, which enables Z.”

### **[P2] Runtime details slightly weaken the infrastructure story**

**What happened:** Performance scored 81. Lighthouse reported an 840 ms redirect opportunity, 4.28-second LCP, and unused CSS; the journey recorded six console issues without blocking completion.

**Likely user question:** “Why does a visually sparse infrastructure page need this much work?”

**Recommended change:** Remove the initial redirect where possible, defer noncritical client modules, and set a marketing-page performance budget.

## Action plan

### Do now

1. Restore unrestricted browser zoom.
2. Translate technical features into operational consequences.
3. Reduce avoidable redirect and client-side cost.

### Learn next

Test the first two proof blocks with founders who know Vercel only for frontend hosting. Ask them to explain what “Agentic Infrastructure” includes and excludes.
