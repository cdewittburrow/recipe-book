# How to Import Your Google Drive Recipes

No Google Cloud. No OAuth. No credentials file. Just download your docs and run one command.

---

## Step 1 — Download your recipe docs from Google Drive

1. Go to **drive.google.com** and open your recipe folder
2. Press **Cmd+A** to select all the docs
3. Right-click → **Download**
4. Google will zip them up and download a `.zip` file — let it finish
5. Double-click the zip to unzip it — you'll get a folder of `.docx` files

---

## Step 2 — Put the files in the right place

Move all those `.docx` files into this folder on your computer:

```
recipe-book/import/recipes/
```

(If the `recipes` folder doesn't exist yet, just create it — or run the script once and it'll create it automatically and tell you where to put the files.)

---

## Step 3 — Install & run

Open **Terminal** and run these two commands:

```bash
cd ~/Projects/recipe-book/import
npm install
```

Then run the import (replace `your_key_here` with your actual Gemini API key):

```bash
GEMINI_API_KEY=your_key_here node import.js
```

The script will print each recipe as it processes it. Takes about 30 seconds for 15 recipes.

---

## Step 4 — Done

Open your recipe book: **https://cdewittburrow.github.io/recipe-book/**

---

## Something went wrong?

**A recipe failed** → The `.docx` is probably formatted in a weird way. Just add that one manually in the app — takes 2 minutes.

**"No files found"** → Make sure the files are `.docx` or `.txt` and are directly inside the `recipes/` folder (not in a sub-folder inside it).
