# Finally Instructions
/Users/thor3/Documents/whono2-astro-with-jxl-works-jxl/src/assets/images/README.md


2026-07-06T23:59:17.542Z




# Cloudinary source images

Drop image files in this folder, then generate responsive breakpoints **and**
a ready-to-paste snippet in one step:

```bash
npm run cloudinary:breakpoints -- src/assets/images/<filename>.jpg
```

The script uploads the image to Cloudinary, writes the generated widths to
`src/data/cloudinary-breakpoints.json`, and prints a `<cloudinary-picture>`
snippet to stdout. Copy that snippet into a `.md` post, replace the alt text,
done.

## One-time setup

Add these to `.env` at the project root (already gitignored — never commit it):

```
PUBLIC_CLOUDINARY_CLOUD_NAME=paulapplegate-com
CLOUDINARY_CLOUD_NAME=paulapplegate-com
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

The build only needs the **cloud name** to render images. The API key/secret are
used solely by the upload script above.

## Paste the printed snippet into a `.md` post

```md
<cloudinary-picture
  src="assets/images/<filename>"
  alt="TODO: describe this image"
  width="2000"
  height="1500"
  sizes="(min-width: 768px) 720px, 100vw"
  breakpoints="200, 382, 527, 730, 1024, 2000"
  picture-class="responsive-picture"
/>
```

No imports needed — a rehype plugin renders `<cloudinary-picture>` at build time
into a `<picture>` with JXL → AVIF → WebP `<source>`s plus a WebP `<img>`
fallback. (The script fills in the real `width`, `height`, and `breakpoints`
from the upload response — only the `alt` is yours to write.)

## Attributes

| Attribute        | Required | Notes |
| --------------- | -------- | ----- |
| `src`           | yes      | Cloudinary public ID: `assets/images/<filename>` (no `src/`, no extension). |
| `alt`           | yes      | Must be non-empty — the build fails otherwise. |
| `width`         | yes      | Intrinsic image width in px. |
| `height`        | yes      | Intrinsic image height in px. |
| `breakpoints`   | yes      | Comma-separated widths, or a JSON array like `[200, 382]`. |
| `sizes`         | rec.     | CSS `sizes` so the browser picks a source. |
| `picture-class` | opt.     | Class on the wrapper `<picture>` (a styling hook). |
| `loading`       | opt.     | `lazy` (default) or `eager`. |
| `decoding`      | opt.     | `async` (default) or `sync`. |
| `transformations` | opt.   | JSON object of extra Cloudinary transforms, e.g. `{"crop":"fill","height":500}` or `{"rawTransformations":["g_auto"]}`. |

## `.mdx` / `.astro` posts (optional)

A `<Picture>` component is still available for `.mdx`/`.astro` if you want typed
props and imports. The breakpoints JSON file is just a cached record of what the
script generated — `.md` posts paste the widths directly and don't import it, so
there's no need to index a JSON object by `publicId`.

```mdx
import Picture from "@/components/Picture.astro";

<Picture
  src="assets/images/<filename>"
  alt="..."
  width={2000}
  height={1500}
  sizes="(min-width: 768px) 720px, 100vw"
  breakpoints={[200, 382, 527, 730, 1024, 2000]}
  pictureClass="responsive-picture"
