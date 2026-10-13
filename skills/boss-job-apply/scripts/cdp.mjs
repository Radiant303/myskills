// Shared Chrome DevTools Protocol helpers for the BOSS直聘 automation scripts.
// Uses raw CDP over WebSocket so we never attach/detach a browser driver that
// would close the user's pages.
export const CDP_HTTP = process.env.BOSS_CDP_HTTP || 'http://127.0.0.1:9222';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function listTabs() {
  const res = await fetch(CDP_HTTP + '/json/list');
  return await res.json();
}

export async function newTab(url) {
  const res = await fetch(CDP_HTTP + '/json/new?' + encodeURIComponent(url), { method: 'PUT' });
  return await res.json();
}

export async function closeTab(id) {
  try { await fetch(CDP_HTTP + '/json/close/' + id); } catch { /* tab already gone */ }
}

export async function evalIn(wsUrl, expression, timeoutMs = 30000) {
  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      const id = Math.floor(Math.random() * 1e9);
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id === id) {
          try { ws.close(); } catch {}
          resolve(msg.result?.result?.value ?? msg);
        }
      };
      ws.onerror = () => reject(new Error('cdp socket error'));
      ws.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: { expression, returnByValue: true, awaitPromise: true },
      }));
      setTimeout(() => {
        try { ws.close(); } catch {}
        reject(new Error('cdp timeout'));
      }, timeoutMs);
    };
    ws.onerror = () => reject(new Error('cdp connect error'));
  });
}

export async function evalInTab(id, expression, timeoutMs) {
  const tabs = await listTabs();
  const tab = tabs.find((t) => t.id === id);
  if (!tab) throw new Error('tab-gone');
  return await evalIn(tab.webSocketDebuggerUrl, expression, timeoutMs);
}

export async function urlOfTab(id) {
  const tabs = await listTabs();
  return tabs.find((t) => t.id === id)?.url || '';
}

// Open a job-detail page, read company size + salary + campus flag, then close.
export async function readJobDetail(href, { settleMs = 5200 } = {}) {
  const url = href.startsWith('http') ? href : 'https://www.zhipin.com' + href;
  const tab = await newTab(url);
  await sleep(settleMs);
  const info = await evalIn(tab.webSocketDebuggerUrl, `(function(){
    var body = document.body.innerText;
    var size = body.match(/(0-20人|20-99人|100-499人|500-999人|1000-9999人|10000人以上)/);
    var salary = body.match(/[0-9]{2,4}-[0-9]{2,4}元\\/天|[0-9]{2,4}元\\/天|[0-9]{1,3}-[0-9]{1,3}K/);
    return {
      size: size ? size[1] : null,
      salary: salary ? salary[0] : null,
      campus: /秋招|校招|应届|在校/.test(body),
      url: location.href,
    };
  })()`).catch(() => null);
  return { tabId: tab.id, info };
}

// Send a greeting in the currently-open chat tab. Returns 'typed-sent',
// 'already-sent', or 'unknown'.
export async function sendGreeting(wsUrl, message) {
  const expr = `(async function(){
    var ta = document.querySelector('textarea.input');
    if (ta) {
      var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, ${JSON.stringify(message)});
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(function(r){ setTimeout(r, 800); });
      var btn = document.querySelector('button.btn-send');
      if (btn) { btn.click(); await new Promise(function(r){ setTimeout(r, 1300); }); return 'typed-sent'; }
    }
    if (document.body.innerText.indexOf('求职') >= 0) return 'already-sent';
    return 'unknown';
  })()`;
  return await evalIn(wsUrl, expr, 30000);
}

// Click the 立即沟通 / 继续沟通 button on a job-detail page.
export async function clickChat(wsUrl) {
  return await evalIn(wsUrl, `(function(){
    var els = document.querySelectorAll('a,button');
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].innerText || '').trim();
      if (t === '立即沟通' || t === '继续沟通') { els[i].click(); return t; }
    }
    return 'no-btn';
  })()`, 15000);
}
