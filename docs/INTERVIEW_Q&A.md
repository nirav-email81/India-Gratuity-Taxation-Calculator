# India Gratuity Taxation Calculator — Interview Q&A

Interview prep that mirrors the **real implementation**. Use these to rehearse
"walk me through your project" and the AI/deployment details that get senior-level
follow-ups. Answers reference actual files/functions.

---

## 1. Project overview

**Q: What does this project do?**
It's a static web app that computes statutory **gratuity** (Payment of Gratuity Act,
1972 / Code on Social Security, 2025) and the **tax** on it. It handles private vs
government formulas, service rounding, a ₹20L tax exemption ladder, surcharge with
marginal relief, and it ships a chat assistant that answers gratuity questions either
through an AI model (via a serverless proxy) or from a built-in knowledge base.

**Q: Why did you use vanilla HTML/CSS/JS instead of React/Vue?**
The app is mostly self-contained computation — there's no heavy state or routing, so
a framework would add toolchain overhead (bundlers, config) with no payoff. The
output is a zero-dependency static site you can run from a file or any host.
`framework-agnostic-parity`: the tax math lives in a few pure functions
(`progressiveTax`, `computeWageBase`, `calculate`).

**Q: What are the three pages and how do they relate?**
- `index.html` — calculator + taxation UI (self-contained inline JS/CSS).
- `learn.html` — static content guide (caveats, protections, judgements, nominations).
- `chat.html` — full-page assistant. Reuses the same engine as the floating widget
  on index/learn.

**Q: Walk me through the calculator end-to-end.**
User picks employee type (permanent/fixed), wage input mode (Basic+DA / +allowances /
+CTC), enters service years, income, prior gratuity, regime → `calculate()`
(index.html) resolves the wage base (with the 50% rule), applies the service
rounding, computes gratuity, then the tax pipeline: exemption ceiling → incremental
slab tax → surcharge + marginal relief → in-hand. Sections hide/show via
`setWageMode()` / `setSector()`; `#eligWarning` shows a reference-only banner when the
employee is below the statutory service threshold.

---

## 2. Domain: gratuity math

**Q: What's the gratuity formula?**
`Gratuity = WageBase × 15 × Years ÷ 26`. 15 = days of wages per completed year,
26 = working days in a month. For permanent employees, fractions ≥ 6 months round
up; fixed-term is pro-rata (no rounding).

**Q: What is the 50% wage rule on CTC?**
If the employee provides CTC, and basic wages are less than 50% of monthly CTC, the
gratuity base is bumped to 50% of CTC — allowances above 50% are effectively "added
back" to basic. Implemented in `computeWageBase()` (mode 3).

**Q: Eligibility — when is someone entitled?**
Permanent: 5 years continuous service (or 4 yrs + 240 days in the final year, per
settled precedents), waived for death/permanent disablement. Fixed-term: 1 year
(pro-rata). Employer must have ≥10 employees on any day in the preceding 12 months.
Below these, the calculator shows a reference-only warning, not an entitlement —
there is no statutory gratuity under 5 years.

**Q: If an employer deducts "gratuity" from salary each month, can you get it back?**
Careful distinction the app enforces:
- A **CTC provision** (~4.81% of basic p.a.) is just the employer's provisioning cost
  — not a salary deduction, nothing to refund.
