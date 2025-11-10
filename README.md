# Question The Day 🎤

A modern, engaging website for the "Question The Day" daily interview series. This site automatically fetches and displays YouTube Shorts, creating an interactive experience for people who've been interviewed.

## Features

✨ **Auto-Updating Video Feed** - Automatically fetches new YouTube Shorts from your channel
🎨 **Modern UI** - Beautiful, responsive design with smooth animations
📱 **Mobile-First** - Optimized for viewing on phones (QR code friendly)
🎬 **Video Modal** - Click any video to watch it in an embedded player
⚡ **Fast Performance** - Built with Next.js for optimal loading speed

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Create credentials (API Key)
5. Copy your API key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Your YouTube Data API Key
YOUTUBE_API_KEY=your_api_key_here

# Your YouTube Channel ID or Handle
# Examples: @YourChannel or UCxxxxxxxxxxxxxx
YOUTUBE_CHANNEL_ID=@questiontheday

# Optional: Secret key for manual refresh endpoint
REFRESH_SECRET_KEY=your_secret_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Automated Updates

The site automatically checks for new videos every 5 minutes when someone visits. For more control, you can set up automated refreshes:

### Option 1: Cron Job (Vercel, etc.)

Set up a cron job to hit the refresh endpoint:

```bash
curl -X POST https://your-domain.com/api/refresh \
  -H "Authorization: Bearer your_secret_key"
```

### Option 2: GitHub Actions

Create `.github/workflows/refresh-videos.yml`:

```yaml
name: Refresh Videos
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger refresh
        run: |
          curl -X POST https://your-domain.com/api/refresh \
            -H "Authorization: Bearer ${{ secrets.REFRESH_SECRET_KEY }}"
```

### Option 3: Vercel Cron Jobs

If deployed on Vercel, add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/refresh",
    "schedule": "0 * * * *"
  }]
}
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
npm install -g vercel
vercel
```

### Other Platforms

The site works on any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted with Node.js

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── videos/      # Fetch videos endpoint
│   │   └── refresh/     # Manual refresh endpoint
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Homepage
│   └── globals.css      # Global styles
├── components/
│   ├── Header.tsx       # Site header
│   ├── VideoGrid.tsx    # Video grid layout
│   ├── VideoCard.tsx    # Individual video card
│   ├── VideoModal.tsx   # Video player modal
│   └── LoadingSpinner.tsx
├── lib/
│   └── youtube.ts       # YouTube API integration
└── public/              # Static assets
```

## Customization

### Update Brand Colors

Edit `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      accent: "#ff6b6b",           // Your brand color
      'accent-secondary': "#4ecdc4" // Secondary color
    }
  }
}
```

### Update Site Info

Edit `app/layout.tsx` for metadata (title, description, etc.)

## Tips for Engagement

1. **QR Code**: Generate a QR code that links directly to your site
2. **Call to Action**: The homepage tells visitors they'll be featured soon
3. **Social Sharing**: Consider adding share buttons for visitors to share their episode
4. **Subscribe Button**: Header has a YouTube subscribe link (update with your channel URL)

## Troubleshooting

### Videos Not Loading?

- Check that your API key is valid and has YouTube Data API v3 enabled
- Verify your channel ID/handle is correct
- Check API quota limits (10,000 units/day free tier)

### API Quota Exceeded?

- Implement caching with Redis or a database
- Reduce refresh frequency
- Request quota increase from Google

## License

MIT License - feel free to customize for your series!

---

Made with ❤️ for Question The Day

