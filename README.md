# Personal Recipe Library

**Live app:** https://recipe-book.vercel.app

A personal recipe library built around one insight: every other recipe app is designed around discovery, not ownership. Your recipes are second-class citizens in those apps. This inverts that entirely — your archive is the product, and everything else serves it.

---

## Stack

- **Frontend:** Single-file HTML, vanilla JS — no build step, no framework
- **Backend:** Supabase (Postgres) — project `zbyhtcsccjvmhvswlzbg`
- **Hosting:** Vercel — auto-deploys on push to `main` (repo: `cdewittburrow/recipe-book`)
- **Form factor:** Mobile-first PWA, designed for use in the kitchen
- **Note:** Supabase anon key is currently hardcoded in `index.html`. Moving it server-side via a Vercel proxy function is specced in [`docs/supabase-proxy.md`](docs/supabase-proxy.md) and slated for v2.

---

## Features (v1)

- **Recipe library** — search, filter by tag, sort by date/alpha/recently cooked
- **Recipe detail** — full view with ingredients, steps, tags, metadata
- **Manual entry form** — add and edit recipes with structured ingredient/step editors
- **Cook mode** — fullscreen, dark UI, live serving scaling, Wake Lock (screen stays on)
- **Annotations** — timestamped personal notes layered on top of any recipe, persisted separately from the recipe content
- **Shopping list** — tap-to-check ingredient list generated from any recipe, with copy to clipboard
- **Export** — print/PDF (with annotations), JSON, plain text

---

## Product Requirements Document

### What This Is

A personal recipe library that treats recipes as living documents. Not a catalog to browse, not a social platform, not a meal planner with a recipe section bolted on. Just your food, the way you actually make it, optimized for one person standing at a stove.

### What This Is Not (v1 Scope)

- No multi-user access or in-app sharing
- No social features, ratings, or comments
- No meal planning or calendar integration (architected to not block it later)
- No grocery list aggregation across multiple recipes (v2)
- No printed book layout tooling
- No discovery feed or external recipe database
- No AI-powered import (v1 — see Roadmap)

### Core Jobs To Be Done

**1. Own Your Archive**
Recipes live in one place. v1 supports manual entry. Initial archive import was done via a one-time script (see `import/`).

**2. Cook Mode That Doesn't Get In the Way**
You use recipes as a loose guide, not a script. Cook mode shows the full picture fast.
- Screen stays awake (Wake Lock API)
- Live ingredient scaling by serving size
- Large, readable type; high contrast; no UI chrome competing for attention
- Full recipe visible — not step-by-step wizard

**3. Recipes That Evolve**
Annotations are first-class — not a notes field at the bottom, but a layer on top of the recipe that persists and travels with it. Examples: "I use 2 tbsp not 1," "skip the cream," "made this for Thanksgiving 2024."

**4. Get Your Recipes Out**
Export is how sharing works. No in-app sharing complexity, no permissions model.

### Data Model

**`recipes`** — title, description, source_url, source_type (`url` | `google_doc` | `manual` | `chat`), base_servings, tags (text[]), cook_time_minutes, prep_time_minutes, last_cooked_at, created_at, updated_at

**`ingredients`** — recipe_id, sort_order, quantity (numeric), unit, name, prep_note

**`steps`** — recipe_id, sort_order, content

**`annotations`** — recipe_id, content, created_at

**`import_log`** — recipe_id, source_type, source_raw, imported_at

### Technical Notes

- **Wake Lock API** for screen-always-on in cook mode. Graceful fallback if unsupported.
- **Scaling math** is client-side: `(quantity / base_servings) * current_servings`. Displays as clean fractions (½, ¼, ⅓) where possible.
- **PDF export** via print stylesheet — separate CSS context from the app UI.
- **Meal planning hook:** `last_cooked_at` and tags leave a clean path to add a planning layer later without schema changes.

### Open Questions (Deferred)

