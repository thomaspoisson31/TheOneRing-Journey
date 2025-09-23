// ====================================
// FONCTIONS DE VOYAGE ET TRACÉ
// ====================================
// Ce fichier contient toutes les fonctions liées aux voyages, tracés de parcours
// et découvertes de régions et lieux

// ====================================
// VARIABLES GLOBALES DE VOYAGE
// ====================================

        // --- Journey tracking ---
        let journeyPath = [];
        let traversedRegions = new Set();
        let nearbyLocations = new Set();
        const PROXIMITY_DISTANCE = 50;
        let journeyDiscoveries = []; // Chronological list of discoveries (regions and locations)

        // --- Path tracking ---
        let totalPathPixels = 0, lastPoint = null, startPoint = null;

        // --- Voyage Segments ---
        let voyageSegments = [];
        let currentSegmentIndex = -1;
        let isVoyageActive = false;
        let activatedSegments = new Set(); // Track which segments have been activated

// ====================================
// FONCTIONS PRINCIPALES DE TRACÉ
// ====================================

function startDrawingFromLocation(event, location) {
    console.log("🎯 Starting drawing from location:", location.name);

    // Convert location coordinates to canvas coordinates
    const canvasCoords = {
        x: location.coordinates.x,
        y: location.coordinates.y
    };

    console.log("📍 Canvas coordinates:", canvasCoords);

    // Clear any existing drawing
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

    // Reset journey tracking
    journeyPath = [];
    traversedRegions.clear();
    nearbyLocations.clear();
    journeyDiscoveries = [];

    // Start drawing from this location
    isDrawing = true;
    totalPathPixels = 0;
    startPoint = canvasCoords;
    lastPoint = canvasCoords;

    // Add start point to journey path
    journeyPath.push({x: canvasCoords.x, y: canvasCoords.y});

    // Draw a small circle to show the starting point
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Begin the path again for the line
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);

    // Update distance display
    updateDistanceDisplay();

    // Show distance container
    distanceContainer.classList.remove('hidden');

    console.log("✅ Drawing started successfully");
}

function getCanvasCoordinates(event) { 
    const rect = mapContainer.getBoundingClientRect(); 
    const x = (event.clientX - rect.left) / scale; 
    const y = (event.clientY - rect.top) / scale; 
    return { x, y }; 
}

function updateDistanceDisplay() {
    const voyageBtn = document.getElementById('voyage-segments-btn');

    if (totalPathPixels === 0 || MAP_WIDTH === 0) {
        distanceContainer.classList.add('hidden');
        if (voyageBtn) voyageBtn.classList.add('hidden');
        return;
    }
    distanceContainer.classList.remove('hidden');
    if (voyageBtn) voyageBtn.classList.remove('hidden');

    const miles = totalPathPixels * (MAP_DISTANCE_MILES / MAP_WIDTH);
    const days = miles / 20;
    const roundedDays = Math.ceil(days * 2) / 2;
    distanceDisplay.innerHTML = `<strong>${Math.round(miles)}</strong> miles &nbsp;&nbsp;|&nbsp;&nbsp; <strong>${roundedDays.toFixed(1)}</strong> jours`;
    updateJourneyInfo();
}

function resetVoyageSegments() {
    voyageSegments = [];
    currentSegmentIndex = -1;
    isVoyageActive = false;
    activatedSegments.clear();
    console.log("🔄 Voyage segments reset");
}

// ====================================
// SUIVI DES DÉCOUVERTES
// ====================================

function updateJourneyInfo() {
    updateDiscoveriesChronologically();
    displayJourneyInfo();
}

