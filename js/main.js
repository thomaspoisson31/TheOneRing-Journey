
// Configuration globale de la carte
const MAP_WIDTH = 5103;
const MAP_HEIGHT = 3296;
const MAP_DISTANCE_MILES = 600; // Distance totale en miles que représente la carte

// Variables globales
let viewport, mapContainer, mapImage, loremasterMapImage;
let drawingCanvas, ctx;
let locationsLayer, regionsLayer;
let isDrawingMode = false;
let isErasingMode = false;
let journeyPath = [];
let totalPathPixels = 0;
let journeyDiscoveries = [];
let regionSegments = new Map();
let locationsData = { locations: [] };
let regionsData = { regions: [] };
let currentZoom = 1;
let currentPan = { x: 0, y: 0 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let panStart = { x: 0, y: 0 };
let isAddLocationMode = false;
let isAddRegionMode = false;
let currentRegionPoints = [];
let filterState = {
    known: false,
    visited: false,
    colors: [],
    showRegions: true
};

// Variables pour la gestion des saisons et du calendrier
let currentSeason = 'printemps-debut';
let isCalendarMode = false;
let calendarData = [];
let currentCalendarDate = null;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Initialisation de l\'application...');
    
    // Initialiser les éléments DOM
    initializeDOMElements();
    
    // Charger les données
    loadAllData();
    
    // Initialiser les gestionnaires d'événements
    setupEventHandlers();
    
    // Initialiser les composants
    initializeComponents();
    
    console.log('✅ Application initialisée avec succès');
});

