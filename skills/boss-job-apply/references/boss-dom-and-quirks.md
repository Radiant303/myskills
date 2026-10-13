# BOSS直聘 DOM structure and site quirks

Hard-won details for driving zhipin.com. Update this file when the site changes.

## Why raw CDP instead of Playwright

`chromium.connectOverCDP()` followed by `browser.close()` **closes the user's pages**.
BOSS's anti-automation then ends the session, and the tab collapses to `about:blank`.
Always talk to the browser with raw CDP over the WebSocket URL from
`http://127.0.0.1:9222/json/list`:

- Open a work tab: `PUT /json/new?<url-encoded-url>`
- Close it: `GET /json/close/<tabId>`
- Evaluate: `Runtime.evaluate` with `returnByValue: true, awaitPromise: true`

Do not navigate the user's primary tab. If `Runtime.evaluate` returns
`Inspected target navigated or closed`, the click caused a navigation — re-read
`/json/list` and continue against the new tab state.

## Page inventory

| Page | URL | Notes |
|------|-----|-------|
| Job search | `/web/geek/jobs?city=<code>&query=<kw>` | Main list + filters |
| Job detail | `/job_detail/<id>.html` | Company size + salary + 立即沟通 |
| Chat | `/web/geek/chat` | Conversation list + message input |
| Resume | `/web/geek/resume` | Online resume |

The 校园 (`/school/`) nav entry **redirects to the home page** for logged-in users.
Do not rely on it; use job-search URLs directly.

## Job list

- Card container: `.job-card-box`
- Card inner text lines: `[title, salary, (schedule/duration/education), company, location]`
- Detail link: the `<a>` inside the card, e.g. `/job_detail/xxxx.html`

## Company-size filter is not scriptable

The 公司规模 filter (`.condition-filter-select`) is a hover-only Vue dropdown.
Scripted `.click()` on the current-select or the `<li>` options does **not** apply
it, and the `scale=` URL param is ignored. **Read company size from each job-detail
page instead** — it appears in the "公司基本信息" block as one of:
`0-20人`, `20-99人`, `100-499人`, `500-999人`, `1000-9999人`, `10000人以上`.

## Job detail

- Chat button text: **立即沟通** (new) or **继续沟通** (already contacted)
- Company size: matched from body text via the size regex above
- Salary: `300-400元/天`, `200元/天`, or `10-15K`

Clicking the chat button **navigates that same tab** to `/web/geek/chat` and may
spawn a second chat tab.

## Chat / sending the greeting

After clicking 立即沟通 the greeting is sometimes auto-sent (the message appears in
the conversation) and sometimes not. Handle both:

- Input: `textarea.input`
- Send button: `button.btn-send` (class also contains `disabled` until text is present)
- Detect auto-send: conversation body already contains part of the greeting

To type reliably, set the value through the native setter, then dispatch
`input` and `change` events so Vue picks it up:

```js
const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
setter.call(textarea, message);
textarea.dispatchEvent(new Event('input', { bubbles: true }));
textarea.dispatchEvent(new Event('change', { bubbles: true }));
```

## Rate limiting and risk control

- Keep ~5-6s between opening a job detail and interacting, and ~250-800ms between jobs.
- The site periodically closes automation tabs. Treat that as a signal to slow down
  or stop, not to retry aggressively.
- Never run this against more than the user's agreed target count in one pass.
- Stop and hand back to the user on any captcha, login prompt, or blank page.

## City codes (BOSS直聘)

```
深圳 101280600   广州 101280100   杭州 101210100   北京 101010100
上海 101020100   成都 101270100   南京 101190100   武汉 101200100
长沙 101250100   西安 101110100   合肥 101220100   厦门 101230100
重庆 101040100   青岛 101120100   郑州 101180100   天津 101030100
苏州 101190200   宁波 101210200   东莞 101281000   南昌 101240100
```