function updateDiscoveriesChronologically() {
    // Track region segments for duration calculation
    let regionSegments = new Map(); // region name -> {entryIndex, exitIndex}
    let currentRegions = new Set(); // regions currently being traversed

    // Track location proximity types
    let locationProximityTypes = new Map(); // location name -> 'traversed' or 'nearby'

    // Process each point in the journey path to maintain chronological order
    for (let i = 0; i < journeyPath.length; i++) {
        const currentPoint = journeyPath[i];

        // Check which regions this point is in
        let pointRegions = new Set();
        regionsData.regions.forEach(region => {
            if (region.points && region.points.length >= 3) {
                if (isPointInPolygon(currentPoint, region.points)) {
                    pointRegions.add(region.name);

                    if (!traversedRegions.has(region.name)) {
                        traversedRegions.add(region.name);
                        // Add to chronological discoveries if not already present
                        if (!journeyDiscoveries.some(d => d.name === region.name && d.type === 'region')) {
                            journeyDiscoveries.push({
                                name: region.name,
                                type: 'region',
                                discoveryIndex: i
                            });
                        }
                        // Mark entry point for this region
                        regionSegments.set(region.name, {entryIndex: i, exitIndex: i});
                    } else {
                        // Update exit point for this region
                        let segment = regionSegments.get(region.name);
                        if (segment) {
                            segment.exitIndex = i;
                        }
                    }
                }
            }
        });

        // Check for regions we're exiting
        currentRegions.forEach(regionName => {
            if (!pointRegions.has(regionName)) {
                // We've exited this region, finalize its segment
                let segment = regionSegments.get(regionName);
                if (segment) {
                    segment.exitIndex = i - 1; // Previous point was the last point in region
                }
            }
        });

        currentRegions = pointRegions;

        // Check locations at this point
        locationsData.locations.forEach(location => {
            if (!location.coordinates || typeof location.coordinates.x === 'undefined' || typeof location.coordinates.y === 'undefined') {
                return;
            }

            const distance = Math.sqrt(
                Math.pow(location.coordinates.x - currentPoint.x, 2) +
                Math.pow(location.coordinates.y - currentPoint.y, 2)
            );

            if (distance <= PROXIMITY_DISTANCE) {
                if (!nearbyLocations.has(location.name)) {
                    nearbyLocations.add(location.name);

                    // Determine proximity type based on distance
                    let proximityType = 'nearby'; // default for 11-50 pixels
                    if (distance <= 10) {
                        proximityType = 'traversed'; // 0-10 pixels
                    }

                    // If location already exists with 'nearby', upgrade to 'traversed' if applicable
                    const existingType = locationProximityTypes.get(location.name);
                    if (!existingType || (existingType === 'nearby' && proximityType === 'traversed')) {
                        locationProximityTypes.set(location.name, proximityType);
                    }

                    // Add to chronological discoveries if not already present
                    if (!journeyDiscoveries.some(d => d.name === location.name && d.type === 'location')) {
                        journeyDiscoveries.push({
                            name: location.name,
                            type: 'location',
                            discoveryIndex: i,
                            proximityType: locationProximityTypes.get(location.name)
                        });
                    } else {
                        // Update existing discovery with new proximity type if better
                        const existingDiscovery = journeyDiscoveries.find(d => d.name === location.name && d.type === 'location');
                        if (existingDiscovery) {
                            existingDiscovery.proximityType = locationProximityTypes.get(location.name);
                        }
                    }
                } else {
                    // Location already discovered, but check if we need to upgrade proximity type
                    let proximityType = 'nearby';
                    if (distance <= 10) {
                        proximityType = 'traversed';
                    }

                    const existingType = locationProximityTypes.get(location.name);
                    if (existingType === 'nearby' && proximityType === 'traversed') {
                        locationProximityTypes.set(location.name, proximityType);
                        // Update existing discovery
                        const existingDiscovery = journeyDiscoveries.find(d => d.name === location.name && d.type === 'location');
                        if (existingDiscovery) {
                            existingDiscovery.proximityType = proximityType;
                        }
                    }
                }
            }
        });
    }

    // Store region segments and location proximity types for duration calculation
    window.regionSegments = regionSegments;
    window.locationProximityTypes = locationProximityTypes;
}

function checkRegionTraversal(point) {
    regionsData.regions.forEach(region => {
        if (region.points && region.points.length >= 3) {
            if (isPointInPolygon(point, region.points)) {
                if (!traversedRegions.has(region.name)) {
                    addDiscovery(region, 'region', journeyPath.length - 1);
                    traversedRegions.add(region.name);
                }
            }
        }
    });
}

function checkNearbyLocations(point) {
    locationsData.locations.forEach(location => {
        if (!location.coordinates) return;

        const distance = Math.sqrt(
            Math.pow(location.coordinates.x - point.x, 2) +
            Math.pow(location.coordinates.y - point.y, 2)
        );

        if (distance <= PROXIMITY_DISTANCE && !nearbyLocations.has(location.name)) {
            const proximityType = distance <= 10 ? 'traversed' : 'nearby';
            addDiscovery(location, 'location', journeyPath.length - 1, proximityType);
            nearbyLocations.add(location.name);
        }
    });
}

