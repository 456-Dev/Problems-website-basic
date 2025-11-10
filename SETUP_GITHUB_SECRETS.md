# 🔑 GitHub Secrets Setup Instructions

## Critical: You MUST add these secrets to your GitHub repository!

### Step-by-Step Instructions:

1. **Go to your GitHub repository**
   - Navigate to: https://github.com/YOUR_USERNAME/Problems-website-basic

2. **Open Settings → Secrets and variables → Actions**
   - Click **Settings** (top navigation)
   - Click **Secrets and variables** (left sidebar)
   - Click **Actions**
   - Click **New repository secret** button

3. **Add ALL 4 secrets** (click "New repository secret" for each):

   ### Secret 1: YOUTUBE_API_KEY
   - **Name:** `YOUTUBE_API_KEY`
   - **Value:** Your YouTube Data API v3 key (from Google Cloud Console)
   - Example: `AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

   ### Secret 2: YOUTUBE_CHANNEL_ID
   - **Name:** `YOUTUBE_CHANNEL_ID`
   - **Value:** Your YouTube channel handle or ID
   - Example: `@bignosemichael` or `UCxxxxxxxxxxxxxxxxxxxx`

   ### Secret 3: NEXT_PUBLIC_YOUTUBE_API_KEY
   - **Name:** `NEXT_PUBLIC_YOUTUBE_API_KEY`
   - **Value:** Same as YOUTUBE_API_KEY (copy the same value)
   - Example: `AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

   ### Secret 4: NEXT_PUBLIC_YOUTUBE_CHANNEL_ID
   - **Name:** `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`
   - **Value:** Same as YOUTUBE_CHANNEL_ID (copy the same value)
   - Example: `@bignosemichael` or `UCxxxxxxxxxxxxxxxxxxxx`

---

## 🎥 How to Get Your YouTube API Key:

If you don't have a YouTube API key yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**:
   - Click "Enable APIs and Services"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "Credentials" (left sidebar)
   - Click "Create Credentials" → "API key"
   - Copy the generated API key
5. (Optional but recommended) Restrict the API key:
   - Click on the API key you just created
   - Under "API restrictions", select "Restrict key"
   - Select only "YouTube Data API v3"
   - Save

---

## 📝 After Adding Secrets:

Once all 4 secrets are added:

```bash
# Commit and push your changes
git commit -m "Fix YouTube API configuration for GitHub Pages"
git push origin main
```

Then:
1. Go to your repo's **Actions** tab
2. Watch the "Deploy to GitHub Pages" workflow run
3. It should complete successfully ✅
4. Visit your site - the YouTube API error should be gone!

---

## ✅ Verification Checklist:

- [ ] Added `YOUTUBE_API_KEY` secret
- [ ] Added `YOUTUBE_CHANNEL_ID` secret  
- [ ] Added `NEXT_PUBLIC_YOUTUBE_API_KEY` secret
- [ ] Added `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` secret
- [ ] Committed changes locally
- [ ] Pushed to GitHub (`git push origin main`)
- [ ] GitHub Actions workflow completed successfully
- [ ] Visited site and confirmed videos are loading

---

## 🚨 Why Do We Need BOTH Versions?

- `YOUTUBE_API_KEY` - Used during server-side build
- `NEXT_PUBLIC_YOUTUBE_API_KEY` - Used for client-side API calls in the browser

Your app fetches data client-side, so the `NEXT_PUBLIC_` prefix makes these variables available to the browser. Next.js only includes environment variables with `NEXT_PUBLIC_` prefix in the browser bundle.

---

## 🔒 Security Note:

GitHub Secrets are encrypted and not visible after creation. They're only available during GitHub Actions workflows and won't be exposed in your repository or to the public.

