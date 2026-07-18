---
title: Content Console User Guide
description: illustrate astro-whono local Content Console null、list search、Ability to edit, preview, download and delete。
badge: guide
date: 2026-06-13
tags: [ "Content Console", "guide" ]
draft: false
---

astro-whono provide a local Content Console，Writing content for managing sites in a development environment。

Content Console The entrance is `/admin/content/`。it covers essay、Whisper、Notes、Browsing about four categories of content、Find、Edit and Preview，and supports creating new drafts、Download source files and delete，Convenient for handwriting when not directly frontmatter Maintain content in case of。

:::note[development environment]
`/admin/content/` and its editing page are only operable in the development environment。Only local development prompts are displayed when accessing the production environment.，Content data and editor not loading；`/api/admin/content/*` Only serve local backend，inaction publicity API。
:::

## Local startup and entry

When developing locally，The project can be started with the following command：

```bash
npm install
npm run dev
```

By default，The development server will run on `http://localhost:4321/`。Can be accessed directly after startup：

```text
http://localhost:4321/admin/content/
```

If the development port is modified locally，please change `4321` Replace with actual port。

Content Console read directly `src/content/**` source files under，No dependencies on databases or external services。New、Saving and deleting content files will fall into the warehouse，Relevant changes can be made through Git Tracking and fallback。

## Content types and capabilities

Content Console Unified management of four types of content，But their capabilities are not the same：

| content | Table of contents | New | edit | delete | List filter |
| :--- | :--- | :---: | :---: | :---: | :---: |
| Essay | `src/content/essay/` | support | support | support | support |
| Whisper | `src/content/bits/` | support | support | support | support |
| Notes | `src/content/memo/index.md` | — | support | — | — |
| about | `src/content/about/index.md` | — | support | — | — |

Essays and murmurs are multiple pieces of content，You can create a new draft in the console、Edit and delete items one by one，The list also provides filtering and paging。Notes and About are fixed single-page content，Only existing text can be edited，New or deleted is not supported。

## Browse、Filter and search

Open `/admin/content/` 时，Default is Essay、Whisper、Notes、Overview of group display content。The top toolbar provides the following capabilities：

- search：by title、tag or slug Find across content
- scope：在「All content」Switch between single-category content
- state：All status / Published / Draft only
- sort：Latest updates / title A-Z
- years：Filter by content year

state、sort、Year filtering and paging are only for essays、Whisper takes effect；Notes and About are fixed single pages，Do not expose these filters。in list，Draft marked as `[draft]`，Close archive of essays tagged `[archive off]`。

Each item is provided「edit」button，as well as「More」Modification information in the menu、Check at the front desk、Download and delete operations。

## New and Edit

### Essay

Click on the essay group「Create new article」，After filling in the basic information such as the title, a draft will be generated，and jump to the edit page。

Provided by essay editing page：

- based on CodeMirror The text editing area，Built-in multiple syntax highlighting themes and line number options
- edit / Preview layout switch，Preview is rendered server-side
- frontmatter Information panel：release date、Update date、Label、Draft and archive fields
- Directory and Markdown Grammar Two Auxiliary Sidebars
- Toolbar：Commonly used Markdown、mathematical formula、emoji、Pictures & Galleries
- Text image upload：After uploading, save it to the attachment directory of the current content.，and insert Markdown

### Whisper

Click on the Whisper group「New activity」，After selecting the publishing time, a draft will be generated and jump to the editing page.。

The Whispers editing page is an independent workbench，Editable text、Basic information and pictures（`images`）行，Support image upload，and provides real-time card previews，What you see and `/bits/` The cards in the list are consistent。

### Notes and About

Notes and About are fixed single-page content，The edit page only processes text：

- Notes：edit `src/content/memo/index.md` text，Support inserting text images、Page preview and text table of contents
- about：edit `src/content/about/index.md` text，Friend links in preview and FAQ Will be rendered according to public page style；For contact link location `::contact-links` Occupancy control

The main and subtitles of the notes and about pages are not maintained here.，unified in Theme Console Adjustment。

## Batch operation

After checking items in the list，Passable「Batch operation」implement：

- release / Revise the draft：Batch switching `draft` state
- download：Pack the source files of the selected content into zip download
- delete：Delete selected items in bulk，Move source files to recycle bin（Will confirm before deleting）

The scope of batch operations is the checked content in the current list；You can use filtering or search to narrow down the scope first，Process in batches again。

## Download and delete

- download：in this article「More」Menu points「Download source file」，get the corresponding Markdown document
- delete：in this article「More」Delete from menu，The source file will be moved to the Recycle Bin，rather than directly erasing；Will confirm before deleting

Download and delete act on the source file itself。Delete only essays、Whisper support，Notes and About No deletion available。

## Content fields and writing conventions

Content Console Responsible for entering and maintaining content，specific frontmatter Field、Image path rules and text writing conventions（Callout、Figure、Gallery、Formulas etc.）still warehouse README 「Content and Writing」Subject to，Not repeated here。

**New content is draft by default**。Essay、Drafts of Whispers are visible in local development，Production build、RSS with public lists automatically filtered；Notes are single-page content，Should not be marked as draft。

---

## write at the end 

:::info[Why build a local backend?]
Content Console It is the most complicated in the whole backstage、The part that takes the most time。Since they are all writing locally、You need to start the development server，Edit directly Markdown can also be completed，Some friends may wonder why we need to build such a backend？

- astro-whono Targeted users may not be familiar with the front end。Things to remember when editing source files directly frontmatter Field、Directory structure and writing conventions，The background collects these into forms and buttons，Lower the barrier to entry。
- When writing, you are more concerned about the final typesetting effect.。Built-in server preview on edit page，text、Both cards and about pages can see a near-foreground presentation before saving.，No need to switch back and forth to the browser to confirm。
- Common content formats（Callout、picture、gallery、formula、emoji 等）Can be inserted directly from the toolbar，Eliminate handwritten markup and documentation。
- Notes、About this type of fixed single page，In the past, only source files could be modified；Text can now be edited in situ in the background and previewed，more convenient。

Content Console The goal is not to replace the command line or editor，Rather, it allows people without coding foundation to easily maintain their own content.。Of course, the best solution is to make it real CMS ，But that's another level of work，Not in the immediate plans either。
:::

### 🔜Current progress and follow-up plans

Content Console The functions originally envisioned are now basically implemented，Admin The backend follow-up will also focus on maintenance and detail optimization.，There are currently no plans to add new features。If you have any suitable ideas or suggestions in use，Suggestions are also welcome。

:::tip[Follow-up plan]
Comments feature is planned，At present, we are initially considering accessing Waline。Essay（essay）Access is relatively straightforward；Whisper（bits）It is a short dynamic type page，It is also necessary to redesign the style and adaptation of the comment system on this kind of page.。Therefore, although the comment module is already included in the plan，It may take some time for it to be officially launched。
:::

---

The above content covers Content Console Current content management entrance and common operations。If you encounter content exceptions during use、save question，Or have ideas and suggestions for features，All are welcome to submit Issue。
