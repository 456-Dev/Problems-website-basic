// Question The Day - Google Sheets Backend
// Handles questions, voting, analytics, visitor tracking, and episode syncing with locations

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
  } else if (action === 'getLocationData') {
    return getLocationData();
  } else if (action === 'getComments') {
    return getComments(e.parameter.videoId);
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
    } else if (action === 'syncEpisodesWithLocation') {
      return syncEpisodesWithLocation(data.episodes);
    } else if (action === 'addComment') {
      return addComment(data.comment);
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
    url: row[3],
    location: row[4] || ''
  })).filter(q => q.question);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    questions: questions
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== LOCATION DATA =====
function getLocationData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Recording Date and Location');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Recording Date and Location sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  
  // Assuming headers in row 1:
  // Column A: Episode Number
  // Column B: Date
  // Column C: Video Location (or Location)
  
  const locations = data.slice(1).map(row => ({
    episodeNumber: parseInt(row[0]),
    location: row[2] || row[1] || '' // Try column C first, then B
  })).filter(loc => loc.episodeNumber && loc.location);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    locations: locations
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== VIDEO COMMENTS (answers to episode questions) =====
function getCommentsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Comments');
  if (!sheet) {
    sheet = ss.insertSheet('Comments');
    sheet.appendRow(['ID', 'Video ID', 'Name', 'Comment', 'Timestamp']);
  }
  return sheet;
}

function getComments(videoId) {
  const sheet = getCommentsSheet();
  const data = sheet.getDataRange().getValues();

  const comments = data.slice(1)
    .map(row => ({
      id: row[0],
      videoId: row[1],
      name: row[2],
      text: row[3],
      timestamp: row[4]
    }))
    .filter(c => c.id && c.videoId === videoId)
    .sort((a, b) => b.timestamp - a.timestamp);

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    comments: comments
  })).setMimeType(ContentService.MimeType.JSON);
}

function addComment(comment) {
  const sheet = getCommentsSheet();

  sheet.appendRow([
    comment.id,
    comment.videoId,
    String(comment.name).slice(0, 40),
    String(comment.text).slice(0, 300),
    comment.timestamp
  ]);

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Comment added'
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

// ===== SYNC EPISODES FROM YOUTUBE (original version without location) =====
function syncEpisodes(episodes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Asked Questions');
  
  // Clear existing data (except header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
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

// ===== SYNC EPISODES WITH LOCATION DATA =====
function syncEpisodesWithLocation(episodes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Asked Questions');
  
  // Update headers to include Location (if not already there)
  const headers = sheet.getRange(1, 1, 1, 5).getValues()[0];
  if (headers[4] !== 'Location') {
    sheet.getRange(1, 5).setValue('Location');
  }
  
  // Clear existing data (except header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
  }
  
  // Add all episodes with location
  episodes.forEach(ep => {
    sheet.appendRow([
      ep.episodeNumber,
      ep.question,
      ep.date,
      ep.videoUrl,
      ep.location || 'New York, USA'
    ]);
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: `Synced ${episodes.length} episodes with location data`
  })).setMimeType(ContentService.MimeType.JSON);
}
