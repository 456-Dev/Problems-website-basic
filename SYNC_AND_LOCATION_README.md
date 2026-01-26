# 🎯 Auto-Sync Episodes with Location Data - Complete Setup

## ✅ What I've Created for You

I've implemented a complete solution to automatically populate your "Asked Questions" sheet with location data from a "Recording Date and Location" sheet!

### New Files:

1. **`scripts/sync-videos-to-sheets.ts`** - The main sync script that:
   - Fetches all YouTube videos from your channel
   - Extracts episode numbers and questions
   - Pulls location data from Google Sheets "Recording Date and Location"
   - Falls back to YouTube metadata or descriptions if no location sheet
   - Uploads everything to "Asked Questions" with locations

2. **`scripts/google-apps-script.js`** - Updated Google Apps Script with:
   - `getLocationData()` - Fetches location data from "Recording Date and Location" sheet
   - `syncEpisodesWithLocation()` - Syncs episodes with location data
   - All existing functionality (voting, analytics, etc.)

3. **`LOCATION_SETUP_GUIDE.md`** - Complete guide for setting up location data

4. **Updated `package.json`** - Added:
   - `sync-episodes` command
   - `dotenv` dependency for environment variables
   - `tsx` dependency for running TypeScript scripts

5. **Updated `GOOGLE_SHEETS_SETUP.md`** - Now includes:
   - 5th sheet: "Recording Date and Location"
   - Updated Apps Script code
   - Auto-sync instructions

---

## 🚀 Step-by-Step Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `dotenv` (for reading `.env.local`)
- `tsx` (for running TypeScript scripts)

### Step 2: Update Your Google Apps Script

1. Open your Google Sheet: **"QTD - Community Database"**
2. Go to **Extensions** → **Apps Script**
3. **Replace ALL code** with the content from `scripts/google-apps-script.js`
4. Click **Save** (💾 icon)
5. Click **Deploy** → **Manage deployments**
6. Click the **edit icon** (✏️) on your existing deployment
7. Change **Version** to "New version"
8. Add description: "Added location sync support"
9. Click **Deploy**
10. Copy the Web App URL (you already have this as a secret)

### Step 3: Create "Recording Date and Location" Sheet

In your Google Sheet:

1. Click the **+** button at the bottom to add a new sheet
2. Name it exactly: **"Recording Date and Location"**
3. Add these headers in row 1:

| A | B | C |
|---|---|---|
| **Episode Number** | **Date** | **Video Location** |

4. Fill in your episode locations (examples):

| Episode Number | Date | Video Location |
|----------------|------|----------------|
| 1 | Nov 1st, 2024 | Times Square, Manhattan |
| 2 | Nov 2nd, 2024 | Union Square, Manhattan |
| 3 | Nov 3rd, 2024 | Washington Heights |
| 4 | Nov 4th, 2024 | Central Park |
| 5 | Nov 5th, 2024 | Financial District |

**Note:** Column C (Video Location) is what gets used. The sync script looks for this specific column!

### Step 4: Update "Asked Questions" Sheet Header

In your "Asked Questions" sheet:

1. In cell **E1**, add the header: **Location**

Your headers should now be:
| A | B | C | D | E |
|---|---|---|---|---|
| Episode Number | Question | Date | Video URL | Location |

### Step 5: Verify Your `.env.local` File

Make sure your `.env.local` file has all required variables:

```bash
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=@bignosemichael
NEXT_PUBLIC_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Step 6: Run the Sync Script!

```bash
npm run sync-episodes
```

You should see output like:

```
📍 Fetching location data from Google Sheets...
✅ Found 175 location entries

🎬 Fetching all QTD videos from YouTube...
✅ Found 175 videos

📊 Parsing episode data...
  📍 Episode 1: Using Google Sheets location: Times Square, Manhattan
  📍 Episode 2: Using Google Sheets location: Union Square, Manhattan
  📍 Episode 3: Using Google Sheets location: Washington Heights
✅ Parsed 175 episodes with episode numbers

📤 Uploading to Google Sheets...
✅ Synced 175 episodes with location data
✅ Sync complete!

