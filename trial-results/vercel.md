# Product Design Review: Vercel

**Reviewed:** July 12, 2026  
**Scope:** Public homepage, desktop and mobile  
**Evidence:** Full-page screenshots plus one Lighthouse run. The capture contains a large blank tail after the visible content, so conclusions are limited to rendered sections.

## Executive verdict

Vercel's homepage is a bold positioning move: “Agentic Infrastructure” is memorable and the customer examples make the abstract category tangible. The composition is confident, but extreme whitespace and dense technical labels place a high interpretation burden on less technical buyers. This run also shows substantial JavaScript cost for a visually sparse page.

## Scorecard

| Dimension | Score | Rationale |
| --- | ---: | --- |
| Positioning and clarity | 8/10 | Distinct category claim with a terse audience statement. |
| Visual hierarchy | 8/10 | Strong type and composition; whitespace occasionally breaks continuity. |
| Aesthetic coherence | 9/10 | A disciplined monochrome system supports the infrastructure message. |
| Usability and information architecture | 7/10 | Examples clarify the offer, but feature labels remain jargon-heavy. |
| Conversion effectiveness | 7/10 | Deploy and sales paths are clear; motivation is stronger for existing category-aware users. |
| Trust and credibility | 9/10 | Named, high-scale customer examples do substantial proof work. |
| Accessibility and responsiveness | 8/10 | Score 95, with zoom restriction and label-name mismatch still flagged. |
| Technical quality | 6/10 | Performance scored 59 and main-thread work reached 18.6 seconds. |

## What is working

The hero is distinctive without ornamental clutter. Customer stories are embedded into the product explanation rather than isolated as generic logos. Mobile retains the primary actions and gives each use case enough room to read.

## Prioritized findings

### [High] Runtime weight contradicts the visual simplicity

**Observed:** Lighthouse scored performance at 59, measured 18.6 s of main-thread work and 14.9 s of JavaScript execution, and estimated 425 KiB of unused JavaScript.  
**What is wrong:** A sparse landing page carries application-scale execution cost.  
**Why it matters:** **Inference:** The delay weakens the felt quality of an infrastructure brand built around speed and operational excellence.  
**How to improve:** Defer noncritical interactive modules, split below-fold customer experiences, and render the hero and first proof with the smallest possible client bundle.

### [High] Mobile zoom is artificially constrained

**Observed:** Lighthouse found a viewport setting that disables or restricts user scaling.  
**What is wrong:** The page limits a basic browser accessibility control.  
**Why it matters:** Users who need magnification cannot adapt the dense technical labels to their reading needs.  
**How to improve:** Remove `user-scalable=no` and any restrictive maximum-scale value, then test zoomed layouts at 200% and 400%.

### [Medium] The technical proof requires too much decoding

**Observed:** Customer sections pair strong outcome headlines with compact all-caps feature lists such as “durable orchestration” and “AI model gateway.”  
**What is wrong:** The feature labels explain implementation, but not the specific risk or effort removed for the buyer.  
**Why it matters:** **Inference:** Decision-makers outside engineering may understand the scale claim but not why these capabilities produce it.  
**How to improve:** Add one plain-language causal sentence to each customer proof that connects capability, changed workflow, and outcome.

## Recommended redesign direction

Keep the monochrome identity and category-level hero. Reduce JavaScript, make accessibility non-negotiable, and translate each technical capability into a short product consequence without diluting the expert tone.

## Quick wins

1. Restore unrestricted browser zoom.
2. Correct visible-label/accessibility-name mismatches.
3. Remove the initial redirect where feasible.
4. Defer unused below-fold JavaScript.

## Longer-term improvements

1. Set a client-JavaScript budget for the marketing homepage.
2. Test customer-proof comprehension with product and business audiences.
3. Investigate the blank captured tail and lazy-render behavior across automated and low-powered clients.
