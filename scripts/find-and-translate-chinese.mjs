#!/usr/bin/env node

/**
 * find-and-translate-chinese.mjs
 * 
 * Scans your Astro theme source files for Chinese text (CJK Unified Ideographs),
 * translates each unique string via google-translate-api-x, and writes two outputs:
 *   1. src/i18n/en.json – a locale JSON file (flat keys grouped by directory)
 *   2. chinese-translations.csv – a full reference table with context lines
 */

import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";
import { translate } from "google-translate-api-x";

// ── Configuration ────────────────────────────────────────────────

const SRC_DIR = path.resolve("src");
const I18N_DIR  = path.join(SRC_DIR, "i18n");
const OUTPUT_CSV = path.join(process.cwd(), "chinese-translations.csv");

// Only scan these extensions (no CSS / images / etc.)
const EXTENSIONS = [".astro", ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".mdx", ".mjs"];

// Regex: contiguous block of CJK characters
const CHINESE_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+/g;

// Skip these files/dirs entirely
const SKIP_BASEREGEX = /^readme/i;

// ── Helpers ──────────────────────────────────────────────────────

function hasChinese(text) {
  return CHINESE_RE.test(text);
}

function extractChineseBlocks(text) {
  const blocks = text.match(CHINESE_RE) || [];
  // Deduplicate within one file, skip single chars (likely noise)
  const seen = new Set();
  const out = [];
  for (const b of blocks) {
    if (b.length >= 2 && !seen.has(b)) {
      seen.add(b);
      out.push(b);
    }
  }
  return out;
}

// ── Scan files ───────────────────────────────────────────────────

async function collectFiles() {
  const all = [];
  for (const ext of EXTENSIONS) {
    // e.g. "*.astro" -> "src/**/*.astro"
    const pattern = path.join("src", "**", `*${ext}`);
    const matches = await glob(pattern, { ignore: ["**/node_modules/**"] });
    all.push(...matches);
  }
  return all;
}

async function scanForChinese(files) {
  /** @type {Array<{ file: string, lineNum: number, chunk: string }>} */
  const entries = [];
  const unique = new Set();

  for (const file of files) {
    const base = path.basename(file).toLowerCase();
    if (SKIP_BASEREGEX.test(base)) continue;        // skip README, etc.

    try {
      const content = fs.readFileSync(file, "utf8");
    } catch {
      continue; // skip unreadable / binary
    }

    if (!hasChinese(content)) continue;

    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const chunks = extractChineseBlocks(lines[i]);
      for (const chunk of chunks) {
        entries.push({ file, lineNum: i + 1, chunk });
        unique.add(chunk);
      }
    }
  }

  return { entries, unique: [...unique] };
}

// ── Translate via Google API ─────────────────────────────────────

async function translateOne(text) {
  try {
    const res = await translate(text, { from: "zh-CN", to: "en" });
    return res.text || text;
  } catch {
    console.error(`   ⚠️  translate failed for "${text}"`);
    return null;
  }
}

async function translateBatch(uniqueTexts) {
  const results = [];
  let ok = 0, fail = 0;

  for (const text of uniqueTexts) {
    // throttle to avoid API abuse
    await new Promise((r) => setTimeout(r, 150));

    const en = await translateOne(text);
    results.push([text, en]);
    if (en) ok++; else fail++;
  }

  return Object.fromEntries(results);
}

// ── Build i18n locale JSON ──────────────────────────────────────

function buildLocaleJSON(entries, translations) {
  /** @type {Record<string, Record<string, string|null>>} */
  const byDir = {};

  for (const entry of entries) {
    const relDir = path.relative(SRC_DIR, path.dirname(entry.file));
    if (!byDir[relDir]) byDir[relDir] = {};
    // last seen line wins (most specific context)
    byDir[relDir][entry.chunk] = translations[entry.chunk];
  }

  return byDir;
}

// ── CSV output ───────────────────────────────────────────────────

function buildCSV(entries, translations) {
  // deduplicate rows
  const seen = new Set();
  const rows = [["Chinese", "English", "File", "Line"]];

  for (const entry of entries) {
    if (seen.has(entry.chunk)) continue;
    seen.add(entry.chunk);
    const en = translations[entry.chunk] || "(translation failed)";
    rows.push([
      `"${entry.chunk}"`,
      `"${en}"`,
      entry.file,
      String(entry.lineNum),
    ]);
  }

  return rows.map((r) => r.join(",")).join("\n");
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log("🔎 Scanning src/ for Chinese text (README excluded)…\n");

  const files = await collectFiles();
  console.log(`   Found ${files.length} source files to check.`);

  const { entries, unique } = await scanForChinese(files);
  console.log(
    `   → ${entries.length} total occurrences\n` +
    `     of ${unique.length} unique Chinese string(s).\n`
  );

  if (unique.length === 0) {
    console.log("   Nothing to translate. Bye! 👋");
    return;
  }

  // Show a quick preview
  console.log("── Preview of strings found ──");
  for (const s of unique.slice(0, 25)) {
    console.log(`   "${s}"`);
  }
  if (unique.length > 25) {
    console.log(`   … and ${unique.length - 25} more\n`);
  }

  // Translate
  console.log("🌐 Translating via Google API… this takes a moment.\n");
  const translations = await translateBatch(unique);

  // Count failures
  let failCount = Object.values(translations).filter((v) => v === null || v === undefined).length;
  if (failCount > 0) {
    console.log(`\n⚠️  ${failCount} translation(s) failed.\n`);
  }

  // Write i18n locale JSON
  const locale = buildLocaleJSON(entries, translations);
  const localePath = path.join(I18N_DIR, "en.json");
  fs.mkdirSync(I18N_DIR, { recursive: true });
  fs.writeFileSync(localePath, JSON.stringify(locale, null, 2));
  console.log(`\n📝 i18n locale file → ${localePath}`);

  // Write CSV
  const csv = buildCSV(entries, translations);
  fs.writeFileSync(OUTPUT_CSV, csv);
  console.log(`📝 CSV reference      → ${OUTPUT_CSV}`);

  // Summary by directory
  const dirCounts = {};
  for (const e of entries) {
    const d = path.relative(SRC_DIR, path.dirname(e.file));
    dirCounts[d] = (dirCounts[d] || 0) + 1;
  }

  console.log("\n── Occurrences by directory ──");
  for (const [d, c] of Object.entries(dirCounts).sort((a, b) => b[1] - a[1])) {
    const uniqueInDir = new Set(entries.filter((e) => path.relative(SRC_DIR, path.dirname(e.file)) === d).map((e) => e.chunk)).size;
    console.log(`   ${d.padEnd(30)}  ${String(c).padStart(4)} occs  (${uniqueInDir} unique)`);
  }

  // How to use the locale file
  console.log("\n── Next steps ──");
  console.log("   1. Open src/i18n/en.json and review the translations.");
  console.log("   2. Fix any bad machine translations manually.");
  console.log("   3. Integrate into your Astro i18n setup (astro.config.mjs)");
  console.log("      using the contents of en.json as your source-of-truth locale.");

  console.log("\n✅ Done!\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
