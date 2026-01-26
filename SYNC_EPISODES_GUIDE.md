# 🔄 Auto-Sync Episodes to Google Sheets

## Overview

This script automatically syncs all your YouTube episodes to the Google Sheets "Asked Questions" database, eliminating the need for manual entry!

## ✅ What It Does:

1. **Fetches ALL videos** from your YouTube channel (with QTD in title or ≤3:10 duration)
2. **Parses episode numbers** from titles (#42, Episode 42, etc.)
3. **Extracts questions** by removing episode numbers and cleaning text
4. **Formats dates** from video publish dates
5. **Uploads to Google Sheets** "Asked Questions" sheet
6. **Overwrites existing data** to keep it fresh

## 🚀 How to Run:

### One-Time Setup:

```bash
# Install dependencies (includes tsx for running TypeScript)
npm install
```

### Run the Sync:

```bash
# Make sure you have .env.local set up with your credentials
npm run sync-episodes
```

### What You'll See:

```
🎬 Fetching all QTD videos from YouTube...
✅ Found 175 videos
📊 Parsed 175 episodes with episode numbers
📤 Uploading to Google Sheets...
✅ Sync complete!

Summary:
- Total videos found: 175
- Episodes with numbers: 175
- Episode range: #1 to #175
```

## 📋 Requirements:

Your `.env.local` file must contain:

```
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=@bignosemichael
NEXT_PUBLIC_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_ID/exec
```

## ⏰ When to Run:

Run the sync script:
- ✅ **After uploading new episodes** to YouTube
- ✅ **Before deploying** to ensure latest data
- ✅ **Weekly** to catch any missed episodes
- ✅ **On demand** when you notice missing episodes

## 🔄 Automated Syncing (Optional):

### Option 1: GitHub Action (runs on schedule)

Create `.github/workflows/sync-episodes.yml`:

```yaml
name: Sync Episodes to Google Sheets

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      
      - run: npm run sync-episodes
        env:
          NEXT_PUBLIC_YOUTUBE_API_KEY: ${{ secrets.NEXT_PUBLIC_YOUTUBE_API_KEY }}
          NEXT_PUBLIC_YOUTUBE_CHANNEL_ID: ${{ secrets.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID }}
          NEXT_PUBLIC_GOOGLE_SHEETS_URL: ${{ secrets.GOOGLE_SHEETS_URL }}
```

### Option 2: Local Cron Job

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2am)
0 2 * * * cd /path/to/project && npm run sync-episodes
```

## 📊 What Gets Synced:

For each video, the script extracts:

| Field | Source | Example |
|-------|--------|---------|
| **Episode Number** | Title parsing | 42 |
| **Question** | Title (cleaned) | What's your biggest fear? |
| **Date** | publishedAt | Nov 15th, 2024 |
| **Video URL** | YouTube link | https://youtube.com/shorts/abc123 |

## 🎯 Parsing Logic:

**Episode Number** from:
- `#42` → Episode 42
- `Episode 42` → Episode 42
- `Ep. 42` → Episode 42
- `(42)` → Episode 42

**Question** extracted by removing:
- Episode numbers
- Special characters (|, •, –, -)
- Extra whitespace

## ⚠️ Important Notes:

1. **Overwrites data**: The sync CLEARS and REPLACES the "Asked Questions" sheet
2. **API quota**: Uses YouTube API quota (50 quota per page)
3. **Takes time**: With 175 videos, may take 10-30 seconds
4. **Requires internet**: Must be connected to fetch from YouTube

## 🐛 Troubleshooting:

### "Missing required environment variables"
- Check your `.env.local` file exists
- Verify all 3 variables are set

### "Failed to sync"
- Check your Google Sheets URL is correct
- Ensure Apps Script is deployed as Web App
- Verify Apps Script has `syncEpisodes` function

### "No episodes with numbers found"
- Check your video titles include episode numbers
- Verify videos have "QTD" in title or are ≤3:10 duration

## ✨ Benefits:

- ⏱️ **Saves hours** of manual data entry
- 🎯 **100% accurate** episode matching
- 🔄 **Always up-to-date** with latest videos
- 🚀 **One command** syncs everything
- 📊 **Automatic validation** ensures data quality

---

**Run `npm run sync-episodes` whenever you upload new episodes!** 🎬