function initializeDOMElements() {
    // Éléments principaux
    viewport = document.getElementById('viewport');
    mapContainer = document.getElementById('map-container');
    mapImage = document.getElementById('map-image');
    loremasterMapImage = document.getElementById('loremaster-map-image');
    drawingCanvas = document.getElementById('drawing-canvas');
    locationsLayer = document.getElementById('locations-layer');
    regionsLayer = document.getElementById('regions-layer');
    
    // Canvas pour le dessin
    if (drawingCanvas) {
        ctx = drawingCanvas.getContext('2d');
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
}

async function loadAllData() {
    try {
        // Charger les données de lieux
        await loadLocationsData();
        
        // Charger les données de régions
        await loadRegionsData();
        
        // Charger les cartes
        await loadMaps();
        
        // Charger la saison
        loadSeason();
        
        // Charger le calendrier
        loadCalendar();
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
    }
}

async function loadLocationsData() {
    try {
        const response = await fetch('Landmarks1.json');
        if (response.ok) {
            const data = await response.json();
            locationsData = data;
            console.log('📍 Lieux chargés:', locationsData.locations?.length || 0);
        }
    } catch (error) {
        console.warn('⚠️ Impossible de charger les lieux:', error);
    }
}

async function loadRegionsData() {
    try {
        const response = await fetch('regions.json');
        if (response.ok) {
            const data = await response.json();
            regionsData = data;
            console.log('🗺️ Régions chargées:', regionsData.regions?.length || 0);
        }
    } catch (error) {
        console.warn('⚠️ Impossible de charger les régions:', error);
    }
}

async function loadMaps() {
    const loaderOverlay = document.getElementById('loader-overlay');
    
    try {
        // Charger la carte joueur par défaut
        mapImage.src = 'fr_tor_2nd_eriadors_map_page-0001.webp';
        loremasterMapImage.src = 'fr_tor_2nd_eriadors_map_page_loremaster.webp';
        
        // Attendre le chargement des images
        await Promise.all([
            new Promise((resolve, reject) => {
                mapImage.onload = resolve;
                mapImage.onerror = reject;
            }),
            new Promise((resolve, reject) => {
                loremasterMapImage.onload = resolve;
                loremasterMapImage.onerror = reject;
            })
        ]);
        
        // Configurer les dimensions du canvas
        setupCanvas();
        
        // Afficher la carte joueur par défaut
        mapImage.style.opacity = '1';
        
        // Masquer le loader
        if (loaderOverlay) {
            loaderOverlay.style.display = 'none';
        }
        
        // Rendre les lieux et régions
        renderLocations();
        renderRegions();
        
        console.log('🗺️ Cartes chargées avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des cartes:', error);
        if (loaderOverlay) {
            loaderOverlay.innerHTML = '<div class="text-red-500">Erreur de chargement de la carte</div>';
        }
    }
}

function setupCanvas() {
    if (!drawingCanvas || !mapImage) return;
    
    // Ajuster les dimensions du canvas à la carte
    drawingCanvas.width = mapImage.naturalWidth || MAP_WIDTH;
    drawingCanvas.height = mapImage.naturalHeight || MAP_HEIGHT;
    
    // Configurer le style du canvas
    drawingCanvas.style.width = '100%';
    drawingCanvas.style.height = '100%';
    
    console.log('🎨 Canvas configuré:', drawingCanvas.width, 'x', drawingCanvas.height);
}

function setupEventHandlers() {
    // Gestionnaires de la barre d'outils
    setupToolbarHandlers();
    
    // Gestionnaires du viewport
    setupViewportHandlers();
    
    // Gestionnaires de zoom et pan
    setupZoomPanHandlers();
}

function setupToolbarHandlers() {
    // Mode dessin
    const drawModeBtn = document.getElementById('draw-mode');
    if (drawModeBtn) {
        drawModeBtn.addEventListener('click', toggleDrawMode);
    }
    
    // Effacer
    const eraseBtn = document.getElementById('erase');
    if (eraseBtn) {
        eraseBtn.addEventListener('click', clearPath);
    }
    
    // Mode ajout de lieu
    const addLocationBtn = document.getElementById('add-location-mode');
    if (addLocationBtn) {
        addLocationBtn.addEventListener('click', toggleAddLocationMode);
    }
    
    // Mode ajout de région
    const addRegionBtn = document.getElementById('add-region-mode');
    if (addRegionBtn) {
        addRegionBtn.addEventListener('click', toggleAddRegionMode);
    }
}

function setupViewportHandlers() {
    if (!viewport) return;
    
    // Événements de souris pour le dessin
    viewport.addEventListener('mousedown', handleMouseDown);
    viewport.addEventListener('mousemove', handleMouseMove);
    viewport.addEventListener('mouseup', handleMouseUp);
    
    // Désactiver le menu contextuel
    viewport.addEventListener('contextmenu', (e) => e.preventDefault());
}

function setupZoomPanHandlers() {
    if (!viewport) return;
    
    // Zoom avec la molette
    viewport.addEventListener('wheel', handleWheel, { passive: false });
}

function handleMouseDown(event) {
    event.preventDefault();
    
    const rect = viewport.getBoundingClientRect();
    const x = (event.clientX - rect.left) / currentZoom - currentPan.x / currentZoom;
    const y = (event.clientY - rect.top) / currentZoom - currentPan.y / currentZoom;
    
    if (isDrawingMode) {
        startDrawing(x, y);
    } else if (isAddLocationMode) {
        showAddLocationModal(x, y);
    } else if (isAddRegionMode) {
        addRegionPoint(x, y);
    } else {
        // Mode pan par défaut
        isDragging = true;
        dragStart = { x: event.clientX, y: event.clientY };
        panStart = { x: currentPan.x, y: currentPan.y };
        viewport.style.cursor = 'grabbing';
    }
}

function handleMouseMove(event) {
    if (isDragging && !isDrawingMode) {
        // Pan de la carte
        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;
        
        currentPan.x = panStart.x + deltaX;
        currentPan.y = panStart.y + deltaY;
        
        updateTransform();
    } else if (isDrawingMode && journeyPath.length > 0) {
        const rect = viewport.getBoundingClientRect();
        const x = (event.clientX - rect.left) / currentZoom - currentPan.x / currentZoom;
        const y = (event.clientY - rect.top) / currentZoom - currentPan.y / currentZoom;
        
        continueDrawing(x, y);
    }
}

function handleMouseUp(event) {
    if (isDragging) {
        isDragging = false;
        viewport.style.cursor = 'grab';
    }
}

function handleWheel(event) {
    event.preventDefault();
    
    const rect = viewport.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.1), 3);
    
    if (newZoom !== currentZoom) {
        const zoomRatio = newZoom / currentZoom;
        
        currentPan.x = mouseX - (mouseX - currentPan.x) * zoomRatio;
        currentPan.y = mouseY - (mouseY - currentPan.y) * zoomRatio;
        
        currentZoom = newZoom;
        updateTransform();
    }
}

