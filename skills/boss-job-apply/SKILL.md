---
name: boss-job-apply
description: Automate BOSS直聘 (zhipin.com) job search and batch outreach. Use when the user wants to filter 2027届/校招/实习 jobs by city, salary, and company size, then send a greeting to recruiters in bulk through their logged-in browser. Only applies to zhipin.com on the user's own account.
metadata:
  short-description: BOSS直聘批量筛选与投递自动化
---

# BOSS Job Apply

Drive the user's **already logged-in** BOSS直聘 session to filter jobs and send recruiter greetings in bulk. This skill never logs in, never handles credentials, and never bypasses captchas.

## Hard boundaries

- Work only on `zhipin.com`, only with the user's own account, only after they log in themselves.
- Never enter or store credentials. If a login screen or captcha appears, stop and hand control back to the user.
- Sending a greeting is an external, irreversible action. Confirm the greeting text, the filters, and the target count with the user before the first send. Reuse that authorization only within the agreed scope.
- Stop immediately if the site shows risk-control pages, blank pages, or repeated navigation failures.

## Workflow

1. **Confirm parameters.** Greeting text, target count, cities, title keywords, company-size range, and salary floor. Defaults live in `scripts/config.example.json`.
2. **Launch a debuggable browser** with `scripts/launch-edge.ps1` (Edge on port 9222, dedicated profile). Ask the user to log in to BOSS直聘 in that window, then confirm.
3. **Collect candidates** with `scripts/collect-candidates.mjs`. This writes a deduplicated candidate list of job-detail links.
4. **Apply** with `scripts/apply-jobs.mjs`. It opens each job detail, reads company size and salary, applies the user's filters, clicks 立即沟通, sends the greeting, and writes resumable progress.
5. **Report** the applied list and any skipped reasons.

Run each script with `node` and a config path. Both scripts are resumable and safe to re-run.

## Critical implementation notes

Read `references/boss-dom-and-quirks.md` before editing the scripts. The most important invariants:

- Use **raw Chrome DevTools Protocol over WebSocket**, not Playwright. Playwright's `connectOverCDP` plus `browser.close()` kills the user's pages, and BOSS's anti-automation ends the session.
- Open work tabs with `PUT http://127.0.0.1:9222/json/new?<url-encoded-url>` and close them with `GET /json/close/<id>`. Never navigate the user's primary tab.
- The 公司规模 filter is a hover-only Vue dropdown that ignores scripted clicks and URL params. **Verify company size per job-detail page instead.**
- Clicking 立即沟通/继续沟通 on a job-detail page navigates that tab to `/web/geek/chat`. The greeting sometimes auto-sends and sometimes must be typed into `textarea.input` and sent via `button.btn-send`. Handle both cases.
- The 校园/校招 nav entry redirects to the home page. Use job-search URLs directly.

## Files

- `scripts/launch-edge.ps1` — start Edge with remote debugging on a dedicated profile.
- `scripts/cdp.mjs` — shared CDP helpers (tab list/new/close, Runtime.evaluate).
- `scripts/collect-candidates.mjs` — collect and dedupe job-detail links by city and keyword.
- `scripts/apply-jobs.mjs` — filter by company size and salary, then send the greeting.
- `scripts/config.example.json` — copy to `config.json` and edit.
- `references/boss-dom-and-quirks.md` — selectors, page structure, and site quirks.