- An actual monthly **salary deduction** labelled "gratuity" is unlawful under the
  Act (gratuity can't be funded from earnings) → claim it back in the **full & final
  settlement** as a wrongful salary deduction, not as gratuity.
The chat system prompt and the Learn page both encode this.

**Q: How does government gratuity differ?**
Central CCS formula: ¼ of monthly emoluments per completed 6-month period, capped at
16.5 × monthly emoluments, fully tax-exempt. Implemented as
`min(floor(service*2) * emoluments/4, 16.5 * emoluments)` with a state-rules-may-vary
note.

---

## 3. Domain: taxation

**Q: How is gratuity taxed for a private employee?**
Exemption = ₹20,00,000 lifetime ceiling minus prior gratuity (declared in Form I).
Only the excess is taxable. Government gratuity is fully exempt.

**Q: Why isn't it `excess × your marginal rate`?**
Because the taxable excess is added **on top of** payout-year income — it's taxed at
the bracket(s) reached by `income + excess`. The app computes it exactly:
`tax(income + excess) − tax(income)`. Example: income ₹12L + excess ₹10L →
`tax(22L) − tax(12L) = ₹2.5L − ₹0.6L = ₹1.9L`, not ₹10L × 15% = ₹1.5L.

**Q: Surcharge and marginal relief — how are they handled?**
Surcharge applies on the income-tax amount (not the gratuity) when total income
crosses ₹50L/1Cr/2Cr/5Cr, rising to 10/15/25/37% (new regime caps at 25%). Marginal
relief caps it near the threshold: `max(0, baseSurcharge − (totalIncome − threshold))`
so crossing the line by a small amount doesn't spike the tax.

**Q: The manual marginal-rate dropdown seems redundant — why keep it?**
It's a fallback only when income is 0 (no payout-year income entered). With income
present, the exact incremental-slab path runs — the dropdown is auto-synced
(`autoSetRate()`).

---

## 4. Frontend

**Q: How is the UI kept responsive?**
Mobile-first CSS: card reflow, `.table-wrap` horizontal scrolling for tables (slabs,
surcharge), edge-to-edge chat widget under 640px, and multi-step `@media` for the
heading so "…Taxation Calculator" doesn't wrap awkwardly.

**Q: What is `active-nav.js`?**
A tiny URL-driven script that highlights the current page's nav link based on
`location.pathname`, removing hardcoded `active` classes — so adding a page means
zero nav edits.

**Q: Any all-India conventions you followed?**
Indian number formatting (`toLocaleString('en-IN')` → 4,50,000), ₹ symbol, FY 2025-26
new-regime (30% above ₹24L) vs old-regime slabs, accessibility via labels/radios.

---

## 5. AI architecture (the senior deep-dive)

**Q: Why a serverless proxy instead of calling the model API directly from the
browser?**
Three reasons:
1. **Secrets** — an API key shipped to the browser is public; anyone can steal it
   and run up your bill.
2. **CORS** — most model APIs don't allow browser origins; the provider requires a
   server-side call.
3. **Control** — you can add rate limiting, input validation, and swap providers
   centrally. (A mobile app with a similarly embedded key raises the same concern —
   it should be guarded or proxied too.)

**Q: Summarize the chat request flow.**
`window.ChatAPI.ask(message)` (`js/chat-core.js`) → POST `{message, context}` to
`/.netlify/functions/chat`. The function validates input, appends the calculator
state as serialized context, calls the configured OpenAI-compatible endpoint with
`SYSTEM_PROMPT + context` messages and `max_tokens: 600`, returns `{response}`.
On any failure the **front end falls back to the local rule-based KB**
(`js/chat-data.js`), so the site never breaks without AI.

**Q: Why does the system use a knowledge base fallback at all?**
Graceful degradation — it guarantees a useful answer even when: GitHub Pages (no
function), no API key configured (503), provider retired (410), or a rate limit hit
(429). It's the difference between "chat is broken" and "chat answers offline".

**Q: How did you design the system prompt?**
`SYSTEM_PROMPT` encodes the non-negotiables: formula constants, eligibility
thresholds, rounding rules, the below-threshold "reference-only" rule, the CTC
provision-vs-unlawful-deduction distinction, government CCS formula, Form I/30-day
settlement, and forfeiture for misconduct. A JSON summary of the live calculator
state is appended so answers can reference the user's actual numbers. The goal is
deterministic guardrails with conversational flexibility on top.

**Q: Why are the provider settings environment variables?**
Provider-agnosticism. `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` are read at runtime.
When GitHub Models hit `github_models_retirement_brownout` (410) during
development, the app migrated to Gemini (free tier) by changing **three env vars** —
zero code change. That's the payoff of decoupling the app from a vendor.

**Q: How does rate limiting work here?**
Netlify's native config on the handler:
`exports.config.rateLimit = { windowLimit: 20, windowSize: 60, aggregateBy: ['ip','domain'] }`
— 20 requests per 60s per IP+domain, before the function body runs, so abuse doesn't
trigger paid model tokens.

**Q: What's in a 503/400 case?**
- No key → `503 AI service not configured`.
- Invalid JSON or missing `message` → `400`.
- Upstream failure → status is **forwarded verbatim** (e.g. 401/410/429) with the
  provider's body — makes debugging why the provider rejected the call trivial.
- Network/catch-all → `500 Proxy error`.

**Q: What security holes could this project have, and how are they mitigated?**
- Key exposure → server-side env vars only; `.env` git-ignored; revoke-on-leak.
- Prompt injection via `message` → treated as user content only; the *system* role
  carries the rules (imperfect but standard).
- Abuse/cost → rate limit + `max_tokens: 600` cap.
- Excessive `context` → bounded to the calculator's fixed fields.
- Front-end trust → the calculator is client-side by design (no user data is stored).

**Q: How would you improve the AI feature?**
Streaming responses (`text/event-stream`) for perceived latency; per-user
rate limiting or auth if shared publicly; provider failover (try Gemini → OpenAI →
KB); answer caching for repeated questions; moderation/content-filter layer; telemetry
(what topics are asked); a proper eval set of gratuity questions to regression-test
prompt changes.

---

## 6. Deployment & security

**Q: Where is this hosted and why two hosts?**
GitHub Pages (free, push-to-deploy) = primary, zero-keys, chat falls back to KB.
Netlify = same static files *plus* the serverless AI proxy so the chat gets live
model answers. Same code, two outputs — doc in `docs/DEPLOY.md`.

**Q: How does the same code behave on both hosts?**
The chat POSTs to a **relative route** (`/.netlify/functions/chat`). On Netlify that
hits the function; on Pages it 404s → `chat-core.js` catches it and uses the KB. All
asset links are relative, so the site works under any subpath.

**Q: What's the cost model?**
Netlify: free-plan function runtime, ≈1 sub-second invocation per message — no
credits to buy. Model: Gemini free tier ≈1,500 req/day; a paid OpenAI model would be
cents/month at this traffic. This separation (host cost vs model token cost) was a
deliberate design consideration.

**Q: Walk me through deploying a change.**
Commit → push to `main` → GitHub Pages rebuilds automatically; Netlify rebuilds for
its site too (or Trigger deploy). Docs verify: `GET index.html → 200`,
`POST /.netlify/functions/chat` returns an AI answer, and the widget shows the
"Powered by AI" tag.

---

## 7. "What would you improve?" / pitfalls

**Possibilities to cite:**
- Add unit tests for `progressiveTax`/`computeWageBase`/rounding (pure functions,
  trivially testable).
- Extract the inline `calculate()` logic into testable modules (it's currently
  one big function inside `index.html`).
- Replace the manual income-regime duplication with a data-driven slab table.
- Add an offline-capable PWA shell.
- Stream model responses; add answer cache + eval set.
- Add analytics on calculator field usage to improve UX.

**Common traps interviewers probe (know these):**
- Gratuity below 5 years is **not** payable (it's reference-only, not rounding up to entitlement).
- The ₹20L is a **lifetime** ceiling, reduced by prior gratuity — not per-payout.
- Surcharge is on the tax, not the gratuity; marginal relief prevents threshold spikes.
- OLD vs NEW regime surcharge caps differ (37% old vs 25% new).
- 4% cess is intentionally excluded — don't claim it's included.
- GitHub Models is retired — the current provider is Gemini, swapped by env vars, which
  is exactly the architecture's point.