function updateTransform() {
    if (!mapContainer) return;
    
    mapContainer.style.transform = `translate(${currentPan.x}px, ${currentPan.y}px) scale(${currentZoom})`;
}

function toggleDrawMode() {
    isDrawingMode = !isDrawingMode;
    const btn = document.getElementById('draw-mode');
    
    if (isDrawingMode) {
        btn.classList.add('bg-blue-600');
        btn.classList.remove('bg-gray-700');
        viewport.style.cursor = 'crosshair';
        
        // Désactiver les autres modes
        isAddLocationMode = false;
        isAddRegionMode = false;
        updateToolbarButtons();
    } else {
        btn.classList.remove('bg-blue-600');
        btn.classList.add('bg-gray-700');
        viewport.style.cursor = 'grab';
        
        if (journeyPath.length > 0) {
            calculateJourneyDistance();
        }
    }
}

function startDrawing(x, y) {
    journeyPath = [{ x, y }];
    totalPathPixels = 0;
    journeyDiscoveries = [];
    regionSegments.clear();
    
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    updateJourneyDisplay();
}

function continueDrawing(x, y) {
    if (journeyPath.length === 0) return;
    
    const lastPoint = journeyPath[journeyPath.length - 1];
    const distance = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);
    
    journeyPath.push({ x, y });
    totalPathPixels += distance;
    
    if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    // Vérifier les découvertes en temps réel
    checkDiscoveries(x, y);
    
    updateJourneyDisplay();
}

function clearPath() {
    journeyPath = [];
    totalPathPixels = 0;
    journeyDiscoveries = [];
    regionSegments.clear();
    
    if (ctx) {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }
    
    updateJourneyDisplay();
    hideJourneyInfo();
}

function checkDiscoveries(x, y) {
    // Vérifier les lieux à proximité
    if (locationsData.locations) {
        locationsData.locations.forEach(location => {
            const distance = Math.sqrt((x - location.coordinates.x) ** 2 + (y - location.coordinates.y) ** 2);
            if (distance < 50) { // Seuil de proximité
                const existing = journeyDiscoveries.find(d => d.name === location.name && d.type === 'location');
                if (!existing) {
                    journeyDiscoveries.push({
                        ...location,
                        type: 'location',
                        discoveryIndex: journeyPath.length - 1
                    });
                }
            }
        });
    }
    
    // Vérifier les régions
    if (regionsData.regions) {
        regionsData.regions.forEach(region => {
            if (isPointInRegion(x, y, region)) {
                const existing = journeyDiscoveries.find(d => d.name === region.name && d.type === 'region');
                if (!existing) {
                    journeyDiscoveries.push({
                        ...region,
                        type: 'region',
                        discoveryIndex: journeyPath.length - 1
                    });
                }
            }
        });
    }
}

function isPointInRegion(x, y, region) {
    // Algorithme simple de point dans polygone
    if (!region.points || region.points.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = region.points.length - 1; i < region.points.length; j = i++) {
        if (((region.points[i].y > y) !== (region.points[j].y > y)) &&
            (x < (region.points[j].x - region.points[i].x) * (y - region.points[i].y) / (region.points[j].y - region.points[i].y) + region.points[i].x)) {
            inside = !inside;
        }
    }
    return inside;
}