Summary:
- Total videos found: 175
- Episodes with numbers: 175
- Episode range: #1 to #175
- Episodes with locations: 175
```

---

## 🎯 How Location Data Works

The script pulls location data in this **priority order**:

1. **Google Sheets "Recording Date and Location"** ← Your primary source (most reliable!)
2. **YouTube recordingDetails** ← Rarely available (requires iOS recording with location)
3. **Video Description** ← Looks for "Location: Manhattan, NYC" in description
4. **Default Fallback** ← "New York, USA"

---

## 📊 What Gets Synced

For each video, the script extracts and syncs:

| Field | Source | Example |
|-------|--------|---------|
| **Episode Number** | Video title parsing | 42 |
| **Question** | Video title (cleaned) | What's your biggest fear? |
| **Date** | YouTube publishedAt | Nov 15th, 2024 |
| **Video URL** | YouTube Shorts URL | https://youtube.com/shorts/abc123 |
| **Location** | Google Sheets + fallbacks | Times Square, Manhattan |

---

## ⚠️ Troubleshooting

### "Missing required environment variables"
- Check `.env.local` exists in project root
- Verify all 3 variables are set correctly

### "Recording Date and Location sheet not found"
- This is just a warning! The script continues with fallback methods
- To fix: Create the sheet with exact name "Recording Date and Location"
- Make sure it has headers in row 1

### "syncEpisodesWithLocation function not found"
- You need to update your Google Apps Script
- Copy code from `scripts/google-apps-script.js`
- Deploy as "New version"

### Location still shows "New York, USA" for everything?
- Make sure you created "Recording Date and Location" sheet
- Check that column C is named "Video Location"
- Verify episode numbers in column A match your videos
- Rerun the script after adding location data

### npm install hanging?
If npm install seems stuck:
1. Press `Ctrl+C` to cancel
2. Run `npm cache clean --force`
3. Try `npm install` again

---

## 💡 Pro Tips

### Tip 1: Batch Update Locations

If you have many episodes in the same area:
1. Fill one cell with location (e.g., "Times Square, Manhattan")
2. Copy the cell
3. Select a range of cells below
4. Paste (Ctrl+V or Cmd+V)

### Tip 2: Add Locations to Video Descriptions

Alternative to the location sheet, add this to your YouTube video descriptions:

```
Question the Day Episode 42

Location: Washington Heights, NYC
Date: Nov 15, 2024
```

The script will parse "Location: ..." automatically!

### Tip 3: Run After Each Upload

Create a habit after uploading new episodes:

```bash
# Upload new episode to YouTube
# Then run:
npm run sync-episodes
git add .
git commit -m "Synced new episodes"
git push
```

### Tip 4: Schedule Automatic Syncs (Advanced)

You can set up a GitHub Action to run the sync automatically every 6 hours. See `SYNC_EPISODES_GUIDE.md` for details.

---

## 📈 Benefits of This System

✅ **No More Manual Entry** - Fully automated episode database  
✅ **Accurate Locations** - Pull from centralized Google Sheet  
✅ **Always Up-to-Date** - One command syncs everything  
✅ **Flexible Fallbacks** - Uses YouTube or descriptions if no location sheet  
✅ **Duplicate Detection** - Website checks against full episode list  
✅ **Scalable** - Works with hundreds of episodes  

---

## 🎬 What Happens When You Run the Script

1. **Connects to Google Sheets** - Fetches location data from "Recording Date and Location"
2. **Connects to YouTube API** - Gets all your channel's videos
3. **Filters for QTD Episodes** - Looks for videos ≤3:10 or with "QTD" in title
4. **Parses Episode Numbers** - Extracts #42, Episode 42, etc.
5. **Extracts Questions** - Cleans up titles
6. **Matches Locations** - Finds location for each episode number
7. **Formats Everything** - Dates, URLs, etc.
8. **Uploads to "Asked Questions"** - Clears old data, adds new with locations
9. **Done!** - Your database is now complete and accurate

---

## 🔄 Keeping Data Fresh

Run the sync whenever:
- ✅ You upload new episodes
- ✅ You update video titles
- ✅ You add new location data
- ✅ Weekly (to catch any changes)

The script is **idempotent** - safe to run multiple times. It clears and refreshes all data.

---

## 📚 Additional Resources

- **`LOCATION_SETUP_GUIDE.md`** - Detailed location setup instructions
- **`SYNC_EPISODES_GUIDE.md`** - Original sync documentation
- **`GOOGLE_SHEETS_SETUP.md`** - Complete Google Sheets setup
- **`NEW_FEATURES_IMPLEMENTED.md`** - Feature overview

---

## ✨ Summary: What You Need to Do

1. ☐ Run `npm install`
2. ☐ Update Google Apps Script (copy from `scripts/google-apps-script.js`)
3. ☐ Create "Recording Date and Location" sheet in Google Sheets
4. ☐ Add location data for your episodes
5. ☐ Add "Location" header (E1) in "Asked Questions" sheet
6. ☐ Run `npm run sync-episodes`
7. ☐ Check your "Asked Questions" sheet - it should be populated with locations!

**That's it!** Your "Asked Questions" database will now have accurate location data for all episodes.

---

**Questions or issues?** Check the troubleshooting section above or review the detailed guides in the other markdown files.

**The location data issue you mentioned is now fixed!** The sync script will pull from the "Recording Date and Location" sheet's "Video Location" column (Column C) as you requested. 🎉
