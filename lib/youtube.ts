import axios from "axios";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

/**
 * Fetches the latest 50 YouTube Shorts from a channel
 */
export async function fetchLatestShorts(): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    console.error("Missing YouTube API credentials");
    throw new Error("YouTube API credentials not configured");
  }

  try {
    // Step 1: Get the channel's uploads playlist ID
    const channelId = await getChannelId(YOUTUBE_CHANNEL_ID);
    
    // Step 2: Get latest 50 videos from the uploads playlist
    const playlistResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/playlistItems",
      {
        params: {
          part: "snippet,contentDetails",
          playlistId: `UU${channelId.substring(2)}`, // UC -> UU for uploads playlist
          maxResults: 50,
          key: YOUTUBE_API_KEY,
        },
      }
    );

    const videos = playlistResponse.data.items || [];

    // Step 3: Get video details (single batch of 50)
    const videoIds = videos.map((item: any) => item.contentDetails.videoId).join(",");
    
    if (!videoIds) {
      return [];
    }

    const videoDetailsResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "contentDetails,snippet",
          id: videoIds,
          key: YOUTUBE_API_KEY,
        },
      }
    );

    const videoDetails = videoDetailsResponse.data.items || [];

    // Filter for Shorts (duration <= 190 seconds / 3 minutes 10 seconds)
    const shorts = videoDetails
      .filter((video: any) => {
        const duration = parseDuration(video.contentDetails.duration);
        return duration <= 190;
      })
      .map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
        publishedAt: video.snippet.publishedAt,
        url: `https://www.youtube.com/shorts/${video.id}`,
      }));

    return shorts;
  } catch (error) {
    console.error("Error fetching YouTube Shorts:", error);
    throw error;
  }
}

/**
 * Gets the channel ID from a channel handle or ID
 */
async function getChannelId(channelIdentifier: string): Promise<string> {
  // If it already looks like a channel ID, return it
  if (channelIdentifier.startsWith("UC") && channelIdentifier.length === 24) {
    return channelIdentifier;
  }

  // If it's a handle (starts with @), look it up
  if (channelIdentifier.startsWith("@")) {
    try {
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/channels",
        {
          params: {
            part: "id",
            forHandle: channelIdentifier,
            key: YOUTUBE_API_KEY,
          },
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id;
      }
    } catch (error) {
      console.error("Error looking up channel by handle:", error);
    }
  }

  // Try looking up by username
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "id",
          forUsername: channelIdentifier.replace("@", ""),
          key: YOUTUBE_API_KEY,
        },
      }
    );

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id;
    }
  } catch (error) {
    console.error("Error looking up channel by username:", error);
  }

  throw new Error(`Could not find channel ID for: ${channelIdentifier}`);
}

/**
 * Parses ISO 8601 duration to seconds
 * Example: PT1M30S = 90 seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Caches video data to avoid hitting API limits
 */
export function getCachedVideos(): YouTubeVideo[] | null {
  // In production, you'd use Redis, database, or file system
  // For now, we'll rely on API route caching
  return null;
}

export function setCachedVideos(videos: YouTubeVideo[]): void {
  // In production, implement caching here
}

