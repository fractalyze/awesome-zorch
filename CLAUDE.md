# CLAUDE.md

Working rules for AI-assisted sessions in this repo. Mechanics of adding a
library live in CONTRIBUTING.md; decisions live in design.md (v2,
authoritative) — read §8 for open items before starting launch work.

## Copy policy — team-written text only

All user-facing copy (taglines, descriptions, hero text, stats) comes verbatim
from team-written sources: repo READMEs, `design.md`, or the Notion docs it
cites. Never invent marketing lines, numbers, or claims. Attribute facts in
`libraries/*.yaml` must be sourced from the library's own README.

## Git

- No AI co-author trailers (`Co-Authored-By: Claude ...`) — strip them.
- Commit via the `workflow:commit` skill; PRs via `workflow:create-pr`.
- Data changes and site changes may share a PR when one motivates the other.

## Quality gates

```bash
export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH"  # system node is 18
npm run validate && npm test        # schema + validator tests (also in CI)
cd site && npm install && npm run build   # prebuild re-runs root validate
```

The site build fails if the catalog doesn't validate — that gate is
load-bearing on Vercel (`npm ci --include=dev`).

## Structure notes

- Branding (names, domain, playground URL) is centralized in
  `site/lib/site.ts`; "zorch"/"ZKX" are placeholders until the naming round,
  so a rename must stay a one-file change.
- `pypi:` in a library yaml enables the site's pip-install button — only set
  it once the package is actually published under that name.
