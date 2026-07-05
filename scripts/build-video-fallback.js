// Generates public/videos.json at build time so the site can show episodes
// even when the browser-side YouTube API call fails (403 key restrictions, quota).
// Sources: YouTube RSS feed (no API key needed, latest 15) + public/data.json (full archive).

const fs = require("fs");
const path = require("path");

const CHANNEL_ID = "UCPHlxgD-zH8MpuZ9bQDAWMA"; // @bignosemichael
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

function extractVideoId(url) {
  const match = String(url).match(/(?:shorts\/|watch\?v=|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function parseRss(xml) {
  const videos = [];
  const entries = xml.split("<entry>").slice(1);
  for (const entry of entries) {
    const get = (tag) => {
      const m = entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].trim() : "";
    };
    const id = get("yt:videoId");
    if (!id) continue;
    videos.push({
      id,
      title: get("title"),
      description: get("media:description"),
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      publishedAt: get("published"),
      url: `https://www.youtube.com/shorts/${id}`,
      location: "New York, USA",
    });
  }
  return videos;
}

function parseDataJson() {
  const file = path.join(__dirname, "..", "public", "data.json");
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return (data.lines || [])
    .map((line) => {
      const id = extractVideoId(line.videoId);
      if (!id) return null;
      return {
        id,
        title: line.name || "",
        description: "",
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        publishedAt: "",
        url: `https://www.youtube.com/shorts/${id}`,
        location: "New York, USA",
        _episode: line.id || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b._episode - a._episode)
    .map(({ _episode, ...video }) => video);
}

async function main() {
  let rssVideos = [];
  try {
    const res = await fetch(RSS_URL);
    if (res.ok) rssVideos = parseRss(await res.text());
  } catch (err) {
    console.warn("RSS fetch failed, using data.json only:", err.message);
  }

  const archive = parseDataJson();
  const seen = new Set(rssVideos.map((v) => v.id));
  const merged = [...rssVideos, ...archive.filter((v) => !seen.has(v.id))];

  const outFile = path.join(__dirname, "..", "public", "videos.json");
  fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), videos: merged }, null, 1));
  console.log(`videos.json: ${rssVideos.length} from RSS + ${merged.length - rssVideos.length} from archive = ${merged.length} total`);
}

main().catch((err) => {
  console.error(err);
  // Don't fail the build over the fallback file
  process.exit(0);
});
