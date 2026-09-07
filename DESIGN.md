# India Gratuity Taxation Calculator — Design Document

## Overview
Single-page web application (static HTML/CSS/JS, hosted on GitHub Pages) that
computes gratuity under the **Code on Social Security, 2025** and calculates the
tax (if any) on that gratuity for private-sector employees.

## Formula

```
Gratuity = WageBase × 15 × QualifyingYears ÷ 26
```

- **WageBase** = last drawn basic wages + qualifying allowances.
  - Input modes: (1) Basic + DA, (2) Basic + DA + Other Allowances, (3) Basic + CTC.
  - 50% rule (mode 3): if Basic < 50% of monthly CTC, WageBase = 50% of monthly CTC.
- **15** = 15 days of wages per completed year.
- **26** = working days in a month.

### Service rounding
| Employee type | Rule |
|---|---|
| Permanent | Fractional year ≥ 6 months rounds up, < 6 months rounds down |
| Fixed-term | Pro-rata on actual years (no rounding) |

### Eligibility
| Employee type | Minimum service |
|---|---|
| Permanent   | 5 years (or 4 yrs + 240 days in final year); waived for death / permanent disablement |
| Fixed-term  | 1 year (pro-rata) |
| Employer    | ≥ 10 employees on any day in preceding 12 months |

## Taxation (private sector)

Exemption model (Option 1, confirmed):

```
ExemptAvailable = max(0, 20,00,000 − priorGratuity)
TaxableExcess   = max(0, currentGratuity − ExemptAvailable)
Tax             = income > 0 ? tax(income + TaxableExcess) − tax(income)   ← exact slab-wise
                            : TaxableExcess × manualMarginalRate            ← fallback
TotalIncome     = income + TaxableExcess
Surcharge       = Tax × surchargeRate(TotalIncome)   (0 if TotalIncome ≤ 50,00,000)
Surcharge       = max(0, baseSurcharge − max(0, TotalIncome − threshold))  ← marginal relief
GrossTax        = Tax + Surcharge
InHand          = currentGratuity − GrossTax
```

- **Government employees**: fully tax-exempt (0 tax).
- **Exact incremental tax**: the taxable excess is added on top of the payout-year
  income, so it is taxed at the bracket(s) reached by `income + excess` (e.g. income
  12L + excess 10L → 25% bracket → tax = ₹2.5L − ₹0.6L = ₹1.9L). The manual rate
  dropdown is a fallback only when income is left at 0.
- **Surcharge** applies on the income-tax amount (NOT the gratuity) when total
  income crosses a threshold. Rates: >₹50L = 10%, >₹1Cr = 15%, >₹2Cr = 25%,
  and >₹5Cr = 37% under the old regime (new regime caps at 25%). Marginal relief
  caps the surcharge near each threshold.
- **Mobile**: responsive layouts on all three pages; tables scroll horizontally
  (`.table-wrap`) and the chat widget goes edge-to-edge under 640px.

### Tax regimes (FY 2025-26 slabs used for auto detect)
| New regime (₹) | Rate | Old regime (₹) | Rate |
|---|---|---|---|
| 0 – 4,00,000 | 0% | 0 – 2,50,000 | 0% |
| 4,00,001 – 8,00,000 | 5% | 2,50,001 – 5,00,000 | 5% |
| 8,00,001 – 12,00,000 | 10% | 5,00,001 – 10,00,000 | 20% |
| 12,00,001 – 16,00,000 | 15% | 10,00,001+ | 30% |
| 16,00,001 – 20,00,000 | 20% | | |
| 20,00,001 – 24,00,000 | 25% | | |
| 24,00,001+ | 30% | | |

## Architecture

```
index.html (self-contained calculator + taxation UI)
  ├── CSS: card layout, sections, switch (gov/private), tables, collapsibles
  ├── JS: computeWageBase(), calculate(), slab detection, Option-1 tax math
  │       builds result table + example table
  └── Includes chat widget via js/chat-widget.js

learn.html — static guide with 7 caveats + general exemptions

chat.html — full-page assistant UI

js/chat-data.js — rule-based knowledge base (fallback engine)
js/chat-core.js — ask(): tries proxy → falls back to local KB
js/chat-widget.js — floating chat bubble on index/learn, injects calc context

netlify/functions/chat.js — GitHub Models proxy (optional backend)
  ├── SYSTEM_PROMPT with gratuity knowledge
  ├── POST https://models.github.ai/inference/chat/completions
  ├── Bearer GITHUB_MODELS_TOKEN (env, server-side only)
  └── rateLimit: 20/60s per IP+domain
```

## Data flow (AI)
```
Browser (widget / chat.html)
   └─ fetch('/.netlify/functions/chat', {message, context})
       └─ [if deployed] Netlify Function → GitHub Models API → response
       └─ [if static/Offline] chat-core falls back to local KB answer
```

On GitHub Pages the proxy is unreachable, so the assistant uses the local
knowledge base — keeping the site fully functional with no keys.

## Compliance reminders (shown in UI)
1. Prior-gratuity declaration (reduces ₹20,00,000 lifetime ceiling).
2. Form I submission; settlement within 30 days; simple interest on delay.
3. Gratuity may be forfeited for misconduct after due process.

## Files
| File | Purpose |
|---|---|
| index.html | Calculator + taxation UI |
| learn.html | Gratuity guide page |
| chat.html | Assistant page |
| js/chat-data.js | Rule-based KB |
| js/chat-core.js | Chat engine (proxy → fallback) |
| js/chat-widget.js | Floating widget |
| netlify/functions/chat.js | GitHub Models proxy (optional) |
| netlify.toml | Netlify build/functions config |
| NETLIFY_DEPLOY.md | Optional AI deploy guide |
| README.md / DESIGN.md / prompt.txt | Docs & history |

## Hosting
- GitHub Pages: `https://nirav-email81.github.io/India-Gratuity-Taxation-Calculator/`
- AI proxy (optional): Netlify Functions (see NETLIFY_DEPLOY.md).