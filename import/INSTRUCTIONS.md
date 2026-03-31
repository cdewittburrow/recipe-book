# How to Import Your Google Drive Recipes

This script will read all your recipe Google Docs, understand them with AI,
and add them to your recipe book automatically. Follow every step in order.

---

## Before You Start

You need three things:
1. A **Gemini API key** (free, takes 2 minutes)
2. A **Google credentials file** (free, takes 5-10 minutes)
3. Your **Google Drive folder ID** (takes 30 seconds)

---

## Step 1 — Get a Free Gemini API Key

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account
3. Click **"Create API key"**
4. Click **"Create API key in new project"**
5. You'll see a long string of letters and numbers — copy it and save it somewhere (like a sticky note app). It looks like: `AIzaSyAbc123...`

That's it! This is completely free.

---

## Step 2 — Set Up Google Drive Access

This is the most steps but each one is simple.

### 2a — Go to Google Cloud Console

1. Go to **https://console.cloud.google.com**
2. Sign in with your Google account (same one that has your recipes)
3. At the top of the page, click where it says **"Select a project"**
4. Click **"New Project"** in the top-right of the popup
5. Name it `Recipe Import` (or anything you want)
6. Click **"Create"**
7. Wait a few seconds, then make sure your new project is selected at the top

### 2b — Turn On the Google Drive API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. In the search box, type `Google Drive API`
3. Click on **"Google Drive API"** in the results
4. Click the big blue **"Enable"** button
5. Wait for it to enable

### 2c — Set Up the Permission Screen

(Google requires this before you can create credentials)

1. In the left sidebar, click **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** and click **"Create"**
3. Fill in just these fields (everything else leave blank):
   - **App name:** `Recipe Import`
   - **User support email:** your email address
   - **Developer contact information** (at the bottom): your email address
4. Click **"Save and Continue"**
5. On the **Scopes** page — click **"Save and Continue"** (don't add anything)
6. On the **Test users** page — click **"Add Users"**, type your own email address, click **"Add"**, then click **"Save and Continue"**
7. Click **"Back to Dashboard"**

### 2d — Create Credentials

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** at the top
3. Choose **"OAuth client ID"**
4. For **Application type**, choose **"Desktop app"**
5. Name it `Recipe Import` (or anything)
6. Click **"Create"**
7. A popup will appear — click **"Download JSON"**
8. A file will download with a long complicated name — **rename it to `credentials.json`**
9. **Move that file into the `recipe-book/import/` folder** on your computer

---

## Step 3 — Find Your Google Drive Folder ID

1. Go to **https://drive.google.com**
2. Open the folder where you put all your recipe docs
3. Look at the URL in your browser — it looks like:
   `https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`
4. The long string of letters/numbers at the end is your folder ID
   (in the example above: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`)
5. Copy that ID

---

## Step 4 — Install & Run the Script

Open your **Terminal** app (it's in Applications → Utilities → Terminal).

### 4a — Navigate to the import folder

Type this and press Enter:
```
cd ~/Projects/recipe-book/import
```

### 4b — Install dependencies

Type this and press Enter (wait for it to finish):
```
npm install
```

### 4c — Run the script

Type this but **replace the two placeholder values** with your real keys:
```
GEMINI_API_KEY=paste_your_gemini_key_here FOLDER_ID=paste_your_folder_id_here node import.js
```

For example, it would look something like:
```
GEMINI_API_KEY=AIzaSyAbc123xyz FOLDER_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms node import.js
```

### 4d — Sign in to Google

- Your browser will automatically open a Google sign-in page
- Sign in with the Google account that has your recipe docs
- Click **"Allow"** when it asks for permission
- You'll see a green checkmark page — go back to Terminal

The script will then process each recipe one by one. You'll see it print each one as it goes.

---

## When It's Done

Open your recipe book: **https://cdewittburrow.github.io/recipe-book/**

All your recipes should be there! If any failed, the script will tell you which ones and why.

---

## Troubleshooting

**"No Google Docs found"**
→ Double-check your FOLDER_ID. Make sure the docs are directly inside that folder (not in a sub-folder).

**"credentials.json not found"**
→ Make sure you renamed the downloaded file to exactly `credentials.json` and put it in the `recipe-book/import/` folder.

**A specific recipe failed**
→ Re-run the script — it will skip already-imported recipes and only retry the ones that failed. (Actually it will re-import, so if that's a problem just run it once and manually add the failed one in the app.)

**Browser didn't open**
→ The script will print a long URL starting with `https://accounts.google.com` — copy and paste it into your browser manually.
