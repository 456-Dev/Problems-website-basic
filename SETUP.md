# Setup Guide - Question The Day

Quick setup guide to get your Question The Day website running!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get YouTube API Credentials

### 2.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "Question The Day" (or whatever you like)
4. Click "Create"

### 2.2 Enable YouTube Data API v3

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for "YouTube Data API v3"
3. Click on it and press "Enable"

### 2.3 Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy your API key
4. (Optional) Click "Restrict Key" and:
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Save

### 2.4 Find Your Channel ID

**Method 1: From Your Channel URL**
- If your URL is `youtube.com/@YourHandle`, use `@YourHandle`
- If your URL is `youtube.com/channel/UCxxxxxxxxx`, use `UCxxxxxxxxx`

**Method 2: From YouTube Studio**
1. Go to [YouTube Studio](https://studio.youtube.com)
2. Click "Settings" → "Channel" → "Advanced settings"
3. Copy your Channel ID (starts with "UC")

## Step 3: Configure Environment Variables

Create a file named `.env.local` in the root directory:

```env
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
YOUTUBE_CHANNEL_ID=@questiontheday

# Optional: For securing the refresh endpoint
REFRESH_SECRET_KEY=some_random_secure_string
```

**Important:**
- Replace `AIzaSy...` with your actual API key
- Replace `@questiontheday` with your channel handle or ID
- Never commit `.env.local` to Git (it's already in `.gitignore`)

## Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your site!

## Step 5: Test It Out

1. Visit the homepage - you should see your YouTube Shorts
2. Click on a video to watch it
3. Go to `/admin` to access the admin dashboard
4. Try the manual refresh button

## Troubleshooting

### "YouTube API credentials not configured"

- Make sure `.env.local` exists in the root directory
- Restart the dev server after creating/editing `.env.local`
- Check that your API key is correct

### "Could not find channel ID"

- Verify your channel handle includes the @ symbol (`@yourhandle`)
- Or use your full channel ID starting with "UC"
- Make sure your channel is public

### No videos showing up

- Ensure you have YouTube Shorts (videos under 60 seconds) on your channel
- Check the browser console for errors
- Try the "Refresh Videos Now" button on the admin page

### API Quota Exceeded

The free tier gives you 10,000 quota units per day. Each video fetch uses ~100 units.

Solutions:
- Reduce refresh frequency
- Implement caching (see README.md)
- Request quota increase from Google

## Next Steps

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your environment variables:
   - `YOUTUBE_API_KEY`
   - `YOUTUBE_CHANNEL_ID`
   - `REFRESH_SECRET_KEY` (optional)
4. Deploy!

### Customize Your Site

- Update the YouTube subscribe link in `components/Header.tsx`
- Change colors in `tailwind.config.ts`
- Edit the hero text in `app/page.tsx`

### Set Up Auto-Refresh

See the README.md for options:
- Vercel Cron Jobs
- GitHub Actions
- External cron services

---

Need help? Check the [README.md](./README.md) for more detailed info!