function addDiscovery(item, type, index, proximityType = null) {
    const discovery = {
        name: item.name,
        type: type,
        discoveryIndex: index
    };
    
    if (proximityType) {
        discovery.proximityType = proximityType;
    }

    // Add to chronological discoveries if not already present
    if (!journeyDiscoveries.some(d => d.name === item.name && d.type === type)) {
        journeyDiscoveries.push(discovery);
    }
}

function highlightDiscoveryOnMap(discoveryName, discoveryType, highlight) {
    if (discoveryType === 'location') {
        // Find and highlight location marker
        const locationMarkers = document.querySelectorAll('.location-marker');
        locationMarkers.forEach(marker => {
            const locationId = parseInt(marker.dataset.id, 10);
            const location = locationsData.locations.find(loc => loc.id === locationId);

            if (location && location.name === discoveryName) {
                if (highlight) {
                    marker.style.borderColor = '#60a5fa'; // Light blue
                    marker.style.borderWidth = '6px';
                    marker.style.zIndex = '1000';
                } else {
                    // Restore original border
                    marker.style.borderColor = location.visited ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                    marker.style.borderWidth = '4px';
                    marker.style.zIndex = '';
                }
            }
        });
    } else if (discoveryType === 'region') {
        // Find and highlight region path
        const regionPaths = regionsLayer.querySelectorAll('.region');
        regionPaths.forEach(path => {
            const regionId = parseInt(path.dataset.regionId, 10);
            const region = regionsData.regions.find(reg => reg.id === regionId);

            if (region && region.name === discoveryName) {
                if (highlight) {
                    path.style.stroke = '#1e40af'; // Dark blue
                    path.style.strokeWidth = '6'; // Thicker border
                    path.style.zIndex = '1000';
                } else {
                    // Restore original stroke
                    path.style.stroke = colorMap[region.color] || colorMap.green;
                    path.style.strokeWidth = '2';
                    path.style.zIndex = '';
                }
            }
        });
    }
}

// ====================================
// GESTION DES SEGMENTS DE VOYAGE
// ====================================

function generateVoyageSegments() {
    if (!journeyPath || journeyPath.length < 2) {
        console.log("📝 Pas assez de points pour générer des segments");
        return [];
    }

    // Cette fonction pourrait être implémentée pour créer des segments basés sur les découvertes
    const segments = [];
    
    // Diviser le voyage en segments logiques basés sur les découvertes
    journeyDiscoveries.forEach((discovery, index) => {
        const startIndex = index === 0 ? 0 : journeyDiscoveries[index - 1].discoveryIndex;
        const endIndex = discovery.discoveryIndex;
        
        if (endIndex > startIndex) {
            segments.push({
                id: index,
                startIndex: startIndex,
                endIndex: endIndex,
                discovery: discovery,
                distance: calculatePathDistance(startIndex, endIndex),
                duration: calculateSegmentDuration({startIndex, endIndex})
            });
        }
    });

    voyageSegments = segments;
    return segments;
}

function calculateSegmentDuration(segment) {
    const distance = calculatePathDistance(segment.startIndex, segment.endIndex);
    const miles = getMilesFromPixels(distance);
    return getDaysFromMiles(miles);
}

function activateVoyageSegment(segmentIndex) {
    if (segmentIndex >= 0 && segmentIndex < voyageSegments.length) {
        currentSegmentIndex = segmentIndex;
        isVoyageActive = true;
        activatedSegments.add(segmentIndex);
        updateVoyageSegmentDisplay(voyageSegments[segmentIndex]);
        console.log(`🎯 Segment ${segmentIndex} activé`);
    }
}

function updateVoyageSegmentDisplay(segment) {
    // Cette fonction pourrait mettre à jour l'affichage du segment actuel
    console.log("📊 Affichage du segment:", segment);
}

function showVoyageSegmentsModal() {
    // Cette fonction pourrait afficher une modal avec tous les segments
    console.log("🗂️ Affichage de la modal des segments");
}

function navigateVoyageSegment(direction) {
    if (direction === 'next' && currentSegmentIndex < voyageSegments.length - 1) {
        activateVoyageSegment(currentSegmentIndex + 1);
    } else if (direction === 'prev' && currentSegmentIndex > 0) {
        activateVoyageSegment(currentSegmentIndex - 1);
    }
}

