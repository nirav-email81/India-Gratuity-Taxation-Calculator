# India Gratuity Taxation Calculator

A single-page web app to compute **gratuity** and the **tax on it**, under India's
updated rules in the **Code on Social Security, 2025** (effective **Nov 21, 2025**).

**Live site (GitHub Pages):** https://nirav-email81.github.io/India-Gratuity-Taxation-Calculator/

## Pages

- **`index.html`** — Gratuity + tax calculator (2025 rules)
- **`learn.html`** — Learn about gratuity: 7 caveats & rules
- **`chat.html`** — AI gratuity assistant (falls back to a built-in knowledge base)

## Formula

```
Gratuity = (Last Drawn Basic Wages + qualifying allowances) × 15 × Years of Service ÷ 26
```

- **26** = working days per month under the rules.
- **Permanent employees**: 5-year rule (or 4 years + 240 working days in the final
  year); fractional years round up from 6 months.
- **Fixed-term employees**: eligible after **1 year**, pro-rata on actual years (no rounding).

## Taxation model (private sector)

Option-1 exemption model:

| Value | Formula |
| --- | --- |
| Exempt available | `max(0, ₹20,00,000 − prior gratuity)` |
| Taxable excess | `max(0, current gratuity − exempt available)` |
| Tax on gratuity | `tax(income + excess) − tax(income)` (slab-wise, exact) |
| Surcharge | `tax × surcharge rate` when total income > ₹50,00,000 |
| Tax + Surcharge | `tax + surcharge` (with marginal relief near thresholds) |
| In-hand | `current gratuity − tax − surcharge` |

- **Government employees**: fully tax-exempt.
- The taxable excess is added **on top of** your payout-year income, so it is taxed at
  the bracket(s) reached by `income + excess` — not just the bracket of the income
  alone. Example: income ₹12,00,000, excess ₹10,00,000 → total ₹22,00,000; the exact
  incremental tax is `tax(22,00,000) − tax(12,00,000) = ₹2,50,000 − ₹60,000 = ₹1,90,000`
  (reaching the 25% bracket), not `₹10,00,000 × 15% = ₹1,50,000`.
- If **income is left at 0**, the manual marginal-rate dropdown is used instead
  (`excess × rate`) as a fallback estimate.
- **Surcharge rates** (levied on the income-tax amount when total income — annual
  income plus taxable gratuity excess — crosses a threshold):

| Total income | New regime | Old regime |
| --- | --- | --- |
| ₹50,00,000 – ₹1,00,00,000 | 10% | 10% |
| ₹1,00,00,000 – ₹2,00,00,000 | 15% | 15% |
| ₹2,00,00,000 – ₹5,00,00,000 | 25% | 25% |
| above ₹5,00,00,000 | 25% (capped) | 37% |

- **Marginal relief** is applied automatically near a threshold so income marginally
  above ₹50 lakh or ₹1 crore is not overtaxed.
- The calculator is mobile-friendly: tables scroll horizontally on small screens and
  all cards reflow for phones.
- The 4% health & education cess is not included (noted on the page).

## Sample test values (gratuity calc)

| # | Wage base (₹) | Service (yrs) | Type | Expected Gratuity (₹) |
|---|--------------|--------------|------|----------------------|
| 1 | 65,000  | 12   | Permanent | 4,50,000  |
| 2 | 65,000  | 12.6 | Permanent | 4,87,500  |
| 3 | 43,000  | 7.6  | Permanent | 1,98,462  |
| 4 | 43,000  | 5.3  | Permanent | 1,24,038  |
| 5 | 100,000 | 14.5 | Permanent | 8,65,385  |
| 6 | 30,000  | 1.0  | Fixed-term | 17,308    |
| 7 | 30,000  | 1.8  | Fixed-term | 31,154    |

Manual check (row 1): `65,000 × 15 × 12 ÷ 26 = 1,17,00,000 ÷ 26 = 4,50,000`.

Manual check (row 3): 7.6 yrs rounds up to 8 → `43,000 × 15 × 8 ÷ 26 = 51,60,000 ÷ 26 = 1,98,462` (rounded).

Manual check (row 6): fixed-term pro-rata `30,000 × 15 × 1 ÷ 26 = 17,308` (rounded).

## Sample test values (taxation)

| Current Gratuity (₹) | Prior (₹) | Exempt avail (₹) | Taxable excess (₹) | Rate | Tax (₹) | In-hand (₹) |
|---------------------|----------|------------------|-------------------|------|--------|------------|
| 18,00,000 | 0        | 20,00,000 | 0        | 30% | 0       | 18,00,000 |
| 18,00,000 | 6,00,000 | 14,00,000 | 4,00,000 | 30% | 1,20,000 | 16,80,000 |
| 24,00,000 | 5,00,000 | 15,00,000 | 9,00,000 | 30% | 2,70,000 | 21,30,000 |
| 32,00,000 | 0        | 20,00,000 | 12,00,000| 30% | 3,60,000 | 28,40,000 |
| 10,00,000 | 0        | 20,00,000 | 0        | 30% | 0       | 10,00,000 |

## AI assistant

- `chat.html` + a floating widget on the calculator and learn pages.
- Tries the GitHub Models proxy (`/.netlify/functions/chat`) if deployed; otherwise
  falls back to the built-in knowledge base (`js/chat-data.js`).
- To enable real AI, see **`NETLIFY_DEPLOY.md`** (GitHub Models token + Netlify Function).

## Project layout

```
index.html               → calculator + taxation UI (self-contained)
learn.html               → gratuity guide / caveats
chat.html                → dedicated assistant page
js/chat-data.js          → rule-based knowledge base (fallback)
js/chat-core.js          → proxy-first, knowledge-base-fallback chat engine
js/chat-widget.js        → floating chat bubble on index/learn
netlify/functions/chat.js→ GitHub Models serverless proxy (optional)
netlify.toml             → Netlify config (publish=., functions dir, rate limit)
NETLIFY_DEPLOY.md        → optional AI deployment guide
DESIGN.md                → design document
prompt.txt               → build prompts history
```

## Run locally

Open `index.html` in any browser. No build step. For a server: `python -m http.server 8080`.

## License

MIT