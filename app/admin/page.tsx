"use client";

import { useState } from "react";

export default function AdminPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage("");

    try {
      // Note: On GitHub Pages (static hosting), there's no server-side refresh.
      // Videos are fetched fresh on each page load.
      setMessage(`ℹ️ On GitHub Pages, videos are automatically fetched fresh on each page visit. No manual refresh needed!`);
      setMessageType("success");
      
      // Reload the page to trigger a fresh fetch
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setMessageType("error");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-4 border-white p-4 bg-black">
          <a
            href="/"
            className="text-vintage-yellow hover:text-vintage-green transition-colors mb-4 inline-block font-bold border-2 border-white px-3 py-1"
          >
            [← BACK TO HOME]
          </a>
          <h1 className="text-4xl font-bold text-vintage-yellow-styled mt-4 mb-2">ADMIN DASHBOARD</h1>
          <p className="text-white font-bold">&gt;&gt; MANAGE YOUR SITE</p>
        </div>

        {/* Configuration Info */}
        <div className="bg-black border-4 border-white p-6 mb-6">
          <h2 className="text-2xl font-bold text-vintage-yellow-styled mb-4">CONFIGURATION</h2>
          <div className="space-y-3">
            <div className="border-2 border-white p-2">
              <span className="text-white font-bold">YouTube API Status:</span>
              <span className="ml-2 text-vintage-green font-bold">
                {process.env.NEXT_PUBLIC_API_CONFIGURED ? "✓ CONFIGURED" : "⚠️ NOT CONFIGURED"}
              </span>
            </div>
            <div className="border-2 border-white p-2">
              <span className="text-white font-bold">Auto-Refresh:</span>
              <span className="ml-2 text-vintage-yellow font-bold">EVERY 5 MINUTES</span>
            </div>
            <div className="pt-2 border-t-4 border-vintage-yellow">
              <p className="text-sm text-white font-bold mb-2">
                TO CONFIGURE: Add to your <code className="bg-vintage-yellow text-black px-2 py-1 font-mono">.env.local</code> file:
              </p>
              <pre className="mt-2 bg-black border-2 border-vintage-green p-3 text-xs text-vintage-green overflow-x-auto font-mono">
{`YOUTUBE_API_KEY=your_api_key
YOUTUBE_CHANNEL_ID=@your_channel_or_UCxxxxxxxxx`}
              </pre>
            </div>
          </div>
        </div>

        {/* Manual Refresh */}
        <div className="bg-black border-4 border-vintage-yellow p-6 mb-6">
          <h2 className="text-2xl font-bold text-vintage-yellow-styled mb-4">MANUAL REFRESH</h2>
          <p className="text-white mb-4 font-bold">
            &gt;&gt; Click to fetch the latest videos from YouTube
          </p>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-6 py-3 bg-vintage-green text-black font-bold border-4 border-white hover:bg-vintage-yellow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? "[REFRESHING...]" : "[REFRESH VIDEOS NOW]"}
          </button>

          {message && (
            <div
              className={`mt-4 p-4 border-4 font-bold ${
                messageType === "success"
                  ? "bg-black text-vintage-green border-vintage-green"
                  : "bg-black text-vintage-red border-vintage-red"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* API Endpoints */}
        <div className="bg-black border-4 border-white p-6 mb-6">
          <h2 className="text-2xl font-bold text-vintage-yellow-styled mb-4">API ENDPOINTS</h2>
          <div className="space-y-3">
            <div className="bg-black border-2 border-white p-3">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <code className="text-vintage-green font-bold">GET /api/videos</code>
                <span className="text-xs bg-vintage-green text-black px-2 py-1 font-bold">PUBLIC</span>
              </div>
              <p className="text-sm text-white">Fetches all YouTube Shorts from your channel</p>
            </div>
            
            <div className="bg-black border-2 border-white p-3">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <code className="text-vintage-green font-bold">POST /api/refresh</code>
                <span className="text-xs bg-vintage-yellow text-black px-2 py-1 font-bold">PROTECTED</span>
              </div>
              <p className="text-sm text-white mb-2">Manually triggers a video refresh</p>
              <details className="mt-2">
                <summary className="text-xs text-vintage-yellow cursor-pointer hover:text-white font-bold">
                  &gt;&gt; SHOW CURL EXAMPLE
                </summary>
                <pre className="mt-2 bg-black border-2 border-vintage-green p-2 text-xs text-vintage-green overflow-x-auto font-mono">
{`curl -X POST https://your-domain.com/api/refresh \\
  -H "Authorization: Bearer your_secret_key"`}
                </pre>
              </details>
            </div>
          </div>
        </div>

        {/* Automation Tips */}
        <div className="bg-black border-4 border-vintage-green p-6">
          <h2 className="text-2xl font-bold text-vintage-yellow-styled mb-4">AUTOMATION</h2>
          <p className="text-white mb-4 font-bold">
            &gt;&gt; Set up automated video refreshes:
          </p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-vintage-yellow pl-4 border-t-2 border-b-2 border-white py-2">
              <h3 className="text-lg font-bold text-vintage-yellow mb-1">1. VERCEL CRON JOBS</h3>
              <p className="text-sm text-white">
                Add <code className="bg-vintage-yellow text-black px-2 py-1 font-mono">vercel.json</code> for scheduled refreshes
              </p>
            </div>

            <div className="border-l-4 border-vintage-green pl-4 border-t-2 border-b-2 border-white py-2">
              <h3 className="text-lg font-bold text-vintage-green mb-1">2. GITHUB ACTIONS</h3>
              <p className="text-sm text-white">
                Create a workflow to trigger the refresh endpoint on schedule
              </p>
            </div>

            <div className="border-l-4 border-vintage-red pl-4 border-t-2 border-b-2 border-white py-2">
              <h3 className="text-lg font-bold text-vintage-red mb-1">3. EXTERNAL CRON SERVICE</h3>
              <p className="text-sm text-white">
                Use cron-job.org or EasyCron to ping your refresh endpoint
              </p>
            </div>
          </div>

          <p className="text-xs text-vintage-yellow mt-4 font-bold border-t-2 border-white pt-3">
            ⚠️ See README.md for detailed setup instructions
          </p>
        </div>
      </div>
    </div>
  );
}

