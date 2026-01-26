// Script to sync all YouTube videos to Google Sheets
// Run this manually or set up as a scheduled task

import axios from 'axios';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
const GOOGLE_SHEETS_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;

interface VideoData {
  episodeNumber: number;
  question: string;
  date: string;
  videoUrl: string;
}

async function syncVideosToSheets() {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID || !GOOGLE_SHEETS_URL) {
    console.error('Missing required environment variables');
    return;
  }

  console.log('🎬 Fetching all QTD videos from YouTube...');

  try {
    // Import the YouTube fetcher
    const { fetchLatestShorts } = await import('../lib/youtube');
    const videos = await fetchLatestShorts();

    console.log(`✅ Found ${videos.length} videos`);

    // Parse episode numbers and questions from videos
    const episodeData: VideoData[] = videos
      .map((video) => {
        // Parse episode number
        const episodeMatch = video.title.match(/#(\d+)|ep\.?\s*(\d+)|episode\s*(\d+)/i);
        const episodeNumber = episodeMatch ? parseInt(episodeMatch[1] || episodeMatch[2] || episodeMatch[3]) : 0;

        if (!episodeNumber) return null;

        // Extract question (remove episode number and clean up)
        let question = video.title
          .replace(/#\d+/g, '')
          .replace(/ep\.?\s*\d+/gi, '')
          .replace(/episode\s*\d+/gi, '')
          .replace(/\(\d+\)/g, '')
          .replace(/[|•–-]/g, '')
          .trim();

        // Format date
        const date = new Date(video.publishedAt);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

        return {
          episodeNumber,
          question,
          date: formattedDate,
          videoUrl: video.url,
        };
      })
      .filter((item): item is VideoData => item !== null)
      .sort((a, b) => a.episodeNumber - b.episodeNumber);

    console.log(`📊 Parsed ${episodeData.length} episodes with episode numbers`);

    // Send to Google Sheets
    console.log('📤 Uploading to Google Sheets...');
    
    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'syncEpisodes',
        episodes: episodeData,
      }),
    });

    console.log('✅ Sync complete!');
    console.log(`\nSummary:`);
    console.log(`- Total videos found: ${videos.length}`);
    console.log(`- Episodes with numbers: ${episodeData.length}`);
    console.log(`- Episode range: #${episodeData[0]?.episodeNumber} to #${episodeData[episodeData.length - 1]?.episodeNumber}`);

  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// Run the sync
syncVideosToSheets();
