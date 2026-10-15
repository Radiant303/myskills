# boss-job-apply

A portable Agent Skill that automates **BOSS直聘 (zhipin.com)** job filtering and batch recruiter outreach, driving your own logged-in browser session.

## What it does

1. Collects job-detail links across configured cities and keywords.
2. Opens each job detail to read **company size** and **salary**.
3. Filters by your rules (company size range, daily pay floor, or campus monthly pay floor).
4. Clicks 立即沟通 and sends your greeting to the recruiter.
5. Writes resumable progress so you can stop and continue safely.

## Requirements

- Windows with Microsoft Edge
- Node.js 22+ (uses the built-in `WebSocket` and `fetch`)
- A BOSS直聘 account you log into yourself

## Quick start

```powershell
# 1. Launch a debuggable Edge window (dedicated profile)
powershell -ExecutionPolicy Bypass -File scripts/launch-edge.ps1

# 2. Log in to BOSS直聘 in the opened window, then:

# 3. Copy and edit the config
Copy-Item scripts/config.example.json scripts/config.json

# 4. Collect candidates
node scripts/collect-candidates.mjs scripts/config.json

# 5. Apply
node scripts/apply-jobs.mjs scripts/config.json
```

## Configuration

Edit `scripts/config.json`:

| Key | Meaning |
|-----|---------|
| `greeting` | Message sent to each recruiter |
| `targetCount` | Stop after this many successful sends |
| `cities` | BOSS city codes to search |
| `queries` | Search keywords |
| `titleInclude` | Title must contain one of these (case-insensitive) |
| `freshnessPattern` | Regex the card text must match (e.g. 2027/实习/校招) |
| `companySizeAllow` | Allowed company-size buckets |
| `dailyPayFloor` | Minimum daily pay |
| `campusMonthlyFloorK` | Minimum monthly pay for campus roles |
| `salaryMode` | `rangeMax` or `rangeMin` |
| `blockedCompanies` | Company names to skip (e.g. big tech) |

## Safety

- Never handles credentials; you log in yourself.
- Never bypasses captchas; it stops and hands back to you.
- Sending a greeting is irreversible — confirm text and filters before running.
- Progress is stored in `out/apply-progress.json`; re-running resumes.

## Notes

See `references/boss-dom-and-quirks.md` for the DOM structure, selectors, and
site-specific quirks (including why this uses raw CDP instead of Playwright).

## Multi-agent import

Download `skill-boss-job-apply.zip`, extract it and keep `boss-job-apply/SKILL.md`, `scripts/` and `references/` together. See [installation and client limitations](references/agent-compatibility.md) for Claude Code, Gemini CLI, Codex and other local agents. Optional `agents/openai.yaml` does not make the skill Codex-only. Import compatibility is not proof of local-browser execution in every client.

## Validation scope

The CLI currently filters size/salary, not education. Use the extension education panel or manually verify each job before outreach. Click-only delivery reporting and automatic retries are not evidence of a sent message; review the target conversation and exact outgoing text.
