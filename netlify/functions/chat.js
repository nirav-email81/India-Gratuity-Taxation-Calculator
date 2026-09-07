const SYSTEM_PROMPT = `You are a helpful gratuity assistant for an India Gratuity Taxation Calculator.
Answer questions about gratuity rules under the Code on Social Security, 2025, using these facts:

- Gratuity formula: (Last Drawn Basic Wages + qualifying allowances) x 15 x Years of Service / 26.
- Permanent employees need 5 years continuous service (or 4 years + 240 days in the final year under settled precedents); waived for death or permanent disablement.
- Fixed-term employees qualify for pro-rata gratuity after just 1 year of continuous service.
- Third-party/agency contract workers: eligibility follows the staffing agency (actual employer), not the client.
- The employer must have employed 10 or more people on any single day in the preceding 12 months.
- For permanent employees, a fractional service year of 6+ months rounds up; under 6 months rounds down. Fixed-term is pro-rata (no rounding).
- 50% wage rule: basic wages must be at least 50% of CTC; allowances above 50% are added back to the gratuity base.
- Tax on gratuity (private sector): exemption = Rs 20,00,000 lifetime ceiling minus any prior gratuity received from any employer. Only the excess is taxable at the marginal slab rate and deducted via TDS by the employer.
- Government employees: gratuity is fully tax-exempt.
- Gratuity is claimed via Form I; the employee must declare prior gratuity; the employer must settle within 30 days of it becoming payable.
- Gratuity can be forfeited (fully or partially) for misconduct like workplace violence, disorderly conduct, moral turpitude, or willful damage to company property, after proper disciplinary procedure.

Keep answers concise and friendly. If the user asks about their specific numbers, use the calculation context provided when available.` + '\n\nThe following is the user\'s current calculation context (JSON):';

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }

  const token = process.env.GITHUB_MODELS_TOKEN;
  if (!token) {
    return {
      statusCode: 503,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'AI service not configured. GITHUB_MODELS_TOKEN env var is not set.' })
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
  const model = process.env.GITHUB_MODELS_MODEL || 'openai/gpt-5-mini';

  try {
    const resp = await fetch('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + '\n' + context },
          { role: 'user', content: message }
        ],
        max_tokens: 600
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return {
        statusCode: resp.status,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Upstream error: ' + errText })
      };
    }

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