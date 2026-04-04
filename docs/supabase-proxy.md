# Supabase Key Proxy — Implementation Spec

## Context

The Supabase anon key is currently hardcoded in `index.html` (lines 1034–1035) and committed to the public GitHub repo. Industry best practice is that secrets never touch the client. This spec describes how to move the key server-side using a single Vercel serverless function.

**Status:** Deferred. The current setup is acceptable for a personal single-user app (the anon key is public by Supabase design, and RLS controls access), but this is the right next step for hygiene.

---

## What Changes

### 1. Create `/api/proxy.js`

A single Vercel serverless function that forwards all Supabase REST requests from the browser. The Supabase key lives in Vercel env vars and never reaches the client.

```js
export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  const { path } = req.query;

  if (!path) return res.status(400).json({ error: 'Missing path' });

  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const prefer = req.headers['prefer'] || '';

  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(prefer && { 'Prefer': prefer }),
    },
    body: ['POST', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
  });

  const text = await upstream.text();
  res.status(upstream.status)
    .setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    .send(text);
}
```

### 2. Update `index.html` — remove keys, update `api.req()`

**Remove** these two constants (lines 1034–1035):
```js
const SUPABASE_URL = 'https://zbyhtcsccjvmhvswlzbg.supabase.co';
const SUPABASE_KEY = 'eyJ...';
```

**Replace** `api.req()` (currently lines 1041–1058) with:
```js
async req(path, opts = {}) {
  const prefer = opts.prefer ?? 'return=representation';
  const res = await fetch(`/api/proxy?path=${encodeURIComponent(path)}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(prefer && { 'Prefer': prefer }),
    },
    body: opts.body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
},
```

No other changes needed — `api.get()`, `api.post()`, `api.patch()`, `api.delete()` all call through `api.req()` and are unaffected.

---

## Vercel Environment Variables

Add via the Vercel dashboard (Project → Settings → Environment Variables) or CLI:

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
```

Set both on **Production**, **Preview**, and **Development**.

Values:
- `SUPABASE_URL`: `https://zbyhtcsccjvmhvswlzbg.supabase.co`
- `SUPABASE_KEY`: the anon key (get from Supabase dashboard → Project Settings → API)

---

## After Deploying

**Rotate the Supabase anon key.** The old key is in the public git history and should be considered compromised once you've moved to the proxy. To rotate:

1. Supabase dashboard → Project Settings → API → "Reset anon key"
2. Copy the new key
3. Update the `SUPABASE_KEY` env var in Vercel
4. Redeploy

The old key in git history becomes useless after rotation.

---

## Verification

- Open app → recipes load (GET proxy works)
- Create a recipe → saves (POST proxy works)
- Edit a recipe → updates (PATCH proxy works)
- Delete a recipe → removes (DELETE proxy works)
- DevTools → Network tab → confirm all data requests go to `/api/proxy`, none to `supabase.co`
- View source → confirm no `SUPABASE_KEY` string in page HTML
