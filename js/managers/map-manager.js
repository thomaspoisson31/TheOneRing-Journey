
class MapManager {
    constructor(domElements) {
        this.dom = domElements;
        this.isInitialized = false;
    }

    async init() {
        console.log("🗺️ Initializing map...");
        
        try {
            await this.loadMapImage();
            this.initializeMapDimensions();
            this.setupCanvas();
            this.setupSVG();
            this.resetView();
            this.showMap();
            await this.preloadLoremasterMap();
            
            this.isInitialized = true;
            console.log("✅ Map initialized successfully");
        } catch (error) {
            console.error("❌ Map initialization failed:", error);
            throw error;
        }
    }

    async loadMapImage() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Map loading timeout"));
            }, 10000);

            this.dom.mapImage.onload = () => {
                clearTimeout(timeout);
                resolve();
            };

            this.dom.mapImage.onerror = () => {
                clearTimeout(timeout);
                reject(new Error("Failed to load map image"));
            };

            this.dom.mapImage.src = CONFIG.MAP.PLAYER_URL;
        });
    }

    initializeMapDimensions() {
        if (this.dom.mapImage.naturalWidth === 0) {
            throw new Error("Map image not loaded properly");
        }

        AppState.mapDimensions.width = this.dom.mapImage.naturalWidth;
        AppState.mapDimensions.height = this.dom.mapImage.naturalHeight;

        this.dom.mapContainer.style.width = `${AppState.mapDimensions.width}px`;
        this.dom.mapContainer.style.height = `${AppState.mapDimensions.height}px`;

        console.log("📐 Map dimensions:", AppState.mapDimensions.width, "x", AppState.mapDimensions.height);
    }

    setupCanvas() {
        this.dom.drawingCanvas.width = AppState.mapDimensions.width;
        this.dom.drawingCanvas.height = AppState.mapDimensions.height;
        
        this.dom.ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        this.dom.ctx.lineWidth = 5;
        this.dom.ctx.lineCap = 'round';
        this.dom.ctx.lineJoin = 'round';
    }

    setupSVG() {
        this.dom.regionsLayer.setAttribute('width', AppState.mapDimensions.width);
        this.dom.regionsLayer.setAttribute('height', AppState.mapDimensions.height);
        this.dom.regionsLayer.setAttribute('viewBox', `0 0 ${AppState.mapDimensions.width} ${AppState.mapDimensions.height}`);
    }

    resetView() {
        const viewportWidth = this.dom.viewport.clientWidth;
        if (viewportWidth === 0 || AppState.mapDimensions.width === 0) return;

        AppState.transform.scale = viewportWidth / AppState.mapDimensions.width;
        AppState.transform.panX = 0;
        AppState.transform.panY = 0;
        this.applyTransform();
    }

    applyTransform() {
        const { scale, panX, panY } = AppState.transform;
        this.dom.mapContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }

    showMap() {
        requestAnimationFrame(() => {
            this.dom.mapImage.classList.remove('opacity-0');
            this.dom.loaderOverlay.style.opacity = '0';
            setTimeout(() => {
                this.dom.loaderOverlay.style.display = 'none';
            }, 500);
        });
    }

    async preloadLoremasterMap() {
        return new Promise((resolve) => {
            const lmImage = new Image();
            lmImage.onload = () => {
                console.log("✅ Loremaster map preloaded.");
                this.dom.loremasterMapImage.src = CONFIG.MAP.LOREMASTER_URL;
                this.dom.mapSwitchBtn.classList.remove('hidden');
                resolve();
            };
            lmImage.onerror = () => {
                console.error("Failed to preload Loremaster map.");
                resolve(); // Continue even if loremaster map fails
            };
            lmImage.src = CONFIG.MAP.LOREMASTER_URL;
        });
    }

    switchMapView() {
        AppState.isPlayerView = !AppState.isPlayerView;
        const icon = this.dom.mapSwitchBtn.querySelector('i');
        
        if (AppState.isPlayerView) {
            this.dom.mapImage.style.opacity = '1';
            this.dom.loremasterMapImage.style.opacity = '0';
            icon.className = 'fas fa-book-open';
            this.dom.mapSwitchBtn.title = "Vue Gardien";
        } else {
            this.dom.mapImage.style.opacity = '0';
            this.dom.loremasterMapImage.style.opacity = '1';
            icon.className = 'fas fa-users';
            this.dom.mapSwitchBtn.title = "Vue Joueurs";
        }
    }

    updatePointerEvents() {
        if (AppState.modes.isDrawingMode) {
            this.dom.drawingCanvas.style.pointerEvents = 'auto';
        } else {
            this.dom.drawingCanvas.style.pointerEvents = 'none';
        }
    }

    getCanvasCoordinates(event) {
        const rect = this.dom.mapContainer.getBoundingClientRect();
        const x = (event.clientX - rect.left) / AppState.transform.scale;
        const y = (event.clientY - rect.top) / AppState.transform.scale;
        return { x, y };
    }

    clearCanvas() {
        this.dom.ctx.clearRect(0, 0, this.dom.drawingCanvas.width, this.dom.drawingCanvas.height);
    }

    drawPath(points) {
        if (points.length === 0) return;

        this.clearCanvas();
        this.dom.ctx.beginPath();
        this.dom.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            this.dom.ctx.lineTo(points[i].x, points[i].y);
        }
        this.dom.ctx.stroke();
    }
}
