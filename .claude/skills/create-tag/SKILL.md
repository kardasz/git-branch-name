---
name: create-tag
description: Create an annotated Git tag for a released version, with a single-line message summarized from CHANGELOG.md.
argument-hint: <version>
disable-model-invocation: true
---

# Create Tag: $ARGUMENTS

Create an annotated Git tag `$ARGUMENTS` with a single-line message.

0. Run `npm run build` — pushing the tag deploys the site to GitHub Pages, so the tag is the gate. Stop and report instead of tagging if the build fails
1. Find the `$ARGUMENTS` section in `CHANGELOG.md` (search for the version heading instead of reading the file whole)
2. Verify `version` in `package.json` matches `$ARGUMENTS` — if it doesn't, stop and report the mismatch instead of tagging
3. Summarize that changelog section into one line
4. `git tag -a $ARGUMENTS -m "<summary>"`
