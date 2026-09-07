(function () {
  if (window.__chatWidgetLoaded) return;
  window.__chatWidgetLoaded = true;

  function injectContext() {
    var ctx = {};
    var id = function (x) { return document.getElementById(x); };
    var read = function (x) { var el = id(x); return el && el.value ? el.value : ''; };

    if (id('basic')) ctx.basic = read('basic');
    if (id('da')) ctx.da = read('da');
    if (id('allow')) ctx.allow = read('allow');
    if (id('ctc')) ctx.ctc = read('ctc');
    if (id('service')) ctx.service = read('service');
    if (id('annualIncome')) ctx.annualIncome = read('annualIncome');
    if (id('priorGratuity')) ctx.priorGratuity = read('priorGratuity');
    var emp = document.querySelector('input[name="empType"]:checked');
    if (emp) ctx.employmentType = emp.value;
    var govt = id('isGovt');
    if (govt) ctx.sector = govt.checked ? 'government' : 'private';
    var amount = id('amount');
    if (amount && amount.textContent && amount.textContent !== '₹ 0') {
      ctx.currentGratuity = amount.textContent;
    }
    return ctx;
  }

  window.ChatAPI.setContext(injectContext());
  window.addEventListener('calculateDone', function () {
    window.ChatAPI.setContext(injectContext());
  });

  var style = document.createElement('style');
  style.textContent =
    '.cw-open{position:fixed;right:20px;bottom:20px;z-index:9998;width:56px;height:56px;border-radius:50%;background:#1a237e;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.3);}'
    + '.cw-open:hover{background:#283593;}'
    + '.cw-panel{position:fixed;right:20px;bottom:88px;z-index:9999;width:340px;max-height:70vh;display:none;flex-direction:column;background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.25);overflow:hidden;}'
    + '.cw-panel.show{display:flex;}'
    + '.cw-head{background:#1a237e;color:#fff;padding:12px 16px;font-weight:700;font-size:.9rem;display:flex;justify-content:space-between;}'
    + '.cw-head button{border:none;background:none;color:#fff;font-size:16px;cursor:pointer;}'
    + '.cw-body{flex:1;overflow-y:auto;padding:12px;height:300px;background:#f5f7fa;font-size:.83rem;line-height:1.5;}'
    + '.cw-msg{margin-bottom:10px;padding:8px 12px;border-radius:12px;max-width:90%;}'
    + '.cw-user{margin-left:auto;background:#1a237e;color:#fff;border-bottom-right-radius:2px;}'
    + '.cw-bot{margin-right:auto;background:#e8eaf6;color:#1a237e;border-bottom-left-radius:2px;}'
    + '.cw-bot small{display:block;margin-top:4px;color:#888;}'
    + '.cw-input-row{display:flex;border-top:1px solid #ddd;}'
    + '.cw-input-row input{flex:1;border:none;padding:12px;font-size:.85rem;outline:none;}'
    + '.cw-input-row button{border:none;background:#1a237e;color:#fff;padding:0 16px;cursor:pointer;font-weight:700;}'
    + '@media (max-width:640px){.cw-panel{right:10px;left:10px;width:auto;max-width:none;bottom:78px;}'
    + '.cw-body{height:42vh;}}';
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.className = 'cw-open';
  btn.textContent = 'AI';
  btn.setAttribute('aria-label', 'Open gratuity assistant');

  var panel = document.createElement('div');
  panel.className = 'cw-panel';
  panel.innerHTML =
    '<div class="cw-head"><span>Gratuity Assistant</span><button type="button" class="cw-close">&times;</button></div>'
    + '<div class="cw-body" id="cwBody"></div>'
    + '<div class="cw-input-row"><input id="cwInput" type="text" placeholder="Ask about gratuity…" /><button type="button" class="cw-send">Send</button></div>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var body = panel.querySelector('.cw-body');
  var input = panel.querySelector('#cwInput');

  function addMsg(text, who) {
    var d = document.createElement('div');
    d.className = 'cw-msg cw-' + who;
    d.textContent = text;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }

  async function send() {
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    addMsg(q, 'user');
    var thinking = addMsg('Thinking…', 'bot');
    try {
      var ans = await window.ChatAPI.ask(q);
      thinking.textContent = ans.text;
      if (ans.source === 'github-models') {
        thinking.innerHTML = ans.text + '<small>Powered by GitHub Models</small>';
      }
    } catch (e) {
      thinking.textContent = 'Sorry, something went wrong. Please try again.';
    }
    body.scrollTop = body.scrollHeight;
  }

  btn.onclick = function () { panel.classList.toggle('show'); };
  panel.querySelector('.cw-close').onclick = function () { panel.classList.remove('show'); };
  panel.querySelector('.cw-send').onclick = send;
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });

  addMsg('Hi! Ask me anything about gratuity — eligibility, formula, tax, the 50% rule, or Form I.', 'bot');
})();