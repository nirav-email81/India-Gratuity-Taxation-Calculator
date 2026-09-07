window.KB_ANSWERS = [
  {
    keys: ['formula', 'calculate', 'computed', 'how is gratuity calculated'],
    a: `Gratuity = (Last Drawn Basic Wages + qualifying allowances) × 15 × Years of Service ÷ 26.
• The '15' = 15 days of wages per completed year.
• The '26' = working days in a month under the rules.
• For permanent employees, a fractional year over 6 months rounds up; under 6 months rounds down.
• For fixed-term employees, the amount is pro-rata on actual years (no rounding).
Example: wage ₹50,000, 12 years = (50,000 × 15 × 12) ÷ 26 = ₹4,50,000.`
  },
  {
    keys: ['eligible', 'eligibility', 'qualify', 'entitled', 'get gratuity'],
    a: `Eligibility under the 2025 Code on Social Security:
• Permanent employees: 5 years of continuous service (or 4 years + 240 days in the final year under settled precedents). Waived entirely for death or permanent disablement.
• Fixed-term employees: 1 year of continuous service, paid pro-rata.
• Third-party/agency contract workers: qualify based on tenure with the staffing agency, not the client.
• The employer must have 10+ employees on any day in the preceding 12 months.`
  },
  {
    keys: ['5 year', 'five year', '5-year', 'permanent'],
    a: `The 5-year rule still applies to permanent employees. The 1-year rule is ONLY for fixed-term employees.
Permanent = 5 years continuous service (or 4 years + 240 days in the final year). Death or permanent disablement waives the requirement.`
  },
  {
    keys: ['1 year', 'one year', 'fixed-term', 'fixed term', 'contract'],
    a: `Fixed-term employees become eligible for gratuity after 1 year of continuous service, on a pro-rata basis.
Note: If you are hired through a third-party staffing agency, your eligibility depends on your tenure with the agency, NOT the client company. Similarly, permanent staff still need 5 years.`
  },
  {
    keys: ['240', '4 year', '4 yr', 'four year', 'gray area', 'grey area'],
    a: `The 240-day rule: a 'completed year' can be satisfied with 240 working days in the final year. So a permanent employee leaving at ~4 years and 7-8 months (4yrs + 240 days) may be eligible under judicial precedents, even though some employers rigidly enforce a strict 5-calendar-year rule.`
  },
  {
    keys: ['tax', 'taxable', 'exemption', 'exempt', '20 lakh', '2000000', 'in-hand', 'in hand', 'tds'],
    a: `Tax on gratuity (private sector):
• Government employees: fully exempt — no tax.
• Private sector: exemption = ₹20,00,000 lifetime ceiling MINUS any gratuity received earlier from any employer.
• Only the excess (current gratuity minus remaining exemption) is taxable, added to your income and taxed at your marginal slab rate.
• Your employer deducts tax (TDS) and pays you the balance (in-hand).
Example: prior gratuity ₹6L, current ₹18L → remaining exemption ₹14L → taxable excess ₹4L. At 30% bracket: tax ₹1.2L, in-hand ₹16.8L.`
  },
  {
    keys: ['prior', 'earlier', 'previously', 'previous', 'before', 'declar'],
    a: `You must declare any gratuity received earlier. The ₹20 lakh lifetime exemption is reduced by prior gratuity received from any employer. This is part of the Form-I claim process.`
  },
  {
    keys: ['form i', 'formI', 'form-1', 'form 1', 'submit', 'claim'],
    a: `Gratuity is claimed by submitting Form I to your employer. The employer must settle the dues within 30 days of them becoming payable. If delayed, simple interest becomes payable. You also declare prior gratuity received as part of this process.`
  },
  {
    keys: ['30 day', '30-day', '30 days', 'payment', 'paid', 'when'],
    a: `Under the 2025 code, employers must settle gratuity within 30 days of it becoming payable. Delays attract simple interest.`
  },
  {
    keys: ['50%', '50 percent', 'fifty', 'wage rule', 'allowance', 'basic', 'ctc'],
    a: `The 50% wage rule: basic wages must be at least 50% of the cost to company (CTC). Allowances above 50% must be added back to the basic wage, giving a higher gratuity base. If you know your CTC, the calculator uses max(Basic + DA, 50% of monthly CTC).`
  },
  {
    keys: ['misconduct', 'forfeit', 'forfeiture', 'removed', 'termination', 'terminated', 'fired'],
    a: `Gratuity can be forfeited (fully or partially) if services are terminated for riotous or disorderly conduct, acts of violence, moral turpitude, or willful damage/loss to company property. The employer must follow proper disciplinary procedure and issue a formal forfeiture notice.`
  },
  {
    keys: ['10 employee', '10+', 'small', 'startup', 'employer size', 'business'],
    a: `An employer must pay statutory gratuity only if it has employed 10 or more people on any single day in the preceding 12 months. Businesses under that threshold are exempt (they may still choose to pay).`
  },
  {
    keys: ['death', 'disablement', 'disabled', 'waived'],
    a: `The 5-year (and 4-year-240-day) rule is waived entirely in case of the employee's death (payout goes to nominee/legal heirs) or permanent disablement caused by an accident or occupational disease during employment.`
  },
  {
    keys: ['0', 'zero', 'no income', 'unsure'],
    a: `If income fields are left at 0, the calculator uses only the gratuity formula. To compute tax on the gratuity accurately, enter your taxable annual income excluding gratuity and any prior gratuity received.`
  },
  {
    keys: ['hi', 'hello', 'hey', 'help', 'what can you do'],
    a: `Hi! I can answer questions about gratuity — formula, eligibility (permanent 5-year vs fixed-term 1-year), the 240-day rule, the 50% wage rule, the ₹20 lakh tax-free ceiling including prior gratuity, Form I, and the 30-day payment rule. Ask me anything!`
  }
];

window.answerLocal = function (msg) {
  const q = ' ' + msg.toLowerCase() + ' ';
  for (const item of window.KB_ANSWERS) {
    for (const k of item.keys) {
      if (q.includes(' ' + k + ' ') || q.includes(k)) {
        return item.a;
      }
    }
  }
  return null;
};