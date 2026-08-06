# Changelog Rules

The project keeps a `CHANGELOG.md` at the repository root. It is part of the
deliverable: every user-facing change updates it in the **same commit** that
makes the change, exactly like a change to the options or the generated names
updates `README.md`.

The file follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/)
and the project versions releases with
[Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html). The `version`
field in `package.json` MUST match the latest released version in the changelog.

## Hard constraints

- **English only.**
- **Truthful** — describe what actually shipped, never planned or removed
  behavior.
- The changelog is for humans, not a raw commit dump — write entries that
  explain the change to someone using the site.

## Recording changes

Add every notable change under an `## [Unreleased]` section at the top, grouped
by the Keep a Changelog change types (use only the ones that apply):

- **Added** — new options, branch types, keyboard shortcuts.
- **Changed** — changes in existing behavior.
- **Deprecated** — soon-to-be-removed features.
- **Removed** — features removed in this release.
- **Fixed** — bug fixes.
- **Security** — vulnerability fixes.

If there is no `## [Unreleased]` section, create one below the intro.

## When to cut a release

**Default to releasing immediately** — in the same commit that adds the
changelog entry, also perform the "On release" steps below (rename
`[Unreleased]`, bump `version`, update comparison links, tag). Do not leave a
change sitting under `## [Unreleased]` and wait to be asked to version it; that
is the default failure mode this rule exists to prevent.

Only skip the immediate release — leaving the entry under `## [Unreleased]`
— when the user has explicitly said multiple changes should land together
under one release (e.g. "hold off tagging, I have more coming for this
version").

## Versioning (SemVer) — when to bump what

Given a `MAJOR.MINOR.PATCH` version, on release rename `## [Unreleased]` to
`## [X.Y.Z] - YYYY-MM-DD` and choose the bump from the accumulated entries:

- **MAJOR** (`X`) — any **breaking change**: removal of a user-facing option or
  branch type, a change to the shape of the generated names that would surprise
  someone relying on the old output, or dropping a persisted setting so saved
  preferences are lost. Anything in a **Removed** group, or a **Changed** entry
  that breaks an existing workflow, forces a MAJOR bump.
- **MINOR** (`Y`) — new, **backward-compatible** functionality: entries under
  **Added**, or **Deprecated** marks that do not yet break anything. Reset
  PATCH to `0`.
- **PATCH** (`Z`) — **backward-compatible bug fixes only**, no new
  functionality: **Fixed** and non-breaking **Security** entries.

When a release mixes types, the highest-ranked bump wins (breaking → MAJOR,
otherwise any new feature → MINOR, otherwise → PATCH).

`1.0.0` is cut, so the `0.x` grace period of SemVer §4 is over: the rules
above apply literally. Anyone can bookmark the site and keep the options they
set, so a MAJOR bump is a real event — it means a name someone generates comes
out different, or a preference they saved stops being honoured.

## On release

1. Rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD` and add a fresh empty
   `## [Unreleased]` above it.
2. Update `version` in `package.json` to match, and refresh `package-lock.json`
   (it carries the version twice) with `npm install --package-lock-only`.
3. Update the comparison links at the bottom of the changelog.
4. Commit, then create an annotated local tag `vX.Y.Z`
   (`git tag -a vX.Y.Z -m "vX.Y.Z"`). Creating the tag is routine and needs no
   extra confirmation; pushing it follows the normal push-confirmation policy —
   don't push without being asked.

Pushing the tag is what publishes the site: `.github/workflows/pages.yml`
deploys to GitHub Pages on every `v*` tag. So the tag is the gate — run
`npm run build` before creating it and do not tag on a failing build.
