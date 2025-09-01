# Question The Day - NYC Interview Map

An interactive map of New York City featuring interview locations and video content. Each line on the map represents an interview location that links to YouTube videos.

## Features

- Interactive NYC map with custom interview routes
- Searchable interview database
- Filter by interview type (Fun, News, Philosophy)  
- Rotating featured interviews display
- Line drawing tool for adding new interviews

## GitHub Pages Deployment

This is a static website that can be hosted directly on GitHub Pages:

1. **Push to GitHub**: Upload all files to your GitHub repository
2. **Enable Pages**: Go to Settings > Pages > Source: Deploy from branch > main
3. **Access**: Your site will be available at `https://yourusername.github.io/repositoryname`

## Files Structure

- `index.html` - Main website page
- `linedrawer.html` - Tool for creating new interview lines
- `data.json` - Interview data (generated from database)
- `styles.css` - Main styling
- `script.js` - Main website functionality
- `linedrawer.js` - Line drawing tool functionality

## Adding New Interviews

1. Use `linedrawer.html` to draw new interview routes
2. Export the data and merge it with `data.json`
3. Redeploy to GitHub Pages

## Local Development

Simply open `index.html` in a web browser. No server required!

## Technologies Used

- HTML5, CSS3, JavaScript (ES6+)
- Leaflet.js for interactive maps
- OpenStreetMap tiles
- YouTube iframe API