function calculateJourneyDistance() {
    if (totalPathPixels === 0) return;
    
    const miles = totalPathPixels * (MAP_DISTANCE_MILES / MAP_WIDTH);
    const days = Math.ceil(miles / 20); // 20 miles par jour
    
    showJourneyInfo(miles, days);
}

function showJourneyInfo(miles, days) {
    const distanceInfo = document.getElementById('distance-info');
    const distanceDisplay = document.getElementById('distance-display');
    
    if (distanceInfo && distanceDisplay) {
        distanceDisplay.innerHTML = `
            <div class="text-white font-medium">${Math.round(miles)} miles</div>
            <div class="text-gray-400 text-xs">${days} jour${days > 1 ? 's' : ''} de voyage</div>
        `;
        distanceInfo.classList.remove('hidden');
    }
}

function hideJourneyInfo() {
    const distanceInfo = document.getElementById('distance-info');
    if (distanceInfo) {
        distanceInfo.classList.add('hidden');
    }
}

function updateJourneyDisplay() {
    // Mettre à jour l'affichage des informations de voyage
    if (journeyPath.length > 1) {
        const miles = totalPathPixels * (MAP_DISTANCE_MILES / MAP_WIDTH);
        const days = Math.ceil(miles / 20);
        showJourneyInfo(miles, days);
    }
}

function renderLocations() {
    if (!locationsLayer || !locationsData.locations) return;
    
    locationsLayer.innerHTML = '';
    
    locationsData.locations.forEach(location => {
        if (!shouldShowLocation(location)) return;
        
        const marker = document.createElement('div');
        marker.className = `location-marker location-${location.color || 'blue'}`;
        marker.style.left = `${location.coordinates.x}px`;
        marker.style.top = `${location.coordinates.y}px`;
        marker.dataset.id = location.id;
        marker.title = location.name;
        
        // Icône selon le statut
        let icon = '📍';
        if (location.known && location.visited) {
            icon = '✅';
        } else if (location.known) {
            icon = '👁️';
        }
        
        marker.innerHTML = `<span class="location-icon">${icon}</span>`;
        
        // Événements
        marker.addEventListener('click', showLocationInfo);
        marker.addEventListener('mouseenter', highlightLocation);
        marker.addEventListener('mouseleave', unhighlightLocation);
        
        locationsLayer.appendChild(marker);
    });
    
    console.log('📍 Lieux rendus:', locationsData.locations.length);
}

function renderRegions() {
    if (!regionsLayer || !regionsData.regions) return;
    
    regionsLayer.innerHTML = '';
    
    if (!filterState.showRegions) return;
    
    regionsData.regions.forEach(region => {
        if (!region.points || region.points.length < 3) return;
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = region.points.map(p => `${p.x},${p.y}`).join(' ');
        
        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', region.color || 'rgba(100, 149, 237, 0.3)');
        polygon.setAttribute('stroke', region.color || 'cornflowerblue');
        polygon.setAttribute('stroke-width', '2');
        polygon.classList.add('region-polygon');
        polygon.dataset.name = region.name;
        
        // Événements
        polygon.addEventListener('click', (e) => showRegionInfo(e, region));
        
        regionsLayer.appendChild(polygon);
    });
    
    console.log('🗺️ Régions rendues:', regionsData.regions.length);
}

function shouldShowLocation(location) {
    // Filtres de statut
    if (filterState.known && !location.known) return false;
    if (filterState.visited && !location.visited) return false;
    
    // Filtre de couleur
    if (filterState.colors.length > 0 && !filterState.colors.includes(location.color)) {
        return false;
    }
    
    return true;
}

function showLocationInfo(event) {
    event.stopPropagation();
    const locationId = parseInt(event.currentTarget.dataset.id);
    const location = locationsData.locations.find(loc => loc.id === locationId);
    
    if (!location) return;
    
    // Afficher les informations du lieu
    showInfoBox(location);
}

function showRegionInfo(event, region) {
    event.stopPropagation();
    
    // Afficher les informations de la région
    showInfoBox(region);
}

