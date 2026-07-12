# Linear User Journey Review

**Reviewed:** July 12, 2026
**Journey:** A product lead decides whether to try Linear
**Device:** Mobile, 390×844
**Tested path:** Homepage → product workflow proof → signup → workspace creation

## Who are we following?

**Maya leads product at a 25-person software company.** Her team works across an issue tracker, documents, and chat. They are adding AI coding agents, and she wants one system that coordinates people and agents without adding more process.

Her goal is to understand what Linear would change for her team, see enough workflow proof to trust the promise, and reach workspace creation.

> This is a simulated journey used as an evaluation lens, not a real usability-test participant. Browser actions are facts; user questions are clearly marked as inference.

## Bottom line

> **Linear makes its new “teams and agents” direction clear and carries Maya all the way to a simple workspace signup. The journey feels coherent, but its strongest product proof arrives slowly and becomes repetitive on mobile.**
>
> **Most important action:** Make the first product image load immediately, then shorten the mobile proof sequence around the three workflows most relevant to a new team.

**No P0 issue was found.** All 6 journey steps completed and signup landed on “Create your workspace.”

## Priority snapshot

| Priority | What Maya runs into | Why it matters | Recommended action |
| --- | --- | --- | --- |
| **P1** | The first product proof is extremely slow | The promise depends on seeing the product | Prioritize and resize the hero image |
| **P1** | Accessibility issues sit inside key controls and content | Some users cannot follow the same journey | Fix names, contrast, links, and headings |
| **P2** | Mobile proof becomes long and visually repetitive | Later capabilities lose attention | Compress and vary the proof sequence |

## Journey at a glance

| Moment | What Maya is trying to do | Experience | State |
| --- | --- | --- | --- |
| Arrive | Decide whether Linear fits a mixed human/agent team | The hero names both teams and agents | **Clear** |
| Understand the workflow | See more than a category claim | Intake, plan, build, review, and monitor are demonstrated | **Clear but dense** |
| Look for operational value | Understand what changes day to day | “Make product operations self-driving” is backed by UI examples | **Clear** |
| Judge full-cycle coverage | Check whether Linear replaces fragmented tools | The page continues through direction, execution, reviews, and progress | **Convincing but long** |
| Try it | Create a workspace | “Sign up” reaches a focused workspace-creation screen | **Clear** |

## What worked well

- The first sentence states both the product category and the changing audience: **“teams and agents.”**
- The page explains a complete product-development cycle rather than listing disconnected features.
- Recognizable customer evidence appears early and again near the decision point.
- Signup asks Maya to create a workspace and offers Google, email, and SAML paths without an unexpected detour.

## Journey replay

### 1. Maya quickly understands the new promise

**Browser fact:** The mobile hero says, “The product development system for teams and agents,” followed by a detailed product interface.

**Likely user question:** “Is this still an issue tracker, or is it now the operating system for all product work?”

The following sections answer that question reasonably well. Linear moves from intake and planning through building, code review, and progress monitoring, so the category claim gains substance.

### 2. The proof is strong, but expensive to receive

**Browser fact:** Lighthouse measured **19.1 seconds LCP**, identified the LCP image as lazily loaded, and scored performance at **58**.

**Likely user question:** “Why is the product preview taking so long when speed is part of Linear’s reputation?”

This is not merely a technical score. The product image is the evidence that helps Maya understand the promise, so delaying it delays product comprehension.

### 3. The long mobile story starts to blur together

**Browser fact:** The mobile page stacks multiple dark interface panels and similarly weighted product sections before reaching testimonials and the final CTA.

**Likely user question:** “Which three capabilities matter for my team right now?”

The breadth builds confidence, but repeated section structure weakens the distinction between primary reasons to adopt and secondary capabilities.

### 4. Signup is direct and matches the CTA

**Browser fact:** Clicking the visible signup action reached `/signup`, where the page says “Create your workspace” and offers Google, email, and SAML SSO. All journey steps completed.

**Likely user question:** “Can I start in the way my company already authenticates?”

The handoff answers this well and preserves momentum.

## Priority findings

### **[P1] Maya waits too long for the visual that explains the product**

**What happened:** The main product visual produced a 19.1-second LCP in this run and was lazily loaded.

**Likely user question:** “Is the page stuck?”

**Why it matters:** The interface is not decoration; it is the primary evidence for a broad positioning claim.

**Recommended change:** Eagerly load and explicitly prioritize the LCP image, ship the correct responsive size, and reduce work before first render.

### **[P1] The polished journey is not equally usable for everyone**

**What happened:** Accessibility scored 85. Detailed checks found unnamed buttons and links, insufficient contrast, and non-sequential headings.

**Likely user question:** “Can I understand and operate this page with my assistive technology?”

**Recommended change:** Match visible and accessible names, repair heading order, and raise muted-text contrast through shared design tokens.

### **[P2] Maya receives more proof than prioritization**

**What happened:** Many mobile sections use the same pattern and visual weight.

**Likely user question:** “What should convince me first?”

**Recommended change:** Lead with three adoption reasons for a first-time team, collapse secondary detail, and vary proof formats so later sections regain attention.

## Action plan

### Do now

1. Fix hero image priority and responsive delivery.
2. Repair accessible names, contrast, links, and heading order.
3. Shorten the default mobile product story.

### Learn next

Test whether product leads can explain Linear’s distinct value for human-and-agent teams after the first three sections, not only after reading the full page.
