// NYC Interactive Map with Featured Display and Searchable Routes

class NYCRoutesMap {
    constructor() {
        // Map elements
        this.mapElement = document.getElementById('map');
        this.modal = document.getElementById('video-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.youtubePlayer = document.getElementById('youtube-player');
        this.closeBtn = document.querySelector('.close');
        
        // Featured scroll elements
        this.featuredScroll = document.getElementById('featured-scroll');
        
        // Routes list elements
        this.searchInput = document.getElementById('search-input');
        this.routesList = document.getElementById('routes-list');
        this.loadingState = document.getElementById('loading-state');
        this.emptyState = document.getElementById('empty-state');
        
        // Map controls
        this.resetViewBtn = document.getElementById('reset-view');
        
        // Data
        this.routes = [];
        this.filteredRoutes = [];
        this.currentFilter = 'all';
        this.featuredRotationInterval = null;
        
        // Map layers
        this.map = null;
        this.darkLayer = null;
        this.lineLayerGroup = null;
        
        this.init();
    }
    
    init() {
        // Debug: Check if modal elements exist
        console.log('Modal element found:', !!this.modal);
        console.log('Modal title element found:', !!this.modalTitle);
        console.log('YouTube player element found:', !!this.youtubePlayer);
        console.log('Close button element found:', !!this.closeBtn);
        
        this.initMap();
        this.setupEventListeners();
        this.loadRoutesFromDatabase();
        this.setCurrentDate();
        console.log('Question The Day initialized!');
    }
    
    setCurrentDate() {
        const dateElement = document.getElementById('current-date');
        const dateHeaderElement = document.getElementById('current-date-header');
        
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateString = today.toLocaleDateString('en-US', options);
        
        if (dateElement) {
            dateElement.textContent = dateString;
        }
        if (dateHeaderElement) {
            dateHeaderElement.textContent = dateString;
        }
    }
    
    initMap() {
        // Define map center and zoom as constants
        this.mapCenter = [40.7089, -73.9551]; // Times Square
        this.mapZoom = 10.3;
        
        // Initialize Leaflet map centered on NYC
        this.map = L.map('map', {
            center: this.mapCenter,
            zoom: this.mapZoom,
            zoomControl: true,
            attributionControl: true,
            zoomSnap: 0.1,        // Allow fractional zoom in 0.25 increments
            zoomDelta: 1,        // Zoom by 0.25 when using zoom controls
        });
        
        // Dark map layer
        this.darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);
        
        // Create layer group for lines
        this.lineLayerGroup = L.layerGroup().addTo(this.map);
    }
    
