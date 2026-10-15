# Education filtering and portable skills implementation plan

**Goal:** Add fail-closed education selection to the extension and distribute a vendor-neutral Agent Skill without modifying installed skill directories.
**Architecture:** Keep the floating-panel content scripts, extract only the selected job detail, normalize explicit education requirements, and gate outreach. Keep the SKILL.md open format with optional Codex UI metadata. Package skill and extension separately from the same repository.
**Tech stack:** Manifest V3, plain JavaScript, Node built-in test runner, Python standard-library ZIP packaging.

## Task 1: Regression tests
- [x] Add Node VM tests for education normalization, ambiguous or unknown education, empty selections, default filters, and selected-detail extraction.
- [x] Run tests against existing code and observe failures before implementation.

## Task 2: Extension
- [x] Add education buckets and exact requirement matching (本科/学历不限 default); unknown requirements skip.
- [x] Isolate selected details from list, injected panel, and resume text; wait for identity-matched details before processing.
- [x] Add education checkboxes with local persistence, config migration and skip logging. Process each job at most once per run, honor pause/stop before communication.
- [x] Increment manifest to 1.1.0 and update installation/use instructions.

## Task 3: Portable Agent Skill
- [x] Replace Codex-specific framing with Agent Skills instructions; document Claude Code/Gemini CLI/Codex installation and direct script use, prerequisites and limitations.
- [x] Update only the repository copy under skills; no installed skill folder edits. Document verified official references and unavailable verification honestly.

## Task 4: Packaging and verification
- [x] Write packaging regression tests ensuring separate ZIPs, correct root layout, no .codex/config/output/private files.
- [x] Add a reusable package script, use it in CI and run tests in CI.
- [x] Run Node tests, syntax checks, skill validator, local ZIP inspection, and browser fixture tests without real outreach.
- [x] Review diff, ensure no private files are tracked, commit/push only intended source changes. Report actual test scope and release state without claiming live outreach validation.

## Verification results

- Red run: 5/6 education tests failed on the old implementation.
- Green run: 7/7 Node tests passed, including the headless Edge fixture (PLAYWRIGHT_MODULE supplied locally).
- Packaging test passed, local archives inspected for correct layout and absence of private data.
- Skill validator, JS syntax and workflow YAML parse passed.
- No live messages sent for testing. Claude/Gemini import documented but not end-to-end executed.
- Only repository skill sources were updated; installed user skill directories were not modified.