/>
```


# New Info all Astro
## Reproduce the fix from scratch

If you ever revert/lose the changes, this is the exact sequence:

### 1. `package.json` dependency versions
Make sure these three lines read:
```jsonc
"astro": "^6.4.4",
"@astrojs/react": "^5.0.7",
"astro-cloudinary": "^1.3.5",
```
(The broken originals were `astro ^2.4.5`, `@astrojs/react ^3.6.2`,
`astro-cloudinary ^0.0.1`.)

### 2. `astro.config.mjs` — Vite section
The `vite` block needs `astro-cloudinary` kept out of pre-bundling:
```js
vite: {
  plugins: [tailwindcss()],
  ssr: {
    // Prevents Vite from parsing internal relative paths in the package during SSR/Build
    noExternal: ['astro-cloudinary', '@radix-ui/*']
  },
  optimizeDeps: {
    // Prevents Vite from pre-bundling the package during static entrypoint building
    exclude: ['astro-cloudinary']
  },
  build: {
    cssMinify: true,
    minify: 'esbuild'
  }
},
```

### 3. `src/components/Picture.astro`
This must be the **Cloudinary** component (uses `getCldImageUrl` from
`astro-cloudinary/helpers`, emits JXL → AVIF → WebP `<source>`s + WebP `<img>`
fallback). It is NOT Astro's built-in `<Picture>`. The current file in the repo
is the correct version — copy it from git history (`git show 77573cc:src/components/Picture.astro`)
if needed.

### 4. Reinstall and build (on Node 22)
```bash
nvm use 22
rm -rf node_modules package-lock.json
npm install
npm run build      # should build 11 pages, no errors
```

### Clean-room sanity check
```bash
nvm use 22
rm -rf node_modules package-lock.json
npm install && npm run build
```
Expected tail: `[build] 11 page(s) built` … `[build] Complete!`

---

## The Cloudinary `<Picture>` workflow

> Blog images are served entirely by Cloudinary (JXL → AVIF → WebP, no JPEG
> fallback). Astro/Sharp never touches them.

### Prerequisites
- Node 22 active (`nvm use 22`), npm.
- `.env` with Cloudinary credentials (already set, gitignored):
  - `CLOUDINARY_CLOUD_NAME` (or `PUBLIC_CLOUDINARY_CLOUD_NAME`)
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### Step 1 — Add the image
Drop the file into `src/assets/images/`, e.g. `src/assets/images/my-photo.jpg`.

### Step 2 — Generate breakpoints
```bash
npm run cloudinary:breakpoints -- src/assets/images/my-photo.jpg
```
- The `--` is required so npm forwards the path to the script.
- This **uploads the image to Cloudinary** (overwrites same public ID), asks for
  responsive breakpoint widths, and merges them into
  `src/data/cloudinary-breakpoints.json`:
  ```json
  { "assets/images/my-photo": [200, 382, 527, 730, 1024, 2000] }
  ```

**Key rule:** the public ID has no extension and no `src/` prefix:

| File on disk                     | Key used everywhere      |
| -------------------------------- | ------------------------ |
| `src/assets/images/my-photo.jpg` | `assets/images/my-photo` |

### Step 3 — Use it in a blog post (`src/content/blog/*.mdx`)
```mdx
import Picture from "@/components/Picture.astro";
import breakpoints from "@/data/cloudinary-breakpoints.json";

<Picture
  src="assets/images/my-photo"
  alt="Describe the image."
  width={2000}
  height={1500}
  sizes="(min-width: 768px) 720px, 100vw"
  breakpoints={breakpoints["assets/images/my-photo"]}
  pictureClass="responsive-picture"
/>
```

### `<Picture>` props
| Prop              | Required | Notes |
| ----------------- | -------- | ----- |
| `src`             | yes | Cloudinary public ID — the no-extension key from Step 2 |
| `alt`             | yes | Throws at build time if missing |
| `width` / `height`| yes | Intrinsic size; `width` is also added to srcset widths |
| `sizes`           | yes | Standard responsive `sizes` attribute |
| `breakpoints`     | yes | The array from `cloudinary-breakpoints.json` for this key |
| `pictureClass`    | no  | Class applied to the `<picture>` element |
| `transformations` | no  | Extra Cloudinary options merged into every generated URL |

### Verify in the browser
```bash
npm run build && npm run preview
```
Open a post and run:
```js
document.querySelector("picture img")?.currentSrc;
```
- Safari 17+ → `f_jxl`
- Chrome / Firefox → `f_avif`
- Older → `f_webp`
- You should never see `f_jpg`.

---

## Related docs
- `docs/cloudinary-picture-workflow.md` — the same workflow, standalone.
- `docs/cloudinary-jxl-demo.mdx` — a demo post / browser verification reference.
- `README.md` → "Local Development" section — the short version.
