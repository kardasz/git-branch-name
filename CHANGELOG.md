# Changelog

All notable changes to Git Branch Name are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-08-06

The tool stays free and ad-free; this adds a quiet way to chip in if it saves
you time.

### Added

- A compact sponsor card below the generator, and a "Sponsor" link in the
  footer, both pointing at GitHub Sponsors. Nothing is tracked and nothing is
  loaded from GitHub — they are ordinary links.

## [1.2.0] - 2026-08-06

Puts the prose back in its place. The generator had two screens of explanation
below it; now there is one collapsed FAQ, and the page ends shortly after the
thing you came to use.

### Added

- The frequently asked questions are collapsible — one answer open at a time,
  the first one to start with. Every answer is still in the page source, so
  search engines and assistants read the same text they did before.

### Changed

- "How it works" and "Options" are no longer separate panels: they are the
  first two questions in the FAQ, keeping the worked example and the full
  description of every option.

## [1.1.0] - 2026-08-06

Makes the site findable. Search engines and chat assistants had almost nothing
to go on before: one heading, one sentence, and a widget they cannot run. There
is now a written explanation of what the generator does below it, and links to
the site finally unfurl with a preview card instead of a bare URL.

### Added

- A "How it works" section, a written reference for every option, and eight
  frequently asked questions below the generator — what a good branch naming
  convention looks like, hyphens versus underscores, how long a name should be,
  which characters git allows, and why the ticket key stays uppercase.
- Link previews. Sharing the site anywhere that reads Open Graph or Twitter
  cards now shows a title, a description and a preview image of the generator.
- `robots.txt` and `sitemap.xml`, a canonical link, and structured data
  describing the page as a free developer tool and its FAQ.
- An apple-touch icon, so the site keeps its mark when added to a home screen,
  and a theme colour matching the light and dark backgrounds.

### Changed

- The browser tab and search results now read "Git Branch Name Generator — JIRA
  ticket to branch name", with a description that says what the tool does.

## [1.0.0] - 2026-08-06

First public release of [gitbranch.name](https://gitbranch.name) — a branch name
generator that turns a task description into a clean, standardized git branch
name. Paste a JIRA link, a ticket key or a plain title and every variant appears
as you type, ready to copy. Everything runs in the browser: there is no backend,
no analytics, and nothing is sent anywhere.

### Added

- Paste a JIRA link, a bare ticket key such as `JIRA-123123`, or just a title,
  and get the branch name back. The ticket key is pulled out of the URL or the
  raw text — a key inside a link wins, because that is the one you actually
  linked — and whatever is left becomes the title.
- One name per branch type, the unprefixed name first: `feature/`, `bugfix/`,
  `hotfix/`, `release/`, `chore/`, `docs/`, `refactor/` and `test/`, each
  switchable in the options panel. Every row carries its type, its character
  count, and marks the count when the name had to be cut to fit.
- There is no generate button. The names are recomputed on every keystroke and
  on every change to the options, and clearing the input clears them.
- Click any name to copy it. The row acknowledges the copy and a toast repeats
  what went to the clipboard; if the browser blocks clipboard access, the toast
  says so instead of failing silently.
- The title is slugified into what a git ref actually allows: accents are
  stripped so `Zmień hasło` becomes `zmien-haslo` rather than `zmie-haso`,
  quotes are dropped, and runs of punctuation collapse into a single separator.
- The ticket key is treated as an identifier, not a word. It keeps its uppercase
  and its own hyphen even under the `_` separator, so JIRA still matches the
  branch to the issue — and `Lowercase TICKET-123` lowercases it when you would
  rather it did.
- Options for the word separator (`-` or `_`), lowercasing the title, prefixing
  today's date, and a character budget for the whole name including the prefix
  (12–200, default 60). A name over budget is trimmed on a word boundary rather
  than mid-word, as long as that keeps most of it.
- Light and dark themes, or match the system — the default. The choice is
  applied before the first paint, so the page never flashes the wrong theme, and
  it is remembered across visits.
- A git graph drifts behind the glass surface of the page.

[Unreleased]: https://github.com/kardasz/git-branch-name/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/kardasz/git-branch-name/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/kardasz/git-branch-name/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/kardasz/git-branch-name/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/kardasz/git-branch-name/releases/tag/v1.0.0
