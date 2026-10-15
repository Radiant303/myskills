# Importing the same skill in multiple agents

## Shared format and constraints

The archive skill-boss-job-apply.zip extracts to boss-job-apply/SKILL.md with scripts/ and references/ alongside it. It follows the open Agent Skills folder format. Keep the folder intact. agents/openai.yaml is optional Codex UI metadata, not a runtime dependency.

Supported here means portable instructions and local scripts, **not** an end-to-end certification of every product. Browser automation was not tested in Claude Code or Gemini CLI during this change. Local filesystem, terminal access, Node.js 22+ and access to the user's controlled browser remain necessary. Web-chat uploads or cloud sandboxes normally do not provide the local browser connection.

## Claude Code

Copy the extracted boss-job-apply folder to ~/.claude/skills/boss-job-apply/ (user) or .claude/skills/boss-job-apply/ inside a project. Ask Claude Code to use boss-job-apply and follow SKILL.md. These are example destination paths; consult the installed version's skill documentation if discovery differs. The Claude documentation endpoint returned HTTP 403 during verification, so manual installation was not tested here.

## Gemini CLI

Copy it to ~/.gemini/skills/boss-job-apply/ or project .gemini/skills/boss-job-apply/. Current official documentation also lists ~/.agents/skills/ and .agents/skills/ aliases. Reload skill discovery in that client and approve local tool usage as appropriate.

## Codex

Use the shared ~/.agents/skills/boss-job-apply/ location or project .agents/skills/boss-job-apply/. Existing installations may also use the client's legacy skill folder; no installed folders are changed by this repository. Optional agents/openai.yaml adds display metadata.

## Other local coding agents

If the agent supports Agent Skills, import the whole folder using its documented mechanism. Otherwise explicitly ask it to read /absolute/path/boss-job-apply/SKILL.md and run the relative scripts from that skill directory. Do not promise universal auto-discovery, a special Codex tool, or automatic account access.

## Direct use without an agent

From the extracted folder (PowerShell):

	Copy-Item scripts/config.example.json scripts/config.json
	node -e "console.log(typeof fetch, typeof WebSocket)"
	powershell -File scripts/launch-edge.ps1
	# Log in yourself. Review the config before proceeding.
	node scripts/collect-candidates.mjs scripts/config.json
	# Review candidates and current job details before authorizing any send.

No import installer runs code or sends messages automatically.

## Official reference pages (checked 2026-10-15)

- Agent Skills specification: https://agentskills.io/specification
- Anthropic's reference skills: https://github.com/anthropics/skills
- Claude Code skills documentation (403 in this environment): https://code.claude.com/docs/en/skills
- Gemini CLI skill discovery: https://geminicli.com/docs/cli/skills/
- Codex skills documentation: https://developers.openai.com/codex/skills/
