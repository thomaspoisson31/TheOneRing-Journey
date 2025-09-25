// js/features/journey.js

function updateDistanceDisplay() {
    const voyageBtn = DOM.getElementById('voyage-segments-btn');
    if (AppState.totalPathPixels === 0 || AppState.mapWidth === 0) {
        DOM.distanceContainer.classList.add('hidden');
        if (voyageBtn) voyageBtn.classList.add('hidden');
        return;
    }
    DOM.distanceContainer.classList.remove('hidden');
    if (voyageBtn) voyageBtn.classList.remove('hidden');

    const miles = pixelsToMiles(AppState.totalPathPixels);
    const days = milesToDays(miles);
    DOM.distanceDisplay.innerHTML = `<strong>${Math.round(miles)}</strong> miles &nbsp;&nbsp;|&nbsp;&nbsp; <strong>${days.toFixed(1)}</strong> jours`;
    updateJourneyInfo();
}

function updateJourneyInfo() {
    updateDiscoveriesChronologically();
    displayJourneyInfo();
}

function updateDiscoveriesChronologically() {
    let regionSegments = new Map();
    let currentRegions = new Set();
    let locationProximityTypes = new Map();
    AppState.journeyDiscoveries = [];
    AppState.traversedRegions.clear();
    AppState.nearbyLocations.clear();

    for (let i = 0; i < AppState.journeyPath.length; i++) {
        const currentPoint = AppState.journeyPath[i];
        let pointRegions = new Set();

        AppState.regionsData.regions.forEach(region => {
            if (region.points && isPointInPolygon(currentPoint, region.points)) {
                pointRegions.add(region.name);
                if (!AppState.traversedRegions.has(region.name)) {
                    AppState.traversedRegions.add(region.name);
                    if (!AppState.journeyDiscoveries.some(d => d.name === region.name && d.type === 'region')) {
                        AppState.journeyDiscoveries.push({ name: region.name, type: 'region', discoveryIndex: i });
                    }
                    regionSegments.set(region.name, { entryIndex: i, exitIndex: i });
                } else {
                    let segment = regionSegments.get(region.name);
                    if (segment) segment.exitIndex = i;
                }
            }
        });

        currentRegions.forEach(regionName => {
            if (!pointRegions.has(regionName)) {
                let segment = regionSegments.get(regionName);
                if (segment) segment.exitIndex = i - 1;
            }
        });
        currentRegions = pointRegions;

        AppState.locationsData.locations.forEach(location => {
            if (!location.coordinates) return;
            const distance = Math.sqrt(Math.pow(location.coordinates.x - currentPoint.x, 2) + Math.pow(location.coordinates.y - currentPoint.y, 2));
            if (distance <= AppConfig.PROXIMITY_DISTANCE) {
                let proximityType = distance <= 10 ? 'traversed' : 'nearby';
                if (!AppState.nearbyLocations.has(location.name)) {
                    AppState.nearbyLocations.add(location.name);
                    locationProximityTypes.set(location.name, proximityType);
                    if (!AppState.journeyDiscoveries.some(d => d.name === location.name && d.type === 'location')) {
                        AppState.journeyDiscoveries.push({ name: location.name, type: 'location', discoveryIndex: i, proximityType: proximityType });
                    }
                } else {
                    const existingType = locationProximityTypes.get(location.name);
                    if (existingType === 'nearby' && proximityType === 'traversed') {
                        locationProximityTypes.set(location.name, proximityType);
                        const existingDiscovery = AppState.journeyDiscoveries.find(d => d.name === location.name);
                        if (existingDiscovery) existingDiscovery.proximityType = proximityType;
                    }
                }
            }
        });
    }
    window.regionSegments = regionSegments;
    window.locationProximityTypes = locationProximityTypes;
}

