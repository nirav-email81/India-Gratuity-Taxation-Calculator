# Deploying the AI Chat (Optional — Netlify)

This project is a **static GitHub Pages site**. The calculator, learn page, and the
built-in rule-based assistant all work with **zero backend and zero API keys**.

The AI chat additionally supports a **GitHub Models** powered assistant. Because a
model token must never live in the browser, the model call must be proxied through
a **serverless function**. This folder ships a ready-to-use Netlify function.

> You do **not** need this unless you want the AI chat to use a real model. Until
> you deploy it, the chat gracefully falls back to the built-in knowledge base.

## Why a function?

GitHub Pages is static-only — it cannot hold a secret server-side. Putting the token
in the HTML would expose it to every visitor. A serverless function (e.g. Netlify
Functions) is the standard, secure way to proxy the call.

## 1. Create a GitHub Personal Access Token for GitHub Models

1. Go to https://github.com/settings/personal-access-tokens (fine-grained) or
   https://github.com/settings/tokens (classic).
2. Create a token with the **`models`** scope (GitHub Models). For classic tokens,
   no extra repo scopes are needed to call the inference API.
3. Copy the token. You will not see it again.

## 2. Create your GitHub Models PAT

The endpoint used is `https://models.github.ai/inference/chat/completions` with a
Bearer token. GitHub Models free tier:

- ~150 requests/day on low-tier models (e.g. `openai/gpt-5-mini`, `openai/gpt-4o-mini`)
- No credit card required; uses your GitHub account
- Free tier is for **prototyping / experimentation** (see GitHub Models docs)

## 3. Deploy to Netlify (when you are ready)

1. Push this repo to GitHub.
2. On Netlify: **Add new site → Import an existing project → GitHub**.
3. Select this repo. Build command: *(empty)*. Publish directory: `.`
   (`netlify.toml` is already configured).
4. Add environment variables (Site settings → Environment variables):
   - `GITHUB_MODELS_TOKEN` = your PAT from step 1
   - `GITHUB_MODELS_MODEL` = `openai/gpt-5-mini` *(optional; default already set)*
5. Deploy. Netlify auto-builds the functions under `netlify/functions/`.

## 4. Verify

Open the deployed site → Gratuity Assistant → ask a question. The reply footer will
say **"Powered by GitHub Models"** when the proxy is active. Without it, you'll see
the built-in answer tag.

## 5. Local development

```bash
npm install -g netlify-cli
netlify dev
```

`netlify dev` serves the site and runs functions locally. Set the token via
`.env` (`GITHUB_MODELS_TOKEN=...`) or the Netlify dashboard.

## Cost control

The function already includes rate limiting: **20 requests / 60s per IP + domain**
(configured in `netlify/functions/chat.js`). Tune `windowLimit` as needed.

## Security notes

- Never commit `.env` or the token (already git-ignored).
- The token is only ever read server-side via `process.env.GITHUB_MODELS_TOKEN`.
- If you deploy elsewhere (Vercel, Cloudflare Workers), move the contents of
  `netlify/functions/chat.js` into that platform's function format.