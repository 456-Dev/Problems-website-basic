import axios from "axios";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
// Known channel ID for @bignosemichael — used when the handle lookup API call fails (quota/key restrictions)
const FALLBACK_CHANNEL_ID = "UCPHlxgD-zH8MpuZ9bQDAWMA";
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || FALLBACK_CHANNEL_ID;

const CACHE_KEY = "qtd_videos_cache_v1";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function readCache(): { ts: number; videos: YouTubeVideo[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(videos: YouTubeVideo[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), videos }));
  } catch {}
}

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
 * Fetches YouTube Shorts from a channel (25 at a time for fast loading)
 */
export async function fetchLatestShorts(limit: number = 25): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    console.error("Missing YouTube API credentials");
    throw new Error("YouTube API credentials not configured");
  }

  // Serve from cache when fresh — avoids quota errors and gives instant loads
  const cached = readCache();
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS && cached.videos.length >= limit) {
    return cached.videos.slice(0, limit);
  }

  try {
    // Step 1: Get the channel's uploads playlist ID
    const channelId = await getChannelId(YOUTUBE_CHANNEL_ID);
    const uploadsPlaylistId = `UU${channelId.substring(2)}`; // UC -> UU for uploads playlist
    
    // Step 2: Fetch videos up to limit
    let allVideos: any[] = [];
    let nextPageToken: string | undefined = undefined;
    const videosNeeded = limit;

    // Fetch in batches of 50 until we have enough
    while (allVideos.length < videosNeeded) {
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
      
      if (!nextPageToken) break; // No more videos
    }

    if (allVideos.length === 0) {
      return [];
    }

    // Step 3: Get video details in batches of 50 (API limit)
    const allShorts: YouTubeVideo[] = [];
    
    for (let i = 0; i < allVideos.length; i += 50) {
      const batch = allVideos.slice(i, i + 50);
      const videoIds = batch.map((item: any) => item.contentDetails.videoId).join(",");
      
      if (!videoIds) continue;

      const videoDetailsResponse: any = await axios.get(
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
          
          // Extract location from YouTube metadata (recordingDetails.location)
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
      
      // Stop if we have enough shorts
      if (allShorts.length >= limit) {
        break;
      }
    }

    const result = allShorts.slice(0, limit);
    if (result.length > (cached?.videos.length || 0)) {
      writeCache(result);
    }
    return result;
  } catch (error) {
    console.error("Error fetching YouTube Shorts:", error);
    // Fall back to stale cache rather than showing an error page
    if (cached && cached.videos.length > 0) {
      return cached.videos.slice(0, limit);
    }
    throw error;
  }
}

/**
 * Extract location from video metadata or description
 * YouTube API provides location fields in recordingDetails
 */
function extractLocation(video: any): string {
  // Log all available data for debugging
  if (video.recordingDetails) {
    console.log(`📍 Video "${video.snippet.title}" recordingDetails:`, JSON.stringify(video.recordingDetails, null, 2));
  }
  
  // Try all possible location name fields
  const locationName = 
    video.recordingDetails?.locationDescription ||
    video.recordingDetails?.location?.name ||
    video.recordingDetails?.location?.description ||
    video.snippet?.location?.name ||
    video.snippet?.locationName;
  
  if (locationName) {
    console.log(`✅ Using location name: ${locationName}`);
    return locationName;
  }
  
  // Try coordinates if available
  if (video.recordingDetails?.location?.latitude && video.recordingDetails?.location?.longitude) {
    const lat = video.recordingDetails.location.latitude;
    const lng = video.recordingDetails.location.longitude;
    console.log(`✅ Using coordinates: ${lat}, ${lng}`);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  
  // Parse from video description
  const description = video.snippet.description || "";
  const locationPattern = /location:\s*([^\n]+)/i;
  const match = description.match(locationPattern);
  
  if (match) {
    console.log(`✅ Using description location: ${match[1].trim()}`);
    return match[1].trim();
  }
  
  // Default fallback
  console.log(`⚠️ No location found for "${video.snippet.title}", using default`);
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

  // Lookups failed (quota, key restrictions, etc.) — use the known channel ID
  console.warn(`Could not resolve channel ID for ${channelIdentifier}, using fallback`);
  return FALLBACK_CHANNEL_ID;
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