function displayJourneyInfo() {
    const traversedRegionsInfo = DOM.getElementById('traversed-regions-info');
    const traversedRegionsList = DOM.getElementById('traversed-regions-list');
    const nearbyLocationsInfo = DOM.getElementById('nearby-locations-info');
    const nearbyLocationsList = DOM.getElementById('nearby-locations-list');

    const regions = AppState.journeyDiscoveries.filter(d => d.type === 'region');
    const locations = AppState.journeyDiscoveries.filter(d => d.type === 'location');

    if (regions.length > 0) {
        traversedRegionsInfo.classList.remove('hidden');
        traversedRegionsList.innerHTML = regions.map(r => `<div>${r.name}</div>`).join('');
    } else {
        traversedRegionsInfo.classList.add('hidden');
    }

    if (locations.length > 0) {
        nearbyLocationsInfo.classList.remove('hidden');
        nearbyLocationsList.innerHTML = locations.map(l => `<div>${l.name} <span class="text-gray-400 text-xs">(${l.proximityType})</span></div>`).join('');
    } else {
        nearbyLocationsInfo.classList.add('hidden');
    }
}


function startDrawing(event) {
    if (event.target.closest('.location-marker, #info-box')) return;

    event.preventDefault();
    event.stopPropagation();

    DOM.ctx.clearRect(0, 0, DOM.drawingCanvas.width, DOM.drawingCanvas.height);
    AppState.isDrawing = true;
    AppState.totalPathPixels = 0;
    AppState.journeyPath = [];
    AppState.traversedRegions.clear();
    AppState.nearbyLocations.clear();
    AppState.journeyDiscoveries = [];

    resetVoyageSegments();

    AppState.startPoint = getCanvasCoordinates(event);
    AppState.lastPoint = AppState.startPoint;
    AppState.journeyPath.push({ x: AppState.startPoint.x, y: AppState.startPoint.y });

    DOM.ctx.beginPath();
    DOM.ctx.moveTo(AppState.lastPoint.x, AppState.lastPoint.y);
    updateDistanceDisplay();
    DOM.distanceContainer.classList.remove('hidden');
}

function draw(event) {
    if (!AppState.isDrawing || !AppState.isDrawingMode) return;
    const currentPoint = getCanvasCoordinates(event);
    const segmentLength = Math.sqrt(Math.pow(currentPoint.x - AppState.lastPoint.x, 2) + Math.pow(currentPoint.y - AppState.lastPoint.y, 2));
    AppState.totalPathPixels += segmentLength;
    AppState.journeyPath.push({ x: currentPoint.x, y: currentPoint.y });
    AppState.lastPoint = currentPoint;
    DOM.ctx.lineTo(currentPoint.x, currentPoint.y);
    DOM.ctx.stroke();
    updateDistanceDisplay();
}

function stopDrawing() {
    if (AppState.isDrawing) {
        AppState.isDrawing = false;
        scheduleAutoSync();
    }
}

function eraseDrawing() {
    DOM.ctx.clearRect(0, 0, DOM.drawingCanvas.width, DOM.drawingCanvas.height);
    AppState.totalPathPixels = 0;
    AppState.startPoint = null;
    AppState.lastPoint = null;
    AppState.journeyPath = [];
    AppState.traversedRegions.clear();
    AppState.nearbyLocations.clear();
    AppState.journeyDiscoveries = [];
    resetVoyageSegments();

    const voyageBtn = DOM.getElementById('voyage-segments-btn');
    if (voyageBtn) voyageBtn.classList.add('hidden');

    updateDistanceDisplay();
    scheduleAutoSync();
}

function redrawJourneyPath() {
    if (AppState.journeyPath.length > 0) {
        DOM.ctx.clearRect(0, 0, DOM.drawingCanvas.width, DOM.drawingCanvas.height);
        DOM.ctx.beginPath();
        DOM.ctx.moveTo(AppState.journeyPath[0].x, AppState.journeyPath[0].y);
        for (let i = 1; i < AppState.journeyPath.length; i++) {
            DOM.ctx.lineTo(AppState.journeyPath[i].x, AppState.journeyPath[i].y);
        }
        DOM.ctx.stroke();
    }
}

function resetVoyageSegments() {
    AppState.currentVoyage = null;
    AppState.voyageSegments = [];
    AppState.isVoyageActive = false;
    AppState.currentSegmentIndex = -1;
    AppState.activatedSegments.clear();
}