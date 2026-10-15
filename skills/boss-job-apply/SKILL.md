---
name: boss-job-apply
description: Search BOSS直聘 (zhipin.com) jobs and prepare authorized recruiter outreach using the user's logged-in browser. Use for city, salary, company-size and education filtering of campus or internship jobs. Works with Agent Skills-compatible coding agents that can execute local Node.js scripts; not limited to Codex.
metadata:
  short-description: BOSS直聘筛选与授权招呼，跨 Agent 通用
---

# BOSS Job Apply

This is a portable Agent Skill: read this file, then run the bundled local scripts. No OpenAI API, model key, Codex CLI or vendor-specific tool is required. Optional `agents/openai.yaml` is UI metadata only; other agents may ignore it.

## Requirements and scope

- Use a local agent with terminal access and Node.js 22+ (check that global fetch and WebSocket exist). The bundled launcher is Windows/Edge; Chrome or other systems need a user-authorized loopback-only debug browser on port 9222.
- The user logs in personally. Never read credentials, export browser profiles or bypass captchas. Browser control and shell tools must be allowed by the host agent.
- Upload/import support is not execution capability: a remote chat-only agent cannot control the user's local browser merely by importing this folder. See [installation and compatibility](references/agent-compatibility.md).
- Do not change installed agent folders automatically. Do not publish config.json, browser profiles, messages, screenshots or output histories.

## Workflow

1. Confirm the exact greeting, cities, job keywords, target count, degree requirements, company sizes and salary interpretation. Use salary **lower bounds** when the user says a minimum; never relax filters to hit a count. Unknown data means skip, not guess.
2. From this skill's own directory, copy scripts/config.example.json to scripts/config.json, review the user-approved values, and launch scripts/launch-edge.ps1 only if a controlled browser is needed. Ask the user to log in.
3. Collect candidates: `node scripts/collect-candidates.mjs scripts/config.json`. Verify title, employer, location and graduation eligibility against the selected job, not the search keyword alone.
4. For education selection in the browser use the extension's 1.1.0+ panel. The CLI scripts currently filter company size and salary, **not education**. If education is a requirement, manually verify each current job first; do not run unattended CLI outreach assuming it filters education.
5. Sending requires explicit user authorization for this run. The current scripts are a DOM-based baseline: inspect/review the selected conversation before sending and verify the exact outgoing message there afterward. Do not count a button click, an unread counter, or matching text elsewhere in the chat list as a delivered application.
6. Stop on a changed recipient, missing details, unexpected navigation, login/captcha/risk-control page, ambiguous delivery or repeated errors. Save uncertain items as pending manual review; never automatically resend them.
7. Report verified **unique new greetings**, prior contacts, skipped jobs, unknown outcomes and unmet target separately. Never describe a greeting as an attachment resume submission.

## Running and installation

The same SKILL.md, scripts/ and references/ are used for all agents. See [agent-compatibility.md](references/agent-compatibility.md) for Claude Code, Gemini CLI, Codex and manual loading. Use absolute paths resolved from this folder if the host starts elsewhere.

## Browser integration

[DOM notes](references/boss-dom-and-quirks.md) document observations from earlier sessions, not guaranteed platform behavior. Prefer the bundled CDP helpers; never close the user's entire browser. A navigation error alone is not evidence of anti-bot controls. Re-read the actual page and stop on site restrictions.

## Resources

- scripts/launch-edge.ps1: dedicated loopback debug browser; user logs in.
- scripts/collect-candidates.mjs: candidate collection.
- scripts/apply-jobs.mjs: existing company-size/salary outreach baseline, requires review and authorization; CLI degree filtering is not implemented.
- scripts/config.example.json: sample parameters; replace the sample greeting with user-confirmed facts.
- agents/openai.yaml: optional metadata, not a portability requirement.
