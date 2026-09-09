# Deploying the AI Chat (Netlify)

This project is a **static GitHub Pages site**. The calculator, learn page, and the
built-in rule-based assistant all work with **zero backend and zero API keys**.

The AI chat is powered by an **OpenAI-compatible model API** (currently **Google
Gemini**, free tier). Because a model token must never live in the browser, the model
call is proxied through a **Netlify serverless function** (`netlify/functions/chat.js`,
already configured in `netlify.toml`).

> Without Netlify, the chat gracefully falls back to the built-in knowledge base.

## Cost split (what you actually pay)

| What | Who bills you | Cost |
|---|---|---|
| Function runtime (Netlify) | Netlify credits / included usage | Tiny — a chat message = 1 sub-second invocation |
| Model tokens (Gemini API) | Google | Free tier ≈ 1,500 requests/day |

**You do not need to buy credits to deploy.** The free Netlify plan's included
function usage and the Gemini free tier are enough for a personal tool. Netlify
credits only matter if traffic grows very large. If you later move to paid OpenAI,
the model bill is pay-as-you-go and cents/month at this scale; that is separate from
Netlify credits.

## Role of each page

- **index.html / learn.html / chat.html** — static; hosted on GitHub Pages and/or Netlify.
- **chat page + widget** — call `/.netlify/functions/chat` first; fall back to the local KB if it fails (e.g. on GitHub Pages).
- **Netlify function** — the only secret holder. Reads the API key from environment variables.

## Environment variables

The function is provider-agnostic — it reads OpenAI-compatible settings and works
with **Gemini**, **OpenAI**, or **GitHub Models** (retired in 2025/2026) with no code
change.

| Variable | Purpose | Our current value |
|---|---|---|
| `AI_API_KEY` | API key for the chosen provider | Google AI Studio key |
| `AI_BASE_URL` | OpenAI-compatible endpoint | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` |
| `AI_MODEL` | Model id to request | `gemini-3.6-flash` |
| `GITHUB_MODELS_TOKEN` | *(legacy — GitHub Models is retiring)* | — |

Set all three (`AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`) for the current provider.
Pointers for other providers:
- **Gemini**: key from `https://aistudio.google.com/apikey`, base
  `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- **OpenAI**: key from `https://platform.openai.com/api-keys`, base
  `https://api.openai.com/v1/chat/completions`, model e.g. `gpt-4.1-nano`
- **GitHub Models**: *(historical)* base `https://models.github.ai/inference/chat/completions` — being retired

## Gemini free tier caveats

- Free tier ≈ **1,500 requests/day** for Flash-class models — plenty for a personal tool.
- Model names rotate as Google retires versions; when you see a
  `"...model X is no longer available"` error, update `AI_MODEL` to the latest
  suggested in the message (e.g. `gemini-3.6-flash`).
- The chat has a built-in KB fallback, so hitting a limit still yields a useful answer.

## 1. Get a Gemini API key

1. Go to **https://aistudio.google.com/apikey** (free; Google account)
2. **Create API key** → copy it. Never paste it into the repo or chat.

## 2. Deploy to Netlify

1. Push this repo to GitHub (already done).
2. Netlify → **Add new site → Import an existing project → GitHub** → select this repo.
   - Build command: *(empty)*. Publish directory: `.`.
   - `netlify.toml` already sets the functions directory — auto-detected.
3. Site settings → **Environment variables**:
   - `AI_API_KEY` = key from step 1
   - `AI_BASE_URL` = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
   - `AI_MODEL` = `gemini-3.6-flash`
4. **Deploy** (env vars apply on a fresh deploy). Netlify auto-builds the functions.

## 3. Verify

1. Open the deployed site → Gratuity Assistant → ask a question.
2. The reply footer will say **"Powered by AI"** when the proxy is active.
   Otherwise (or on GitHub Pages without Netlify), you'll see the built-in answer.
3. Sanity-check: `GET https://<site>.netlify.app/index.html` → 200;
   `POST /.netlify/functions/chat` returns a model answer.

## 4. Local development

```bash
npm install -g netlify-cli
netlify dev
```

`netlify dev` serves the site and runs functions locally. Set the key via `.env`
(`AI_API_KEY=...`) or the Netlify dashboard.

## Cost control / security

- Rate limit on the function: **20 requests / 60s per IP + domain** already configured.
- Never commit `.env` or the token (git-ignored). The token is only read server-side.
- To move to Vercel/Cloudflare later, port `netlify/functions/chat.js` to that
  platform's function format.