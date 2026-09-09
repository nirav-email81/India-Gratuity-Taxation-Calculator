# Deploying the AI Chat (Netlify)

This project is a **static GitHub Pages site**. The calculator, learn page, and the
built-in rule-based assistant all work with **zero backend and zero API keys**.

The AI chat additionally supports a **GitHub Models** powered assistant. Because a
model token must never live in the browser, the model call is proxied through a
**Netlify serverless function** (`netlify/functions/chat.js`, already configured in
`netlify.toml`).

> Without Netlify, the chat gracefully falls back to the built-in knowledge base.

## Cost split (what you actually pay)

| What | Who bills you | Cost |
|---|---|---|
| Function runtime (Netlify) | Netlify credits / included usage | Tiny — a chat message = 1 sub-second invocation |
| Model tokens (GitHub Models) | GitHub | $0 on the free tier |

**You do not need to buy credits to deploy.** The free Netlify plan's included
function usage and the GitHub Models free tier are enough for a personal tool. Netlify
credits only matter if traffic grows very large. If you later move to Gemini/OpenAI,
the model bill is pay-as-you-go and cents/month at this scale; that is separate from
Netlify credits.

## Role of each page

- **index.html / learn.html / chat.html** — static; hosted on GitHub Pages and/or Netlify.
- **chat page + widget** — call `/.netlify/functions/chat` first; fall back to the local KB if it fails (e.g. on GitHub Pages).
- **Netlify function** — the only secret holder. Reads the API key from environment variables.

## Environment variables

The function is provider-agnostic. Defaults target GitHub Models; override to switch providers with no code change.

| Variable | Purpose | Default |
|---|---|---|
| `GITHUB_MODELS_TOKEN` | GitHub Models PAT (scope: `models`) | — |
| `GITHUB_MODELS_MODEL` | Model id for GitHub Models | `openai/gpt-5-mini` |
| `AI_API_KEY` | Generic key (falls back to `GITHUB_MODELS_TOKEN`) | — |
| `AI_BASE_URL` | OpenAI-compatible endpoint | `https://models.github.ai/inference/chat/completions` |
| `AI_MODEL` | Model id to request | `openai/gpt-5-mini` |

To switch to Gemini or OpenAI later, set `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`
(for Gemini: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`)
— no code change.

## GitHub Models free tier caveats

- Free usage is **rate-limited** and intended for **prototyping** — per GitHub's terms it
  is not for production traffic. Limits are ~15 req/min and **150 req/day** on low-tier
  models like `gpt-5-mini` (50/day on high-tier; frontier models lower).
- Daily quota resets at UTC midnight.
- The chat has a built-in KB fallback, so hitting the quota degrades gracefully.

## 1. Create a GitHub Models token

1. GitHub → Settings → Developer settings → **Personal access tokens** → generate.
2. Add the **`models`** scope (also `repo` if you prefer fine-grained).
3. Copy the token immediately — you won't see it again.

## 2. Deploy to Netlify

1. Push this repo to GitHub (already done).
2. Netlify → **Add new site → Import an existing project → GitHub** → select this repo.
   - Build command: *(empty)*. Publish directory: `.`.
   - `netlify.toml` already sets the functions directory — auto-detected.
3. Site settings → **Environment variables**:
   - `GITHUB_MODELS_TOKEN` = the PAT from step 1
   - `GITHUB_MODELS_MODEL` = `openai/gpt-5-mini` *(optional; default)*
4. **Deploy**. Netlify auto-builds the functions.

## 3. Verify

1. Open the deployed site → Gratuity Assistant → ask a question.
2. The reply footer will say **"Powered by GitHub Models"** when the proxy is active.
   Without it (or on GitHub Pages), you'll see the built-in answer.
3. Sanity-check: `GET https://<site>.netlify.app/index.html` → 200;
   `POST /.netlify/functions/chat` returns a model answer.

## 4. Local development

```bash
npm install -g netlify-cli
netlify dev
```

`netlify dev` serves the site and runs functions locally. Set the token via `.env`
(`GITHUB_MODELS_TOKEN=...`) or the Netlify dashboard.

## Cost control / security

- Rate limit on the function: **20 requests / 60s per IP + domain** already configured.
- Never commit `.env` or the token (git-ignored). The token is only read server-side.
- To move to Vercel/Cloudflare later, port `netlify/functions/chat.js` to that
  platform's function format.