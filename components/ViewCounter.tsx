"use client";

import { useEffect, useState } from "react";

export default function ViewCounter() {
  const [views, setViews] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Increment and fetch view count
    const fetchViewCount = async () => {
      try {
        // Using countapi.xyz - free counter service
        const response = await fetch('https://api.countapi.xyz/hit/questiontheday.com/homepage');
        const data = await response.json();
        
        if (data.value) {
          setViews(data.value);
        }
      } catch (error) {
        console.error('Failed to fetch view count:', error);
        // Fallback: use localStorage for local tracking
        const localViews = localStorage.getItem('qtd_views');
        if (localViews) {
          const count = parseInt(localViews) + 1;
          localStorage.setItem('qtd_views', count.toString());
          setViews(count);
        } else {
          localStorage.setItem('qtd_views', '1');
          setViews(1);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchViewCount();
  }, []);

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

