# myskills

A personal collection of [Codex](https://github.com/openai/codex) skills.

## Layout

```
myskills/
└── skills/
    └── <skill-name>/      # one folder per skill
        ├── SKILL.md       # required entrypoint
        ├── README.md      # optional docs
        ├── agents/        # optional UI metadata
        ├── scripts/       # optional executable helpers
        └── references/    # optional supporting docs
```

Each skill lives in its own folder under `skills/`. To add a new skill, create
`skills/<skill-name>/` and include a `SKILL.md` with `name` and `description`
frontmatter.

## Skills

| Skill | Description |
|-------|-------------|
| [boss-job-apply](skills/boss-job-apply) | Automate BOSS直聘 job filtering and batch recruiter outreach through a logged-in browser. |

## Usage

Install a skill by copying its folder into your Codex skills directory:

```powershell
Copy-Item -Recurse skills/boss-job-apply "$env:USERPROFILE\.codex\skills\boss-job-apply"
```

## Notes

- `.codex/` is ignored on purpose and must never be committed.
- Per-skill `config.json` and `out/` are gitignored so credentials and local
  results stay out of the repo.
