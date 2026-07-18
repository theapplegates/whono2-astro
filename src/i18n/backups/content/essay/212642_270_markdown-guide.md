---
title: Markdown Typographic Guidelines
description: show all Markdown Format effect，include title、list、code、sheet、Quotes etc.
date: 2026-01-15
badge: Example
tags: [ "Markdown", "typesetting"]
draft: false
---

<cloudinary-picture
  src="assets/images/clay-banks-awsOkT5bksE-unsplash"
  alt="TODO: describe this image"
  width="3400"
  height="2267"
  sizes="(min-width: 768px) 720px, 100vw"
  breakpoints="50, 392, 583, 741, 913, 961, 1000"
  picture-class="responsive-picture"
/>



This article shows all the support for this theme Markdown Typesetting effect。

first paragraph……（for list preview）
<!-- more -->
Follow-up text……

## text format

This is a normal text。**This is bold text**，*This is italicized text*，***This is bold italic***。You can also use ~~strikethrough~~ to mark content as obsolete。

Use backticks to wrap inline code：`const hello = 'world'`，Great for tagging variable names or commands。

## Quote

> The value of design goes beyond completion of construction。Good design should be able to withstand the test of time，It still maintains its unique charm and practicality over the years.。

You can also use multiple quotes：

> First paragraph quote。
>
> Second paragraph quote，Show multi-paragraph effect。

Source annotation（`<cite>` put on blockquote the last line in）：

> The value of design goes beyond completion of construction。
>
> <cite>— Dieter Rams</cite>

Pullquote（use `blockquote.pullquote` Variants）：

<blockquote class="pullquote">
  You hate those people so much，After fighting them for so long，In the end, he became like them。No ideal in the world is worth the price of such sinking。
  <cite>— One Hundred Years of Solitude</cite>
</blockquote>

## prompt block（Callout）

support `note / tip / info / warning` Four kinds of syntactic sugar。Let’s first give a minimal way of writing；For more granular control，You can also write directly HTML。

~~~md
:::note[title]
This is the text。
:::
~~~

If you need to write directly HTML（More precise control）：

~~~html
<div class="callout note">
  <p class="callout-title" data-icon="none">title</p>
  <p>This is the text。</p>
</div>
~~~

illustrate：
- The default icon is determined by the type，unnecessary `<span class="callout-icon">`。
- Used to hide icons `data-icon="none"`，written in `.callout-title` 上。
- Custom icons available `data-icon="✨"`（Optional）。

### Syntactic sugar variant example（Callout）

This set of examples mainly shows different types of、The actual style of the title form and content structure on the front end。

:::note
This is an untitled example。
:::

:::note[with title]
This is a normal paragraph body。
:::

:::tip[Tip]
Can contain inline code `npm run dev`、emphasize text and [Link](https://astro.build)。
:::

:::info[Info]
```ts
const hello = 'world';
```
:::

:::warning[Warning]
> Can also contain quoted blocks。
>
> You can also change it to multiple paragraphs of content。
:::

The basic syntax is as follows：

~~~text
:::type[Optional title]
Text content
:::
~~~

Only supports `note / tip / info / warning`；Unsupported type（如 `:::foo[...]`）Currently it will be downgraded to `note`。

## list

### unordered list

- first item
- Second item
  - Nested items A
  - Nested items B
- The third item

### ordered list

1. Preparation
2. Install dependencies
3. Run the project
   1. development mode
   2. Production build

### task list

- [x] Complete design draft
- [x] Development homepage
- [ ] Write documentation
- [ ] Publish online

## code block

The following code block is used to display the toolbar（language/Number of lines/copy button）with line number（Enabled by default）。

### JavaScript

```javascript
// a simple Astro Component example
const greeting = 'Hello, World!';

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
```

### Python

```python
def quick_sort(arr):
    """Quick sort algorithm implementation"""
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)

# Usage example
numbers = [3, 6, 8, 10, 1, 2, 1]
print(quick_sort(numbers))
```

### CSS

```css
.card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}
```

### Shell

```bash
# Install dependencies and start the development server
npm install
npm run dev

# Build production version
npm run build
```

## sheet

| Function | state | illustrate |
|:----:|:----:|:----:|
| Responsive layout | ✅ | Perfectly adapted to mobile devices |
| dark mode | 🚧 | Under development |
| RSS subscription | ✅ | Support many Feed |
| internationalization | ❌ | in plan |

## Links and pictures

this is a [external links](https://astro.build)，will open in a new tab。

### Figure / Caption

**Case A：img + figcaption**

<figure class="figure">
  <img src="/images/archive/demo-archive-01.webp" alt="Example images of legends 1" />
  <figcaption class="figure-caption">Legend example：This is the caption for the image。</figcaption>
</figure>

**Case B：无 figcaption**

<figure class="figure">
  <img src="/images/archive/demo-archive-02.webp" alt="Example without legend" />
</figure>

**Case C：picture + figcaption（Optional）**

<figure class="figure">
  <picture>
    <source srcset="/images/archive/demo-archive-03.webp" type="image/webp" />
    <img src="/images/archive/demo-archive-02.webp" alt="Example images of legends 2" />
  </picture>
  <figcaption class="figure-caption">Legend example：picture Description of。</figcaption>
</figure>

> illustrate：under current style `img` 与 `picture` Visual consistency。`picture` Mainly used to prepare multiple images for the same picture“Alternate version”，The browser will automatically select the most appropriate one（Such as mobile phone thumbnail、Computer big picture，or give priority to WebP/AVIF）。When automatic version selection is not required，用 `img` Just fine。

### Gallery

**Case：Two pictures layout（With optional figcaption）**

<ul class="gallery">
  <li>
    <figure>
      <img src="/images/archive/demo-archive-01.webp" alt="Gallery example 1" />
      <figcaption>First legend（Optional）</figcaption>
    </figure>
  </li>
  <li>
    <figure>
      <img src="/images/archive/demo-archive-02.webp" alt="Gallery example 2" />
      <figcaption>Second illustration（Optional）</figcaption>
    </figure>
  </li>
</ul>

## dividing line

Above is some content。

---

Below is some more content。

## Math and special characters

Commonly used mathematical symbols：π ≈ 3.14159，e ≈ 2.71828

special characters：© 2026 · ™ · ® · € · £ · ¥ · → · ← · ↑ · ↓

## English paragraph

> The best way to predict the future is to invent it. — Alan Kay

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

## Mixed typography

This is a paragraph containing **Bold**、*italics*、`code` 和 [Link](/) mixed typesetting text。You can freely combine these elements within a paragraph，Create a rich reading experience。

---

The above is all supported by this theme Markdown Format。If you notice any rendering issues，Submissions are welcome Issue！
