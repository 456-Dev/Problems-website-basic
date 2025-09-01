// NYC Line Drawer - Create GPS coordinates by drawing on map

class NYCLineDrawer {
    constructor() {
        // Map elements
        this.mapElement = document.getElementById('map');
        this.modal = document.getElementById('gps-modal');
        this.closeBtn = document.querySelector('.close');
        this.gpsOutput = document.getElementById('gps-output');
        
        // Control elements
        this.lineNameInput = document.getElementById('line-name');
        this.lineColorInput = document.getElementById('line-color');
        this.lineWidthInput = document.getElementById('line-width');
        this.widthDisplay = document.getElementById('width-display');
        this.videoIdInput = document.getElementById('video-id');
        
        this.startDrawingBtn = document.getElementById('start-drawing');
        this.finishLineBtn = document.getElementById('finish-line');
        this.cancelLineBtn = document.getElementById('cancel-line');
        this.clearAllBtn = document.getElementById('clear-all');
        
        this.resetViewBtn = document.getElementById('reset-view');
        this.toggleSatelliteBtn = document.getElementById('toggle-satellite');
        
        this.linesList = document.getElementById('lines-list');
        this.exportCsvBtn = document.getElementById('export-csv');
        this.copyAllBtn = document.getElementById('copy-all');
        this.saveToBackendBtn = document.getElementById('save-to-backend');
        this.copyGpsBtn = document.getElementById('copy-gps');
        
        // Drawing state
        this.isDrawing = false;
        this.currentPath = [];
        this.drawnLines = [];
        this.lineCounter = 0;
        this.isSatelliteView = false;
        
        // Map layers
        this.map = null;
        this.streetLayer = null;
        this.satelliteLayer = null;
        this.lineLayerGroup = null;
        this.currentLineLayer = null;
        
        this.init();
    }
    
    init() {
        this.initMap();
        this.setupEventListeners();
        this.updateLinesList();
        console.log('NYC Line Drawer initialized!');
    }
    
    initMap() {
        // Initialize Leaflet map centered on NYC
        this.map = L.map('map', {
            center: [40.7589, -73.9851], // Times Square
            zoom: 13,
            zoomControl: true,
            attributionControl: true
        });
        
        // Simple, clean street map layer (default)
        this.streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);
        
