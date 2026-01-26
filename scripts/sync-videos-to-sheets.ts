import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
const GOOGLE_SHEETS_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;

interface Episode {
  episodeNumber: number;
  question: string;
  date: string;
  videoUrl: string;
  location?: string;
}

interface LocationData {
  episodeNumber: number;
  location: string;
}

/**
 * Main sync function
 */
async function syncVideosToSheets() {
  console.log('🎬 Starting sync process...\n');

  // Validate environment variables
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID || !GOOGLE_SHEETS_URL) {
    console.error('❌ Missing required environment variables:');
    if (!YOUTUBE_API_KEY) console.error('  - NEXT_PUBLIC_YOUTUBE_API_KEY');
    if (!YOUTUBE_CHANNEL_ID) console.error('  - NEXT_PUBLIC_YOUTUBE_CHANNEL_ID');
    if (!GOOGLE_SHEETS_URL) console.error('  - NEXT_PUBLIC_GOOGLE_SHEETS_URL');
    process.exit(1);
  }

  try {
    // Step 1: Fetch location data from Google Sheets
    console.log('📍 Fetching location data from Google Sheets...');
    const locationMap = await fetchLocationData();
    console.log(`✅ Found ${Object.keys(locationMap).length} location entries\n`);

    // Step 2: Fetch all videos from YouTube
    console.log('🎬 Fetching all QTD videos from YouTube...');
    const videos = await fetchAllVideosFromYouTube();
    console.log(`✅ Found ${videos.length} videos\n`);

    // Step 3: Parse videos into episodes
    console.log('📊 Parsing episode data...');
    const episodes = parseVideosToEpisodes(videos, locationMap);
    console.log(`✅ Parsed ${episodes.length} episodes with episode numbers\n`);

    if (episodes.length === 0) {
      console.log('⚠️  No episodes with episode numbers found. Check your video titles!');
      return;
    }

    // Step 4: Upload to Google Sheets
    console.log('📤 Uploading to Google Sheets...');
    await uploadToGoogleSheets(episodes);
    console.log('✅ Sync complete!\n');

    // Summary
    console.log('Summary:');
    console.log(`- Total videos found: ${videos.length}`);
    console.log(`- Episodes with numbers: ${episodes.length}`);
    console.log(`- Episode range: #${Math.min(...episodes.map(e => e.episodeNumber))} to #${Math.max(...episodes.map(e => e.episodeNumber))}`);
    console.log(`- Episodes with locations: ${episodes.filter(e => e.location && e.location !== 'New York, USA').length}`);
  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  }
}

/**
 * Fetch location data from "Recording Date and Location" sheet
 */
async function fetchLocationData(): Promise<Record<number, string>> {
  try {
    const response: any = await axios.get(GOOGLE_SHEETS_URL!, {
      params: {
        action: 'getLocationData'
      }
    });

    if (response.data.status === 'success' && response.data.locations) {
      const locationMap: Record<number, string> = {};
      
      response.data.locations.forEach((loc: LocationData) => {
        if (loc.episodeNumber && loc.location) {
          locationMap[loc.episodeNumber] = loc.location;
        }
      });

      return locationMap;
    }

    console.log('⚠️  No location data found in Google Sheets, will use fallback methods');
    return {};
  } catch (error: any) {
    if (error.response?.data?.message?.includes('getLocationData')) {
      console.log('⚠️  "Recording Date and Location" sheet not found or action not implemented');
      console.log('   Location will be extracted from YouTube or default to "New York, USA"');
    } else {
      console.log('⚠️  Could not fetch location data:', error.message);
    }
    return {};
  }
}

/**
 * Fetch all videos from YouTube channel
 */
async function fetchAllVideosFromYouTube(): Promise<any[]> {
  const channelId = await getChannelId(YOUTUBE_CHANNEL_ID!);
  const uploadsPlaylistId = `UU${channelId.substring(2)}`;

  let allVideos: any[] = [];
  let nextPageToken: string | undefined = undefined;
  let pageCount = 0;
  const maxPages = 10;

  // Fetch playlist items
  do {
    const response: any = await axios.get(
      'https://www.googleapis.com/youtube/v3/playlistItems',
      {
        params: {
          part: 'snippet,contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults: 50,
          pageToken: nextPageToken,
          key: YOUTUBE_API_KEY,
        },
      }
    );

    allVideos.push(...(response.data.items || []));
    nextPageToken = response.data.nextPageToken;
    pageCount++;
  } while (nextPageToken && pageCount < maxPages);

  // Get detailed video info in batches
  const detailedVideos: any[] = [];

  for (let i = 0; i < allVideos.length; i += 50) {
    const batch = allVideos.slice(i, i + 50);
    const videoIds = batch.map((item: any) => item.contentDetails.videoId).join(',');

    if (!videoIds) continue;

    const videoResponse: any = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          part: 'contentDetails,snippet,recordingDetails',
          id: videoIds,
          key: YOUTUBE_API_KEY,
        },
      }
    );

    const videos = videoResponse.data.items || [];

    // Filter for Shorts or videos with "QTD"
    const filtered = videos.filter((video: any) => {
      const duration = parseDuration(video.contentDetails.duration);
      const hasQTD = video.snippet.title.toUpperCase().includes('QTD');
      return duration <= 190 || hasQTD;
    });

    detailedVideos.push(...filtered);
  }

  return detailedVideos;
}