    setupEventListeners() {
        // Map controls
        this.resetViewBtn.addEventListener('click', () => this.resetView());
        
        // Search functionality
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Filter dropdown
        this.filterDropdown = document.getElementById('filter-dropdown');
        this.filterDropdown.addEventListener('change', (e) => this.handleFilter(e.target.value));
        
        // Modal events
        this.closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }
        });
    }
    
    async loadRoutesFromDatabase() {
        try {
            const response = await fetch('./data.json');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.processRoutes(data.lines);
                    console.log(`Loaded ${this.routes.length} routes from data.json`);
                    return;
                }
            }
        } catch (error) {
            console.warn('Failed to load data.json, using fallback data:', error);
        }
        
        // Fallback data for local development
        this.loadFallbackData();
    }
    
    loadFallbackData() {
        // Import the complete dataset for local development
        const fallbackData = {
            "success": true,
            "lines": [
                {"id": 1, "name": "What Is Reality? [QTD Episode 1]", "color": "#ff0001", "width": 4, "videoId": "https://youtube.com/shorts/IjyC9GufViY?si=Z8RGt-k2qyjU9xNL", "gpsPoints": "40.757224,-73.989873;40.756005,-73.990785;40.757176,-73.993531;40.758386,-73.992652;40.757241,-73.989884", "video_type": "philosophy"},
                {"id": 2, "name": "What Is The Most Important News Right? [QTD Episode 2]", "color": "#ff0001", "width": 4, "videoId": "https://youtube.com/shorts/GQb33Nq9Ltc?si=llHfLcmbTtFtpLr-", "gpsPoints": "40.735083,-73.991010;40.735034,-73.990538;40.735408,-73.989991;40.735717,-73.990785;40.735790,-73.991075;40.735376,-73.991203;40.735083,-73.991053", "video_type": "news"},
                {"id": 3, "name": "What Do You Think About Spider-Man? [QTD Episode 3]", "color": "#00ff00", "width": 4, "videoId": "https://youtube.com/shorts/QpUsgMcGHZI?si=09LL7WPLWSp1Hsq1", "gpsPoints": "40.827494,-73.911939;40.830774,-73.910437;40.831034,-73.911381;40.830936,-73.912368;40.831261,-73.913355;40.833339,-73.914084;40.834735,-73.917861;40.826780,-73.922539;40.827754,-73.925972;40.829345,-73.928633;40.832592,-73.925328;40.835157,-73.923912;40.836261,-73.922153;40.837560,-73.922238;40.838339,-73.923268", "video_type": "fun"},
                {"id": 4, "name": "What Do You Think Of The Tariffs? [QTD Episode 4]", "color": "#00ffde", "width": 4, "videoId": "https://youtube.com/shorts/ggy_9QycbK4?feature=share", "gpsPoints": "40.765116,-73.973050;40.764824,-73.972406;40.759135,-73.976741", "video_type": "news"},
                {"id": 5, "name": "Do You Feel Safe? [QTD Episode 5]", "color": "#f3ff00", "width": 4, "videoId": "https://youtube.com/shorts/RZQ1Lo9qY1U?feature=share", "gpsPoints": "40.711926,-74.011878;40.711584,-74.011180;40.711283,-74.010901;40.711226,-74.011095;40.711527,-74.011760;40.711844,-74.011953;40.711918,-74.011899", "video_type": "news"},
                {"id": 6, "name": "What Do You Think About Ukraine? [QTD Episode 6]", "color": "#0017ff", "width": 4, "videoId": "https://youtube.com/shorts/meHQTn5kHV0?feature=share", "gpsPoints": "40.706659,-73.806581;40.702137,-73.804371;40.702739,-73.802354;40.701974,-73.802032;40.702495,-73.799908;40.707820,-73.802805;40.708773,-73.798921;40.710302,-73.799865;40.709684,-73.801496;40.708172,-73.802934;40.707749,-73.802805", "video_type": "news"},
                {"id": 7, "name": "What Is The Most Important Invention Of All Time? [QTD Episode 7]", "color": "#00ff00", "width": 4, "videoId": "https://youtube.com/shorts/meHQTn5kHV0?feature=share", "gpsPoints": "40.746174,-73.890288;40.748417,-73.895416;40.749799,-73.884194;40.746093,-73.883657;40.744044,-73.885159;40.746158,-73.890288", "video_type": "fun"},
                {"id": 8, "name": "What Do You Think About Capitalism? [QTD Episode 8]", "color": "#ff00ff", "width": 4, "videoId": "https://youtube.com/shorts/dJhPmxO_eUk?feature=share", "gpsPoints": "40.770978,-73.987076;40.760926,-73.994535", "video_type": "philosophy"},
                {"id": 9, "name": "What Is Your Favorite Thing About Jersey City? [QTD Episode 9]", "color": "#ff8900", "width": 4, "videoId": "https://youtube.com/shorts/T7LP8yUQPHI?feature=share", "gpsPoints": "40.719505,-74.042240;40.720025,-74.042959;40.721643,-74.046103", "video_type": "fun"},
                {"id": 10, "name": "What Do You Think About Death? [QTD Episode 13]", "color": "#00ffde", "width": 4, "videoId": "https://youtube.com/shorts/dCKr29LgfAk?feature=share", "gpsPoints": "40.765126,-73.973265;40.765581,-73.973050;40.766036,-73.973522;40.767125,-73.973329;40.768084,-73.973801;40.768247,-73.974960;40.768328,-73.975797;40.767174,-73.976870;40.767629,-73.978586;40.766914,-73.978951", "video_type": "philosophy"},
                {"id": 11, "name": "Should The National Guard Takeover D.C.? [QTD Episode 14]", "color": "#00ff00", "width": 4, "videoId": "https://youtube.com/shorts/CCQr3_nr_Os?feature=share", "gpsPoints": "40.762971,-73.969831;40.754649,-73.975925", "video_type": "news"},
                {"id": 12, "name": "What Could You Do To Make The Person Watching This Laugh? [QTD Episode 15]", "color": "#ff0001", "width": 4, "videoId": "https://youtube.com/shorts/FJvmiNLb1FQ?feature=share", "gpsPoints": "40.754112,-73.976730;40.752576,-73.977824;40.752340,-73.976988;40.753778,-73.975979;40.754128,-73.976752", "video_type": "fun"},
                {"id": 13, "name": "What Do You Think About Communism? [QTD Episode 16]", "color": "#00ffde", "width": 4, "videoId": "https://youtube.com/shorts/siRfBmzH_vg?feature=share", "gpsPoints": "40.705862,-74.013326;40.704983,-74.013283;40.705032,-74.011502;40.706285,-74.011266;40.707179,-74.010623;40.707705,-74.011610", "video_type": "philosophy"},
                {"id": 14, "name": "Where Will The Wolrd Be In 5 Years? [QTD Episode 17]", "color": "#00ffde", "width": 4, "videoId": "https://youtube.com/shorts/Dv7jOXscej0?feature=share", "gpsPoints": "40.715133,-74.002125;40.715507,-74.003026;40.714206,-74.003434;40.713929,-74.003069;40.714222,-74.002469;40.713572,-74.001310;40.714450,-74.000709;40.715117,-74.001997;40.716743,-74.001052;40.715686,-74.001524;40.715312,-74.000731;40.716109,-74.000087", "video_type": "philosophy"},
                {"id": 15, "name": "What Is The Most Beautiful Thing You Have Ever Seen? [QTD Episode 18]", "color": "#ff0001", "width": 4, "videoId": "https://youtube.com/shorts/lXSv8pVJ2IE?feature=share", "gpsPoints": "40.709349,-73.960776;40.707625,-73.961120;40.706941,-73.961334;40.705900,-73.960176;40.702810,-73.965025;40.700467,-73.962708;40.701118,-73.961763", "video_type": "fun"},
                {"id": 16, "name": "What Would Make Your Life Complete? [QTD Episode 19]", "color": "#ff00ff", "width": 4, "videoId": "https://youtube.com/shorts/x8-ux9n55rk?feature=share", "gpsPoints": "40.710748,-73.959918;40.714488,-73.957558;40.714066,-73.955884;40.714261,-73.955026;40.715497,-73.953910;40.717026,-73.956485;40.718164,-73.955197;40.721482,-73.960433;40.722581,-73.959339;40.724045,-73.961892", "video_type": "philosophy"},
                {"id": 17, "name": "What Should Trump Tell Putin In Alaska? [QTD Episode 20]", "color": "#0017ff", "width": 4, "videoId": "https://youtube.com/shorts/9v6s70_AcQw?feature=share", "gpsPoints": "40.756138,-74.003263;40.756447,-74.004400;40.756187,-74.005172;40.754871,-74.005923;40.754220,-74.005601;40.753473,-74.003713;40.752681,-74.002136;40.752023,-74.001921;40.749186,-74.003820;40.747252,-74.005237;40.746033,-74.006009;40.744862,-74.006835;40.743464,-74.006932;40.742391,-74.007672;40.740448,-74.008101;40.739440,-74.008219", "video_type": "news"},
                {"id": 18, "name": "What Would Be Your Superpower? [QTD Episode 21]", "color": "#ff00ff", "width": 4, "videoId": "https://youtube.com/shorts/Qqo7LTnr7Fo?feature=share", "gpsPoints": "40.757240,-73.989801;40.754804,-73.984085", "video_type": "fun"},
                {"id": 19, "name": "How Would You Define Racism? [QTD Episode 25]", "color": "#f3ff00", "width": 4, "videoId": "https://youtube.com/shorts/-BUwe1ahZKA?feature=share", "gpsPoints": "40.766573,-73.962944;40.772325,-73.958652;40.770359,-73.954103", "video_type": "philosophy"},
                {"id": 21, "name": "How Would You Define Cool? [QTD Episode 26]", "color": "#f3ff00", "width": 4, "videoId": "https://youtube.com/shorts/-BUwe1ahZKA?feature=share", "gpsPoints": "1,1;0,0", "video_type": "philosophy"},
                {"id": 20, "name": "What Percentage Of The Internet Is Bots? [QTD Episode 26]", "color": "#00ff00", "width": 4, "videoId": "https://youtube.com/shorts/gdGDHW8-Xx8?feature=share", "gpsPoints": "40.805240,-73.939404;40.808971,-73.948309", "video_type": "news"}
            ]
        };
        
        this.processRoutes(fallbackData.lines);
        console.log(`Loaded ${this.routes.length} routes from fallback data`);
    }
    
    processRoutes(lines) {
        this.routes = lines.map(route => ({
            id: route.id,
            name: route.name,
            color: route.color,
            width: route.width,
            videoId: route.videoId,
            gpsPoints: route.gpsPoints,
            videoType: route.video_type || 'fun'
        }));
        
        // Sort routes in reverse chronological order (highest episode number first)
        this.routes.sort((a, b) => {
            const episodeA = this.extractEpisodeNumber(a.name);
            const episodeB = this.extractEpisodeNumber(b.name);
            return episodeB - episodeA; // Reverse order (newest first)
        });
        
        this.filteredRoutes = [...this.routes];
        this.hideLoading();
        this.renderRoutesList();
        this.addRoutesToMap();
        // this.fitMapToAllRoutes(); // Removed - keep fixed center/zoom
        this.startFeaturedRotation();
    }
    

    
    hideLoading() {
        this.loadingState.style.display = 'none';
    }
    
    showError(message) {
        this.hideLoading();
        this.emptyState.innerHTML = `
            <h3>Error Loading Routes</h3>
            <p>${message}</p>
        `;
        this.emptyState.style.display = 'block';
    }
    
    renderRoutesList() {
        if (this.filteredRoutes.length === 0) {
            this.routesList.style.display = 'none';
            this.emptyState.style.display = 'block';
            return;
        }
        
        this.emptyState.style.display = 'none';
        this.routesList.style.display = 'block';
        
        this.routesList.innerHTML = this.filteredRoutes.map(route => `
            <div class="route-item" data-route-id="${route.id}">
                <div class="route-header">
                    <div class="route-episode">${this.getEpisodeNumber(route.name)}</div>
                    <div class="route-title">${this.splitTitleForDisplay(route.name)}</div>
                    <button class="route-watch-btn" data-route-id="${route.id}">WATCH</button>
                </div>
            </div>
        `).join('');
        
        // Add click listeners to route items
        document.querySelectorAll('.route-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger route selection if clicking on watch button
                if (e.target.classList.contains('route-watch-btn')) return;
                
                const routeId = parseInt(item.dataset.routeId);
                const route = this.routes.find(r => r.id === routeId);
                if (route) {
                    this.selectRoute(route);
                }
            });
        });
        
        // Add click listeners to watch buttons
        document.querySelectorAll('.route-watch-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routeId = parseInt(btn.dataset.routeId);
                const route = this.routes.find(r => r.id === routeId);
                if (route) {
                    this.openVideo(route.videoId, this.cleanTitle(route.name));
                }
            });
        });
    }
    
    startFeaturedRotation() {
        if (this.routes.length === 0) {
            this.featuredScroll.innerHTML = '<div class="loading-featured">No interviews available</div>';
            return;
        }
        
        // Clear any existing interval
        if (this.featuredRotationInterval) {
            clearInterval(this.featuredRotationInterval);
        }
        
        // Initialize the wheel
        this.currentWheelIndex = 0;
        this.wheelRoutes = [...this.routes].sort(() => 0.5 - Math.random());
        this.updateWheelDisplay();
        
        // Rotate every 5 seconds
        this.featuredRotationInterval = setInterval(() => {
            this.rotateWheel();
        }, 5000);
    }
    
    updateWheelDisplay() {
        if (this.wheelRoutes.length === 0) return;
        
        const totalRoutes = this.wheelRoutes.length;
        const currentIndex = this.currentWheelIndex;
        
        // Get the 3 routes: previous, current, next
        const prevIndex = (currentIndex - 1 + totalRoutes) % totalRoutes;
        const nextIndex = (currentIndex + 1) % totalRoutes;
        
        const prevRoute = this.wheelRoutes[prevIndex];
        const currentRoute = this.wheelRoutes[currentIndex];
        const nextRoute = this.wheelRoutes[nextIndex];
        
        this.featuredScroll.innerHTML = `
            <div class="wheel-container">
                <div class="wheel-item wheel-prev" data-route-id="${prevRoute.id}">
                    <div class="featured-content">
                        <div class="episode-number">${this.getEpisodeNumber(prevRoute.name)}</div>
                        <div class="question-text">${this.cleanTitle(prevRoute.name)}</div>
                    </div>
                </div>
                <div class="wheel-item wheel-current" data-route-id="${currentRoute.id}">
                    <div class="featured-content">
                        <div class="episode-number">${this.getEpisodeNumber(currentRoute.name)}</div>
                        <div class="question-text">${this.cleanTitle(currentRoute.name)}</div>
                    </div>
                </div>
                <div class="wheel-item wheel-next" data-route-id="${nextRoute.id}">
                    <div class="featured-content">
                        <div class="episode-number">${this.getEpisodeNumber(nextRoute.name)}</div>
                        <div class="question-text">${this.cleanTitle(nextRoute.name)}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add click listeners to wheel items
        document.querySelectorAll('.wheel-item').forEach(item => {
            item.addEventListener('click', () => {
                const routeId = parseInt(item.dataset.routeId);
                const route = this.routes.find(r => r.id === routeId);
                if (route) {
                    this.openVideo(route.videoId, this.cleanTitle(route.name));
                }
            });
        });
    }
    
    rotateWheel() {
        // Add rotation animation class
        const wheelContainer = document.querySelector('.wheel-container');
        if (wheelContainer) {
            wheelContainer.classList.add('rotating');
            
            // Update index after animation starts
            setTimeout(() => {
                this.currentWheelIndex = (this.currentWheelIndex + 1) % this.wheelRoutes.length;
                this.updateWheelDisplay();
            }, 600); // Half of the animation duration
        }
    }
    
    cleanTitle(title) {
        // Remove content in brackets and parentheses, and remove hashtags
        return title.replace(/\s*[\[\(][^\]\)]*[\]\)]\s*/g, '')  // Remove [brackets] and (parentheses)
                   .replace(/#\w+/g, '')                          // Remove hashtags like #hashtag
                   .replace(/\s+/g, ' ')                          // Clean up multiple spaces
                   .trim();
    }
    
    splitTitleForDisplay(title) {
        // Split long titles into two lines only if really necessary
        const cleanedTitle = this.cleanTitle(title);
        const words = cleanedTitle.split(' ');
        
        // Only split if title is very long - be more conservative
        if (words.length <= 6 || cleanedTitle.length <= 45) {
            return `<span class="title-text">${cleanedTitle}</span>`;
        }
        
        // Split roughly in the middle for very long titles
        const midPoint = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, midPoint).join(' ');
        const secondLine = words.slice(midPoint).join(' ');
        
        return `<span class="title-text">${firstLine}</span><span class="title-text">${secondLine}</span>`;
    }
    
    getEpisodeNumber(title) {
        // Extract episode number from "[QTD Episode X]" format
        const match = title.match(/\[QTD Episode (\d+)\]/i);
        return match ? `#${match[1]}` : '#?';
    }
    
    extractEpisodeNumber(title) {
        // Extract numeric episode number for sorting
        const match = title.match(/\[QTD Episode (\d+)\]/i);
        return match ? parseInt(match[1], 10) : 0;
    }
    
    getVideoTypeDisplay(videoType) {
        const typeMap = {
            'fun': 'Fun',
            'news': 'News', 
            'philosophy': 'Philosophy'
        };
        return typeMap[videoType] || 'Fun';
    }
    
    selectRoute(route) {
        console.log('selectRoute called with:', route);
        
        // Update active state
        document.querySelectorAll('.route-item').forEach(item => {
            item.classList.remove('active');
        });
        const routeElement = document.querySelector(`[data-route-id="${route.id}"]`);
        if (routeElement) {
            routeElement.classList.add('active');
            console.log('Route element found and activated');
        } else {
            console.warn('Route element not found for ID:', route.id);
        }
        
        // Focus on route on map
        this.focusOnRoute(route);
        
        // Open the video
        console.log('Opening video with ID:', route.videoId);
        this.openVideo(route.videoId, this.cleanTitle(route.name));
    }
    
    focusOnRoute(route) {
        const points = this.parseGpsPoints(route.gpsPoints);
        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            this.map.fitBounds(bounds, { padding: [20, 20] });
            
            // Highlight the route temporarily
            this.lineLayerGroup.eachLayer(layer => {
                if (layer.options && layer.options.routeId === route.id) {
                    const originalStyle = {
                        weight: layer.options.weight,
                        opacity: layer.options.opacity
                    };
                    
                    layer.setStyle({ weight: originalStyle.weight + 4, opacity: 1 });
                    
                    setTimeout(() => {
                        layer.setStyle(originalStyle);
                    }, 3000);
                }
            });
        }
    }
    
    addRoutesToMap() {
        console.log('Adding routes to map:', this.routes.length, 'routes');
        this.lineLayerGroup.clearLayers();
        
        let linesAdded = 0;
        this.routes.forEach(route => {
            const points = this.parseGpsPoints(route.gpsPoints);
            console.log(`Route ${route.id}: ${points.length} points parsed from "${route.gpsPoints}"`);
            
            if (points.length < 2) {
                console.warn(`Route ${route.id} skipped: insufficient points (${points.length})`);
                return;
            }
            
            const polyline = L.polyline(points, {
                color: route.color,
                weight: parseInt(route.width),
                opacity: 0.8,
                routeId: route.id
            });
            
            // Add click handler for both desktop and mobile
            polyline.on('click', (e) => {
                console.log('Polyline clicked:', route.id, route.name);
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();
                this.selectRoute(route);
            });
            
            // Add touch support for mobile
            polyline.on('touchend', (e) => {
                console.log('Polyline touched:', route.id, route.name);
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();
                this.selectRoute(route);
            });
            
            // Add hover effects
            polyline.on('mouseover', (e) => {
                e.target.setStyle({ weight: parseInt(route.width) + 2, opacity: 1 });
            });
            
            polyline.on('mouseout', (e) => {
                e.target.setStyle({ weight: parseInt(route.width), opacity: 0.8 });
            });
            
            this.lineLayerGroup.addLayer(polyline);
            linesAdded++;
        });
        
        console.log(`Successfully added ${linesAdded} lines to map`);
    }
    
    parseGpsPoints(gpsString) {
        if (!gpsString || gpsString.trim() === '') return [];
        
        try {
            return gpsString.split(';').map(point => {
                const [lat, lng] = point.trim().split(',').map(coord => parseFloat(coord.trim()));
                if (isNaN(lat) || isNaN(lng)) throw new Error('Invalid coordinates');
                return [lat, lng];
            }).filter(point => point.length === 2);
        } catch (error) {
            console.warn('Invalid GPS points format:', gpsString);
            return [];
        }
    }
    
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        this.filteredRoutes = this.routes.filter(route => {
            const matchesSearch = route.name.toLowerCase().includes(searchTerm);
            const matchesFilter = this.currentFilter === 'all' || route.videoType === this.currentFilter;
            return matchesSearch && matchesFilter;
        });
        
        // Maintain reverse chronological order for search results
        this.filteredRoutes.sort((a, b) => {
            const episodeA = this.extractEpisodeNumber(a.name);
            const episodeB = this.extractEpisodeNumber(b.name);
            return episodeB - episodeA; // Reverse order (newest first)
        });
        
        this.renderRoutesList();
    }
    
    handleFilter(filter) {
        this.currentFilter = filter;
        
        // Update dropdown selection
        this.filterDropdown.value = filter;
        
        // Apply filter
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        this.filteredRoutes = this.routes.filter(route => {
            const matchesSearch = !searchTerm || route.name.toLowerCase().includes(searchTerm);
            const matchesFilter = filter === 'all' || route.videoType === filter;
            return matchesSearch && matchesFilter;
        });
        
        // Maintain reverse chronological order for filtered results
        this.filteredRoutes.sort((a, b) => {
            const episodeA = this.extractEpisodeNumber(a.name);
            const episodeB = this.extractEpisodeNumber(b.name);
            return episodeB - episodeA; // Reverse order (newest first)
        });
        
        this.renderRoutesList();
    }
    
    fitMapToAllRoutes() {
        if (this.routes.length === 0) return;
        
        const allPoints = [];
        this.routes.forEach(route => {
            const points = this.parseGpsPoints(route.gpsPoints);
            allPoints.push(...points);
        });
        
        if (allPoints.length > 0) {
            const bounds = L.latLngBounds(allPoints);
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
    
    resetView() {
        // Reset to fixed NYC center instead of fitting all routes
        this.map.setView(this.mapCenter, this.mapZoom);
    }
    
    openVideo(videoId, routeName) {
        console.log('openVideo called with videoId:', videoId, 'routeName:', routeName);
        
        if (!videoId || videoId === '') {
            console.error('No video ID provided');
            this.showNotification('No video ID specified for this route', 'error');
            return;
        }
        
        // Extract video ID from various YouTube URL formats
        const extracted = this.extractYouTubeId(videoId);
        console.log('Extracted video data:', extracted);
        
        if (!extracted || !extracted.id) {
            console.error('Failed to extract video ID from:', videoId);
            this.showNotification('Invalid YouTube video ID or URL', 'error');
            return;
        }
        
        this.modalTitle.textContent = routeName || 'NYC Route';
        
        // Create proper embed URL for Shorts vs regular videos
        let embedUrl;
        if (extracted.isShorts) {
            // For Shorts, replace /shorts/ with /embed/ in the original URL
            embedUrl = videoId.replace('/shorts/', '/embed/');
            // Add autoplay parameter if not already present
            if (!embedUrl.includes('?')) {
                embedUrl += '?autoplay=1&rel=0';
            } else if (!embedUrl.includes('autoplay')) {
                embedUrl += '&autoplay=1&rel=0';
            }
        } else {
            // For regular videos, use standard embed format
            embedUrl = `https://www.youtube.com/embed/${extracted.id}?autoplay=1&rel=0`;
        }
        console.log('Setting embed URL:', embedUrl, 'isShorts:', extracted.isShorts);
        
        // Update modal styling based on video type
        if (extracted.isShorts) {
            console.log('Configuring modal for YouTube Shorts');
            this.modal.classList.add('shorts-mode');
        } else {
            console.log('Configuring modal for regular YouTube video');
            this.modal.classList.remove('shorts-mode');
        }
        
        this.youtubePlayer.src = embedUrl;
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        console.log('Modal should now be visible');
    }
    
    extractYouTubeId(input) {
        if (!input) return null;
        
        // Clean up the input - remove @ symbol if present
        let url = input.trim().replace(/^@/, '');
        
        // If it's already just an ID (11 characters, alphanumeric with dashes/underscores)
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return { id: url, isShorts: false };
        }
        
        // YouTube Shorts URL patterns
        const shortsPatterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?youtu\.be\/shorts\/([a-zA-Z0-9_-]{11})/
        ];
        
        // Regular YouTube URL patterns
        const regularPatterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/
        ];
        
        // Try shorts patterns first
        for (const pattern of shortsPatterns) {
            const match = url.match(pattern);
            if (match) return { id: match[1], isShorts: true };
        }
        
        // Try regular patterns
        for (const pattern of regularPatterns) {
            const match = url.match(pattern);
            if (match) return { id: match[1], isShorts: false };
        }
        
        console.warn('Could not extract YouTube ID from:', input);
        return null;
    }
    
    closeModal() {
        this.modal.classList.remove('show');
        this.modal.classList.remove('shorts-mode');
        this.youtubePlayer.src = '';
        document.body.style.overflow = 'auto';
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const nycMap = new NYCRoutesMap();
    
    // Add notification animations CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('🗽 NYC Routes Map is ready!');
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NYCRoutesMap };
}