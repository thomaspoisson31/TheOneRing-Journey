// js/features/maps.js

function loadMapsData() {
    const savedMaps = localStorage.getItem('availableMaps');
    const savedConfig = localStorage.getItem('currentMapConfig');

    if (savedMaps) {
        try {
            AppState.availableMaps = JSON.parse(savedMaps);
        } catch (e) {
            console.error('Error loading maps data:', e);
            AppState.availableMaps = [];
        }
    }

    if (savedConfig) {
        try {
            AppState.currentMapConfig = JSON.parse(savedConfig);
        } catch (e) {
            console.error('Error loading map config:', e);
        }
    }

    if (AppState.availableMaps.length === 0) {
        AppState.availableMaps = [
            { id: 1, name: 'Carte Joueur - Eriador', filename: 'fr_tor_2nd_eriadors_map_page-0001.webp', type: 'player', isDefault: true },
            { id: 2, name: 'Carte Gardien - Eriador', filename: 'fr_tor_2nd_eriadors_map_page_loremaster.webp', type: 'loremaster', isDefault: true }
        ];
        saveMapsData();
    }
}

function saveMapsData() {
    localStorage.setItem('availableMaps', JSON.stringify(AppState.availableMaps));
    localStorage.setItem('currentMapConfig', JSON.stringify(AppState.currentMapConfig));
    scheduleAutoSync();
}

function renderMapsGrid() {
    const mapsGrid = DOM.getElementById('maps-grid');
    if (!mapsGrid) return;

    mapsGrid.innerHTML = AppState.availableMaps.map((map, index) => {
        const isActive = (map.type === 'player' && AppState.currentMapConfig.playerMap === map.filename) ||
                       (map.type === 'loremaster' && AppState.currentMapConfig.loremasterMap === map.filename);
        return `
            <div class="bg-gray-800 rounded-lg p-3 border ${isActive ? 'border-blue-500' : 'border-gray-600'} relative">
                ${isActive ? '<div class="absolute top-2 right-2 text-blue-400"><i class="fas fa-check-circle"></i></div>' : ''}
                <div class="aspect-video bg-gray-700 rounded-lg mb-2 overflow-hidden">
                    <img src="${map.filename}" alt="${map.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                </div>
                <div class="text-sm font-medium text-white mb-1">${map.name}</div>
                <div class="text-xs text-gray-400 mb-2">${map.type === 'player' ? 'Carte Joueur' : 'Carte Gardien'}</div>
                <div class="flex space-x-2">
                    <button class="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs ${isActive ? 'opacity-50 cursor-not-allowed' : ''}"
                            onclick="setActiveMap('${map.filename}', '${map.type}')" ${isActive ? 'disabled' : ''}>
                        ${isActive ? 'Active' : 'Activer'}
                    </button>
                    <button class="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs" onclick="editMap(${index})"><i class="fas fa-edit"></i></button>
                    ${!map.isDefault ? `<button class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs" onclick="deleteMap(${index})"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function setActiveMap(filename, type) {
    if (type === 'player') {
        AppState.currentMapConfig.playerMap = filename;
        DOM.mapImage.src = filename;
        DOM.getElementById('active-player-map-preview').src = filename;
    } else {
        AppState.currentMapConfig.loremasterMap = filename;
        DOM.loremasterMapImage.src = filename;
        DOM.getElementById('active-loremaster-map-preview').src = filename;
    }
    saveMapsData();
    renderMapsGrid();
}

function editMap(index) {
    openMapModal(index);
}

function deleteMap(index) {
    if (AppState.availableMaps[index].isDefault) {
        alert('Impossible de supprimer une carte par défaut.');
        return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
        AppState.availableMaps.splice(index, 1);
        saveMapsData();
        renderMapsGrid();
    }
}

function initializeMap() {
    if (DOM.mapImage.naturalWidth === 0) {
        console.warn("⚠️ Map image not loaded yet, retrying...");
        return;
    }
    AppState.mapWidth = DOM.mapImage.naturalWidth;
    AppState.mapHeight = DOM.mapImage.naturalHeight;
    DOM.mapContainer.style.width = `${AppState.mapWidth}px`;
    DOM.mapContainer.style.height = `${AppState.mapHeight}px`;
    DOM.drawingCanvas.width = AppState.mapWidth;
    DOM.drawingCanvas.height = AppState.mapHeight;
    DOM.regionsLayer.setAttribute('viewBox', `0 0 ${AppState.mapWidth} ${AppState.mapHeight}`);

    DOM.ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    DOM.ctx.lineWidth = 5;
    DOM.ctx.lineCap = 'round';
    DOM.ctx.lineJoin = 'round';

    renderLocations();
    renderRegions();

    requestAnimationFrame(() => {
        resetView();
        DOM.mapImage.classList.remove('opacity-0');
        DOM.loaderOverlay.style.opacity = '0';
        setTimeout(() => { DOM.loaderOverlay.style.display = 'none'; }, 500);
    });

    preloadLoremasterMap();
    console.log("✅ Map initialized successfully");
}

function preloadLoremasterMap() {
    const lmImage = new Image();
    lmImage.onload = () => {
        DOM.loremasterMapImage.src = AppConfig.LOREMASTER_MAP_URL;
        DOM.mapSwitchBtn.classList.remove('hidden');
    };
    lmImage.src = AppConfig.LOREMASTER_MAP_URL;
}

function applyTransform() {
    DOM.mapContainer.style.transform = `translate(${AppState.panX}px, ${AppState.panY}px) scale(${AppState.scale})`;
}

function resetView() {
    const viewportWidth = DOM.viewport.clientWidth;
    if (viewportWidth === 0 || AppState.mapWidth === 0) return;
    AppState.scale = viewportWidth / AppState.mapWidth;
    AppState.panX = 0;
    AppState.panY = 0;
    applyTransform();
}