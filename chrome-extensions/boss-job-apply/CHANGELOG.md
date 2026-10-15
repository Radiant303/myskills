# Changelog

## 1.1.0 - 2026-10-15

- Added exact education requirement selection with 本科/学历不限 defaults and legacy config migration.
- Unknown/ambiguous degree requirements fail closed.
- Scope requirement parsing to the selected job header and verify its identity.
- Process each job at most once per run; respect pause/stop before communication.
- Report unverified send attempts separately and stop rather than assume delivery.
- Tested with offline browser fixtures; live end-to-end outreach is not certified.

The separate portable Agent Skill archive now includes multi-agent import instructions. It remains independent of this browser extension.
