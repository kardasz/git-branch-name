# Commit Message Rules

All git commit messages MUST follow these rules.

## Hard constraints

- **English only** — never Polish or any other language
- **Single line** — subject line only; no body, no bullet list, no footer, unless the user explicitly asks for one
- **No AI attribution** — never append `Co-Authored-By`, `Generated with Claude`, `🤖`, or any similar trailer

## Conventional Commits format

```
<type>(<scope>): <description>
```

- `type` and `description` are required; `scope` is optional
- Lowercase `type` and `description`; no trailing period
- Imperative mood, present tense: "add", "fix", "remove" — not "added", "adds", "fixed"
- Keep the subject ≤ 72 characters
- `scope` is the affected area, lowercase (e.g. `generator`, `options`, `theme`, `styles`, `ambient`, `a11y`, `ci`, `tooling`)

### Allowed types

- **feat** — a new feature
- **fix** — a bug fix
- **refactor** — code change that neither fixes a bug nor adds a feature
- **perf** — performance improvement
- **test** — adding or correcting tests
- **docs** — documentation only
- **build** — build system, dependencies, or tooling
- **ci** — CI configuration
- **chore** — maintenance that doesn't touch src or tests
- **style** — formatting only, no code-behavior change

### Breaking changes

Add `!` after the type/scope: `feat(options)!: drop the legacy query-string format`.

## Examples

```
feat(generator): keep the ticket key uppercase under the `_` separator
fix(options): persist the max length across reloads
refactor(lib): split slugging out of branch-name assembly
docs: describe the options table in README.md
ci: deploy to GitHub Pages on `v*` tags only
```