/**
 * Parse videos into episodes with all metadata
 */
function parseVideosToEpisodes(videos: any[], locationMap: Record<number, string>): Episode[] {
  const episodes: Episode[] = [];

  for (const video of videos) {
    const episodeNumber = extractEpisodeNumber(video.snippet.title);
    if (!episodeNumber) continue;

    const question = extractQuestion(video.snippet.title);
    const date = formatDate(video.snippet.publishedAt);
    const videoUrl = `https://youtube.com/shorts/${video.id}`;

    // Get location from multiple sources (priority order):
    // 1. Google Sheets "Recording Date and Location"
    // 2. YouTube recordingDetails
    // 3. Video description
    // 4. Default to "New York, USA"
    let location = locationMap[episodeNumber];

    if (!location && video.recordingDetails?.location?.description) {
      location = video.recordingDetails.location.description;
      console.log(`  📍 Episode ${episodeNumber}: Using YouTube recording location: ${location}`);
    }

    if (!location) {
      const descLocation = extractLocationFromDescription(video.snippet.description);
      if (descLocation !== 'New York, USA') {
        location = descLocation;
        console.log(`  📍 Episode ${episodeNumber}: Using description location: ${location}`);
      }
    }

    if (!location) {
      location = 'New York, USA';
    }

    episodes.push({
      episodeNumber,
      question,
      date,
      videoUrl,
      location,
    });
  }

  // Sort by episode number
  return episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
}

/**
 * Extract episode number from video title
 */
function extractEpisodeNumber(title: string): number | null {
  // Match patterns: #42, Episode 42, Ep. 42, (42), etc.
  const patterns = [
    /#(\d+)/,                    // #42
    /episode\s*(\d+)/i,         // Episode 42
    /ep\.?\s*(\d+)/i,           // Ep. 42
    /\((\d+)\)/,                // (42)
    /\[(\d+)\]/,                // [42]
    /\bE(\d+)\b/,               // E42
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Extract clean question from title
 */
function extractQuestion(title: string): string {
  let question = title;

  // Remove episode number patterns
  question = question.replace(/#\d+/g, '');
  question = question.replace(/episode\s*\d+/gi, '');
  question = question.replace(/ep\.?\s*\d+/gi, '');
  question = question.replace(/\(\d+\)/g, '');
  question = question.replace(/\[\d+\]/g, '');
  question = question.replace(/\bE\d+\b/g, '');

  // Remove [QTD Episode X] pattern
  question = question.replace(/\[QTD Episode \d+\]/gi, '');

  // Remove special characters
  question = question.replace(/[|•–-]/g, '');

  // Clean up whitespace
  question = question.trim().replace(/\s+/g, ' ');

  return question;
}

/**
 * Extract location from video description
 */
function extractLocationFromDescription(description: string): string {
  if (!description) return 'New York, USA';

  const locationPattern = /location:\s*([^\n]+)/i;
  const match = description.match(locationPattern);

  if (match) {
    return match[1].trim();
  }

  return 'New York, USA';
}

/**
 * Format date from ISO string
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();

  const suffix = getDaySuffix(day);

  return `${month} ${day}${suffix}, ${year}`;
}

/**
 * Get day suffix (st, nd, rd, th)
 */
function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Parse ISO 8601 duration to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get channel ID from handle or username
 */
async function getChannelId(channelIdentifier: string): Promise<string> {
  if (channelIdentifier.startsWith('UC') && channelIdentifier.length === 24) {
    return channelIdentifier;
  }

  if (channelIdentifier.startsWith('@')) {
    const response: any = await axios.get(
      'https://www.googleapis.com/youtube/v3/channels',
      {
        params: {
          part: 'id',
          forHandle: channelIdentifier,
          key: YOUTUBE_API_KEY,
        },
      }
    );

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id;
    }
  }

  throw new Error(`Could not find channel ID for: ${channelIdentifier}`);
}

/**
 * Upload episodes to Google Sheets
 */
async function uploadToGoogleSheets(episodes: Episode[]): Promise<void> {
  try {
    const response: any = await axios.post(GOOGLE_SHEETS_URL!, {
      action: 'syncEpisodesWithLocation',
      episodes: episodes,
    });

    if (response.data.status === 'success') {
      console.log(`✅ ${response.data.message}`);
    } else {
      throw new Error(response.data.message || 'Unknown error');
    }
  } catch (error: any) {
    if (error.response?.data?.message?.includes('syncEpisodesWithLocation')) {
      console.log('\n⚠️  Google Apps Script needs to be updated!');
      console.log('The syncEpisodesWithLocation function is not found.');
      console.log('Please update your Google Apps Script with the new code.\n');
    }
    throw error;
  }
}

// Run the sync
syncVideosToSheets();
