# Deploying the project — step-by-step for beginners

This guide takes you from **nothing** to a **live, working site** with an optional
**AI assistant**. Read Part A first (the free static version), then Part B (the AI
part) only if you want the chat to answer with real AI.

---

## 0. What you need before you start

| Tool | Why | Where to get it |
|---|---|---|
| A GitHub account | Store your code + host the free site | https://github.com/join |
| Git (or GitHub Desktop) | Push your code to GitHub | https://desktop.github.com (easiest for beginners) |
| A web browser | Open/test the site locally | any |

You also need the code on your computer. Either download the ZIP
(GitHub → **Code** → **Download ZIP**) or clone it:

```bash
git clone https://github.com/nirav-email81/India-Gratuity-Taxation-Calculator.git
cd India-Gratuity-Taxation-Calculator
```

> The project is **static** — no build step, no `npm install`. It runs straight from
> the folder.

---

## Part A — GitHub Pages (free, zero keys, no AI)

GitHub Pages serves your static HTML/CSS/JS for free. The chat works there too —
it just answers from the **built-in knowledge base** instead of AI.

### A1. Create a repository on GitHub
1. github.com → **+** → **New repository**.
2. Name it e.g. `india-gratuity-calculator` → **Public** → **Create repository**.
3. You can leave it empty; you'll push the code into it.

### A2. Put the code in it (pick one)
**Option A — GitHub Desktop (easiest)**
1. File → **Add local repository** → choose the project folder.
2. Click **Publish repository** → pick your new repo → publish.

**Option B — terminal**
```bash
git remote add origin https://github.com/<your-username>/india-gratuity-calculator.git
git branch -M main
git push -u origin main
```

### A3. Turn on Pages
1. Repo → **Settings** (top tabs) → **Pages** (left sidebar).
2. **Branch**: `main` → **/ (root)** → **Save**.
3. Wait ~1 minute. Your site appears at:

```
https://<your-username>.github.io/<repo-name>/
```

### A4. Auto-updates
Every `git push` to `main` rebuilds the site. No action needed.

> ⚠️ The chat widget on GitHub Pages calls `/.netlify/functions/chat` which doesn't
> exist there → the browser gets a 404 and **automatically falls back** to the local
> knowledge base. This is by design.

---

## Part B — Add real AI with Netlify (optional)

AI = a model (like Gemini) answers gratuity questions. The model call must stay
**server-side** (secrets can't live in the browser), so we proxy it through a
**Netlify serverless function** (`netlify/functions/chat.js`, already in the repo).

### Cost split (what you actually pay)

| What | Who bills you | Cost |
|---|---|---|
| Function runtime (Netlify) | Netlify credits / included usage | Tiny — 1 chat message = 1 sub-second call |
| Model tokens (Gemini) | Google | Free tier ≈ 1,500 requests/day |

**You do not need to buy Netlify credits.** The free Netlify plan's included
function usage plus the Gemini free tier is plenty for a personal tool. If you switch
to a paid OpenAI model later, that bill is cents/month at this traffic — separate
from Netlify.

### B1. Get a Gemini API key (free, ~2 min)
1. Go to **https://aistudio.google.com/apikey** (free — log in with Google).
2. **Create API key** → copy it.
3. Never paste it into the repo or a chat — it goes straight into Netlify's settings.

### B2. Create the Netlify site
1. Go to **https://app.netlify.com** → log in with GitHub (easiest).
2. **Add new site** → **Import an existing project** → pick **GitHub**.
3. Select this repository.
4. On the build screen **change nothing** — `netlify.toml` auto-detects:
   - Build command: *(empty)*, Publish directory: `.`, Functions: `netlify/functions`
5. **Deploy site**. Within ~1–2 min the deploy shows **Published** (green).

### B3. Add the three environment variables
Netlify site → **Site configuration** (gear) → **Environment variables** → **Add a variable**.
Add these one by one (you type both the **Key** and the **Value**; there is no dropdown):

| Key | Value |
|---|---|
| `AI_API_KEY` | *(your Gemini API key from B1)* |
| `AI_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` |
| `AI_MODEL` | `gemini-3.6-flash` |

**Save** after each.

### B4. Apply the settings (env vars need a fresh deploy)
Netlify → **Deploys** → **Trigger deploy** → **Deploy site** → wait for **Published**.

### B5. (Optional) nicer URL
Site configuration → **Change site name** → e.g. `india-gratuity-calculator` →
site becomes `https://india-gratuity-calculator.netlify.app`.

### B6. Verify the AI
1. Open your Netlify URL → bottom-right **AI** bubble → ask e.g.
   *"I worked 3 years and gratuity was deducted from my CTC — what can I do?"*
2. You should see **"Powered by AI"** under the reply.
   (No tag → you're seeing the built-in answer; see Part C.)

### The function is provider-agnostic
It reads three vars — `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` — and works with any
**OpenAI-compatible** endpoint with **no code change**:

| Provider | `AI_BASE_URL` | `AI_MODEL` |
|---|---|---|
| Gemini (current) | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` | `gemini-3.6-flash` |
| OpenAI | `https://api.openai.com/v1/chat/completions` | e.g. `gpt-4.1-nano` |
| GitHub Models (historical) | `https://models.github.ai/inference/chat/completions` | — (being retired) |

---

## Part C — Troubleshooting

| Symptom | Cause → fix |
|---|---|
| Chat reply has **no** "Powered by AI" tag | Not hitting the function (or it needs a fresh deploy). Check env vars (B3), then **Trigger deploy** (B4). |
| `503 AI service not configured` | `AI_API_KEY` missing/empty. Re-check B3 + redeploy. |
| `410` from the function | Upstream provider retirement/error — if it says GitHub Models, you're using the retired endpoint; set `AI_BASE_URL`/`AI_MODEL` for Gemini (B3). |
| `"...model X is no longer available"` | Google renamed/retired the model. Change `AI_MODEL` to the model named in the error message (e.g. `gemini-3.6-flash`) → redeploy. |
| `404` on GitHub Pages URL | Not published; re-check A3 branch/root + wait. |
| Site works, chat answers but says "built-in assistant" | That's the **knowledge-base fallback** working as designed — it's the safe mode when the AI isn't configured. |
| Hitting request limits | Gemini free ≈ 1,500/day; the built-in KB keeps answering offline. |

---

## Local development

Open `index.html` in any browser — no build step. With a local server:

```bash
python -m http.server 8080     # then open http://localhost:8080
```

To test the **Netlify function locally** (optional):

```bash
npm install -g netlify-cli
netlify dev
```

Local env vars go in a `.env` file in the repo root — it is **git-ignored**, never
committed:

```
AI_API_KEY=...
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
AI_MODEL=gemini-3.6-flash
```

---

## Security rules (always)

- **Never commit keys.** `.env`, `.env.*` are already in `.gitignore`.
- The AI key is read **server-side only** (Netlify env var), never shipped to the browser.
- If a key is ever shared/pasted anywhere public, **revoke it** and make a new one
  (GitHub token: Developer settings; Gemini: https://aistudio.google.com/apikey).
- The function already has a rate limit (20 req / 60 s per IP + domain) in
  `netlify/functions/chat.js`.

## Moving to Vercel/Cloudflare later

Port `netlify/functions/chat.js` to that platform's function format — the logic
(read env vars → call OpenAI-compatible endpoint → return response) is platform-neutral.