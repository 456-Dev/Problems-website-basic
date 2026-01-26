# 📊 Google Sheets Question Database Setup

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it: **"QTD - Community Questions"**
4. In the first sheet, add these column headers in row 1:
   - **A1**: `ID`
   - **B1**: `Question`
   - **C1**: `Votes`
   - **D1**: `Timestamp`

## Step 2: Add the Apps Script Code

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any default code
3. Paste the following code:

```javascript
// Question The Day - Google Sheets Backend
// This script handles question submissions and voting

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'get') {
    return getQuestions();
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

function getQuestions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  const questions = data.slice(1).map(row => ({
    id: row[0],
    text: row[1],
    votes: row[2],
    timestamp: row[3]
  })).filter(q => q.id); // Filter out empty rows
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    questions: questions
  })).setMimeType(ContentService.MimeType.JSON);
}

function addQuestion(question) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Find the row with this ID (starting from row 2, since row 1 is header)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 3).setValue(newVotes); // Column C (votes)
      break;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Vote updated'
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

**Note**: After deploying, wait 30 seconds for Google's servers to propagate the script. First request might be slow!
