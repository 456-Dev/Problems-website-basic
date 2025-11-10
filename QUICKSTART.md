# Quick Start Guide 🚀

Get your Question The Day website running in 5 minutes!

## Prerequisites

- Node.js 18+ installed ([download here](https://nodejs.org/))
- A YouTube channel with some Shorts uploaded
- A Google account to get API credentials

## Quick Setup (3 Steps)

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Set Up YouTube API

You have two options:

**Option A: Interactive Script (Mac/Linux)**
```bash
./scripts/create-env.sh
```

**Option B: Manual Setup**

Create a file named `.env.local` in the root directory:

```env
YOUTUBE_API_KEY=your_api_key_here
YOUTUBE_CHANNEL_ID=@your_channel_handle
REFRESH_SECRET_KEY=any_random_string
```

### 3️⃣ Run the App

```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## Getting YouTube API Credentials

### Quick Method (5 minutes)

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the key to `.env.local`

**Detailed guide:** See [SETUP.md](./SETUP.md)

---

## Project Structure

```
problemsiteV3/
├── app/              # Next.js app (pages & API routes)
│   ├── page.tsx      # Homepage with video grid
│   ├── admin/        # Admin dashboard
│   └── api/          # API endpoints
├── components/       # React components
├── lib/              # YouTube API integration
└── public/           # Static files
```

---

## Key Features

✅ **Auto-Updating** - Checks for new videos every 5 minutes  
✅ **Mobile-Optimized** - Perfect for QR code scans  
✅ **Video Modal** - Click to watch embedded Shorts  
✅ **Admin Dashboard** - Manual refresh & settings  

---

## Common Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production
npm start            # Run production server

# Linting
npm run lint         # Check for code issues
```

---

## Accessing Your Site

- **Homepage**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API - Videos**: http://localhost:3000/api/videos
- **API - Refresh**: POST to http://localhost:3000/api/refresh

---

## Customization Quick Wins

### 1. Change the Subscribe Link

Edit `components/Header.tsx` line 28:
```tsx
href="https://youtube.com/@your_channel"
```

### 2. Update Brand Colors

Edit `app/globals.css`:
```css
--accent: #ff6b6b;           /* Your color */
--accent-secondary: #4ecdc4; /* Your color */
```

### 3. Change the Hero Text

Edit `app/page.tsx` lines 48-56.

---

## Next Steps

### Deploy to Vercel (Free)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repo
4. Add environment variables
5. Deploy!

**Full deployment guide:** See [README.md](./README.md#deployment)

### Create Business Cards

1. Deploy your site
2. Generate a QR code (https://www.qr-code-generator.com/)
3. Design your cards

**Business card guide:** See [BUSINESS_CARD_GUIDE.md](./BUSINESS_CARD_GUIDE.md)

### Set Up Auto-Refresh

Make your site check for new videos automatically.

**Automation guide:** See [README.md](./README.md#automated-updates)

---

## Troubleshooting

### "YouTube API credentials not configured"
- Make sure `.env.local` exists
- Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

### "Cannot find module"
- Run `npm install` again

### Videos not showing
- Check your channel has Shorts (under 60 seconds)
- Verify your API key in Google Cloud Console
- Check browser console for errors (F12)

### Build errors
- Make sure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be 18+)

---

## Need More Help?

- **Detailed Setup**: [SETUP.md](./SETUP.md)
- **Full Documentation**: [README.md](./README.md)
- **Business Cards**: [BUSINESS_CARD_GUIDE.md](./BUSINESS_CARD_GUIDE.md)

---

## That's It! 🎉

You now have a fully functional website for your "Question The Day" series!

**Happy interviewing!** 🎤

---

Made with ❤️ for content creators

