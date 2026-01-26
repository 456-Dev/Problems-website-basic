"use client";

import { useEffect, useState } from "react";

export default function ViewCounter() {
  const [views, setViews] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Increment and fetch view count from Google Sheets
    const fetchAndIncrementViews = async () => {
      try {
        const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
        if (!scriptUrl) {
          console.error("Google Sheets URL not configured");
          setLoading(false);
          return;
        }

        // Check if this user has already been counted in this session
        const hasViewedThisSession = sessionStorage.getItem('qtd_viewed');
        
        if (!hasViewedThisSession) {
          // Increment view count
          const incrementResponse = await fetch(`${scriptUrl}?action=incrementView`);
          const incrementData = await incrementResponse.json();
          
          if (incrementData.views) {
            setViews(incrementData.views);
          }

          // Track visitor data
          trackVisitor(scriptUrl);
          
          // Mark this session as viewed
          sessionStorage.setItem('qtd_viewed', 'true');
        } else {
          // Just get current view count without incrementing
          const viewResponse = await fetch(`${scriptUrl}?action=getViews`);
          const viewData = await viewResponse.json();
          
          if (viewData.views) {
            setViews(viewData.views);
          }
        }
      } catch (error) {
        console.error('Failed to fetch view count:', error);
        setViews(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAndIncrementViews();
  }, []);

  // Track visitor information (privacy-friendly, no IP address)
  const trackVisitor = async (scriptUrl: string) => {
    try {
      const visitorData = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        referrer: document.referrer || 'Direct'
      };

      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'trackVisitor',
          visitor: visitorData,
        }),
      });
    } catch (error) {
      console.error('Failed to track visitor:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 text-white text-sm">
        <span>👁️</span>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-white text-sm">
      <span>👁️</span>
      <span className="font-bold">{views ? formatNumber(views) : '---'}</span>
      <span>views</span>
    </div>
  );
}

