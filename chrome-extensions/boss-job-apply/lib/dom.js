// DOM helpers for the BOSS直聘 pages this extension runs on.
// Selectors verified against the live site; see README for how to re-check them.
(function () {
  'use strict';

  const SELECTORS = {
    jobCard: '.job-card-box',
    jobDetailLink: 'a',
    chatButtonText: ['立即沟通', '继续沟通'],
    chatInput: 'textarea.input',
    chatSend: 'button.btn-send',
  };

  function text(el) { return (el && el.innerText || '').trim(); }

  function listCards() {
    return Array.from(document.querySelectorAll(SELECTORS.jobCard));
  }

  function readCard(card) {
    const lines = text(card).split('\n').map((s) => s.trim()).filter(Boolean);
    const link = card.querySelector(SELECTORS.jobDetailLink);
    return {
      element: card,
      href: (link && link.getAttribute('href')) || '',
      title: lines[0] || '',
      salary: lines[1] || '',
      company: guessCompany(lines),
    };
  }

  function guessCompany(lines) {
    // Card layout: title, salary, [schedule], [education], company, location
    for (let i = 2; i < lines.length; i++) {
      if (/[·]/.test(lines[i]) || /区|市/.test(lines[i])) return lines[i - 1] || '';
    }
    return lines[lines.length - 2] || '';
  }

  function findButtonByText(labels) {
    const els = document.querySelectorAll('a,button');
    for (const el of els) {
      if (labels.includes(text(el))) return el;
    }
    return null;
  }

  function readDetail() {
    const body = document.body.innerText || '';
    return {
      size: window.BossFilters.findSize(body),
      salary: (body.match(/\d{2,4}-\d{2,4}元\/天|\d{2,4}元\/天|\d{1,3}-\d{1,3}K|\d{1,3}K/) || [null])[0],
      campus: /秋招|校招|应届|在校/.test(body),
    };
  }

  async function typeAndSend(message) {
    const input = document.querySelector(SELECTORS.chatInput);
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(input, message);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(500);
      const send = document.querySelector(SELECTORS.chatSend);
      if (send) { send.click(); await sleep(800); return 'sent'; }
      return 'no-send-button';
    }
    if ((document.body.innerText || '').includes(message.slice(0, 10))) return 'already-sent';
    return 'no-input';
  }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  window.BossDom = {
    SELECTORS, listCards, readCard, readDetail, findButtonByText, typeAndSend, sleep,
  };
})();
