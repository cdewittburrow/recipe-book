#!/usr/bin/env node
/**
 * Recipe Book — One-time Google Drive import
 *
 * Reads every Google Doc in a Drive folder, parses each one with
 * Gemini, and inserts the result into Supabase.
 *
 * Usage (after following INSTRUCTIONS.md):
 *   GEMINI_API_KEY=your_key FOLDER_ID=your_folder_id node import.js
 */

const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── CONFIG ────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zbyhtcsccjvmhvswlzbg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpieWh0Y3NjY2p2bWh2c3dsemJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTA0MzksImV4cCI6MjA5MDU2NjQzOX0.QxnLcNfeOkbf-vp1utN_461vhq3693Bzngn4av-Aemo';
const CREDENTIALS_FILE = path.join(__dirname, 'credentials.json');
const TOKEN_FILE = path.join(__dirname, 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
// ─────────────────────────────────────────────────────────────

// Check required env vars
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FOLDER_ID = process.env.FOLDER_ID;

if (!GEMINI_API_KEY) {
  console.error('\n❌  Missing GEMINI_API_KEY');
  console.error('    See INSTRUCTIONS.md for how to get one.\n');
  process.exit(1);
}
if (!FOLDER_ID) {
  console.error('\n❌  Missing FOLDER_ID');
  console.error('    See INSTRUCTIONS.md for how to find it.\n');
  process.exit(1);
}
if (!fs.existsSync(CREDENTIALS_FILE)) {
  console.error('\n❌  credentials.json not found in this folder');
  console.error('    See INSTRUCTIONS.md Step 2.\n');
  process.exit(1);
}

// ── SUPABASE HELPERS ──────────────────────────────────────────
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

// ── GOOGLE AUTH ───────────────────────────────────────────────
async function getAuthClient() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE));
  const { client_id, client_secret } = creds.installed || creds.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3333/callback');

  // Reuse saved token if we have one
  if (fs.existsSync(TOKEN_FILE)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_FILE)));
    return oAuth2Client;
  }

  // First run: open browser, get token
  const token = await runOAuthFlow(oAuth2Client);
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(token));
  return oAuth2Client;
}

function runOAuthFlow(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });

    console.log('\n🔐 Opening your browser to sign in with Google…');
    console.log('   (If the browser doesn\'t open automatically, copy this URL and paste it in Chrome/Safari:)');
    console.log(`\n   ${authUrl}\n`);

    try { execSync(`open "${authUrl}"`); } catch (_) {
      try { execSync(`xdg-open "${authUrl}"`); } catch (_) {}
    }

    // Catch Google's redirect on localhost:3333
    const server = http.createServer(async (req, res) => {
      const code = new URL(req.url, 'http://localhost:3333').searchParams.get('code');
      if (!code) { res.end('No code.'); return; }
      res.end('<html><body style="font-family:sans-serif;padding:40px"><h2>✅ All done! Close this tab and go back to your terminal.</h2></body></html>');
      server.close();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        resolve(tokens);
      } catch (e) { reject(e); }
    });

    server.listen(3333, () => console.log('   Waiting for you to sign in…'));
    server.on('error', reject);
  });
}

// ── GEMINI PARSER ─────────────────────────────────────────────
const gemini = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function parseRecipeText(text, docTitle) {
  const prompt = `You are a recipe parser. Convert the recipe text below into a JSON object. Return ONLY the JSON — no explanation, no markdown code fences.

JSON structure:
{
  "title": "Recipe name (use document title if unclear)",
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
- unit: "cup", "tbsp", "tsp", "g", "oz", "lb", "whole", "clove", etc. or null
- prep_note: things like "diced", "room temperature", "roughly chopped" — or null
- base_servings: integer, default to 4 if not mentioned
- times: integers in minutes, or null if not mentioned
- tags: 2–5 lowercase tags describing cuisine, protein, meal type, or technique

Document title: ${docTitle}

Recipe text:
${text.slice(0, 8000)}`;

  const result = await geminiModel.generateContent(prompt);
  const raw = result.response.text().trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Gemini returned something that isn't valid JSON:\n${raw.slice(0, 300)}`);
  }
}

// ── SUPABASE INSERT ───────────────────────────────────────────
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
  const steps = (parsed.steps || []).filter(s => (typeof s === 'string' ? s : s.content)?.trim());

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
          content: (typeof s === 'string' ? s : s.content).trim(),
        })))
      : Promise.resolve(),
  ]);

  return recipe;
}

// ── MAIN ──────────────────────────────────────────────────────
async function main() {
  console.log('\n🍳  Recipe Book — Google Drive Import');
  console.log('────────────────────────────────────\n');

  // Step 1: Auth
  console.log('Step 1/4  Connecting to Google Drive…');
  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });
  console.log('          ✅ Connected\n');

  // Step 2: List docs
  console.log(`Step 2/4  Finding Google Docs in your folder…`);
  const listRes = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 100,
  });
  const docs = listRes.data.files || [];

  if (docs.length === 0) {
    console.log('          ⚠️  No Google Docs found. Double-check your FOLDER_ID.\n');
    return;
  }
  console.log(`          Found ${docs.length} doc${docs.length !== 1 ? 's' : ''}:`);
  docs.forEach(d => console.log(`          • ${d.name}`));
  console.log();

  // Step 3: Parse + insert each
  console.log('Step 3/4  Parsing and importing…\n');
  const ok = [], failed = [];

  for (const doc of docs) {
    process.stdout.write(`          ⏳  ${doc.name}… `);
    try {
      // Export doc as plain text
      const exportRes = await drive.files.export({ fileId: doc.id, mimeType: 'text/plain' });

      // Parse with Gemini
      const parsed = await parseRecipeText(exportRes.data, doc.name);

      // Save to Supabase
      const recipe = await insertRecipe(parsed);

      console.log(`✅  saved as "${recipe.title}"`);
      ok.push(recipe.title);
    } catch (e) {
      console.log(`❌  ${e.message}`);
      failed.push({ doc: doc.name, error: e.message });
    }

    // Pause briefly between docs so we don't hit Gemini rate limits
    await new Promise(r => setTimeout(r, 600));
  }

  // Step 4: Summary
  console.log('\nStep 4/4  Done!\n');
  console.log(`          ✅  Imported: ${ok.length}`);
  if (failed.length) {
    console.log(`          ❌  Failed:   ${failed.length}`);
    failed.forEach(f => console.log(`               • ${f.doc}\n                 ${f.error}`));
  }
  console.log('\n          Open your recipe book:');
  console.log('          https://cdewittburrow.github.io/recipe-book/\n');
}

main().catch(e => {
  console.error(`\n💥  Fatal error: ${e.message}\n`);
  process.exit(1);
});
