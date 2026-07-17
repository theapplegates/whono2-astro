---
title: Theme Console Configuration Guide
description: illustrate astro-whono local Theme Console Scope of application in development environment、Page grouping、Configuration placement and saving mechanism。
badge: guide
date: 2026-04-26
tags: [ "Theme Console", "guide"]
draft: false
---

astro-whono provide a local Theme Console，For centrally managing topic-level configuration in a development environment。

Theme Console The entrance is `/admin/theme/`。It mainly covers site information、sidebar、front page、Internal page copywriting，And some reading and code display options，Convenient for fork 或 clone Quickly adjust site theme settings later。

:::note[development environment]
`/admin/theme/` Only available in development environment。When accessing the production environment，Show only local development tips，Does not provide writing capabilities。
:::

## Local startup and entry

When developing locally，The project can be started with the following command：

```bash
npm install
npm run dev
```

By default，The development server will run on `http://localhost:4321/`。Can be accessed directly after startup：

```text
http://localhost:4321/admin/theme/
```

If the development port is modified locally，please change `4321` Replace with actual port。

`/admin/` It's backstage Site Overview Entrance，Used to view site snapshots。Theme Console lie in `/admin/theme/`，Pay attention to distinguish these two entrances when using。

## Development and production environments

Theme Console Is a configuration tool for local maintainers，The performance under different environments is as follows:：

- development environment：`/admin/theme/` Can read and save theme configurations
- production environment：`/admin/theme/` Keep only local development tips，Don't show writable forms
- `/api/admin/settings/`：Only available in development environment，inaction publicity API use

## Scope of application

Theme Console Currently suitable for processing the following types of configurations：

- site title、Default language、default SEO describe
- Footer year and copyright copy
- `/admin/` Overview Display on/off status copy to the outside world
- Social links and their ordering
- Sidebar site name、citation copy、Navigation order and visibility
- Sidebar action icons（reading mode / RSS / theme switching / Site overview entrance）
- front page Hero、Home page introduction and home page internal entrance
- `/essay/`、`/archive/`、`/bits/`、`/memo/`、`/about/` main subtitle
- Article meta information display options
- code block line number


## Configuration file

The saved settings will be automatically written into groups. `src/data/settings/`：

```text
src/data/settings/
  site.json
  shell.json
  home.json
  page.json
  ui.json
```

> 若 `src/data/settings/*.json` Does not exist yet，first time in `/admin/theme/` Will be automatically generated when saving。

Theme Console What is managed is the theme configuration in the warehouse，Relevant changes can still be approved Git Track and rollback。

The reading order of topic configurations is fixed to：`src/data/settings/*.json` priority，Next read legacy Configuration，Finally use project defaults。Here's legacy Configuration mainly comes from `site.config.mjs` and default constants within the component。<br>
That is to say，刚 clone You can use the default configuration first when working on the project；As long as Theme Console Saved once in，will generate a traceable settings JSON。

## Page grouping

`/admin/theme/` Currently divided into five groups according to editing scenes。

### Site

`Site` Responsible for basic information at the site level：

- site title
- Default language
- default SEO describe
- Footer year and copyright copy
- `/admin/` Overview Whether to display externally，And the text displayed when closing
- social links

> ![Site Group screenshots](./theme-console/theme-console-site.webp)

### Sidebar

`Sidebar` Responsible for shell and navigation related configuration：

- Sidebar site name
- Sidebar quote copy
- Sidebar divider style
- Show and hide sidebar action icons（reading mode / RSS / theme switching / Site overview）
- Navigation name、sort、Suffix characters and visible and hidden status

> ![Sidebar Group screenshots](./theme-console/theme-console-sidebar.webp)

### Home

`Home` Responsible for home page display related configuration：

- Hero Image address and description
- Hero Reveal
- Home page introduction main copy
- Home page introduction supplementary copy
- Supplement the primary link and secondary link in the introduction

> ![Home Group screenshots](./theme-console/theme-console-home.webp)

The supplementary introduction on the home page still uses a fixed sentence pattern，The backend only opens copywriting and entrance selections，Try to keep the structure of the homepage as stable as possible。Current optional entrances include `archive`、`essay`、`bits`、`memo`、`about` 和 `tag`。


### Inner Pages

`Inner Pages` Responsible for unified copywriting and display strategies at the internal page level：

- `/essay/` Page main and subtitles
- `/archive/` Page main and subtitles
- `/bits/` Page main and subtitles
- `/memo/` Page main and subtitles
- `/about/` Page main and subtitles
- Whether the article meta information displays the date、Label、word count、Reading time
- `/bits/` Default author name and avatar

> ![Inner Pages Group screenshots](./theme-console/theme-console-inner-pages.webp)


### Code

- Whether to display line numbers in code blocks


## Save mechanism

- Save button `site / shell / home / page / ui` group writeback，Do not directly modify the template source code
- Most fields provide instant preview or clear page correspondence
- Field verification will be performed before saving.
- Version information will be attached when saving，Used to avoid silent overwriting caused by concurrent modifications
- Write process includes rollback on failure，Avoid multi-file semi-success state

---

The above content covers Theme Console Currently commonly used configuration entries and saving mechanisms。If you find configuration abnormalities or saving problems when using，Submissions are welcome Issue。
