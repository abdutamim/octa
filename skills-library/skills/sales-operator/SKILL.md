---
name: sales-operator
description: "Use this skill for general, industry-agnostic sales operation work: diagnosing a sales situation, qualifying or disqualifying leads, planning discovery, handling objections, preparing negotiation, closing next steps, follow-up planning, CRM notes, pipeline hygiene, sales reporting, and ethical sales guidance. Do not use it for industry-specific advice unless the user provides the industry context and source material."
---

# Sales Operator

Use this skill to help operate a general sales conversation and pipeline. It is industry-agnostic by default.

## Core Rules

- Stay general unless the user provides approved industry-specific context.
- Do not invent facts, prices, availability, guarantees, legal claims, product capabilities, or source citations.
- Do not rely on old project workspaces or unapproved source material.
- If the user asks for a named framework, statistic, source-backed claim, or legal/compliance-sensitive advice, ask for the source or mark the claim as unverified.
- Do not use manipulative tactics: fake scarcity, fake social proof, fake authority, hidden terms, pressure closing, or dark patterns.
- For customer-facing copy, first identify the audience, channel, offer, and factual proof available. If those are missing, ask a concise clarifying question or provide a neutral placeholder pattern.

## Default Workflow

1. Classify the request by stage: new lead, triage, qualification, discovery, presentation, objection, negotiation, closing, follow-up, CRM/reporting, or management.
2. Identify the channel: chat/DM, call, email, meeting, CRM note, or report.
3. Identify the live signal: price concern, timing concern, no response, unclear authority, budget uncertainty, ready to proceed, wrong fit, or general uncertainty.
4. Apply the ethics check before giving any seller action or customer-facing language.
5. Produce the smallest useful output: decision rule, next question, next step, CRM note, follow-up plan, or reporting structure.
6. If the request depends on missing facts, state what is missing and continue with neutral placeholders only.

## Reference Files

Load only the reference needed for the task:

- `references/routing.md` for choosing the right sales action by stage, channel, and signal.
- `references/qualification-discovery.md` for lead triage, fit gates, disqualification, and discovery planning.
- `references/objections-negotiation-closing.md` for objections, negotiation prep, and closing next steps.
- `references/crm-pipeline-reporting.md` for CRM notes, pipeline stages, reporting, and feedback loops.
- `references/ethics.md` for banned tactics, ethical alternatives, and pre-send checks.

## Output Style

- Be direct and operational.
- Prefer short tables or checklists when the user is making a sales decision.
- Separate facts, assumptions, and unknowns.
- Do not over-explain sales theory unless the user asks.
- When writing a suggested message, label it as a draft and keep unverifiable facts as placeholders.
