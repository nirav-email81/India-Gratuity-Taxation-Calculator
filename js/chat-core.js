window.ChatAPI = (function () {
  let lastContext = {};

  function setContext(ctx) {
    lastContext = ctx || {};
  }

  function getContext() {
    return lastContext;
  }

  async function ask(message) {
    // 1) Try the serverless proxy (deployed backend) if available.
    //    Retry once: transient provider/Netlify timeouts (503/504) are common.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/.netlify/functions/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, context: lastContext })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.response) {
            return { text: data.response, source: 'ai' };
          }
        }
      } catch (e) {
        // proxy unreachable (e.g. static GitHub Pages) — fall through
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
    }

    // 2) Fallback: local rule-based knowledge base.
    const local = window.answerLocal ? window.answerLocal(message) : null;
    if (local) {
      return { text: local + '\n\n_(answered by the built-in assistant — AI is unavailable at the moment.)_', source: 'local' };
    }

    return {
      text: 'I could not find a confident answer offline, and the AI service is unavailable right now. Try asking about the formula, eligibility, the 50% wage rule, or the ₹20 lakh tax cap.',
      source: 'none'
    };
  }

  return { ask, setContext, getContext };
})();