1. **Cook mode layout** — single scroll vs. split view vs. pinned ingredients. Prototype with actual use.
2. **Fraction display** — how to handle quantities that don't reduce to clean fractions after scaling (e.g. 1.33 cups).
3. **Tag taxonomy** — freeform tags vs. a suggested set. Starting freeform, see what emerges.

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| Mar 2026 | No multi-user; export is sharing | Keeps the app simple. Export-to-PDF covers every real sharing scenario. |
| Mar 2026 | Annotations as first-class feature | Core insight: recipes should evolve. A note field bolted on is not enough. |
| Mar 2026 | Skip ratings in v1 | Solo app — rating your own recipes has no utility without context over time. |
| Mar 2026 | Meal planning explicitly not v1 | Would rather leave a clean hook than half-build a calendar feature. |
| Mar 2026 | Live scaling in cook mode only | Setting a base serving at recipe level + scaling live in cook keeps the model clean. |
| Mar 2026 | Cook mode layout deferred to prototyping | Can't make a good layout decision without testing it with flour on your hands. |
| Mar 2026 | Drop AI-powered import from v1 entirely | Original PRD called for Claude-powered import. Dropped because: (1) didn't want to pay for an API account, (2) the real need was a one-time bulk import of ~30 existing Google Docs, not ongoing AI parsing. |
| Mar 2026 | Initial import via one-time script + Claude Code, not in-app | 30 recipes from Google Drive were a one-time migration problem, not a recurring UX problem. Used Gemini free tier (20 req/day limit hit) + manual Claude Code parsing for the remainder. Script lives in `import/`. |
| Mar 2026 | No Google Drive API integration for import | Attempted OAuth/Cloud Console setup was too friction-heavy for a one-time task. Switched to: download .docx files from Drive, run local script with mammoth for text extraction. |
| Mar 2026 | Gemini `2.5-flash` for import parsing (free tier) | `gemini-1.5-flash` was deprecated; `gemini-2.0-flash` has a $0 quota limit. `gemini-2.5-flash` confirmed working on free tier at 20 req/day. |
| Mar 2026 | Supabase RLS with open anon policies | Single-user personal tool with no auth. RLS enabled to keep the pattern correct, but policies allow full anon access. Revisit if the app ever becomes multi-user. |
| Apr 2026 | Migrate hosting from GitHub Pages to Vercel | No build step required; automatic deploys on push to `main`; better platform fit for future functions work (API proxy, AI ingestion). GitHub Pages disabled. |
| Apr 2026 | Defer Supabase key proxy to v2 | Key is anon-level and already public in git history — moving it server-side is the right call but not urgent. Full spec in [`docs/supabase-proxy.md`](docs/supabase-proxy.md). Rotate the key in Supabase after implementing. |

---

## Roadmap

### v2

| Feature | Notes |
|---|---|
| **Supabase key proxy** | Move anon key out of client HTML into a Vercel serverless function. Key lives in Vercel env vars; browser never sees it. Rotate the Supabase key after deploying (old key is in git history). Full spec: [`docs/supabase-proxy.md`](docs/supabase-proxy.md). |
| **AI-driven recipe ingestion** | Add a paste-text import flow in the app. User pastes a URL or raw text; an AI API parses it into the recipe schema and presents a structured preview to confirm before saving. Leading candidate: run it through a Claude Code session rather than embedding an API key in the client (consistent with how the initial import was done). Alternatively, a small Supabase Edge Function could proxy the API call to keep the key server-side. |
| Multi-recipe shopping list | Aggregate ingredients across multiple recipes for a meal. Needs smart consolidation (e.g. "1 onion" + "½ cup diced onion" → one line item). |
| Make-again / ratings | Useful once there's enough cook history to provide context. `last_cooked_at` already tracked. |
| Bulk Google Docs import utility | If the archive grows beyond 30 recipes, build a proper CLI that iterates a Drive folder. The `import/` script is the foundation. |

### v3

| Feature | Notes |
|---|---|
| Meal planning / calendar | Meaningful UX investment. `last_cooked_at` and tags leave a clean hook. Don't half-build it. |
| Printed book layout | Export gives the raw material. Book design is a separate creative project. |

### Never (by design)

| Feature | Reason |
|---|---|
| Multi-user / in-app sharing | Export covers the sharing need cleanly. Complexity not worth it. |
| Social features, ratings, comments | This is a personal tool. |
| External recipe discovery | Your archive is the product. |

---

## Import

The `import/` directory contains the one-time migration script used to import ~30 recipes from Google Drive.

```
import/
  import.js          # reads .docx/.txt files from import/recipes/, parses with Gemini, inserts to Supabase
  insert_remaining.js # manually parsed fallback for recipes that hit Gemini's 20 req/day free limit
  package.json
  INSTRUCTIONS.md
```

To run a future import:
```bash
cd import
npm install
# drop .docx files into import/recipes/
GEMINI_API_KEY=your_key node import.js
```
