# 📊 Google Sheets Question Database Setup

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it: **"QTD - Community Database"**

### Create 4 Sheets:

#### Sheet 1: "Suggested Questions"
Column headers in row 1:
- **A1**: `ID`
- **B1**: `Question`
- **C1**: `Votes`
- **D1**: `Timestamp`

#### Sheet 2: "Analytics"
Cell values:
- **A1**: `Total Views`
- **B1**: `0` (initial value)

#### Sheet 3: "Visitors"
Column headers in row 1:
- **A1**: `Timestamp`
- **B1**: `User Agent`
- **C1**: `Screen Size`
- **D1**: `Timezone`
- **E1**: `Language`
- **F1**: `Referrer`

#### Sheet 4: "Asked Questions"
Column headers in row 1:
- **A1**: `Episode Number`
- **B1**: `Question`
- **C1**: `Date`
- **D1**: `Video URL`

(You'll populate this manually with your existing episodes)

## Step 2: Add the Apps Script Code

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any default code
3. Paste the following code:

```javascript
// Question The Day - Google Sheets Backend
// Handles questions, voting, analytics, and visitor tracking

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'get') {
    return getQuestions();
  } else if (action === 'getAskedQuestions') {
    return getAskedQuestions();
  } else if (action === 'getViews') {
    return getViewCount();
  } else if (action === 'incrementView') {
    return incrementViewCount();
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'add') {
      return addQuestion(data.question);
    } else if (action === 'vote') {
      return updateVote(data.id, data.votes);
    } else if (action === 'trackVisitor') {
      return trackVisitor(data.visitor);
    } else if (action === 'syncEpisodes') {
      return syncEpisodes(data.episodes);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== SUGGESTED QUESTIONS =====
function getQuestions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Suggested Questions');
  const data = sheet.getDataRange().getValues();
  
  const questions = data.slice(1).map(row => ({
    id: row[0],
    text: row[1],
    votes: row[2],
    timestamp: row[3]
  })).filter(q => q.id);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    questions: questions
  })).setMimeType(ContentService.MimeType.JSON);
}

function addQuestion(question) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Suggested Questions');
  
  sheet.appendRow([
    question.id,
    question.text,
    question.votes,
    question.timestamp
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Question added'
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateVote(id, newVotes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Suggested Questions');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 3).setValue(newVotes);
      break;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Vote updated'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== ASKED QUESTIONS (for duplicate checking) =====
function getAskedQuestions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Asked Questions');
  const data = sheet.getDataRange().getValues();
  
  const questions = data.slice(1).map(row => ({
    episode: row[0],
    question: row[1],
    date: row[2],
    url: row[3]
  })).filter(q => q.question);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    questions: questions
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== ANALYTICS - VIEW COUNTER =====
function getViewCount() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Analytics');
  const views = sheet.getRange('B1').getValue();
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    views: views
  })).setMimeType(ContentService.MimeType.JSON);
}

function incrementViewCount() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Analytics');
  const currentViews = sheet.getRange('B1').getValue();
  const newViews = currentViews + 1;
  sheet.getRange('B1').setValue(newViews);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    views: newViews
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== VISITOR TRACKING =====
function trackVisitor(visitor) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Visitors');
  
  sheet.appendRow([
    visitor.timestamp,
    visitor.userAgent,
    visitor.screenSize,
    visitor.timezone,
    visitor.language,
    visitor.referrer
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Visitor tracked'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== SYNC EPISODES FROM YOUTUBE =====
function syncEpisodes(episodes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Asked Questions');
  
  // Clear existing data (except header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
  }
  
  // Add all episodes
  episodes.forEach(ep => {
    sheet.appendRow([
      ep.episodeNumber,
      ep.question,
      ep.date,
      ep.videoUrl
    ]);
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: `Synced ${episodes.length} episodes`
  })).setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Save** (disk icon)
5. Name the project: **"QTD Question Backend"**

## Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ → Select **Web app**
3. Fill in the settings:
   - **Description**: "QTD Question API v1"
   - **Execute as**: "Me (your@email.com)"
   - **Who has access**: "Anyone"
4. Click **Deploy**
5. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycbxxx.../exec
   ```

## Step 4: Add to GitHub Secrets

1. Go to your GitHub repo: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - **Name**: `GOOGLE_SHEETS_URL`
   - **Value**: The Web App URL you copied above

## Step 5: Update GitHub Actions Workflow

The workflow needs to include the Google Sheets URL during build. Update `.github/workflows/deploy.yml`:

```yaml
- name: Build with Next.js
  run: npm run build
  env:
    YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
    YOUTUBE_CHANNEL_ID: ${{ secrets.YOUTUBE_CHANNEL_ID }}
    NEXT_PUBLIC_YOUTUBE_API_KEY: ${{ secrets.NEXT_PUBLIC_YOUTUBE_API_KEY }}
    NEXT_PUBLIC_YOUTUBE_CHANNEL_ID: ${{ secrets.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID }}
    NEXT_PUBLIC_GOOGLE_SHEETS_URL: ${{ secrets.GOOGLE_SHEETS_URL }}  # ADD THIS LINE
```

## Step 6: Local Development

For local testing, create a `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=@bignosemichael
```

## ✅ Testing

1. Visit your site
2. Submit a question
3. Check your Google Sheet - the question should appear!
4. Vote on a question
5. Check the sheet - votes should update!

## 📊 Benefits

- ✅ **Centralized data** - All users see the same questions
- ✅ **Real-time sync** - New submissions appear for everyone
- ✅ **Public voting** - Votes are shared across all visitors
- ✅ **Easy management** - Edit/delete directly in Google Sheets
- ✅ **Free forever** - No database costs
- ✅ **Scalable** - Handles thousands of questions

## 🔒 Security

The sheet is read/write via the Apps Script, but only you can edit it directly in Google Sheets. The public can only submit/vote through your website.

---

## 📝 Populating "Asked Questions" Sheet

Manually add all your previous episodes to the "Asked Questions" sheet:

### Example entries:

| Episode Number | Question | Date | Video URL |
|----------------|----------|------|-----------|
| 1 | What's your biggest fear? | Nov 1st, 2024 | https://youtube.com/shorts/abc123 |
| 2 | If you could have dinner with anyone, who would it be? | Nov 2nd, 2024 | https://youtube.com/shorts/def456 |
| 3 | What's one thing you'd change about NYC? | Nov 3rd, 2024 | https://youtube.com/shorts/ghi789 |

### Tips:
- Copy questions exactly as they appear in your videos
- Include the YouTube Shorts URL for each episode
- When users try to suggest a duplicate question, they'll see:
  - "This question was already asked in Episode #42!"
  - A clickable button to watch that episode

## 📊 What Each Sheet Does:

1. **Suggested Questions** - Community submissions and votes
2. **Analytics** - Total view counter (B1 cell)
3. **Visitors** - Privacy-friendly analytics (no IP addresses)
   - Timestamp, Browser, Screen Size, Timezone, Language, Referrer
4. **Asked Questions** - Your master list of all episodes for duplicate checking

---

## 🔒 Privacy Note

The visitor tracking collects:
- ✅ Browser type (User Agent)
- ✅ Screen size
- ✅ Timezone
- ✅ Language
- ✅ Referrer (where they came from)

**NOT collected:**
- ❌ IP addresses
- ❌ Personal information
- ❌ Emails or names
- ❌ Cookies

All data is anonymous and used only for understanding your audience!

---

**Note**: After deploying, wait 30 seconds for Google's servers to propagate the script. First request might be slow!
