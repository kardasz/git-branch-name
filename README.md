# Git Branch Name

<p align="center">
  <a href="https://github.com/kardasz/git-branch-name/actions/workflows/pages.yml">
    <img src="https://github.com/kardasz/git-branch-name/actions/workflows/pages.yml/badge.svg" alt="Build status" />
  </a>
  <a href="https://github.com/kardasz/git-branch-name/deployments">
    <img src="https://img.shields.io/github/deployments/kardasz/git-branch-name/github-pages?label=deployment" alt="Deployment status" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  </a>
  <a href="https://github.com/sponsors/kardasz">
    <img src="https://img.shields.io/github/sponsors/kardasz?label=Sponsor&amp;logo=githubsponsors" alt="Sponsor on GitHub" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white" alt="Astro" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/CSS-1572B6?logo=css&logoColor=white" alt="CSS" />
</p>

<p align="center">
  <strong>🌐 <a href="https://gitbranch.name">gitbranch.name</a></strong>
</p>

A git branch name generator. Paste a task description — a JIRA link, a ticket ID such as `JIRA-123123`, or just a plain title — and get a clean, standardized branch name ready to copy and paste into your terminal.

Open source, by [Krzysztof Kardasz](https://kardasz.eu) — [github.com/kardasz/git-branch-name](https://github.com/kardasz/git-branch-name).

## ✨ What it does

Type or paste something like:

```text
https://company.atlassian.net/browse/JIRA-123123 Add pagination to the feed query
```

and get every variant at once, the unprefixed name first:

```text
JIRA-123123-add-pagination-to-the-feed-query
feature/JIRA-123123-add-pagination-to-the-feed-query
bugfix/JIRA-123123-add-pagination-to-the-feed-query
hotfix/JIRA-123123-add-pagination-to-the-feed-query
…
```

Click any of them to copy it. There is no generate button — names are recomputed on every keystroke, and clearing the input clears them.

The generator pulls the ticket key out of a JIRA URL or raw text, slugifies the rest of the title, strips accents and anything illegal in a git ref, and trims the result to the length budget on a word boundary. The ticket key is treated as an identifier rather than a word: it keeps its uppercase and its own hyphen even under `Lowercase` and the `_` separator, so JIRA still matches the branch to the issue. Turn on `Lowercase TICKET-123` if you would rather have it lowercased.

## 🎛️ Options

| Option                 | Description                                                                                                                                                      |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Branch types`         | Which prefixes to generate — `feature/`, `bugfix/`, `hotfix/`, `release/`, `chore/`, `docs/`, `refactor/`, `test/`. All on by default; one name per checked type |
| `Word separator`       | Character joining words — `-` or `_`                                                                                                                             |
| `Lowercase`            | Lowercases the title (on by default). The ticket key is not affected                                                                                             |
| `Lowercase TICKET-123` | Lowercases the ticket key too (off by default)                                                                                                                   |
| `Include date`         | Prefixes the name with today's date, e.g. `feature/20260806-JIRA-123123-…`                                                                                       |
| `Max length`           | Character budget for the whole name, prefix included (default `60`)                                                                                              |
| `Theme`                | Light, dark, or match the system — the default                                                                                                                   |

Branch generation runs entirely in the browser. Pasted text and generated names are not sent to Google Analytics. Optional GA4 (`G-CTBPCXYPXK`) loads only after explicit analytics consent. Visitors can accept or reject with equal prominence, and change or withdraw consent through **Cookie settings** in the footer. The consent choice expires after 180 days; analytics cookies are removed on rejection. See `/privacy/` for the privacy and cookie notice.

### Analytics administration

The browser uses basic consent mode: no Google tag is loaded before consent, and advertising consent remains denied. Google signals and ad personalization are disabled. The tag uses host-only analytics cookies with a 180-day lifetime and no automatic renewal. The current page's query string, fragment and referring URL are excluded from the configured page metadata. No generator input or branch-name events are sent.

Before publishing, verify the controller/contact details in `src/pages/privacy.astro`, confirm the Google Analytics data-processing terms and international-transfer safeguards, and set/document the property's actual event-data retention in that notice. Cookie expiry does not configure server-side data retention. Disable Enhanced Measurement features not needed for page-visit statistics (especially form interactions, site search and outbound clicks) in the GA4 stream; these are managed in Google's admin console, not by this repository. Review Google-side data sharing and linked products as well.

Consent handling can be checked with `npm test` (Node 22.13+; CI uses Node 24). Increment `CONSENT_VERSION` in `src/scripts/consent.ts` when purposes or consent information materially change, so existing visitors are asked again.

## 💖 Support

If Git Branch Name saves you time, you can [sponsor its continued development on GitHub](https://github.com/sponsors/kardasz). Your support helps keep the tool polished, private, and available to everyone.

## 🚀 Project Structure

Name generation lives in `src/lib` and touches no DOM, so it can be reasoned about and tested on its own; `src/scripts` holds the browser wiring.

```text
/
├── public/
│   ├── apple-touch-icon.png
│   ├── favicon.svg
│   ├── og.png                   # 1200×630 link preview card
│   ├── robots.txt
│   └── sitemap.xml
├── src
│   ├── components
│   │   ├── About.astro          # the prose below the generator, and its FAQ schema
│   │   ├── AmbientGraph.astro   # the git graph drifting behind the glass
│   │   ├── Generator.astro      # input + results + options, owns the client script
│   │   ├── InputCapsule.astro
│   │   ├── Masthead.astro
│   │   ├── OptionsPanel.astro
│   │   ├── ResultList.astro
│   │   ├── Support.astro        # compact GitHub Sponsors call to action
│   │   ├── ThemeSwitch.astro
│   │   └── Toast.astro
│   ├── layouts
│   │   └── Layout.astro
│   ├── lib
│   │   ├── branch-name.ts       # parsing, slugging, name assembly — no DOM
│   │   └── branch-types.ts
│   ├── pages
│   │   └── index.astro
│   ├── scripts
│   │   ├── ambient.ts
│   │   ├── app.ts               # wires the input and options to the result list
│   │   ├── dom.ts
│   │   └── theme.ts
│   └── styles
│       ├── global.css           # page frame, glass surface, result rows
│       └── tokens.css           # palette, both themes
└── package.json
```

Result rows are built at runtime, so their styles sit in `global.css` — Astro only scopes markup it renders itself.

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 📄 License

[MIT](LICENSE) © [Krzysztof Kardasz](https://kardasz.eu)
