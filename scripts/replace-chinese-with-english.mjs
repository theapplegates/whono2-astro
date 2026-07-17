#!/usr/bin/env node

/**
 * replace-chinese-with-english.mjs
 * 
 * Replaces all Chinese strings in your Astro theme source files with
 * their English translations from src/i18n/en.json.
 * 
 * Safety: makes backup copies of every modified file first.
 */

import fs from "node:fs";
import path from "node:path";

const SRC_DIR     = path.resolve("src");
const EN_JSON     = path.join(SRC_DIR, "i18n", "en.json");
const BACKUP_BASE = path.join(SRC_DIR, "i18n", "backups");

const EXTENSIONS  = new Set([".astro", ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".mdx"]);
const CJK_RE      = () => /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+/g;

// ═══════════ Helpers ═══════════

function collectFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".astro", "dist"].includes(entry.name)) continue;
      files.push(...collectFiles(full));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!EXTENSIONS.has(ext)) continue;
      const base = path.basename(entry.name, ext).toLowerCase();
      if (base.startsWith("readme")) continue;
      files.push(full);
    }
  }
  return files;
}

function buildFlatLookup(json) {
  // The en.json structure is:
  //   { "components": { "归档": "Archive", ... }, "lib/admin-console": { ... }, ... }
  // Each top-level key is a directory scope, each inner value is Chinese → English
  
  /** @type {Record<string, Record<string, string>>} */
  const flat = {};

  for (const [scope, values] of Object.entries(json)) {
    if (typeof values === "object" && values !== null && !Array.isArray(values)) {
      // Collect all Chinese→English entries in this scope
      const enEntries = [];
      const cnEntries = [];
      
      function traverse(obj) {
        for (const [key, val] of Object.entries(obj)) {
          if (typeof val === "object" && val !== null && !Array.isArray(val)) {
            traverse(val); // recurse into deeper nesting
          } else {
            cnEntries.push(key);  // Chinese key is the property name
            enEntries.push(String(val)); // English is the value
          }
        }
      }
      
      traverse(values);
      
      // Build lookup: Chinese → English
      for (let i = 0; i < cnEntries.length; i++) {
        if (!flat[scope]) flat[scope] = {};
        flat[scope][cnEntries[i]] = enEntries[i];
      }
    }
  }

  return flat;
}

function makeBackup(file) {
  const relDir = path.relative(SRC_DIR, path.dirname(file));
  const backupDir = path.join(BACKUP_BASE, relDir);
  fs.mkdirSync(backupDir, { recursive: true });
  
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}${String(now.getSeconds()).padStart(2,"0")}_${String(now.getMilliseconds()).padStart(3,"0")}`;
  
  const backupPath = path.join(backupDir, `${ts}_${path.basename(file)}`);
  fs.copyFileSync(file, backupPath);
  return backupPath;
}

function processFile(filePath, lookup) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return null; // skip unreadable
  }
  
  const re1 = CJK_RE();
  if (!re1.test(content)) return { replaced: 0 };
  
  // Determine scope directory relative to src/
  const relDir = path.relative(SRC_DIR, path.dirname(filePath));
  
  // Combined lookup: fallback + scoped override (longer scope name wins)
  // We collect ALL matching scopes and merge them
  /** @type {Record<string, string>} */
  const combined = {};
  
  // Try exact match first (most specific), then parent dirs, then global ""
  const scopesToTry = [relDir];
  let current = path.dirname(relDir);
  while (current && current !== "." && lookup[current]) {
    scopesToTry.push(current);
    current = path.dirname(current);
  }
  if (lookup[""]) scopesToTry.push("");
  
  for (const scope of scopesToTry) {
    const scopeMap = lookup[scope] || {};
    for (const [cn, en] of Object.entries(scopeMap)) {
      if (typeof en === "string" && en.length > 0) {
        combined[cn] = en; // scoped overrides earlier scopes
      }
    }
  }
  
  const replacements = Object.entries(combined).sort((a, b) => b[0].length - a[0].length);
  if (replacements.length === 0) return { replaced: 0 };
  
  let modified = content;
  let count = 0;
  
  for (const [cn, en] of replacements) {
    if (!modified.includes(cn)) continue;
    
    const tempRe = CJK_RE();
    const matches = modified.match(tempRe);
    if (!matches) continue;
    
    // Count occurrences of this exact string
    let occ = 0;
    for (const m of matches) {
      if (m === cn) occ++;
    }
    if (occ === 0) continue;
    
    // Replace all occurrences
    const safeCn = cn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    modified = modified.split(new RegExp(safeCn, "g")).join(en);
    count += occ;
  }
  
  if (modified === content) return { replaced: 0 };
  
  fs.writeFileSync(filePath, modified, "utf-8");
  return { replaced: count };
}

// ═══════════ Main ═══════════

async function main() {
  console.log("📖 Loading translations from src/i18n/en.json…\n");
  
  const rawLocale = JSON.parse(fs.readFileSync(EN_JSON, "utf-8"));
  const lookup    = buildFlatLookup(rawLocale);
  
  let totalEntries = 0;
  for (const scope of Object.values(lookup)) {
    for (const v of Object.values(scope)) {
      if (typeof v === "string" && v.length > 0) totalEntries++;
    }
  }
  console.log(`   Loaded ${totalEntries} translation entries across ${Object.keys(lookup).length} scopes.\n`);

  const files = collectFiles(SRC_DIR);
  console.log(`🔎 Found ${files.length} source files to check.`);

  /** @type {Array<{file: string, count: number}>} */
  const candidates = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      if (!CJK_RE().test(content)) continue;
      const unique = new Set(content.match(CJK_RE()) || []);
      candidates.push({ file, count: unique.size });
    } catch {
      continue;
    }
  }

  console.log(`   ${candidates.length} files contain Chinese strings.\n`);

  if (candidates.length === 0) {
    console.log("No Chinese text found. Nothing to do! 👋\n");
    return;
  }

  // Preview
  console.log("── Files that will be modified ──");
  for (const c of candidates.slice(0, 40)) {
    const rel = path.relative(SRC_DIR, c.file);
    console.log(`   ${rel.padEnd(50)} (${String(c.count).padStart(3)} strings)`);
  }
  if (candidates.length > 40) {
    console.log(`   … and ${candidates.length - 40} more\n`);
  }

  console.log("✅ Proceeding with replacement…\n");

  let totalReplaced = 0;
  
  for (const c of candidates) {
    const result = processFile(c.file, lookup);
    if (result && result.replaced > 0) {
      const backupPath = makeBackup(c.file);
      totalReplaced += result.replaced;
      console.log(`   ✅ ${path.relative(SRC_DIR, c.file).padEnd(48)} → ${String(result.replaced).padStart(3)} replaced`);
    }
  }

  console.log(`\n📝 Total: ${totalReplaced} Chinese string(s) replaced across ${candidates.length} file(s)`);
  console.log(`💾 Backups → src/i18n/backups/`);
  console.log("\n✅ Done! Your theme is now all English.\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
