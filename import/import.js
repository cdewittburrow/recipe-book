#!/usr/bin/env node
/**
 * Recipe Book — One-time local file import
 *
 * Reads .docx or .txt recipe files from the ./recipes folder,
 * parses each with Gemini, and inserts into Supabase.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node import.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

// ── CONFIG ────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zbyhtcsccjvmhvswlzbg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpieWh0Y3NjY2p2bWh2c3dsemJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTA0MzksImV4cCI6MjA5MDU2NjQzOX0.QxnLcNfeOkbf-vp1utN_461vhq3693Bzngn4av-Aemo';
const RECIPES_DIR = path.join(__dirname, 'recipes');
// ─────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('\n❌  Set your Gemini API key first:');
  console.error('    GEMINI_API_KEY=your_key node import.js\n');
  process.exit(1);
}

if (!fs.existsSync(RECIPES_DIR)) {
  fs.mkdirSync(RECIPES_DIR);
  console.error(`\n❌  No recipes folder found — I just created it for you.`);
  console.error(`    Put your .docx or .txt recipe files in:\n    ${RECIPES_DIR}\n`);
  process.exit(1);
}

// ── SUPABASE ──────────────────────────────────────────────────
async function supabaseInsert(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── FILE READING ──────────────────────────────────────────────
async function readFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8');
  }
  throw new Error(`Unsupported file type: ${ext} (use .docx or .txt)`);
}

// ── GEMINI PARSER ─────────────────────────────────────────────
const gemini = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function parseRecipe(text, filename) {
  const prompt = `You are a recipe parser. Convert the recipe text below into a JSON object. Return ONLY the JSON — no explanation, no markdown code fences.

JSON structure:
{
  "title": "Recipe name",
  "description": "1-2 sentence description, or null",
  "base_servings": 4,
  "prep_time_minutes": null,
  "cook_time_minutes": null,
  "tags": ["lowercase", "tags"],
  "ingredients": [
    { "quantity": 2, "unit": "cups", "name": "flour", "prep_note": null }
  ],
  "steps": [
    "Full text of step one.",
    "Full text of step two."
  ]
}

Field rules:
- quantity: a number (1, 0.5, 2.5) or null if no amount given
- unit: "cup", "tbsp", "tsp", "g", "oz", "lb", "whole", "clove", etc. — or null
- prep_note: things like "diced", "room temperature", "roughly chopped" — or null
- base_servings: integer, default 4 if not mentioned
- times: integers in minutes, or null
- tags: 2–5 lowercase tags (cuisine type, main protein, meal type, technique)
- Use the filename as a hint for the recipe title if the text is unclear

Filename: ${filename}

Recipe text:
${text.slice(0, 8000)}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Gemini returned invalid JSON:\n${raw.slice(0, 300)}`);
  }
}

// ── INSERT INTO SUPABASE ──────────────────────────────────────
async function insertRecipe(parsed) {
  const [recipe] = await supabaseInsert('recipes', {
    title: parsed.title,
    description: parsed.description || null,
    base_servings: parsed.base_servings || 4,
    prep_time_minutes: parsed.prep_time_minutes || null,
    cook_time_minutes: parsed.cook_time_minutes || null,
    source_type: 'google_doc',
    tags: parsed.tags || [],
  });

  const ingredients = (parsed.ingredients || []).filter(i => i.name?.trim());
  const steps = (parsed.steps || []).filter(s => String(s).trim());

  await Promise.all([
    ingredients.length
      ? supabaseInsert('ingredients', ingredients.map((ing, i) => ({
          recipe_id: recipe.id,
          sort_order: i,
          quantity: ing.quantity ?? null,
          unit: ing.unit || null,
          name: ing.name.trim(),
          prep_note: ing.prep_note || null,
        })))
      : Promise.resolve(),
    steps.length
      ? supabaseInsert('steps', steps.map((s, i) => ({
          recipe_id: recipe.id,
          sort_order: i,
          content: String(s).trim(),
        })))
      : Promise.resolve(),
  ]);

  return recipe;
}

// ── MAIN ──────────────────────────────────────────────────────
async function main() {
  console.log('\n🍳  Recipe Book — Import\n');

  const files = fs.readdirSync(RECIPES_DIR)
    .filter(f => ['.docx', '.txt'].includes(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.error(`❌  No .docx or .txt files found in:\n    ${RECIPES_DIR}\n`);
    console.error('    Download your Google Docs as described in INSTRUCTIONS.md\n');
    process.exit(1);
  }

  console.log(`Found ${files.length} file${files.length !== 1 ? 's' : ''}:`);
  files.forEach(f => console.log(`  • ${f}`));
  console.log();

  const ok = [], failed = [];

  for (const file of files) {
    process.stdout.write(`⏳  ${file}… `);
    try {
      const text = await readFile(path.join(RECIPES_DIR, file));
      const parsed = await parseRecipe(text, file);
      const recipe = await insertRecipe(parsed);
      console.log(`✅  "${recipe.title}"`);
      ok.push(recipe.title);
    } catch (e) {
      console.log(`❌  ${e.message}`);
      failed.push({ file, error: e.message });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n✅  Imported: ${ok.length}`);
  if (failed.length) {
    console.log(`❌  Failed:   ${failed.length}`);
    failed.forEach(f => console.log(`    • ${f.file}: ${f.error}`));
  }
  console.log('\nOpen your recipe book:');
  console.log('https://cdewittburrow.github.io/recipe-book/\n');
}

main().catch(e => {
  console.error(`\n💥  ${e.message}\n`);
  process.exit(1);
});
