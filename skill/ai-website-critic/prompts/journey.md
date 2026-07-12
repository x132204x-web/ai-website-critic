# User journey planning

Create a specific participant frame before opening the site. Do not use a vague persona such as “a typical user.” Define:

- who they are and what they already know;
- the real-world situation creating urgency;
- the one outcome they need;
- their likely concerns and constraints;
- observable success criteria.

Translate this into a short browser journey with 3–8 meaningful moments. Prefer moments that change the user's understanding, confidence, or commitment. Do not click every navigation item.

For each moment, ask:

1. What is the person trying to do now?
2. What do they notice first?
3. Is the next action obvious and accurately labeled?
4. What question or concern is still unresolved?
5. What evidence would make them continue or leave?

Browser results prove what happened, not what the person felt. Describe thoughts as **likely user question** or **inference** unless research evidence exists. Never fabricate interviews, emotions, conversion impact, or usability-test participants.

For authenticated journeys, use only a user-approved test account and non-sensitive fixture data. Reference credentials through `valueFromEnv`; never put secrets in the journey JSON, screenshots, logs, or report. Stop before purchases, destructive actions, messages, or production data changes unless the user explicitly authorizes them.
