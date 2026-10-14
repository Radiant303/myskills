# myskills

A personal collection of [Codex](https://github.com/openai/codex) skills and Chrome extensions.

## Layout

```
myskills/
├── skills/                    # Codex skills
│   └── <skill-name>/
│       ├── SKILL.md           # required entrypoint
│       ├── README.md          # optional docs
│       ├── agents/            # optional UI metadata
│       ├── scripts/           # optional executable helpers
│       └── references/        # optional supporting docs
└── chrome-extensions/         # Chrome / Edge extensions
    └── <extension-name>/
        ├── manifest.json      # Manifest V3
        ├── content/           # content scripts (panel UI)
        ├── lib/               # shared helpers
        └── icons/             # extension icons
```

## Skills

Each skill lives in its own folder under `skills/`. To add a new skill, create
`skills/<skill-name>/` and include a `SKILL.md` with `name` and `description`
frontmatter.

| Skill | Description |
|-------|-------------|
| [boss-job-apply](skills/boss-job-apply) | Automate BOSS直聘 job filtering and batch recruiter outreach through a logged-in browser. |

Install a skill by copying its folder into your Codex skills directory:

```powershell
Copy-Item -Recurse skills/boss-job-apply "$env:USERPROFILE\.codex\skills\boss-job-apply"
```

## Chrome Extensions

Each extension lives in its own folder under `chrome-extensions/`.

| Extension | Description |
|-----------|-------------|
| [boss-job-apply](chrome-extensions/boss-job-apply) | In-page floating panel on BOSS直聘 that filters jobs by company size and salary, then sends greetings in bulk. |

Load an extension unpacked in Chrome/Edge:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the extension folder, e.g. `chrome-extensions/boss-job-apply`

## CI / Releases

Two GitHub Actions workflows run automatically:

- **Lint** — validates every `.json` file and checks JavaScript syntax.
- **Package Extensions** — zips each folder under `chrome-extensions/`.
  - On push / PR: zips are uploaded as workflow artifacts.
  - On a `v*` tag: zips are attached to a GitHub Release.

Download a ready-to-install extension zip from the
[Releases](https://github.com/caiyuping123456/myskills/releases) page, then
unzip it and load the folder via `chrome://extensions`.

## Notes

- `.codex/` is ignored on purpose and must never be committed.
- Per-skill `config.json` and `out/` are gitignored so credentials and local
  results stay out of the repo.
