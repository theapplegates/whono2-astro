---
title: Admin Console Quick guide
description: introduce astro-whono local Admin Console entrance、Functions of each page。
badge: guide
date: 2026-04-24
tags: [ "Admin Console", "guide" ]
draft: false
---
<cloudinary-picture
  src="assets/images/The-Gulfstream-G800.20250416"
  alt="TODO: describe this image"
  width="3600"
  height="2400"
  devices="1200|40|original,992|60|16:9,768|70|4:3,0|100|1:1"
  breakpoints="50, 432, 647, 858, 1000"
  picture-class="responsive-picture"
/>



<cloudinary-picture
  src="assets/images/slava-auchynnikau-Z4g5S4sksPQ-unsplash"
  alt="TODO: describe this image"
  width="4000"
  height="2667"
  sizes="(min-width: 768px) 720px, 100vw"
  breakpoints="50, 431, 638, 746, 968, 984, 1000"
  picture-class="responsive-picture"
/>


<cloudinary-picture
  src="assets/images/alim-unsplash"
  alt="TODO: describe this image"
  width="4018"
  height="3014"
  sizes="(min-width: 768px) 720px, 100vw"
  breakpoints="50, 402, 604, 715, 786, 873, 879, 1000"
  picture-class="responsive-picture"
/>

<cloudinary-picture
  src="assets/images/the-metropolitan-museum-of-art-zvD1-cNLluI-unsplash"
  alt="TODO: describe this image"
  width="2846"
  height="3536"
  sizes="(min-width: 768px) 720px, 100vw"
  breakpoints="50, 319, 439, 519, 524, 690, 703, 727, 777, 825, 855, 864, 901, 938, 982, 988, 1000"
  picture-class="responsive-picture"
/>
Admin Console `/admin/`It is the local backend entrance，used in fork、clone Or take over site configuration and content maintenance after self-hosting。

it is not independent CMS，The save operation will write back the configuration or content files in the warehouse，Therefore suitable for and Git used together：You can see before and after changes diff，When it is necessary to roll back, it will be processed as a normal project file.。

:::note[local tools]
Admin Console Provides writing capabilities only in development environment。<br>
The production environment retains at most the read-only site overview page；`/api/admin/*` Only serve the local backend，inaction publicity API。
:::

## Quick entry

Start a project locally：

```bash
npm install
npm run dev
```

The development server runs by default on `http://localhost:4321/`，If the port has been modified，please change `4321` Replace it with your actual port。

| Entrance | page | Main purpose |
| :---: | :---: | :--- |
| `/admin/` | Site Overview | View site overview、Content structure、Recent articles, etc. |
| `/admin/theme/` | Theme Console | Edit site information、sidebar、front page、Internal page copywriting |
| `/admin/content/` | Content Console | Article management and visual writing |
| `/admin/images/` | Images Console | Browse image resources，Copy available paths |
| `/admin/checks/` | Checks Console | View structured diagnostics，Do pre-release checks |
| `/admin/data/` | Data Console | Import and export theme settings，Easy migration and backup |

## main page

### 📈 Site Overview

[Site Overview](/admin/) It is the backend homepage，Number of site contents that can be viewed、Recent updates、Backstage entrance, etc.（The entrance is only visible to the development environment）。

This page is optional and open to visitors，受 Theme Console within the page Admin Overview switch control。

### 🛠️ Theme Console

Theme Console Manage topic-level configuration，Convenient in fork 或 clone Quickly adjust site basic settings。

For details, see [Theme Console Configuration Guide](/archive/theme-console-guide/)。

### 📝 Content Console

Content Console It is the entrance to content management and visual writing，Can centrally view and maintain the writing content of the site。

For details, see [Content Console User Guide](/archive/content-console-guide/)。

### 🖼️ Images Console

Images Console Browsable image resources、Check image information，and copy the path that can be used for configuration or content fields。

Currently positioned close to the resource browser，Compression is not supported yet、Delete or replace files。
When you need to change the picture，First put the pictures in the project agreed directory，Go back to the corresponding page to select or fill in the path.。

### ✅ Checks Console

Checks Console Do pre-release checks，will put the content、Configuration、Image references and agreed risks are organized into diagnostic results。

This page does not modify files directly。After discovering the problem，back again Theme、Content Or process it in the source code。

### 📤 Data Console

Data Console Responsible for importing or exporting theme settings。Export is suitable for migration or backup；The import will be pre-checked first.，Confirm writing again。

it deals with Theme Console Managed topic configuration data，Do not process article content。

---
These are the current Admin Console The main entrance and functions of。If you have more ideas or suggestions，Submissions are welcome Issue。
