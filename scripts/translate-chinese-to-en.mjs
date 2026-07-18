#!/usr/bin/env node

/**
 * translate-chinese-to-en.mjs
 * 
 * Scans your Astro theme's src/ for Chinese text (CJK Unified Ideographs),
 * translates each unique string to English via Google Translate API,
 * and writes a structured locale JSON file under src/i18n/.
 *
 * Output:
 *   src/i18n/en.json          – flat key-value pairs ready for Astro i18n
 *   src/i18n/chinese-report.csv – full reference with file/line context
 */

import fs from "node:fs";
import path from "node:path";
import { translate } from "google-translate-api-x";

// ═══════════ Configuration ═══════════

const SRC_DIR = path.resolve("src");
const I18N_DIR  = path.join(SRC_DIR, "i18n");
const CSV_OUT   = path.join(I18N_DIR, "chinese-report.csv");
const JSON_LOCALE = path.join(I18N_DIR, "en.json");

// Extensions that hold user-visible strings (no CSS / binary)
const EXTENSIONS = new Set([".astro", ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".mdx"]);

// Regex: contiguous block of CJK Unified Ideographs + Extensions
const CHINESE_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+/g;

// Directories to skip entirely
const SKIP_DIRS = new Set(["node_modules", ".astro", "dist"]);

// ═══════════ Helpers ═══════════

function extractChineseBlocks(text) {
  const blocks = text.match(CHINESE_RE) || [];
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

function collectFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...collectFiles(fullPath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!EXTENSIONS.has(ext)) continue;
      // Skip README* files
      const base = path.basename(entry.name, ext).toLowerCase();
      if (base.startsWith("readme")) continue;
      files.push(fullPath);
    }
  }
  return files;
}

// ═══════════ Translation ═══════════

async function translateOne(text) {
  try {
    const res = await translate(text, { from: "zh-CN", to: "en" });
    // google-translate-api-x v10 returns a string directly (not .text)
    return typeof res === "string" ? res : (res.text || text);
  } catch (err) {
    console.error(`   ⚠️ translate failed for "${text}": ${err.message}`);
    return null;
  }
}

async function translateBatch(texts) {
  const translations = new Map();
  let failCount = 0;

  for (const text of texts) {
    const result = await translateOne(text);
    translations.set(text, result);
    if (!result) failCount++;
    // Throttle to avoid rate-limiting the free endpoint
    await new Promise((r) => setTimeout(r, 150));
  }

  return { translations, failCount };
}

// ═══════════ Output Builders ═══════════

function buildLocaleJSON(entries, translations) {
  /** @type {Record<string, Record<string, string | null>>} */
  const byDir = {};

  for (const entry of entries) {
    const relDir = path.relative(SRC_DIR, path.dirname(entry.file));
    if (!byDir[relDir]) byDir[relDir] = {};
    // last-seen line wins; translation is per-string globally
    byDir[relDir][entry.chunk] = translations.get(entry.chunk);
  }

  return byDir;
}

function buildCSV(entries, translations) {
  const rows = [["Chinese", "English", "File", "Line"]];
  const seen = new Set();

  for (const entry of entries) {
    if (seen.has(entry.chunk)) continue;
    seen.add(entry.chunk);
    const en = translations.get(entry.chunk) || "(translation failed)";
    rows.push([`"${entry.chunk}"`, `"${en}"`, entry.file, String(entry.lineNum)]);
  }

  return rows.map((r) => r.join(",")).join("\n");
}

// ═══════════ Main ═══════════

async function main() {
  console.log("🔎 Scanning src/ for Chinese text (README excluded)…\n");

  // Collect files
  const files = collectFiles(SRC_DIR);
  console.log(`   Found ${files.length} source files.\n`);

  // Scan for Chinese strings
  /** @type {Array<{ file: string, lineNum: number, chunk: string }>} */
  const entries = [];
  const uniqueTexts = new Set();

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, "utf-8");
    } catch {
      continue; // skip unreadable / binary
    }

    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const chunks = extractChineseBlocks(lines[i]);
      for (const chunk of chunks) {
        entries.push({ file, lineNum: i + 1, chunk });
        uniqueTexts.add(chunk);
      }
    }
  }

  if (entries.length === 0) {
    console.log("   No Chinese text found. Bye! 👋");
    return;
  }

  const unique = [...uniqueTexts];
  const fileSet = new Set(entries.map((e) => e.file));

  console.log(`   → ${entries.length} total occurrences`);
  console.log(`     of ${unique.length} unique string(s)`);
  console.log(`     in ${fileSet.size} file(s)\n`);

  // Preview first 25
  console.log("── Preview ──");
  for (const s of unique.slice(0, 25)) {
    console.log(`   "${s}"`);
  }
  if (unique.length > 25) {
    console.log(`     … and ${unique.length - 25} more\n`);
  }

  // Translate
  console.log("🌐 Translating via Google API…");
  const { translations, failCount } = await translateBatch(unique);

  if (failCount > 0) {
    console.log(`\n   ⚠️  ${failCount} translation(s) failed.\n`);
  }

  // Show sample translations
  const success = [...translations.entries()].filter(([, v]) => v !== null);
  console.log("── Sample translations ──");
  for (const [cn, en] of success.slice(0, 20)) {
    console.log(`   "${cn}" → "${en}"`);
  }
  if (success.length > 20) {
    console.log(`     … and ${success.length - 20} more\n`);
  }

  // Build locale JSON structure grouped by directory
  const localeJSON = buildLocaleJSON(entries, translations);
  fs.mkdirSync(I18N_DIR, { recursive: true });
  fs.writeFileSync(JSON_LOCALE, JSON.stringify(localeJSON, null, 2), "utf-8");
  console.log(`\n📝 i18n locale → ${JSON_LOCALE}`);

  // Build CSV report
  const csv = buildCSV(entries, translations);
  fs.writeFileSync(CSV_OUT, csv, "utf-8");
  console.log(`   CSV report    → ${CSV_OUT}`);

  // Summary by directory
  const dirCounts = {};
  for (const e of entries) {
    const d = path.relative(SRC_DIR, path.dirname(e.file));
    dirCounts[d] = (dirCounts[d] || 0) + 1;
  }

  console.log("\n── Occurrences by directory ──");
  for (const [d, c] of Object.entries(dirCounts).sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    const uniqueInDir = new Set(entries.filter((e) => path.relative(SRC_DIR, path.dirname(e.file)) === d).map((e) => e.chunk)).size;
    console.log(`   ${d.padEnd(35)}  ${String(c).padStart(4)} occs  (${uniqueInDir} unique)`);
  }

  console.log("\n── Next steps ──");
  console.log("   1. Open src/i18n/en.json and review the translations.");
  console.log("   2. Fix any bad machine translations manually.");
  console.log("   3. Integrate en.json into your Astro i18n setup (astro.config.mjs).");

  console.log("\n✅ Done!\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
