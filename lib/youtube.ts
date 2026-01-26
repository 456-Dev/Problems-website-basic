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
  location?: string; // Extracted from description or recording location
}

/**
 * Fetches ALL YouTube Shorts from a channel (paginated)
 */
export async function fetchLatestShorts(): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    console.error("Missing YouTube API credentials");
    throw new Error("YouTube API credentials not configured");
  }

  try {
    // Step 1: Get the channel's uploads playlist ID
    const channelId = await getChannelId(YOUTUBE_CHANNEL_ID);
    const uploadsPlaylistId = `UU${channelId.substring(2)}`; // UC -> UU for uploads playlist
    
    // Step 2: Fetch ALL videos with pagination
    let allVideos: any[] = [];
    let nextPageToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 10; // Limit to 500 videos (50 per page * 10 pages)

    do {
      const playlistResponse: any = await axios.get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            part: "snippet,contentDetails",
            playlistId: uploadsPlaylistId,
            maxResults: 50,
            pageToken: nextPageToken,
            key: YOUTUBE_API_KEY,
          },
        }
      );

      allVideos.push(...(playlistResponse.data.items || []));
      nextPageToken = playlistResponse.data.nextPageToken;
      pageCount++;
    } while (nextPageToken && pageCount < maxPages);

    if (allVideos.length === 0) {
      return [];
    }

    // Step 3: Get video details in batches of 50
    const allShorts: YouTubeVideo[] = [];
    
    for (let i = 0; i < allVideos.length; i += 50) {
      const batch = allVideos.slice(i, i + 50);
      const videoIds = batch.map((item: any) => item.contentDetails.videoId).join(",");
      
      if (!videoIds) continue;

      const videoDetailsResponse = await axios.get(
        "https://www.googleapis.com/youtube/v3/videos",
        {
          params: {
            part: "contentDetails,snippet,recordingDetails",
            id: videoIds,
            key: YOUTUBE_API_KEY,
          },
        }
      );

      const videoDetails = videoDetailsResponse.data.items || [];

      // Filter for Shorts (duration <= 190 seconds) OR videos with "QTD" in title
      const shorts = videoDetails
        .filter((video: any) => {
          const duration = parseDuration(video.contentDetails.duration);
          const hasQTD = video.snippet.title.toUpperCase().includes('QTD');
          return duration <= 190 || hasQTD;
        })
        .map((video: any) => {
          // Get highest quality thumbnail available
          const thumbnails = video.snippet.thumbnails;
          const thumbnail = thumbnails.maxres?.url || 
                           thumbnails.standard?.url || 
                           thumbnails.high?.url || 
                           thumbnails.medium?.url ||
                           thumbnails.default?.url;
          
          // Extract location from recording details or description
          const location = extractLocation(video);
          
          return {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail: thumbnail,
            publishedAt: video.snippet.publishedAt,
            url: `https://www.youtube.com/shorts/${video.id}`,
            location: location,
          };
        });

      allShorts.push(...shorts);
    }

    return allShorts;
  } catch (error) {
    console.error("Error fetching YouTube Shorts:", error);
    throw error;
  }
}

/**
 * Extract location from video metadata or description
 */
function extractLocation(video: any): string {
  // Try recordingDetails first (rarely available)
  if (video.recordingDetails?.location?.description) {
    console.log('Found location in recordingDetails:', video.recordingDetails.location.description);
    return video.recordingDetails.location.description;
  }
  
  // Parse from description
  const description = video.snippet.description || "";
  const locationPattern = /location:\s*([^\n]+)/i;
  const match = description.match(locationPattern);
  
  if (match) {
    console.log('Found location in description:', match[1].trim());
    return match[1].trim();
  }
  
  // Default
  console.log('No location found, using default: New York, USA');
  return "New York, USA";
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

