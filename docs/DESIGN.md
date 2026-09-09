# India Gratuity Taxation Calculator — Design Document

## Overview
Static, dependency-free web application (vanilla HTML/CSS/JS) that computes
gratuity under the **Code on Social Security, 2025** and the tax on it, for
private- and government-sector employees. Hosted on GitHub Pages, with an optional
**AI chat assistant** proxied through a Netlify serverless function.

Live: https://nirav-email81.github.io/India-Gratuity-Taxation-Calculator/
(mirror with AI: https://india-gratuity-calculator.netlify.app/)

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Calculator + taxation UI (self-contained JS & CSS) |
| `learn.html` | Static guide: 7 caveats, exemptions, protections, judgements, nominations |
| `chat.html` | Full-page assistant UI (uses the same engine as the widget) |

## Gratuity formula

```
Gratuity = WageBase × 15 × QualifyingYears ÷ 26
```

- **WageBase** = last drawn basic wages + qualifying allowances, computed by
  `computeWageBase()` (index.html): input modes
  1. Basic + DA
  2. Basic + DA + Other Allowances
  3. Basic + CTC → 50% rule applies
- **50% rule (mode 3):** if Basic < 50% of monthly CTC, WageBase = 50% of monthly CTC
  (allowances above 50% are "added back" to the gratuity base).
- **15** = 15 days of wages per completed year of service; **26** = working days in a month.

### Service rounding (`calculate()`, index.html)
| Employee type | Rule |
|---|---|
| Permanent | Fractional year ≥ 6 months rounds **up**, < 6 months rounds down |
| Fixed-term | **Pro-rata** on actual years (no rounding) |

### Eligibility
| Employee type | Minimum service |
|---|---|
| Permanent | 5 years (or 4 yrs + 240 days in final year); waived for death / permanent disablement |
| Fixed-term | 1 year (pro-rata) |
| Employer | ≥ 10 employees on any day in preceding 12 months (once covered, always covered) |

**Below-threshold flag:** if a permanent employee is under 5 years (or fixed-term
under 1 year), the UI shows a bold **"not entitled"** amber banner (`#eligWarning`):
the computed number is **reference-only**, not an entitlement.

### Government (CCS) formula
`Gratuity = min( floor(serviceYears × 2) × monthlyEmoluments ÷ 4 ,  16.5 × monthlyEmoluments )`
i.e. ¼ of monthly emoluments per completed 6-month period, capped at 16.5× monthly
emoluments. Fully **tax-exempt**. State rules may vary (shown in `#govNote`).

## Taxation (private sector)

Exemption model (Option 1):

```
ExemptAvailable = max(0, 20,00,000 − priorGratuity)      // ₹20L lifetime ceiling
TaxableExcess   = max(0, currentGratuity − ExemptAvailable)
Tax             = income > 0 ? tax(income + TaxableExcess) − tax(income)  ← exact slab-wise
                            : TaxableExcess × manualMarginalRate          ← fallback
TotalIncome     = income + TaxableExcess
Surcharge       = Tax × surchargeRate(TotalIncome)   (0 if TotalIncome ≤ ₹50L)
Surcharge       = max(0, baseSurcharge − max(0, TotalIncome − threshold)) ← marginal relief
GrossTax        = Tax + Surcharge
InHand          = currentGratuity − GrossTax
```

Key points implemented in `progressiveTax()` / `surchargeInfo()` (index.html):

- **Incremental tax is exact:** the taxable excess is added *on top of* the
  payout-year income, so it's taxed at the bracket(s) reached by `income + excess`
  — not the bracket of `income` alone. Example: income ₹12L + excess ₹10L →
  `tax(22L) − tax(12L) = ₹2.5L − ₹0.6L = ₹1.9L` (reaches the 25% slab).
- **If income is left at 0**, a manual marginal-rate dropdown is used
  (`excess × rate`) as a fallback estimate.
- **Surcharge** is levied on the income-tax amount (not the gratuity) once total
  income crosses a threshold. Marginal relief caps it near each threshold.
- **Government employees**: 0 tax.
- 4% health & education cess is **not** included (noted in UI).

### Regimes (FY 2025-26 slabs)
| New regime (₹) | Rate | Old regime (₹) | Rate |
|---|---|---|---|
| 0 – 4,00,000 | 0% | 0 – 2,50,000 | 0% |
| 4,00,001 – 8,00,000 | 5% | 2,50,001 – 5,00,000 | 5% |
| 8,00,001 – 12,00,000 | 10% | 5,00,001 – 10,00,000 | 20% |
| 12,00,001 – 16,00,000 | 15% | 10,00,001+ | 30% |
| 16,00,001 – 20,00,000 | 20% | | |
| 20,00,001 – 24,00,000 | 25% | | |
| 24,00,001+ | 30% | | |

### Surcharge rates
| Total income | New regime | Old regime |
|---|---|---|
| ₹50L – ₹1Cr | 10% | 10% |
| ₹1Cr – ₹2Cr | 15% | 15% |
| ₹2Cr – ₹5Cr | 25% | 25% |
| above ₹5Cr | 25% (capped) | 37% |

## Architecture

```
Static pages (HTML + inline CSS/JS)
├── index.html  — calculator & taxation UI
│   ├── computeWageBase()  — wage-base resolution (modes, 50% rule)
│   ├── calculate()        — service rounding, formula, eligibility flag, tax pipeline,
│   │                        builds #result / #taxTable / #eligWarning / #serviceNote
│   ├── setWageMode() / setSector() / setRegime() / autoSetRate()
│   ├── progressiveTax()   — slab-wise tax for a regime
│   ├── surchargeInfo()    — surcharge % + marginal relief
│   └── buildExampleTable()— sample reference values
├── learn.html  — static guide (caveats, exemptions, protections, judgements)
└── chat.html   — full-page assistant (same engine as widget)

js/
├── chat-data.js    — rule-based knowledge base (22+ entries) — offline fallback
├── chat-core.js    — window.ChatAPI: ask() → proxy first, KB fallback second
└── chat-widget.js  — floating bubble on index/learn; injects calculator context
└── active-nav.js   — URL-based navigation highlighting

netlify/
├── functions/chat.js — AI serverless proxy (optional backend)
└── toml: publish=".", functions dir, build command empty
```

## AI assistant — design

### Why a serverless proxy?
The model key must **never reach the browser** (CORS + secrets). A small Netlify
Function holds the secret in an env var and forwards requests to an
**OpenAI-compatible** chat-completions endpoint.

### Provider-agnostic config (`netlify/functions/chat.js`)
| Env var | Purpose | Current value |
|---|---|---|
| `AI_API_KEY` | Provider API key (falls back to legacy `GITHUB_MODELS_TOKEN`) | Gemini key |
| `AI_BASE_URL` | OpenAI-compatible endpoint | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` |
| `AI_MODEL` | Model id | `gemini-3.6-flash` |

Switching provider = changing 3 env vars, **no code change**. This design paid off
when GitHub Models entered retirement (410 `github_models_retirement_brownout`):
the app migrated to Gemini by env-var swap alone.

### Request pipeline
1. `window.ChatAPI.ask(message)` (`js/chat-core.js`) POSTs `{message, context}` to
   `/.netlify/functions/chat`.
2. Netlify Function validates input → calls `AI_BASE_URL` with the system prompt,
   user message, and serialized calculator context (`model`, `max_tokens: 600`).
3. On 2xx it returns `{response}`; the widget renders it with a **"Powered by AI"**
   tag (`source: 'ai'`).
4. On any failure (404 on Pages, 503 unconfigured, 410 retired provider, 429 limit)
   → `chat-core` **falls back to the local KB** (`answerLocal()`), tagged
   "built-in assistant — AI service not connected". The site never breaks without AI.

### System prompt (`SYSTEM_PROMPT` in chat.js)
Covers: formula; 5-year/1-year eligibility; rounding rules; below-threshold
reference-only rule; CTC "gratuity" provision vs unlawful salary deduction (refundable
in full & final settlement); 50% wage rule; ₹20L exemption ladder + surcharge + 4%
cess; **govt CCS formula** + full exemption; Form I, 30-day settlement, forfeiture for
misconduct; staffing-agency eligibility. A JSON summary of the on-page calculation
context is appended so the model can reference the user's actual numbers.

### Guardrails
- CORS: `Access-Control-Allow-Origin: *`; preflight `OPTIONS` handled.
- Rate limit: `exports.config.rateLimit = { windowLimit: 20, windowSize: 60,
  aggregateBy: ['ip','domain'] }` (Netlify built-in).
- `max_tokens: 600` bounds output cost.
- 503 if no key configured; 400 on invalid JSON/missing message; upstream status is
  forwarded verbatim for debuggability.

## Data flow

```
Browser (widget / chat.html)
   │  fetch('/.netlify/functions/chat', {message, context})
   ▼
[Netlify] chat.js → provider API (Gemini) ──► AI reply, tagged "Powered by AI"
   │  (function unreachable / errors / 404 / 410 / 503 / 429)
   ▼
[Browser] chat-core.js → local KB (chat-data.js) ──► rule-based answer
```

## Decision log

| Decision | Rationale |
|---|---|
| Vanilla HTML/CSS/JS, no build step | Static, portable, zero toolchain; runs from any host or file |
| GitHub Pages as primary host | Free, push-to-deploy, per-project subdomain |
| Netlify Function for AI | Server-side secret isolation + CORS-sane API + free function tier |
| Provider-agnostic env vars | Model market churn (GitHub Models retirement) → swap-by-config |
| KB fallback chain | Predictable offline behavior; degraded mode ≠ broken site |
| Option 1 exact incremental tax | Matches IT-Department computation intent; the manual-rate dropdown is only a 0-income fallback |
| ₹20L lifetime ceiling (Option 1) | Statutory; prior-gratuity input is declared in Form I |

## Testing references

See `README.md` → sample gratuity rows (e.g. 65,000 × 15 × 12 ÷ 26 = ₹4,50,000) and
taxation rows (exemption ladder + incremental tax). Manual checks:
- Row 1: `7.6 yrs rounds up to 8 → 43,000 × 15 × 8 ÷ 26 = ₹1,98,462`
- Fixed-term: `30,000 × 15 × 1 ÷ 26 = ₹17,308` (pro-rata, no rounding)
- Govt: service 10 yrs, emoluments ₹50,000 → `floor(20) × 50,000 ÷ 4 = ₹2,50,000`;
  formula caps at `16.5 × 50,000 = ₹8,25,000`

Live verification after a deploy:
```
GET  https://<site>/index.html                     → 200
POST https://<site>/.netlify/functions/chat        → AI reply (body: {"message":"…"})
```

## Security & cost

- Secrets live only in Netlify env vars / local `.env` (git-ignored). Never shipped
  to the browser; never committed.
- Free tier: Gemini ≈ 1,500 req/day; Netlify function ≈ trivial. No credits to buy.
- If a key is shared publicly, revoke and replace it.

## Files

| File | Purpose |
|---|---|
| `index.html` | Calculator + taxation UI |
| `learn.html` | Gratuity guide page |
| `chat.html` | Assistant page |
| `js/chat-data.js` | Rule-based KB (fallback) |
| `js/chat-core.js` | Chat engine (proxy → fallback) |
| `js/chat-widget.js` | Floating widget (injects calc context) |
| `js/active-nav.js` | URL-based nav highlighting |
| `netlify/functions/chat.js` | AI proxy (provider-agnostic) |
| `netlify.toml` | Netlify config |
| `docs/DEPLOY.md` | Beginner deploy guide |
| `docs/INTERVIEW_Q&A.md` | Interview prep |
| `README.md` | Project overview |
| `prompt.txt` | Historical build prompts (log only) |