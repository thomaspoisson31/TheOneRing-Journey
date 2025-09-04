class JourneyManager {
    constructor(domElements) {
        this.dom = domElements;
    }

    startDrawing(event) {
        if (event.target.closest('.location-marker, #info-box')) return;

        this.dom.ctx.clearRect(0, 0, this.dom.drawingCanvas.width, this.dom.drawingCanvas.height);
        AppState.modes.isDrawing = true;

        // Reset journey tracking
        AppState.journey.path = [];
        AppState.journey.discoveries = [];
        AppState.journey.totalPathPixels = 0;
        AppState.journey.traversedRegions.clear();
        AppState.journey.nearbyLocations.clear();

        const coords = window.mapManager.getCanvasCoordinates(event);
        AppState.journey.startPoint = coords;
        AppState.journey.lastPoint = coords;
        AppState.journey.path.push({x: coords.x, y: coords.y});

        this.dom.ctx.beginPath();
        this.dom.ctx.moveTo(coords.x, coords.y);
        this.updateDistanceDisplay();
        this.dom.distanceContainer.classList.remove('hidden');
    }

    continueDrawing(event) {
        if (!AppState.modes.isDrawing) return;

        const currentPoint = window.mapManager.getCanvasCoordinates(event);
        const segmentLength = Math.sqrt(
            Math.pow(currentPoint.x - AppState.journey.lastPoint.x, 2) +
            Math.pow(currentPoint.y - AppState.journey.lastPoint.y, 2)
        );

        AppState.journey.totalPathPixels += segmentLength;
        AppState.journey.path.push({x: currentPoint.x, y: currentPoint.y});
        AppState.journey.lastPoint = currentPoint;

        this.dom.ctx.lineTo(currentPoint.x, currentPoint.y);
        this.dom.ctx.stroke();
        this.updateDistanceDisplay();
    }

    stopDrawing() {
        if (AppState.modes.isDrawing) {
            AppState.modes.isDrawing = false;
            window.dispatchEvent(new CustomEvent('scheduleAutoSync'));
        }
    }

    clearJourney() {
        this.dom.ctx.clearRect(0, 0, this.dom.drawingCanvas.width, this.dom.drawingCanvas.height);
        AppState.journey.totalPathPixels = 0;
        AppState.journey.startPoint = null;
        AppState.journey.lastPoint = null;
        AppState.journey.path = [];
        AppState.journey.discoveries = [];
        AppState.journey.traversedRegions.clear();
        AppState.journey.nearbyLocations.clear();

        this.updateDistanceDisplay();
        window.dispatchEvent(new CustomEvent('scheduleAutoSync'));
    }

    updateDistanceDisplay() {
        if (AppState.journey.totalPathPixels === 0 || AppState.mapDimensions.width === 0) {
            this.dom.distanceContainer.classList.add('hidden');
            return;
        }

        this.dom.distanceContainer.classList.remove('hidden');
        const miles = AppState.journey.totalPathPixels * (CONFIG.MAP.DISTANCE_MILES / AppState.mapDimensions.width);
        const days = miles / CONFIG.JOURNEY.MILES_PER_DAY;
        const roundedDays = Math.ceil(days * 2) / 2;

        this.dom.distanceDisplay.innerHTML = `<strong>${Math.round(miles)}</strong> miles &nbsp;&nbsp;|&nbsp;&nbsp; <strong>${roundedDays.toFixed(1)}</strong> jours`;
        this.updateJourneyInfo();
    }

    updateJourneyInfo() {
        // Update journey discoveries and display
        this.updateDiscoveriesChronologically();
        this.displayJourneyInfo();
        
        // Update voyage segments if the modal is open
        if (window.voyageManager) {
            window.voyageManager.updateDisplay();
        }
    }

    updateDiscoveriesChronologically() {
        // Reset tracking
        AppState.journey.traversedRegions.clear();
        AppState.journey.nearbyLocations.clear();
        AppState.journey.discoveries = [];

        // Track region traversals with segments
        const regionTraversals = new Map(); // regionName -> [segments]
        const discoveredLocations = new Set();

        // First pass: identify all region traversals
        for (let i = 0; i < AppState.journey.path.length; i++) {
            const currentPoint = AppState.journey.path[i];

            AppState.regionsData.regions.forEach(region => {
                if (region.points && region.points.length >= 3) {
                    if (this.isPointInPolygon(currentPoint, region.points)) {
                        AppState.journey.traversedRegions.add(region.name);
                        
                        if (!regionTraversals.has(region.name)) {
                            regionTraversals.set(region.name, []);
                        }
                        
                        const segments = regionTraversals.get(region.name);
                        const lastSegment = segments[segments.length - 1];
                        
                        if (!lastSegment || lastSegment.endIndex < i - 1) {
                            // Start a new segment
                            segments.push({
                                startIndex: i,
                                endIndex: i
                            });
                        } else {
                            // Extend current segment
                            lastSegment.endIndex = i;
                        }
                    }
                }
            });
        }

        // Second pass: add region discoveries with duration
        regionTraversals.forEach((segments, regionName) => {
            segments.forEach(segment => {
                AppState.journey.discoveries.push({
                    name: regionName,
                    type: 'region',
                    discoveryIndex: segment.startIndex,
                    startIndex: segment.startIndex,
                    endIndex: segment.endIndex
                });
            });
        });

        // Third pass: add location discoveries
        for (let i = 0; i < AppState.journey.path.length; i++) {
            const currentPoint = AppState.journey.path[i];

            AppState.locationsData.locations.forEach(location => {
                if (!location.coordinates) return;

                const distance = Math.sqrt(
                    Math.pow(location.coordinates.x - currentPoint.x, 2) +
                    Math.pow(location.coordinates.y - currentPoint.y, 2)
                );

                if (distance <= CONFIG.JOURNEY.PROXIMITY_DISTANCE) {
                    AppState.journey.nearbyLocations.add(location.name);

                    // Only add to discoveries if not already discovered
                    if (!discoveredLocations.has(location.name)) {
                        discoveredLocations.add(location.name);
                        const proximityType = distance <= 10 ? 'traversed' : 'nearby';
                        AppState.journey.discoveries.push({
                            name: location.name,
                            type: 'location',
                            discoveryIndex: i,
                            proximityType: proximityType
                        });
                    }
                }
            });
        }
    }

    isPointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
                (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    }

    displayJourneyInfo() {
        const traversedRegionsInfo = this.dom.traversedRegionsInfo;
        const traversedRegionsList = this.dom.traversedRegionsList;
        const nearbyLocationsInfo = this.dom.nearbyLocationsInfo;

        if (AppState.journey.discoveries.length > 0) {
            const chronologicalDiscoveries = AppState.journey.discoveries.sort((a, b) => a.discoveryIndex - b.discoveryIndex);
            
            // Calculate total journey distance and duration
            const totalMiles = AppState.journey.totalPathPixels * (CONFIG.MAP.DISTANCE_MILES / AppState.mapDimensions.width);
            const totalPathPoints = AppState.journey.path.length;

            const discoveryElements = chronologicalDiscoveries.map((discovery) => {
                const icon = discovery.type === 'region' ? '🗺️' : '📍';
                
                let displayText = '';

                if (discovery.proximityType) {
                    const proximityText = discovery.proximityType === 'traversed' ? 'traversé' : 'passage à proximité';
                    displayText = `${icon} ${discovery.name} (${proximityText})`;
                } else if (discovery.type === 'region') {
                    // Calculate duration for this region traversal
                    const segmentLength = discovery.endIndex - discovery.startIndex + 1;
                    const segmentRatio = segmentLength / totalPathPoints;
                    const segmentMiles = totalMiles * segmentRatio;
                    const segmentDays = Math.max(1, Math.ceil(segmentMiles / CONFIG.JOURNEY.MILES_PER_DAY));
                    
                    displayText = `${icon} ${discovery.name} (${segmentDays} jour${segmentDays > 1 ? 's' : ''})`;
                } else {
                    displayText = `${icon} ${discovery.name}`;
                }

                return `<span class="discovery-item clickable-discovery" data-discovery-name="${discovery.name}" data-discovery-type="${discovery.type}">${displayText}</span>`;
            });

            traversedRegionsInfo.classList.remove('hidden');
            traversedRegionsList.innerHTML = discoveryElements.join('<br>');
            nearbyLocationsInfo.classList.add('hidden');

            const regionsTitle = traversedRegionsInfo.querySelector('.font-semibold');
            if (regionsTitle) {
                regionsTitle.textContent = 'Découvertes du voyage :';
                regionsTitle.className = 'font-semibold text-blue-400 mb-1';
            }
        } else {
            traversedRegionsInfo.classList.add('hidden');
            nearbyLocationsInfo.classList.add('hidden');
        }
    }
}