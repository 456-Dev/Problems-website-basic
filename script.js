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
        this.initMap();
        this.setupEventListeners();
        this.loadRoutesFromDatabase();
        this.setCurrentDate();
        console.log('Question The Day initialized!');
    }
    
    setCurrentDate() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const today = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.textContent = today.toLocaleDateString('en-US', options);
        }
    }
    
    initMap() {
        // Initialize Leaflet map centered on NYC
        this.map = L.map('map', {
            center: [40.7589, -73.9851], // Times Square
            zoom: 11.5,
            zoomControl: true,
            attributionControl: true
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
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e.target.dataset.filter));
        });
        
        // Modal events
        this.closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
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
                    this.routes = data.lines.map(route => ({
                        id: route.id,
                        name: route.name,
                        color: route.color,
                        width: route.width,
                        videoId: route.videoId,
                        gpsPoints: route.gpsPoints,
                        videoType: route.video_type || 'fun'
                    }));
                    
                    this.filteredRoutes = [...this.routes];
                    this.hideLoading();
                    this.renderRoutesList();
                    this.addRoutesToMap();
                    this.fitMapToAllRoutes();
                    this.startFeaturedRotation();
                    
                    console.log(`Loaded ${this.routes.length} routes from data.json`);
                } else {
                    console.error('Failed to load routes:', data.error);
                    this.showError('Failed to load routes from data.json');
                }
            } else {
                console.error('Failed to fetch data.json');
                this.showError('Could not load data.json');
            }
        } catch (error) {
            console.error('Error loading routes from data.json:', error);
            this.showError('Error loading routes');
        }
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
                    <div class="route-title">${this.cleanTitle(route.name)}</div>
                    <button class="route-watch-btn" data-route-id="${route.id}">WATCH</button>
                </div>
                <div class="route-meta">
                    <div class="route-color" style="background-color: ${route.color}"></div>
                    <span class="route-type">${this.getVideoTypeDisplay(route.videoType)}</span>
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
                <div class="wheel-item wheel-prev">
                    <div class="featured-text">${this.cleanTitle(prevRoute.name)}<span class="click-to-watch">click to watch</span></div>
                    <button class="featured-watch-btn" data-route-id="${prevRoute.id}">WATCH</button>
                </div>
                <div class="wheel-item wheel-current">
                    <div class="featured-text">${this.cleanTitle(currentRoute.name)}<span class="click-to-watch">click to watch</span></div>
                    <button class="featured-watch-btn" data-route-id="${currentRoute.id}">WATCH</button>
                </div>
                <div class="wheel-item wheel-next">
                    <div class="featured-text">${this.cleanTitle(nextRoute.name)}<span class="click-to-watch">click to watch</span></div>
                    <button class="featured-watch-btn" data-route-id="${nextRoute.id}">WATCH</button>
                </div>
            </div>
        `;
        
        // Add click listeners to watch buttons
        document.querySelectorAll('.featured-watch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const routeId = parseInt(btn.dataset.routeId);
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
        // Remove content in brackets and parentheses
        return title.replace(/\s*[\[\(][^\]\)]*[\]\)]\s*/g, '').trim();
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
        // Update active state
        document.querySelectorAll('.route-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-route-id="${route.id}"]`).classList.add('active');
        
        // Focus on route on map
        this.focusOnRoute(route);
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
        this.lineLayerGroup.clearLayers();
        
        this.routes.forEach(route => {
            const points = this.parseGpsPoints(route.gpsPoints);
            if (points.length < 2) return;
            
            const polyline = L.polyline(points, {
                color: route.color,
                weight: parseInt(route.width),
                opacity: 0.8,
                routeId: route.id
            });
            
            // Add click handler
            polyline.on('click', () => {
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
        });
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
        
        this.renderRoutesList();
    }
    
    handleFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Apply filter
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        this.filteredRoutes = this.routes.filter(route => {
            const matchesSearch = !searchTerm || route.name.toLowerCase().includes(searchTerm);
            const matchesFilter = filter === 'all' || route.videoType === filter;
            return matchesSearch && matchesFilter;
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
        this.fitMapToAllRoutes();
    }
    
    openVideo(videoId, routeName) {
        if (!videoId || videoId === '') {
            this.showNotification('No video ID specified for this route', 'error');
            return;
        }
        
        // Extract video ID from various YouTube URL formats
        const extractedId = this.extractYouTubeId(videoId);
        if (!extractedId) {
            this.showNotification('Invalid YouTube video ID or URL', 'error');
            return;
        }
        
        this.modalTitle.textContent = routeName || 'NYC Route';
        const embedUrl = `https://www.youtube.com/embed/${extractedId}?autoplay=1&rel=0`;
        this.youtubePlayer.src = embedUrl;
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    extractYouTubeId(input) {
        if (!input) return null;
        
        // Clean up the input - remove @ symbol if present
        let url = input.trim().replace(/^@/, '');
        
        // If it's already just an ID (11 characters, alphanumeric with dashes/underscores)
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
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
            if (match) return match[1];
        }
        
        // Try regular patterns
        for (const pattern of regularPatterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        
        console.warn('Could not extract YouTube ID from:', input);
        return null;
    }
    
    closeModal() {
        this.modal.style.display = 'none';
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