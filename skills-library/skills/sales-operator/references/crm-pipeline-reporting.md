# CRM, Pipeline, And Reporting

Use this for notes, pipeline movement, win/loss reasons, and sales reports.

## Pipeline Stages

| Stage | Entry | Exit |
|---|---|---|
| new_lead | Lead received | Triage started |
| triage | Lead is being checked | Real prospect, disqualified, or needs clarification |
| qualified | Fit gate passed | Discovery or recommendation scheduled |
| discovery | Buyer situation is being understood | Need, fit, and decision process are clear |
| recommendation | Seller has proposed next path | Buyer accepts, objects, negotiates, or pauses |
| negotiation | Terms or tradeoffs are being discussed | Agreement, loss, or nurture |
| commitment | Buyer agrees to next formal step | Won, lost, or stalled |
| won | Deal closed | Report and feedback logged |
| lost | Deal lost or disqualified | Loss reason logged |
| nurture | Timing is not now but fit may exist | Future touch scheduled |

## Interaction Note Schema

Use stable fields:

```yaml
interaction:
  lead_id:
  timestamp:
  channel:
  stage:
  direction:
  source:
  summary:
  problem_or_goal:
  fit_gate:
    problem_exists:
    impact_size:
    offer_fit:
    authority_path:
    timing:
    budget_clarity:
  objections:
  next_step:
  next_step_owner:
  next_step_due:
  evidence_claims:
```

`next_step` should not be empty unless the lead is closed-lost or intentionally archived.

## Win / Loss Taxonomy

Common win reasons:

- strong_fit
- value_clear
- trust_established
- timing_fit
- risk_reduced
- referral_or_relationship

Common loss reasons:

- wrong_fit
- no_problem
- budget_mismatch
- no_decision
- competitor
- bad_timing
- trust_gap
- unresponsive
- no_authority_path

## Reporting Tiers

| Tier | Examples | Use |
|---|---|---|
| Activities | touches, calls, emails, follow-ups, response time | Manage effort |
| Objectives | qualification rate, discovery-to-recommendation rate, close rate, cycle time | Manage process |
| Results | revenue, deals won, win rate, average deal size | Measure outcomes |

## Feedback To Marketing Or Demand Generation

Track:

- lead_quality_by_source
- recurring_objections
- win_reasons
- loss_reasons
- persona_mismatch
- message_market_mismatch

Feedback must be factual, based on observed sales conversations, and not invented.