// ====================================
// FONCTIONS UTILITAIRES
// ====================================

function getMilesFromPixels(pixels) {
    return pixels * (MAP_DISTANCE_MILES / MAP_WIDTH);
}

function getDaysFromMiles(miles) {
    const days = miles / 20; // 20 miles per day
    return Math.round(days * 2) / 2; // Round to nearest half day
}

function isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
            (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
            inside = !inside;
        }
    }
    return inside;
}

function calculatePathDistance(startIndex, endIndex) {
    if (startIndex >= endIndex || startIndex < 0 || endIndex >= journeyPath.length) {
        return 0;
    }

    let distance = 0;
    for (let i = startIndex; i < endIndex; i++) {
        const point1 = journeyPath[i];
        const point2 = journeyPath[i + 1];
        distance += Math.sqrt(
            Math.pow(point2.x - point1.x, 2) +
            Math.pow(point2.y - point1.y, 2)
        );
    }
    return distance;
}

// Fonctions alias pour compatibilité avec la liste fournie
const pixelsToMiles = getMilesFromPixels;
const milesToDays = getDaysFromMiles;

// ====================================
// AFFICHAGE DES INFORMATIONS DE VOYAGE
// ====================================

function getDiscoveryTooltipContent(discoveryName, type) {
    let data;
    if (type === 'location') {
        data = locationsData.locations.find(loc => loc.name === discoveryName);
    } else if (type === 'region') {
        data = regionsData.regions.find(reg => reg.name === discoveryName);
    }

    if (!data) return '';

    let content = '';
    if (data.description) {
        content += `<div><strong>Description :</strong><br>${data.description}</div>`;
    }

    return content;
}

