# Deploy to GitHub Pages

## What I've Set Up

I've configured your Next.js app for static export and GitHub Pages deployment:

1. **Modified `next.config.js`** - Added `output: 'export'` for static site generation
2. **Created GitHub Actions workflow** - Automatic deployment on push to `main` branch
3. **Added `.nojekyll` file** - Prevents GitHub Pages from processing with Jekyll
4. **Removed API routes** - They don't work with static export (we fetch data on the client side instead)

## Deployment Steps

### Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Name it whatever you want (e.g., `question-the-day`)
3. Make it **public** (required for free GitHub Pages)
4. **Don't** initialize with README, .gitignore, or license

### Step 2: Initialize Git and Push

In your terminal, run:

```bash
cd /Users/michaellinares/Desktop/CODE/problemsiteV3

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Question The Day website"

# Add your GitHub repo as remote (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Add GitHub Secrets

Your app needs YouTube API credentials. Add them as secrets:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:
   - `YOUTUBE_API_KEY` - Your YouTube Data API v3 key
   - `YOUTUBE_CHANNEL_ID` - Your channel ID (e.g., `@bignosemichael`)
   - `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` - Same as above (for client-side)

### Step 4: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. That's it! The workflow will run automatically

### Step 5: Wait for Deployment

1. Go to the **Actions** tab in your repository
2. Watch the "Deploy to GitHub Pages" workflow run
3. Once complete (green checkmark), your site will be live at:
   - `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## Important Notes

### If Using a Repository Name (Not Root Domain)

If your site is at `username.github.io/repo-name` (not just `username.github.io`), uncomment these lines in `next.config.js`:

```javascript
basePath: '/YOUR_REPO_NAME',
assetPrefix: '/YOUR_REPO_NAME/',
```

Then rebuild and push.

### Custom Domain (Optional)

To use a custom domain:
1. Add a `CNAME` file in the `public/` folder with your domain
2. Configure DNS with your domain provider
3. Enable HTTPS in GitHub Pages settings

### Updating the Site

Just push changes to the `main` branch:

```bash
git add .
git commit -m "Your update message"
git push
```

The site will automatically rebuild and redeploy!

## Troubleshooting

### Build Fails in GitHub Actions
- Check the Actions tab for error details
- Make sure all secrets are set correctly
- Verify the `.env.local` values match your GitHub secrets

### Site Shows 404
- Make sure GitHub Pages is enabled
- Check that the workflow completed successfully
- Wait a few minutes for DNS propagation

### Videos Not Loading
- Verify `YOUTUBE_API_KEY` secret is set correctly
- Check API quota limits in Google Cloud Console
- Make sure the channel ID is correct

## Local Testing

To test the static export locally:

```bash
npm run build
npx serve out
```

Then visit `http://localhost:3000`