function showInfoBox(item) {
    const infoBox = document.getElementById('info-box');
    const infoBoxTitle = document.getElementById('info-box-title');
    const infoBoxContent = document.getElementById('info-box-content');
    
    if (!infoBox || !infoBoxTitle || !infoBoxContent) return;
    
    infoBoxTitle.textContent = item.name;
    
    // Contenu selon le type
    if (item.type === 'region') {
        infoBoxContent.innerHTML = `
            <div class="region-info">
                <h3>${item.name}</h3>
                <p>${item.description || 'Aucune description disponible.'}</p>
            </div>
        `;
    } else {
        // Lieu
        infoBoxContent.innerHTML = `
            <div class="location-info">
                <h3>${item.name}</h3>
                <p>${item.description || 'Aucune description disponible.'}</p>
                ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" class="location-image">` : ''}
            </div>
        `;
    }
    
    infoBox.classList.remove('hidden');
    infoBox.classList.add('visible');
}

function highlightLocation(event) {
    event.currentTarget.classList.add('highlighted');
}

function unhighlightLocation(event) {
    event.currentTarget.classList.remove('highlighted');
}

function toggleAddLocationMode() {
    isAddLocationMode = !isAddLocationMode;
    const btn = document.getElementById('add-location-mode');
    
    if (isAddLocationMode) {
        btn.classList.add('bg-blue-600');
        btn.classList.remove('bg-gray-700');
        viewport.style.cursor = 'copy';
        
        // Désactiver les autres modes
        isDrawingMode = false;
        isAddRegionMode = false;
        updateToolbarButtons();
    } else {
        btn.classList.remove('bg-blue-600');
        btn.classList.add('bg-gray-700');
        viewport.style.cursor = 'grab';
    }
}

function toggleAddRegionMode() {
    isAddRegionMode = !isAddRegionMode;
    const btn = document.getElementById('add-region-mode');
    
    if (isAddRegionMode) {
        btn.classList.add('bg-blue-600');
        btn.classList.remove('bg-gray-700');
        viewport.style.cursor = 'crosshair';
        currentRegionPoints = [];
        
        // Désactiver les autres modes
        isDrawingMode = false;
        isAddLocationMode = false;
        updateToolbarButtons();
    } else {
        btn.classList.remove('bg-blue-600');
        btn.classList.add('bg-gray-700');
        viewport.style.cursor = 'grab';
        currentRegionPoints = [];
    }
}

function updateToolbarButtons() {
    // Mettre à jour l'état visuel de tous les boutons de la barre d'outils
    const buttons = {
        'draw-mode': isDrawingMode,
        'add-location-mode': isAddLocationMode,
        'add-region-mode': isAddRegionMode
    };
    
    Object.entries(buttons).forEach(([id, active]) => {
        const btn = document.getElementById(id);
        if (btn) {
            if (active) {
                btn.classList.add('bg-blue-600');
                btn.classList.remove('bg-gray-700');
            } else {
                btn.classList.remove('bg-blue-600');
                btn.classList.add('bg-gray-700');
            }
        }
    });
}

function showAddLocationModal(x, y) {
    const modal = document.getElementById('add-location-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Stocker les coordonnées pour l'ajout
        modal.dataset.x = x;
        modal.dataset.y = y;
    }
}

function addRegionPoint(x, y) {
    currentRegionPoints.push({ x, y });
    
    // Dessiner un point temporaire
    if (ctx) {
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Si on a au moins 3 points et qu'on clique près du premier point, fermer la région
    if (currentRegionPoints.length >= 3) {
        const firstPoint = currentRegionPoints[0];
        const distance = Math.sqrt((x - firstPoint.x) ** 2 + (y - firstPoint.y) ** 2);
        
        if (distance < 20) {
            showAddRegionModal();
        }
    }
}

function showAddRegionModal() {
    const modal = document.getElementById('add-region-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function initializeComponents() {
    // Initialiser le gestionnaire de voyages
    if (typeof VoyageManager !== 'undefined') {
        const domElements = {
            getElementById: (id) => document.getElementById(id),
            showModal: (modal) => modal.classList.remove('hidden'),
            hideModal: (modal) => modal.classList.add('hidden'),
            voyageSegmentsModal: document.getElementById('voyage-segments-modal')
        };
        
        const voyageManager = new VoyageManager(domElements);
        voyageManager.init();
        
        console.log('🚀 Gestionnaire de voyages initialisé');
    }
    
    // Autres initialisations de composants...
    initializeAuth();
    initializeSettings();
    initializeFilters();
}

function initializeAuth() {
    // Placeholder pour l'authentification
    console.log('🔐 Authentification initialisée');
}

function initializeSettings() {
    // Placeholder pour les paramètres
    console.log('⚙️ Paramètres initialisés');
}

function initializeFilters() {
    // Placeholder pour les filtres
    console.log('🔍 Filtres initialisés');
}

function loadSeason() {
    const saved = localStorage.getItem('currentSeason');
    if (saved) {
        currentSeason = saved;
    }
    updateSeasonDisplay();
}

function loadCalendar() {
    const savedCalendar = localStorage.getItem('calendarData');
    const savedDate = localStorage.getItem('currentCalendarDate');
    const savedMode = localStorage.getItem('isCalendarMode');
    
    if (savedCalendar) {
        try {
            calendarData = JSON.parse(savedCalendar);
            isCalendarMode = savedMode === 'true';
            
            if (savedDate) {
                currentCalendarDate = JSON.parse(savedDate);
            }
            
            updateSeasonDisplay();
        } catch (error) {
            console.warn('⚠️ Erreur lors du chargement du calendrier:', error);
        }
    }
}

function updateSeasonDisplay() {
    const seasonIndicator = document.getElementById('season-indicator');
    const calendarDateIndicator = document.getElementById('calendar-date-indicator');
    
    // Mapping des saisons vers les symboles
    const seasonSymbols = {
        'printemps-debut': '🌱',
        'printemps-milieu': '🌿',
        'printemps-fin': '🌸',
        'ete-debut': '☀️',
        'ete-milieu': '🌞',
        'ete-fin': '🌻',
        'automne-debut': '🍂',
        'automne-milieu': '🍁',
        'automne-fin': '🎃',
        'hiver-debut': '❄️',
        'hiver-milieu': '⛄',
        'hiver-fin': '🌨️'
    };
    
    if (seasonIndicator) {
        seasonIndicator.textContent = seasonSymbols[currentSeason] || '🌱';
    }
    
    // Affichage de la date
    if (calendarDateIndicator) {
        if (isCalendarMode && currentCalendarDate) {
            calendarDateIndicator.textContent = `${currentCalendarDate.day} ${currentCalendarDate.month}`;
        } else {
            calendarDateIndicator.textContent = '1 Gwaeron';
        }
    }
}

// Fonctions utilitaires globales
window.highlightDiscoveryOnMap = function(name, type, highlight) {
    if (type === 'location') {
        const marker = document.querySelector(`[data-id] [title="${name}"]`)?.parentElement;
        if (marker) {
            marker.classList.toggle('highlighted', highlight);
        }
    } else if (type === 'region') {
        const polygon = document.querySelector(`[data-name="${name}"]`);
        if (polygon) {
            polygon.classList.toggle('highlighted', highlight);
        }
    }
};

// Variables et fonctions globales pour la compatibilité
window.journeyPath = journeyPath;
window.totalPathPixels = totalPathPixels;
window.journeyDiscoveries = journeyDiscoveries;
window.regionSegments = regionSegments;
window.locationsData = locationsData;
window.regionsData = regionsData;
window.MAP_DISTANCE_MILES = MAP_DISTANCE_MILES;
window.MAP_WIDTH = MAP_WIDTH;
window.isCalendarMode = isCalendarMode;
window.calendarData = calendarData;
window.currentCalendarDate = currentCalendarDate;
window.currentSeason = currentSeason;

console.log('🎯 Fichier main.js chargé avec succès');
