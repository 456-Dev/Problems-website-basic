# 📍 Location Data Setup Guide

## Overview

To ensure accurate location data for each episode, you can create a "Recording Date and Location" sheet in your Google Sheets database. The sync script will pull location data from this sheet when populating the "Asked Questions" database.

## 🔧 Setup Instructions

### Step 1: Create the "Recording Date and Location" Sheet

In your **"QTD - Community Database"** Google Sheet:

1. Create a new sheet (tab) at the bottom
2. Name it exactly: **"Recording Date and Location"**

### Step 2: Add Column Headers

In row 1, add these headers:

| A | B | C |
|---|---|---|
| **Episode Number** | **Date** | **Video Location** |

### Step 3: Populate the Sheet

Add your episode data with location information:

| Episode Number | Date | Video Location |
|----------------|------|----------------|
| 1 | Nov 1st, 2024 | Times Square, Manhattan |
| 2 | Nov 2nd, 2024 | Union Square, Manhattan |
| 3 | Nov 3rd, 2024 | Washington Heights |
| 4 | Nov 4th, 2024 | Central Park |
| 5 | Nov 5th, 2024 | Financial District |

**Important Notes:**
- Column A (Episode Number) must be a number (1, 2, 3, etc.)
- Column B (Date) is optional but useful for your records
- Column C (Video Location) is what gets pulled into the "Asked Questions" sheet

## 🔄 How Location Data Works

The sync script pulls location data in this priority order:

1. **Google Sheets "Recording Date and Location"** ← Primary source (most reliable)
2. **YouTube recordingDetails** ← Rarely available (iOS only)
3. **Video Description** ← Looks for "Location: Manhattan, NYC"
4. **Default** ← Falls back to "New York, USA"

## 🎯 Example Workflow

### Option 1: Pre-populate the Location Sheet

1. Create the "Recording Date and Location" sheet
2. Add all your episode locations manually
3. Run `npm run sync-episodes`
4. All locations will be accurate!

### Option 2: Let Script Fill Defaults, Then Edit

1. Run `npm run sync-episodes` without location sheet
2. Script fills "New York, USA" as default
3. Later, create "Recording Date and Location" sheet
4. Add specific locations
5. Run `npm run sync-episodes` again to update

## 📊 Complete Google Sheets Structure

Your final spreadsheet should have **5 sheets**:

```
QTD - Community Database
├── Sheet 1: Suggested Questions
│   └── Columns: ID, Question, Votes, Timestamp
├── Sheet 2: Analytics
│   └── Cell B1: Total view count
├── Sheet 3: Visitors
│   └── Columns: Timestamp, User Agent, Screen Size, Timezone, Language, Referrer
├── Sheet 4: Asked Questions
│   └── Columns: Episode Number, Question, Date, Video URL, Location
└── Sheet 5: Recording Date and Location (NEW!)
    └── Columns: Episode Number, Date, Video Location
```

## 🚀 Running the Sync with Locations

```bash
# Make sure you have the latest dependencies
npm install

# Run the sync script
npm run sync-episodes
```

### What You'll See:

```
📍 Fetching location data from Google Sheets...
✅ Found 175 location entries

🎬 Fetching all QTD videos from YouTube...
✅ Found 175 videos

📊 Parsing episode data...
  📍 Episode 1: Using Google Sheets location: Times Square, Manhattan
  📍 Episode 2: Using Google Sheets location: Union Square, Manhattan
✅ Parsed 175 episodes with episode numbers

📤 Uploading to Google Sheets...
✅ Sync complete!

Summary:
- Total videos found: 175
- Episodes with numbers: 175
- Episode range: #1 to #175
- Episodes with locations: 175
```

## ⚠️ Troubleshooting

### "Recording Date and Location sheet not found"

This is just a warning, not an error! The script will continue and use fallback methods:
1. YouTube recording details
2. Video descriptions
3. Default to "New York, USA"

**To fix:** Create the sheet with the exact name "Recording Date and Location"

### Location data not updating?

Make sure:
1. Sheet name is exactly "Recording Date and Location" (case-sensitive)
2. Column headers are in row 1
3. Episode numbers in column A match your videos
4. Video Location is in column C (not B)
5. You've redeployed the Google Apps Script with the updated code

### How to update the Apps Script?

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Replace all code with the content from `scripts/google-apps-script.js`
4. Click **Save**
5. Click **Deploy** → **Manage deployments**
6. Click the edit icon (pencil) on your existing deployment
7. Change **Version** to "New version"
8. Click **Deploy**

## 💡 Pro Tips

### Tip 1: Bulk Location Updates

If you have many episodes in the same location:

1. Fill column C with the same location
2. Use Google Sheets' fill-down feature (Ctrl+D)
3. Update specific episodes that were elsewhere

### Tip 2: Location Consistency

Use consistent naming for better map visualization:
- ✅ "Times Square, Manhattan"
- ✅ "Washington Heights, NYC"
- ✅ "Central Park, New York"
- ❌ "times square" (inconsistent capitalization)
- ❌ "TS" (abbreviations won't map well)

### Tip 3: Automatic Backfill

If you create the location sheet after already syncing:
1. Your "Asked Questions" sheet has default locations
2. Create "Recording Date and Location" sheet
3. Fill it with accurate locations
4. Run `npm run sync-episodes` again
5. Location column will update automatically!

## 📝 Alternative: Video Descriptions

If you don't want to maintain a separate sheet, add locations to your YouTube video descriptions:

```
Question the Day Episode 42

Location: Washington Heights, NYC
Date: Nov 15, 2024
```

The script will parse "Location: ..." from descriptions automatically.

## ✅ Benefits of Using the Location Sheet

1. **Centralized Management** - Edit all locations in one place
2. **Bulk Updates** - Change multiple episodes at once
3. **Historical Data** - Keep track of where each episode was filmed
4. **Independent of YouTube** - Don't need to update video descriptions
5. **Clean Sync** - More reliable than parsing descriptions

---

**Need help?** Make sure your Google Apps Script is updated with the code from `scripts/google-apps-script.js`!