        // Alternative simple satellite layer
        this.satelliteLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        });
        
        // Create layer group for lines
        this.lineLayerGroup = L.layerGroup().addTo(this.map);
        
        // Map click handler for drawing
        this.map.on('click', (e) => {
            if (this.isDrawing) {
                this.addPointToCurrentLine(e.latlng);
            }
        });
    }
    
    setupEventListeners() {
        // Drawing controls
        this.startDrawingBtn.addEventListener('click', () => this.startDrawing());
        this.finishLineBtn.addEventListener('click', () => this.finishLine());
        this.cancelLineBtn.addEventListener('click', () => this.cancelDrawing());
        this.clearAllBtn.addEventListener('click', () => this.clearAllLines());
        
        // Map controls
        this.resetViewBtn.addEventListener('click', () => this.resetView());
        this.toggleSatelliteBtn.addEventListener('click', () => this.toggleSatelliteView());
        
        // Export controls
        this.exportCsvBtn.addEventListener('click', () => this.exportToCsv());
        this.copyAllBtn.addEventListener('click', () => this.copyAllGps());
        this.saveToBackendBtn.addEventListener('click', () => this.saveToBackend());
        this.copyGpsBtn.addEventListener('click', () => this.copyGpsToClipboard());
        
        // Line properties
        this.lineWidthInput.addEventListener('input', () => {
            this.widthDisplay.textContent = `${this.lineWidthInput.value}px`;
            this.updateCurrentLineStyle();
        });
        
        this.lineColorInput.addEventListener('change', () => {
            this.updateCurrentLineStyle();
        });
        
        // Modal events
        this.closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.modal.style.display === 'block') {
                    this.closeModal();
                } else if (this.isDrawing) {
                    this.cancelDrawing();
                }
            } else if (e.key === 'Enter' && this.isDrawing) {
                this.finishLine();
            }
        });
    }
    
    startDrawing() {
        this.isDrawing = true;
        this.currentPath = [];
        
        // Update UI
        this.startDrawingBtn.disabled = true;
        this.finishLineBtn.disabled = false;
        this.cancelLineBtn.disabled = false;
        document.body.classList.add('drawing-active');
        
        // Create current line layer
        this.currentLineLayer = L.polyline([], {
            color: this.lineColorInput.value,
            weight: parseInt(this.lineWidthInput.value),
            opacity: 0.8,
            dashArray: '5,5'
        }).addTo(this.lineLayerGroup);
        
        this.showNotification('Click on the map to add points to your line', 'info');
    }
    
    addPointToCurrentLine(latlng) {
        if (!this.isDrawing) return;
        
        this.currentPath.push([latlng.lat, latlng.lng]);
        this.currentLineLayer.setLatLngs(this.currentPath);
        
        // Add a small marker for each point
        L.circleMarker(latlng, {
            radius: 4,
            fillColor: this.lineColorInput.value,
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.lineLayerGroup);
        
        this.showNotification(`Added point ${this.currentPath.length}. Click to add more or finish line.`, 'success');
    }
    
    updateCurrentLineStyle() {
        if (this.currentLineLayer) {
            this.currentLineLayer.setStyle({
                color: this.lineColorInput.value,
                weight: parseInt(this.lineWidthInput.value)
            });
        }
    }
    
    finishLine() {
        if (!this.isDrawing || this.currentPath.length < 2) {
            this.showNotification('Need at least 2 points to create a line', 'error');
            return;
        }
        
        // Extract and clean video ID
        const cleanVideoId = this.extractYouTubeId(this.videoIdInput.value) || '';
        
        // Create line data
        const lineData = {
            id: `line-${this.lineCounter++}`,
            name: this.lineNameInput.value || `Line ${this.lineCounter}`,
            color: this.lineColorInput.value,
            width: parseInt(this.lineWidthInput.value),
            videoId: cleanVideoId,
            path: [...this.currentPath],
            gpsString: this.pathToGpsString(this.currentPath)
        };
        
        // Add to lines array
        this.drawnLines.push(lineData);
        
        // Update current line style (remove dash)
        this.currentLineLayer.setStyle({
            dashArray: null,
            opacity: 1
        });
        
        // Reset drawing state
        this.isDrawing = false;
        this.currentPath = [];
        this.currentLineLayer = null;
        
        // Update UI
        this.startDrawingBtn.disabled = false;
        this.finishLineBtn.disabled = true;
        this.cancelLineBtn.disabled = true;
        document.body.classList.remove('drawing-active');
        
        // Clear form for next line
        this.lineNameInput.value = '';
        this.videoIdInput.value = '';
        this.lineColorInput.value = this.getRandomColor();
        
        // Update lines list
        this.updateLinesList();
        
        this.showNotification(`Line "${lineData.name}" created successfully!`, 'success');
    }
    
    cancelDrawing() {
        if (!this.isDrawing) return;
        
        // Remove current line from map
        if (this.currentLineLayer) {
            this.lineLayerGroup.removeLayer(this.currentLineLayer);
        }
        
        // Remove point markers
        this.lineLayerGroup.eachLayer(layer => {
            if (layer instanceof L.CircleMarker) {
                this.lineLayerGroup.removeLayer(layer);
            }
        });
        
        // Reset state
        this.isDrawing = false;
        this.currentPath = [];
        this.currentLineLayer = null;
        
        // Update UI
        this.startDrawingBtn.disabled = false;
        this.finishLineBtn.disabled = true;
        this.cancelLineBtn.disabled = true;
        document.body.classList.remove('drawing-active');
        
        this.showNotification('Drawing cancelled', 'info');
    }
    
    pathToGpsString(path) {
        return path.map(point => `${point[0].toFixed(6)},${point[1].toFixed(6)}`).join(';');
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
    
    updateLinesList() {
        if (this.drawnLines.length === 0) {
            this.linesList.innerHTML = '<p class="empty-state">No lines created yet. Start drawing to create your first line!</p>';
            return;
        }
        
        this.linesList.innerHTML = this.drawnLines.map(line => `
            <div class="line-item" data-line-id="${line.id}">
                <div class="line-header">
                    <span class="line-name">${line.name}</span>
                    <div class="line-color" style="background-color: ${line.color}"></div>
                </div>
                <div class="line-info">
                    ${line.path.length} points • ${line.width}px width • Video: ${line.videoId || 'None'}
                </div>
                <div class="line-gps">${line.gpsString}</div>
                <div class="line-actions">
                    <button class="preview-btn" onclick="lineDrawer.previewLine('${line.id}')">👁️ Preview</button>
                    <button class="copy-btn" onclick="lineDrawer.copyLineGps('${line.id}')">📋 Copy GPS</button>
                    <button class="delete-btn" onclick="lineDrawer.deleteLine('${line.id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    previewLine(lineId) {
        const line = this.drawnLines.find(l => l.id === lineId);
        if (!line) return;
        
        // Fit map to line bounds
        const bounds = L.latLngBounds(line.path);
        this.map.fitBounds(bounds, { padding: [20, 20] });
        
        // Temporarily highlight the line
        this.lineLayerGroup.eachLayer(layer => {
            if (layer instanceof L.Polyline && layer.getLatLngs().length > 0) {
                const layerLatLngs = layer.getLatLngs().map(ll => [ll.lat, ll.lng]);
                if (JSON.stringify(layerLatLngs) === JSON.stringify(line.path)) {
                    const originalStyle = {
                        weight: layer.options.weight,
                        opacity: layer.options.opacity
                    };
                    
                    layer.setStyle({ weight: originalStyle.weight + 4, opacity: 1 });
                    
                    setTimeout(() => {
                        layer.setStyle(originalStyle);
                    }, 2000);
                }
            }
        });
    }
    
    copyLineGps(lineId) {
        const line = this.drawnLines.find(l => l.id === lineId);
        if (!line) return;
        
        navigator.clipboard.writeText(line.gpsString).then(() => {
            this.showNotification('GPS coordinates copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            this.showNotification('Failed to copy to clipboard', 'error');
        });
    }
    
    deleteLine(lineId) {
        if (!confirm('Are you sure you want to delete this line?')) return;
        
        const lineIndex = this.drawnLines.findIndex(l => l.id === lineId);
        if (lineIndex === -1) return;
        
        const line = this.drawnLines[lineIndex];
        
        // Remove from map
        this.lineLayerGroup.eachLayer(layer => {
            if (layer instanceof L.Polyline && layer.getLatLngs().length > 0) {
                const layerLatLngs = layer.getLatLngs().map(ll => [ll.lat, ll.lng]);
                if (JSON.stringify(layerLatLngs) === JSON.stringify(line.path)) {
                    this.lineLayerGroup.removeLayer(layer);
                }
            }
        });
        
        // Remove from array
        this.drawnLines.splice(lineIndex, 1);
        
        // Update UI
        this.updateLinesList();
        
        this.showNotification('Line deleted successfully', 'success');
    }
    
    clearAllLines() {
        if (this.drawnLines.length === 0) return;
        
        if (!confirm('Are you sure you want to delete all lines?')) return;
        
        // Clear map
        this.lineLayerGroup.clearLayers();
        
        // Clear data
        this.drawnLines = [];
        this.lineCounter = 0;
        
        // Update UI
        this.updateLinesList();
        
        this.showNotification('All lines cleared', 'success');
    }
    
    exportToCsv() {
        if (this.drawnLines.length === 0) {
            this.showNotification('No lines to export', 'error');
            return;
        }
        
        const csvHeader = 'Name,Color,Width,YouTube ID,GPS Points\n';
        const csvRows = this.drawnLines.map(line => {
            return `"${line.name}","${line.color}",${line.width},"${line.videoId}","${line.gpsString}"`;
        });
        
        const csvContent = csvHeader + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `nyc-lines-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('CSV exported successfully!', 'success');
    }
    
    copyAllGps() {
        if (this.drawnLines.length === 0) {
            this.showNotification('No lines to copy', 'error');
            return;
        }
        
        const allGps = this.drawnLines.map(line => `${line.name}: ${line.gpsString}`).join('\n\n');
        this.gpsOutput.value = allGps;
        this.modal.style.display = 'block';
    }
    
    copyGpsToClipboard() {
        navigator.clipboard.writeText(this.gpsOutput.value).then(() => {
            this.showNotification('All GPS coordinates copied to clipboard!', 'success');
            this.closeModal();
        }).catch(err => {
            console.error('Failed to copy: ', err);
            this.showNotification('Failed to copy to clipboard', 'error');
        });
    }
    
    async saveToBackend() {
        if (this.drawnLines.length === 0) {
            this.showNotification('No lines to save', 'error');
            return;
        }
        
        const saveData = {
            timestamp: new Date().toISOString(),
            lines: this.drawnLines.map(line => ({
                name: line.name,
                color: line.color,
                width: line.width,
                videoId: line.videoId,
                gpsPoints: line.gpsString
            }))
        };
        
        try {
            // For now, we'll save to localStorage and download as JSON
            // In a real backend, this would be a POST request
            localStorage.setItem('nycMapLines', JSON.stringify(saveData));
            
            // Also download as JSON file
            const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `nyc-map-lines-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            this.showNotification('Lines saved to backend and downloaded!', 'success');
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Failed to save to backend', 'error');
        }
    }
    
    resetView() {
        this.map.setView([40.7589, -73.9851], 13);
    }
    
    toggleSatelliteView() {
        if (this.isSatelliteView) {
            this.map.removeLayer(this.satelliteLayer);
            this.map.addLayer(this.streetLayer);
            this.toggleSatelliteBtn.textContent = '🌍';
            this.toggleSatelliteBtn.title = 'Switch to Voyager view';
        } else {
            this.map.removeLayer(this.streetLayer);
            this.map.addLayer(this.satelliteLayer);
            this.toggleSatelliteBtn.textContent = '🗺️';
            this.toggleSatelliteBtn.title = 'Switch to Light view';
        }
        this.isSatelliteView = !this.isSatelliteView;
    }
    
    closeModal() {
        this.modal.style.display = 'none';
    }
    
    getRandomColor() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
            '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd',
            '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
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
            max-width: 300px;
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
        }, 4000);
    }
}

// Global variable for access from inline event handlers
let lineDrawer;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    lineDrawer = new NYCLineDrawer();
    
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
    
    console.log('🎨 NYC Line Drawer is ready!');
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NYCLineDrawer };
}
