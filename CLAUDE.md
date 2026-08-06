# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page, fully static branch-name generator ([gitbranch.name](https://gitbranch.name)) built with Astro 7 and vanilla TypeScript. Paste a JIRA link, a ticket key, or a plain title; every branch-name variant is recomputed on each keystroke and copied on click. There is no backend, no analytics, and no network traffic at runtime — keep it that way.

## Commands

| Command           | Action                              |
| :---------------- | :---------------------------------- |
| `npm install`     | Install dependencies (Node ≥ 22.12) |
| `npm run dev`     | Dev server at `localhost:4321`      |
| `npm run build`   | Static build to `./dist/`           |
| `npm run preview` | Serve the built site                |

There is no test suite, linter, or formatter configured, and `astro check` is not installed (`@astrojs/check`/`typescript` are absent). `npm run build` is the only verification gate — run it before tagging, since `.github/workflows/pages.yml` deploys to GitHub Pages on every `v*` tag.

## Architecture

The split that matters: **`src/lib` is pure and DOM-free, `src/scripts` is the browser wiring.**

- `src/lib/branch-name.ts` — the whole domain: `parseInput` (ticket extraction), `slugify`, `formatTicket`, `formatDate`, `buildBranchName`, `clampLength`, plus the `FormatOptions` shape and length bounds. Anything about _what a name looks like_ belongs here, and it must stay importable without a DOM.
- `src/lib/branch-types.ts` — `BRANCH_TYPES` (the single source of order for the options panel and the result list), the `BranchType` type, `isBranchType`, and `hueOf`, which maps a type to its `--t-<type>` CSS token (`null` → `--t-none`).
- `src/scripts/app.ts` — the only stateful client code. Reads options from the DOM, calls `buildBranchName` once per selected type (`null` first, for the unprefixed name), rebuilds the row list, and handles clipboard + toast. State lives in the DOM, not in a store; `render()` is called on every `input` event on the textarea or the options panel.
- `src/scripts/theme.ts`, `ambient.ts` — independent entry points, imported from their own components.
- `src/scripts/dom.ts` — `must()`, a querySelector that throws when markup and script drift apart. Use it rather than null checks.

Each `.astro` component that needs client code imports its script in a `<script>` block (`Generator.astro` → `app`, `ThemeSwitch.astro` → `theme`, `AmbientGraph.astro` → `ambient`). Astro bundles those; nothing is registered globally.

### Conventions worth not rediscovering

- **The ticket key is an identifier, not a word.** It keeps its uppercase and its own `-` even under the `_` separator and under `Lowercase`, so JIRA still links the branch to the issue. Only the explicit `Lowercase TICKET-123` option changes that. Don't "fix" this into uniform casing.
- **A ticket key inside a URL wins** over one in the surrounding text — that's the one the person actually linked.
- **Colour is never hardcoded in components.** Every colour resolves through a custom property in `src/styles/tokens.css`; themes are switched by redefining tokens, with `prefers-color-scheme` as the default and `data-theme` on `<html>` overriding it in both directions. An inline script in `Layout.astro` applies the stored theme before first paint — if you change `THEME_KEY` (`gbn-theme`), change it there too.
- **Result rows are built at runtime**, so their CSS lives in `src/styles/global.css`, not in a component `<style>` — Astro only scopes markup it renders itself.
- Indentation is tabs, in `.ts`, `.astro`, and `.css` alike.

## Changelog and releases

`.claude/rules/changelog.md` governs `CHANGELOG.md` and is binding: every user-facing change updates the changelog **in the same commit**, and the default is to cut the release immediately (rename `[Unreleased]`, bump `package.json` + `package-lock.json`, update comparison links, tag) rather than letting entries accumulate. `package.json`'s `version` must match the latest released version. The `/create-tag` skill handles the annotated tag. Never push a tag without being asked — pushing one publishes the site.

`.claude/rules/commit-messages.md` governs commit messages: single-line Conventional Commits, English, no AI attribution trailers.