function displayJourneyInfo() {
    const traversedRegionsInfo = document.getElementById('traversed-regions-info');
    const traversedRegionsList = document.getElementById('traversed-regions-list');
    const nearbyLocationsInfo = document.getElementById('nearby-locations-info');
    const nearbyLocationsList = document.getElementById('nearby-locations-list');

    if (!traversedRegionsInfo || !nearbyLocationsInfo) return;

    // Calculer les durées de traversée des régions
    const regionTraversalInfo = calculateRegionTraversalDurations();

    // Séparer les découvertes par type
    const regions = [];
    const locations = [];

    journeyDiscoveries.forEach(discovery => {
        if (discovery.type === 'region') {
            const traversalData = regionTraversalInfo.get(discovery.name);
            if (traversalData) {
                regions.push({
                    name: discovery.name,
                    duration: traversalData.duration,
                    distance: traversalData.distance
                });
            }
        } else if (discovery.type === 'location') {
            locations.push(discovery);
        }
    });

    // Affichage des régions avec durées
    if (regions.length > 0) {
        traversedRegionsInfo.classList.remove('hidden');
        const regionsHtml = regions.map(region => {
            const durationText = region.duration >= 1 ?
                `${region.duration.toFixed(1)} jour${region.duration > 1 ? 's' : ''}` :
                `${Math.round(region.duration * 24)} heures`;
            const distanceText = `(${Math.round(region.distance)} miles)`;

            return `<div class="mb-1">
                <span class="font-medium">${region.name}</span>
                <span class="text-gray-400 text-xs ml-2">${durationText} ${distanceText}</span>
            </div>`;
        }).join('');
        traversedRegionsList.innerHTML = regionsHtml;
    } else {
        traversedRegionsInfo.classList.add('hidden');
    }

    // Affichage des lieux
    if (locations.length > 0) {
        nearbyLocationsInfo.classList.remove('hidden');
        const locationsHtml = locations.map(location => {
            const proximityText = location.proximityType === 'traversed' ? '(traversé)' : '(à proximité)';
            return `<div class="mb-1">
                <span class="font-medium">${location.name}</span>
                <span class="text-gray-400 text-xs ml-2">${proximityText}</span>
            </div>`;
        }).join('');
        nearbyLocationsList.innerHTML = locationsHtml;
    } else {
        nearbyLocationsInfo.classList.add('hidden');
    }

    // Affichage chronologique alternatif
    const chronologicalDiscoveries = journeyDiscoveries.sort((a, b) => a.discoveryIndex - b.discoveryIndex);

    if (chronologicalDiscoveries.length > 0) {
        // Calculate travel times for each discovery
        const discoveryElements = chronologicalDiscoveries.map((discovery, index) => {
            const icon = discovery.type === 'region' ? '🗺️' : '📍';

            // Calculate reach time for this discovery
            let startIndex = 0;
            if (index > 0) {
                // Find the end point of the previous discovery
                const prevDiscovery = chronologicalDiscoveries[index - 1];
                if (prevDiscovery.type === 'region' && window.regionSegments) {
                    const segment = window.regionSegments.get(prevDiscovery.name);
                    startIndex = segment ? segment.exitIndex : prevDiscovery.discoveryIndex;
                } else {
                    startIndex = prevDiscovery.discoveryIndex;
                }
            }

            const reachDistance = calculatePathDistance(startIndex, discovery.discoveryIndex);
            const reachMiles = pixelsToMiles(reachDistance);
            const reachDays = milesToDays(reachMiles);

            // Check if this is a starting location (close to journey start)
            let travelInfo;
            if (discovery.type === 'location' && startPoint && discovery.discoveryIndex === 0) {
                // Find the actual location to check distance from start point
                const location = locationsData.locations.find(loc => loc.name === discovery.name);
                if (location && location.coordinates) {
                    const distanceFromStart = Math.sqrt(
                        Math.pow(location.coordinates.x - startPoint.x, 2) +
                        Math.pow(location.coordinates.y - startPoint.y, 2)
                    );
                    if (distanceFromStart <= 20) {
                        travelInfo = "(point de départ)";
                    } else {
                        // Add proximity information for locations
                        let proximityText = '';
                        if (discovery.proximityType === 'traversed') {
                            proximityText = ', traversé';
                        } else if (discovery.proximityType === 'nearby') {
                            proximityText = ', passage à proximité';
                        }
                        travelInfo = `(atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}${proximityText})`;
                    }
                } else {
                    // Add proximity information for locations
                    let proximityText = '';
                    if (discovery.proximityType === 'traversed') {
                        proximityText = ', traversé';
                    } else if (discovery.proximityType === 'nearby') {
                        proximityText = ', passage à proximité';
                    }
                    travelInfo = `(atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}${proximityText})`;
                }
            } else {
                // Add proximity information for locations
                let proximityText = '';
                if (discovery.type === 'location') {
                    if (discovery.proximityType === 'traversed') {
                        proximityText = ', traversé';
                    } else if (discovery.proximityType === 'nearby') {
                        proximityText = ', passage à proximité';
                    }
                }
                travelInfo = `(atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}${proximityText})`;
            }

            return `
                <div class="discovery-item discovery-${discovery.type} flex items-center justify-between p-2 mb-2 bg-gray-800 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-700" 
                     data-discovery-name="${discovery.name}" 
                     data-discovery-type="${discovery.type}"
                     onclick="openDiscoveryDetail('${discovery.name}', '${discovery.type}')">
                    <div class="flex items-center space-x-3">
                        <span class="text-xl">${icon}</span>
                        <div>
                            <div class="font-medium text-white">${discovery.name}</div>
                            <div class="text-xs text-gray-400">${travelInfo}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Update both sections with the chronological view
        if (traversedRegionsInfo && nearbyLocationsInfo) {
            const regionsTitle = traversedRegionsInfo.querySelector('h4');
            if (regionsTitle) {
                regionsTitle.textContent = 'Découvertes du voyage :';
            }

            // Show only the regions section with all discoveries
            traversedRegionsInfo.classList.remove('hidden');
            nearbyLocationsInfo.classList.add('hidden');
            traversedRegionsList.innerHTML = discoveryElements;

            console.log("🌟 Journey discoveries (chronological):", chronologicalDiscoveries.map(d => `${d.type}: ${d.name}`));
        }
    } else {
        traversedRegionsInfo.classList.add('hidden');
        nearbyLocationsInfo.classList.add('hidden');
        console.log("🌟 No discoveries made");
    }
}

function calculateRegionTraversalDurations() {
    const regionTraversalInfo = new Map();

    if (!journeyPath || journeyPath.length < 2 || !regionsData || !regionsData.regions) {
        return regionTraversalInfo;
    }

    // Variables pour suivre l'état de traversée
    let currentRegionsActive = new Map(); // regionName -> {entryIndex, pixelDistance}
    let previousRegions = new Set();

    console.log("🔧 [REGION DURATION] Début du calcul séquentiel pour", journeyPath.length, "points");

    // Parcourir séquentiellement chaque point du tracé (logique étapes 1-5)
    for (let z = 0; z < journeyPath.length; z++) {
        const currentPoint = journeyPath[z];
        const currentRegions = new Set();

        // Étape 1 : Identifier dans quelles régions se trouve le point actuel
        regionsData.regions.forEach(region => {
            if (region.points && region.points.length >= 3) {
                if (isPointInPolygon(currentPoint, region.points)) {
                    currentRegions.add(region.name);
                }
            }
        });

        // Étape 2 : Détecter les changements de région (entrée/sortie)
        currentRegions.forEach(regionName => {
            if (!previousRegions.has(regionName)) {
                // Étape 2 : Entrée dans une nouvelle région A
                console.log(`🔧 [REGION DURATION] Point ${z}: Entrée dans région ${regionName}`);

                // Si un calcul d'une autre région était en cours, le finaliser
                currentRegionsActive.forEach((data, activeRegionName) => {
                    if (activeRegionName !== regionName) {
                        console.log(`🔧 [REGION DURATION] Finalisation région ${activeRegionName} (interrompue par ${regionName})`);
                        finalizeRegionDuration(activeRegionName, data, z - 1, regionTraversalInfo);
                    }
                });

                // Étape 3 : Mémoriser le point d'entrée (x,y,z)
                currentRegionsActive.set(regionName, {
                    entryIndex: z,
                    pixelDistance: 0
                });
            }
        });

        // Détecter les sorties de région
        previousRegions.forEach(regionName => {
            if (!currentRegions.has(regionName)) {
                // Sortie de région
                console.log(`🔧 [REGION DURATION] Point ${z}: Sortie de région ${regionName}`);

                if (currentRegionsActive.has(regionName)) {
                    const regionData = currentRegionsActive.get(regionName);
                    finalizeRegionDuration(regionName, regionData, z - 1, regionTraversalInfo);
                    currentRegionsActive.delete(regionName);
                }
            }
        });

        // Étape 4-5 : Pour chaque région active, calculer la distance du segment précédent
        if (z > 0) {
            const previousPoint = journeyPath[z - 1];

            currentRegionsActive.forEach((data, regionName) => {
                if (currentRegions.has(regionName)) {
                    // Étape 5a : La région continue, incrémenter la distance
                    const segmentDistance = Math.sqrt(
                        Math.pow(currentPoint.x - previousPoint.x, 2) +
                        Math.pow(currentPoint.y - previousPoint.y, 2)
                    );

                    data.pixelDistance += segmentDistance;
                    console.log(`🔧 [REGION DURATION] Région ${regionName}: +${segmentDistance.toFixed(1)} pixels (total: ${data.pixelDistance.toFixed(1)})`);
                }
            });
        }

        // Mise à jour pour le prochain tour
        previousRegions = new Set(currentRegions);
    }

    // Finaliser toutes les régions encore actives à la fin du tracé
    currentRegionsActive.forEach((data, regionName) => {
        console.log(`🔧 [REGION DURATION] Finalisation région ${regionName} (fin de tracé)`);
        finalizeRegionDuration(regionName, data, journeyPath.length - 1, regionTraversalInfo);
    });

    console.log("🔧 [REGION DURATION] Résultats finaux:", regionTraversalInfo);
    return regionTraversalInfo;
}

function finalizeRegionDuration(regionName, regionData, exitIndex, regionTraversalInfo) {
    // Convertir les pixels en miles puis en jours
    const distanceInMiles = pixelsToMiles(regionData.pixelDistance);
    const durationInDays = milesToDays(distanceInMiles);

    // Arrondir au 0.5 jour le plus proche (minimum 0.5 jour)
    const roundedDuration = Math.max(0.5, Math.round(durationInDays * 2) / 2);

    console.log(`🔧 [REGION DURATION] Région ${regionName}: ${regionData.pixelDistance.toFixed(1)} pixels → ${distanceInMiles.toFixed(1)} miles → ${roundedDuration} jour(s)`);

    regionTraversalInfo.set(regionName, {
        distance: distanceInMiles,
        duration: roundedDuration,
        pixelDistance: regionData.pixelDistance,
        entryIndex: regionData.entryIndex,
        exitIndex: exitIndex
    });
}