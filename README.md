# India Gratuity Taxation Calculator

A simple, free tool that computes **gratuity** and the **tax on it** under India's
**Code on Social Security, 2025** (effective **Nov 21, 2025**).

No login. No backend. No build step. Just open it in a browser and start calculating.

**Live sites**
- GitHub Pages (free, works for everyone): https://nirav-email81.github.io/India-Gratuity-Taxation-Calculator/
- Netlify mirror (adds the AI chat): https://india-gratuity-calculator.netlify.app/

## What can you do with it?

| Feature | Where |
|---|---|
| Calculate gratuity — permanent or fixed-term, private or government | `index.html` |
| See the income-tax on the taxable gratuity (slabs, surcharge, marginal relief) | `index.html` |
| Learn gratuity rules, exemptions and pitfalls | `learn.html` |
| Ask gratuity questions to a chat assistant (AI, or offline answers) | `chat.html` + floating widget |

## Quick start (run it yourself)

You can run the entire app **without installing anything**:

1. Open `index.html` in any browser — done.
   The chat still works, answering from a built-in knowledge base.
2. Prefer a local server? Any of these work:
   ```bash
   python -m http.server 8080     # http://localhost:8080
   npx serve .
   ```
3. Or just double-click `index.html` from your file explorer.

## How it works (the important rules)

```
Gratuity = (Last Drawn Basic Wages + qualifying allowances) × 15 × Years of Service ÷ 26
```

| Rule | Detail |
|---|---|
| `26` | Working days per month under the rules |
| Permanent eligibility | 5 years (or 4 yrs + 240 days in final year); waived for death / permanent disablement |
| Permanent rounding | Fractional year ≥ 6 months rounds **up**, < 6 months rounds down |
| Fixed-term eligibility | **1 year**, paid pro-rata (no rounding) |
| 50% wage rule (CTC mode) | If Basic < 50% of CTC, the gratuity base becomes 50% of CTC |
| Below threshold | Under 5 years (permanent) or 1 year (fixed-term), the shown number is **reference-only** — not an entitlement |

**Government employees**: gratuity = one-fourth of monthly emoluments per completed
6-month period, capped at 16.5× emoluments (Central CCS formula), fully **tax-exempt**.

## How the tax is calculated (private sector)

Option-1 exemption model:

| Step | Rule |
|---|---|
| Exempt available | `max(0, ₹20,00,000 − prior gratuity)` — a lifetime ceiling |
| Taxable excess | `max(0, current gratuity − exempt available)` |
| Tax | `tax(income + excess) − tax(income)` — exact, slab-wise |
| Surcharge | `tax × rate` when total income > ₹50,00,000 (with marginal relief near thresholds) |
| In-hand | `current gratuity − tax − surcharge` |

The taxable excess is added **on top of** your payout-year income, so it's taxed at
the bracket(s) reached by `income + excess` — not just the bracket of your income.
Example: income ₹12L + excess ₹10L → `tax(22L) − tax(12L) = ₹2.5L − ₹0.6L = ₹1.9L`.

**Surcharge rates** (on the income-tax amount, when total income crosses):

| Total income | New regime | Old regime |
| --- | --- | --- |
| ₹50,00,000 – ₹1,00,00,000 | 10% | 10% |
| ₹1,00,00,000 – ₹2,00,00,000 | 15% | 15% |
| ₹2,00,00,000 – ₹5,00,00,000 | 25% | 25% |
| above ₹5,00,00,000 | 25% (capped) | 37% |

Marginal relief is applied automatically near thresholds. The 4% health & education
cess is **not** included (noted on the page).

## AI assistant

- A floating chat widget on the calculator/learn pages, plus a full-page
  `chat.html`.
- The chat first calls the **AI proxy** (`/.netlify/functions/chat`); if that is
  unavailable (e.g. on GitHub Pages) it **automatically falls back** to a built-in
  knowledge base — the site never breaks.
- When AI is active, replies are tagged **"Powered by AI"**.
- To enable real AI, follow **`docs/DEPLOY.md`** (free Gemini key + Netlify — about
  10 minutes).

## Project layout

```
index.html                Calculator + taxation UI (self-contained)
learn.html                Gratuity guide / caveats
chat.html                 Full-page assistant
js/chat-data.js           Rule-based knowledge base (offline fallback)
js/chat-core.js           Chat engine: AI proxy first, KB fallback
js/chat-widget.js         Floating chat bubble on index/learn
js/active-nav.js          URL-based navigation highlighting
netlify/functions/chat.js AI serverless proxy (optional)
netlify.toml              Netlify config (publish, functions, build)
docs/DEPLOY.md            Step-by-step deploy guide (Pages + Netlify AI)
docs/DESIGN.md            Design document
docs/INTERVIEW_Q&A.md     Interview Q&A for this project
prompt.txt                Historical build prompts (log only)
```

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

Checks: `65,000 × 15 × 12 ÷ 26 = ₹4,50,000` · `7.6 yrs → 8 yrs → ₹1,98,462` ·
fixed-term is pro-rata.

## Sample test values (taxation)

| Current Gratuity (₹) | Prior (₹) | Exempt avail (₹) | Taxable excess (₹) | Rate | Tax (₹) | In-hand (₹) |
|---------------------|----------|------------------|-------------------|------|--------|------------|
| 18,00,000 | 0        | 20,00,000 | 0        | 30% | 0       | 18,00,000 |
| 18,00,000 | 6,00,000 | 14,00,000 | 4,00,000 | 30% | 1,20,000 | 16,80,000 |
| 24,00,000 | 5,00,000 | 15,00,000 | 9,00,000 | 30% | 2,70,000 | 21,30,000 |
| 32,00,000 | 0        | 20,00,000 | 12,00,000| 30% | 3,60,000 | 28,40,000 |
| 10,00,000 | 0        | 20,00,000 | 0        | 30% | 0       | 10,00,000 |

## Deployment in one line

- **GitHub Pages (free, no keys):** push the repo → repo **Settings → Pages →**
  deploy `main` → `/ (root)`.
- **Netlify (optional AI chat):** import repo → set `AI_API_KEY`, `AI_BASE_URL`,
  `AI_MODEL` → deploy.

Full beginner walkthrough: **`docs/DEPLOY.md`**.

## Roadmap / possible improvements

- **Unit tests** for the pure functions (`progressiveTax`, `computeWageBase`,
  service rounding) — they're deterministic, so a small test harness would lock the
  sample values in.
- **Chat eval set** — a curated list of gratuity questions with expected answers, to
  regression-test the system prompt and model choice.
- **Streaming replies** (server-sent events) so chat answers appear incrementally.
- **Answer caching** for repeated common questions (saves model tokens + latency).
- **Provider failover** — try Gemini → OpenAI → knowledge base automatically.
- **PWA shell** — offline-capable app + installable icon on mobile.

## Tech stack

Vanilla HTML/CSS/JS · zero dependencies · no build step · Netlify Functions (optional
AI proxy) · OpenAI-compatible model API (Gemini).

## License

MIT