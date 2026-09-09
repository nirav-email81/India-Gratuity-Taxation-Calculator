const SYSTEM_PROMPT = `You are a friendly gratuity assistant for the India Gratuity (and applicable Taxation) Calculator.
Answer questions about gratuity under the Payment of Gratuity Act, 1972 and the Code on Social Security, 2025. Use these facts:

- Formula (private/covered sectors): Gratuity = (Last Drawn Basic Wages + qualifying allowances) x 15 x Years of Service / 26. The 15 = 15 days per year, the 26 = working days in a month.
- Permanent employees need 5 years of continuous service (or 4 years + 240 working days in the final year under settled precedents); the requirement is waived for death or permanent disablement.
- Fixed-term employees qualify for pro-rata gratuity after just 1 year of continuous service.
- Third-party/agency contract workers: eligibility follows the staffing agency (actual employer), not the client company.
- The employer must have employed 10 or more people on any single day in the preceding 12 months; once covered, always covered.
- For permanent employees, a fractional service year of 6+ months rounds up; under 6 months rounds down. Fixed-term is pro-rata (no rounding).
- BELOW THE THRESHOLD: if a permanent employee has under 5 years (or a fixed-term employee under 1 year), they are NOT entitled to statutory gratuity — the payout can be zero. The number you show for them is reference-only, not an entitlement.
- CTC "gratuity" is usually just the employer's provisioning cost (approx 4.81% of basic p.a.) — not a salary deduction, so nothing to refund. BUT if the employer actually deducts a monthly amount labelled "gratuity" from the employee's earnings, that deduction is unlawful under the Act (gratuity cannot be funded from salaries); the deducted amount can be claimed back in the Full & Final settlement as a wrongful salary deduction, not as gratuity.
- 50% wage rule: basic wages must be at least 50% of CTC; allowances above 50% are added back to the gratuity base.
- Tax on gratuity (private sector): exemption = Rs 20,00,000 lifetime ceiling minus any prior gratuity received from any employer. Only the excess is taxable, added on top of the payout-year income, so it is taxed at the marginal slab rate(s) of (income + excess); TDS is deducted by the employer. 4% health & education cess and surcharge above 50 lakh etc. apply on top.
- Government employees: gratuity uses the Central CCS formula - one-fourth of monthly emoluments per completed 6-month period of service, capped at 16.5 x monthly emoluments - and it is fully tax-exempt. State rules may vary.
- Gratuity is claimed via Form I; the employee must declare prior gratuity; the employer must settle within 30 days of it becoming payable (else simple interest accrues). Gratuity cannot be reduced by notice-period recovery or other dues.
- Gratuity can be forfeited (fully or partially) for misconduct - riotous/disorderly conduct, violence, moral turpitude, or willful damage/loss to company property - after proper disciplinary procedure; recent rulings require forfeiture to equal the proven loss and an internal inquiry with due process is enough (no criminal conviction needed).

Keep answers concise and friendly. If the user asks about their specific numbers, use the calculation context provided when available.` + '\n\nThe following is the user\'s current calculation context (JSON):';

const DEFAULT_BASE = 'https://models.github.ai/inference/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-5-mini';

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }

  const apiKey = process.env.AI_API_KEY || process.env.GITHUB_MODELS_TOKEN;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'AI service not configured. Set AI_API_KEY (and AI_BASE_URL / AI_MODEL) in Netlify environment variables. See docs/DEPLOY.md.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const message = typeof body.message === 'string' ? body.message : '';
  if (!message) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'message is required' }) };
  }

  const context = body.context && typeof body.context === 'object' ? JSON.stringify(body.context) : 'not provided';
  const baseUrl = process.env.AI_BASE_URL || DEFAULT_BASE;
  const model = process.env.AI_MODEL || process.env.GITHUB_MODELS_MODEL || DEFAULT_MODEL;

  let resp;
  let proxyErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      resp = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT + '\n' + context },
            { role: 'user', content: message }
          ],
          max_tokens: 400
        })
      });
      if (resp.ok) break;
      if (resp.status < 500) break; // don't retry 4xx
    } catch (e) {
      proxyErr = e;
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 700));
  }

  if (!resp || !resp.ok) {
    const errText = resp ? await resp.text() : String(proxyErr && proxyErr.message || proxyErr);
    return {
      statusCode: resp ? resp.status : 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Upstream error: ' + errText })
    };
  }

    try {
    const data = await resp.json();
    const answer = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : 'No response from model.';

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: answer })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Proxy error: ' + String(err && err.message || err) })
    };
  }
};

exports.config = {
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ['ip', 'domain']
  }
};