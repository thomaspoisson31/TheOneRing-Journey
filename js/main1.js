// --- Maps Management Functions ---
        // Variables déclarées dans main.js : availableMaps, currentMapConfig, editingMapIndex

        function loadMapsData() {
            const savedMaps = localStorage.getItem('availableMaps');
            const savedConfig = localStorage.getItem('currentMapConfig');

            if (savedMaps) {
                try {
                    availableMaps = JSON.parse(savedMaps);
                } catch (e) {
                    console.error('Error loading maps data:', e);
                    availableMaps = [];
                }
            }

            if (savedConfig) {
                try {
                    currentMapConfig = JSON.parse(savedConfig);
                } catch (e) {
                    console.error('Error loading map config:', e);
                }
            }

            // Ajouter les cartes par défaut si la liste est vide
            if (availableMaps.length === 0) {
                availableMaps = [
                    {
                        id: 1,
                        name: 'Carte Joueur - Eriador',
                        filename: 'fr_tor_2nd_eriadors_map_page-0001.webp',
                        type: 'player',
                        isDefault: true
                    },
                    {
                        id: 2,
                        name: 'Carte Gardien - Eriador',
                        filename: 'fr_tor_2nd_eriadors_map_page_loremaster.webp',
                        type: 'loremaster',
                        isDefault: true
                    }
                ];
                saveMapsData();
            }
        }

        function saveMapsData() {
            localStorage.setItem('availableMaps', JSON.stringify(availableMaps));
            localStorage.setItem('currentMapConfig', JSON.stringify(currentMapConfig));
            scheduleAutoSync();
        }

        function renderMapsGrid() {
            const mapsGrid = document.getElementById('maps-grid');
            if (!mapsGrid) return;

            mapsGrid.innerHTML = availableMaps.map(map => {
                const isActive = (map.type === 'player' && currentMapConfig.playerMap === map.filename) ||
                                (map.type === 'loremaster' && currentMapConfig.loremasterMap === map.filename);

                return `
                    <div class="bg-gray-800 rounded-lg p-3 border ${isActive ? 'border-blue-500' : 'border-gray-600'} relative">
                        ${isActive ? '<div class="absolute top-2 right-2 text-blue-400"><i class="fas fa-check-circle"></i></div>' : ''}
                        <div class="aspect-video bg-gray-700 rounded-lg mb-2 overflow-hidden">
                            <img src="${map.filename}" alt="${map.name}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiHElaaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNjc3NDhDIi8+Cjwvc3ZnPg=='">
                        </div>
                        <div class="text-sm font-medium text-white mb-1">${map.name}</div>
                        <div class="text-xs text-gray-400 mb-2">${map.type === 'player' ? 'Carte Joueur' : 'Carte Gardien'}</div>
                        <div class="flex space-x-2">
                            <button class="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs ${isActive ? 'opacity-50 cursor-not-allowed' : ''}"
                                    onclick="setActiveMap('${map.filename}', '${map.type}')"
                                    ${isActive ? 'disabled' : ''}>
                                ${isActive ? 'Active' : 'Activer'}
                            </button>
                            <button class="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs" onclick="editMap(${availableMaps.indexOf(map)})">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${!map.isDefault ? `<button class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs" onclick="deleteMap(${availableMaps.indexOf(map)})"><i class="fas fa-trash"></i></button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function setActiveMap(filename, type) {
            if (type === 'player') {
                currentMapConfig.playerMap = filename;
                // Mettre à jour l'image active
                mapImage.src = filename;
                document.getElementById('active-player-map-preview').src = filename;
            } else if (type === 'loremaster') {
                currentMapConfig.loremasterMap = filename;
                // Mettre à jour l'image du gardien
                loremasterMapImage.src = filename;
                document.getElementById('active-loremaster-map-preview').src = filename;
            }

            saveMapsData();
            renderMapsGrid();
        }

        function openMapModal(editIndex = -1) {
            editingMapIndex = editIndex;
            const modal = document.getElementById('map-modal');
            const title = document.getElementById('map-modal-title');
            const nameInput = document.getElementById('map-name-input');
            const fileInput = document.getElementById('map-file-input');
            const previewContainer = document.getElementById('map-preview-container');
            const previewImage = document.getElementById('map-preview-image');
            const saveText = document.getElementById('save-map-text');

            if (editIndex >= 0) {
                const map = availableMaps[editIndex];
                title.innerHTML = '<i class="fas fa-map-marked-alt mr-2"></i>Modifier la carte';
                nameInput.value = map.name;
                previewContainer.classList.remove('hidden');
                previewImage.src = map.filename;
                document.querySelector(`input[name="map-type"][value="${map.type}"]`).checked = true;
                saveText.textContent = 'Modifier';
            } else {
                title.innerHTML = '<i class="fas fa-map-marked-alt mr-2"></i>Ajouter une carte';
                nameInput.value = '';
                fileInput.value = '';
                previewContainer.classList.add('hidden');
                document.querySelector('input[name="map-type"][value="player"]').checked = true;
                saveText.textContent = 'Ajouter';
            }

            modal.classList.remove('hidden');
        }

        function closeMapModal() {
            document.getElementById('map-modal').classList.add('hidden');
            editingMapIndex = -1;
        }

        function editMap(index) {
            openMapModal(index);
        }

        function deleteMap(index) {
            if (availableMaps[index].isDefault) {
                alert('Impossible de supprimer une carte par défaut.');
                return;
            }

            if (confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
                availableMaps.splice(index, 1);
                saveMapsData();
                renderMapsGrid();
            }
        }

        function setupMapsEventListeners() {
            // Bouton ajouter une carte
            document.getElementById('add-map-btn')?.addEventListener('click', () => openMapModal());

            // Boutons de la modal
            document.getElementById('close-map-modal')?.addEventListener('click', closeMapModal);
            document.getElementById('cancel-map-btn')?.addEventListener('click', closeMapModal);
            document.getElementById('save-map-btn')?.addEventListener('click', saveMap);

            // Preview de l'image lors de la sélection
            document.getElementById('map-file-input')?.addEventListener('change', handleMapFileSelect);
        }

        function handleMapFileSelect(event) {
            const file = event.target.files[0];
            const previewContainer = document.getElementById('map-preview-container');
            const previewImage = document.getElementById('map-preview-image');

            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImage.src = e.target.result;
                    previewContainer.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        }

        function saveMap() {
            const nameInput = document.getElementById('map-name-input');
            const fileInput = document.getElementById('map-file-input');
            const mapType = document.querySelector('input[name="map-type"]:checked').value;

            if (!nameInput.value.trim()) {
                alert('Veuillez entrer un nom pour la carte.');
                return;
            }

            if (editingMapIndex >= 0) {
                // Modification d'une carte existante
                availableMaps[editingMapIndex].name = nameInput.value.trim();
                availableMaps[editingMapIndex].type = mapType;

                if (fileInput.files.length > 0) {
                    // Nouvelle image sélectionnée
                    const file = fileInput.files[0];
                    const filename = `map_${Date.now()}_${file.name}`;
                    availableMaps[editingMapIndex].filename = filename;

                    // Note: Dans un vrai système, ici on uploadrait le fichier
                    // Pour cette démo, on utilise un data URL
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        availableMaps[editingMapIndex].dataUrl = e.target.result;
                        saveMapsData();
                        renderMapsGrid();
                        closeMapModal();
                    };
                    reader.readAsDataURL(file);
                    return;
                }
            } else {
                // Nouvelle carte
                if (fileInput.files.length === 0) {
                    alert('Veuillez sélectionner un fichier image.');
                    return;
                }

                const file = fileInput.files[0];
                const filename = `map_${Date.now()}_${file.name}`;

                const reader = new FileReader();
                reader.onload = (e) => {
                    const newMap = {
                        id: Date.now(),
                        name: nameInput.value.trim(),
                        filename: filename,
                        type: mapType,
                        isDefault: false,
                        dataUrl: e.target.result
                    };

                    availableMaps.push(newMap);
                    saveMapsData();
                    renderMapsGrid();
                    closeMapModal();
                };
                reader.readAsDataURL(file);
                return;
            }

            saveMapsData();
            renderMapsGrid();
            closeMapModal();
        }


// --- Initialization ---
        // --- Load Initial Locations ---
        async function loadInitialLocations() {
            console.log("Attempting to load locations...");
            try {
                // Try to load from localStorage first
                const saved = localStorage.getItem('middleEarthLocations');
                if (saved) {
                    try {
                        locationsData = JSON.parse(saved);
                        console.log("✅ Success: Loaded saved locations from localStorage.");
                        return Promise.resolve();
                    } catch (parseError) {
                        console.warn("⚠️ Warning: Failed to parse saved locations, loading defaults.");
                    }
                }

                // If no saved data or parsing failed, load from file
                try {
                    const response = await fetch(LOCATIONS_URL);
                    if (response.ok) {
                        locationsData = await response.json();
                        console.log("✅ Success: Loaded locations from file.");
                    } else {
                        throw new Error(`HTTP ${response.status}`);
                    }
                } catch (fetchError) {
                    console.warn("⚠️ Warning: Failed to load locations file, using defaults.");
                    locationsData = getDefaultLocations();
                }

                return Promise.resolve();
            } catch (error) {
                console.error("❌ Error loading locations:", error);
                locationsData = getDefaultLocations();
                return Promise.resolve();
            }
        }

        // Make function globally available
        window.loadInitialLocations = loadInitialLocations;

function initializeMap() {
    console.log("🗺️ Initializing map...");
    if (mapImage.naturalWidth === 0) {
        console.warn("⚠️ Map image not loaded yet, retrying...");
        return;
    }

    console.log("📐 Map dimensions:", mapImage.naturalWidth, "x", mapImage.naturalHeight);
    MAP_WIDTH = mapImage.naturalWidth;
    MAP_HEIGHT = mapImage.naturalHeight;
    mapContainer.style.width = `${MAP_WIDTH}px`;
    mapContainer.style.height = `${MAP_HEIGHT}px`;
    drawingCanvas.width = MAP_WIDTH;
    drawingCanvas.height = MAP_HEIGHT;
    regionsLayer.setAttribute('width', MAP_WIDTH);
    regionsLayer.setAttribute('height', MAP_HEIGHT);
    regionsLayer.setAttribute('viewBox', `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    renderLocations();
    renderRegions();
    requestAnimationFrame(() => {
        resetView();
        mapImage.classList.remove('opacity-0');
        loaderOverlay.style.opacity = '0';
        setTimeout(() => { loaderOverlay.style.display = 'none'; }, 500);
    });
    preloadLoremasterMap();

    // Initialize VoyageManager
    voyageManager = new VoyageManager(dom);
    voyageManager.init();

    console.log("✅ Map initialized successfully");
}

// Rendre initializeMap globalement accessible
window.initializeMap = initializeMap;

function preloadLoremasterMap() {
    console.log("Preloading Loremaster map...");
    const lmImage = new Image();
    lmImage.onload = () => {
        console.log("✅ Loremaster map preloaded.");
        loremasterMapImage.src = LOREMASTER_MAP_URL;
        mapSwitchBtn.classList.remove('hidden');
    };
    lmImage.onerror = () => {
        console.error("Failed to preload Loremaster map.");
    };
    lmImage.src = LOREMASTER_MAP_URL;
}

// --- Location Markers & Info Box ---
function renderLocations() {
    locationsLayer.innerHTML = '';
    const filteredLocations = locationsData.locations.filter(location => {
        // Skip locations without coordinates
        if (!location.coordinates || typeof location.coordinates.x === 'undefined' || typeof location.coordinates.y === 'undefined') {
            return false;
        }
        const knownMatch = !activeFilters.known || location.known;
        const visitedMatch = !activeFilters.visited || location.visited;
        const colorMatch = activeFilters.colors.length === 0 || activeFilters.colors.includes(location.color);
        return knownMatch && visitedMatch && colorMatch;
    });

    filteredLocations.forEach(location => {
        const marker = document.createElement('div');
        marker.className = 'location-marker';
        marker.style.left = `${location.coordinates.x}px`;
        marker.style.top = `${location.coordinates.y}px`;
        marker.style.backgroundColor = location.known ? (colorMap[location.color] || colorMap.red) : 'rgba(107, 114, 128, 0.7)';
        marker.style.borderColor = location.visited ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        marker.dataset.id = location.id;

        // Configure pointer events based on current mode
        if (isDrawingMode) {
            marker.style.pointerEvents = 'none';
        } else {
            marker.style.pointerEvents = 'auto';

            // Only allow dragging when not in any special mode
            if (!isAddingLocationMode && !isAddingRegionMode) {
                marker.addEventListener('mousedown', startDragMarker);
            }

            marker.addEventListener('click', (e) => {
                if (e.detail > 0) {
                    if (!isAddingLocationMode && !isAddingRegionMode) {
                        // Show info box normally
                        showInfoBox(e);
                    }
                }
            });

            // Ajouter le tooltip au survol
            marker.title = location.name;
        }

        locationsLayer.appendChild(marker);
    });
}

function showInfoBox(event) {
    const marker = event.currentTarget;
    activeLocationId = parseInt(marker.dataset.id, 10);
    const location = locationsData.locations.find(loc => loc.id === activeLocationId);
    if (!location) return;

    // Update image tab content
    const imageTab = document.getElementById('image-tab');
    const images = getLocationImages(location);

    if (images.length > 0) {
        if (infoBox.classList.contains('expanded') && images.length > 1) {
            // Multi-tab view for expanded mode with multiple images
            const imageTabs = images.map((img, index) =>
                `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Image ${index + 1}</button>`
            ).join('');

            const imageContents = images.map((img, index) =>
                `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                    <div class="image-view">
                        <img src="${img}" alt="${location.name}" title="${img.split('/').pop()}" onerror="handleImageError(this)">
                    </div>
                </div>`
            ).join('');

            imageTab.innerHTML = `
                <div class="image-tabs-container">
                    <div class="image-tabs">${imageTabs}</div>
                    <div class="image-contents">${imageContents}</div>
                </div>
            `;

            setupImageTabSwitching();
            setupImageClickHandlers();
        } else {
            // Single image view (compact mode or single image)
            const defaultImage = getDefaultLocationImage(location);
            const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                            <span style="font-family: 'Merriweather', serif;">${location.name}</span>
                        </div>` : '';
            imageTab.innerHTML = `
                <div class="image-view">
                    ${titleHtml}
                    <img src="${defaultImage}" alt="${location.name}" title="${defaultImage.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
                </div>
            `;
            setupImageClickHandlers();
        }
    } else {
        // No image - show title instead of placeholder in compact mode
        if (!infoBox.classList.contains('expanded')) {
            imageTab.innerHTML = `
                <div class="image-view">
                    <div class="compact-title">
                        <span style="font-family: 'Merriweather', serif;">${location.name}</span>
                    </div>
                </div>
            `;
        } else {
            imageTab.innerHTML = `
                <div class="image-view">
                    <div class="image-placeholder">Aucune image disponible</div>
                </div>
            `;
        }
    }

    // Update text tab content
    const textTab = document.getElementById('text-tab');
    textTab.innerHTML = `
        <div class="text-view">
            <h3>${location.name}</h3>
            <p>${location.description || 'Aucune description.'}</p>
        </div>
    `;

    // Update rumeurs tab content
    const rumeursTab = document.getElementById('rumeurs-tab');
    // Ajouter les sections Rumeurs (support multiple) et Tradition_Ancienne si elles existent
    let rumeursContent = '';
    if (location.Rumeurs && location.Rumeurs.length > 0) {
        const rumeursValides = location.Rumeurs.filter(rumeur => rumeur && rumeur !== "A définir");

        if (rumeursValides.length > 0) {
            rumeursContent += `
                <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                    <div class="font-bold text-yellow-300 mb-2 flex items-center">
                        <i class="fas fa-ear-listen mr-2"></i>
                        ${rumeursValides.length > 1 ? 'Rumeurs' : 'Rumeur'}
                    </div>
            `;

            rumeursValides.forEach((rumeur, index) => {
                const marginClass = index > 0 ? 'mt-3 pt-3 border-t border-yellow-600 border-opacity-50' : '';
                rumeursContent += `
                    <div class="${marginClass} text-yellow-100 text-sm italic leading-relaxed">
                        ${rumeur}
                    </div>
                `;
            });

            rumeursContent += `</div>`;
        }
    }
    // Support de l'ancienne structure avec Rumeur simple
    else if (location.Rumeur && location.Rumeur !== "A définir") {
        rumeursContent += `
            <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                <div class="font-bold text-yellow-300 mb-2 flex items-center">
                    <i class="fas fa-ear-listen mr-2"></i>
                    Rumeur
                </div>
                <div class="text-yellow-100 text-sm italic leading-relaxed">
                    ${location.Rumeur}
                </div>
            </div>
        `;
    }
    rumeursTab.innerHTML = `<div class="text-view">${rumeursContent || '<p class="text-gray-500 italic">Aucune rumeur connue.</p>'}</div>`;


    // Update tradition tab content
    const traditionTab = document.getElementById('tradition-tab');
    traditionTab.innerHTML = `
        <div class="text-view">
            <h3>Tradition Ancienne</h3>
            <p>${location.Tradition_Ancienne || 'Aucune tradition ancienne connue.'}</p>
        </div>
    `;

    // Update tables tab content
    const tablesTab = document.getElementById('tables-tab');
    const tables = getLocationTables(location);

    if (tables.length > 0) {
        if (infoBox.classList.contains('expanded') && tables.length > 1) {
            // Multi-tab view for expanded mode with multiple tables
            const tableTabs = tables.map((table, index) =>
                `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Table ${index + 1}</button>`
            ).join('');

            const tableContents = tables.map((table, index) =>
                `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                    <div class="image-view">
                        <img src="${table}" alt="Table aléatoire ${location.name}" title="${table.split('/').pop()}" onerror="handleImageError(this)">
                    </div>
                </div>`
            ).join('');

            tablesTab.innerHTML = `
                <div class="image-tabs-container">
                    <div class="image-tabs">${tableTabs}</div>
                    <div class="image-contents">${tableContents}</div>
                </div>
            `;

            setupImageTabSwitching();
            setupImageClickHandlers();
        } else {
            // Single table view (compact mode or single table)
            const defaultTable = getDefaultLocationTable(location);
            const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                            <span style="font-family: 'Merriweather', serif;">Tables - ${location.name}</span>
                        </div>` : '';
            tablesTab.innerHTML = `
                <div class="image-view">
                    ${titleHtml}
                    <img src="${defaultTable}" alt="Table aléatoire ${location.name}" title="${defaultTable.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
                </div>
            `;
            setupImageClickHandlers();
        }
    } else {
        // No tables - show placeholder
        if (!infoBox.classList.contains('expanded')) {
            tablesTab.innerHTML = `
                <div class="image-view">
                    <div class="compact-title">
                        <span style="font-family: 'Merriweather', serif;">Tables - ${location.name}</span>
                    </div>
                </div>
            `;
        } else {
            tablesTab.innerHTML = `
                <div class="image-view">
                    <div class="image-placeholder">Aucune table disponible</div>
                </div>
            `;
        }
    }

    // Update header title
    updateInfoBoxHeaderTitle(location.name);

    // Show the info box
    document.getElementById('info-box-edit-content').classList.add('hidden');
    document.getElementById('info-box-content').classList.remove('hidden');

    infoBox.style.display = 'block';
    // Ouvrir en mode étendu par défaut
    if (!infoBox.classList.contains('expanded')) {
        infoBox.classList.add('expanded');
        const expandBtn = document.getElementById('info-box-expand');
        if (expandBtn) {
            expandBtn.className = 'fas fa-compress';
            expandBtn.title = 'Vue compacte';
        }
        const titleElement = document.getElementById('info-box-title');
        const deleteBtn = document.getElementById('info-box-delete');
        titleElement.classList.remove('hidden');
        deleteBtn.classList.remove('hidden');
    }
    positionInfoBoxExpanded();

    // Set up tab switching
    setupTabSwitching();
    // Set up event listeners for locations
    setupInfoBoxEventListeners('location', location.id);
}

function hideInfoBox() {
    infoBox.style.display = 'none';
    activeLocationId = null;

    function setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                activateTab(targetTab);
            });
        });
    }

    function activateTab(tabName) {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    function handleImageError(imgElement) {
        imgElement.parentElement.innerHTML = '<div class="image-placeholder">Erreur de chargement de l\'image</div>';
    }

    function getLocationImages(location) {
        // Support both old format (imageUrl) and new format (images array)
        if (location.images && Array.isArray(location.images)) {
            return location.images.map(img => img.url).filter(url => url);
        } else if (location.imageUrl) {
            return [location.imageUrl];
        }
        return [];
    }

    function getDefaultLocationImage(location) {
        if (location.images && Array.isArray(location.images)) {
            const defaultImg = location.images.find(img => img.isDefault);
            return defaultImg ? defaultImg.url : (location.images[0] ? location.images[0].url : '');
        } else if (location.imageUrl) {
            return location.imageUrl;
        }
        return '';
    }

    function setupImageTabSwitching() {
        const imageTabButtons = document.querySelectorAll('.image-tab-button');
        const imageContents = document.querySelectorAll('.image-content');

        imageTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetIndex = button.dataset.imageIndex;

                // Update active tab button
                imageTabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update active image content
                imageContents.forEach(content => content.classList.remove('active'));
                document.querySelector(`[data-image-index="${targetIndex}"].image-content`).classList.add('active');
            });
        });
    }

    function setupImageClickHandlers() {
        // Add click listener to make images toggle fullscreen
        document.querySelectorAll('.modal-image').forEach(img => {
            img.addEventListener('click', (e) => {
                // Prevent event from propagating to parent elements if needed
                e.stopPropagation();

                const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

                if (!isFullscreen) {
                    // Request fullscreen
                    const element = img.parentElement.parentElement; // Go up to the .image-view or .image-content container
                    if (element.requestFullscreen) {
                        element.requestFullscreen();
                    } else if (element.webkitRequestFullscreen) { /* Safari */
                        element.webkitRequestFullscreen();
                    } else if (element.mozRequestFullScreen) { /* Firefox */
                        element.mozRequestFullScreen();
                    } else if (element.msRequestFullscreen) { /* IE11 */
                        element.msRequestFullscreen();
                    }
                } else {
                    // Exit fullscreen
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) { /* Safari */
                        document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) { /* Firefox */
                        document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) { /* IE11 */
                        document.msExitFullscreen();
                    }
                }
            });
        });
    }


    function getRegionImages(region) {
        if (region.images && Array.isArray(region.images)) {
            return region.images.map(img => img.url).filter(url => url);
        }
        return [];
    }

    function getDefaultRegionImage(region) {
        if (region.images && Array.isArray(region.images)) {
            const defaultImg = region.images.find(img => img.isDefault);
            return defaultImg ? defaultImg.url : (region.images[0] ? region.images[0].url : '');
        }
        return '';
    }

    function getLocationTables(location) {
        if (location.tables && Array.isArray(location.tables)) {
            return location.tables.map(table => table.url).filter(url => url);
        }
        return [];
    }

    function getDefaultLocationTable(location) {
        if (location.tables && Array.isArray(location.tables)) {
            const defaultTable = location.tables.find(table => table.isDefault);
            return defaultTable ? defaultTable.url : (location.tables[0] ? location.tables[0].url : '');
        }
        return '';
    }

    function getRegionTables(region) {
        if (region.tables && Array.isArray(region.tables)) {
            return region.tables.map(table => table.url).filter(url => url);
        }
        return [];
    }

    function getDefaultRegionTable(region) {
        if (region.tables && Array.isArray(region.tables)) {
            const defaultTable = region.tables.find(table => table.isDefault);
            return defaultTable ? defaultTable.url : (region.tables[0] ? region.tables[0].url : '');
        }
        return '';
    }

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

    function enterEditMode() {
        const location = locationsData.locations.find(loc => loc.id === activeLocationId);
        if (!location) return;

        // Mark the info box as being in edit mode
        infoBox.dataset.editMode = 'true';

        // Update image tab to show image editing interface
        updateImageTabForEdit(location);

        // Update text tab to show text editing interface
        updateTextTabForEdit(location);

        // Update rumeurs tab to show rumeurs editing interface
        updateRumeursTabForEdit(location);

        // Update tradition tab to show tradition editing interface
        updateTraditionTabForEdit(location);

        // Update tables tab to show tables editing interface
        updateTablesTabForEdit(location);

        // Add edit controls at the bottom
        addEditControls();
    }

    function updateImageTabForEdit(location) {
        const imageTab = document.getElementById('image-tab');
        const images = location.images || [];
        const imagesHtml = generateImageEditHTML(images);

        const colorPickerHtml = Object.keys(colorMap).map(color =>
            `<div class="color-swatch ${location.color === color ? 'selected' : ''}" data-color="${color}" style="background-color: ${colorMap[color]}"></div>`
        ).join('');

        imageTab.innerHTML = `
            <div class="space-y-4">
                <div class="bg-gray-700 p-3 rounded-md">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Images (max 5)</label>
                    <div id="edit-images-container">${imagesHtml}</div>
                    <button id="add-image-btn" class="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm">Ajouter une image</button>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Couleur</label>
                    <div class="flex space-x-2" id="edit-color-picker">${colorPickerHtml}</div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="flex items-center">
                        <input id="edit-known" type="checkbox" ${location.known ? 'checked' : ''} class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                        <label for="edit-known" class="ml-2 block text-sm text-gray-300">Connu</label>
                    </div>
                    <div class="flex items-center">
                        <input id="edit-visited" type="checkbox" ${location.visited ? 'checked' : ''} class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                        <label for="edit-visited" class="ml-2 block text-sm text-gray-300">Visité</label>
                    </div>
                </div>
            </div>
        `;

        setupImageEditListeners();
        setupColorPickerListeners();
        setupStatusCheckboxListeners();
    }

    function updateTextTabForEdit(location) {
        const textTab = document.getElementById('text-tab');
        textTab.innerHTML = `
            <div class="text-view space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Nom</label>
                    <input type="text" id="edit-name" value="${location.name}" placeholder="Nom" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <div class="flex items-start space-x-2">
                        <textarea id="edit-desc" rows="4" placeholder="Description" class="flex-1 bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${location.description || ''}</textarea>
                        <button id="generate-edit-desc" class="p-2 bg-purple-600 hover:bg-purple-700 rounded-md" title="Générer une description"><span class="gemini-icon">✨</span></button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('generate-edit-desc').addEventListener('click', handleGenerateDescription);
    }

    function updateRumeursTabForEdit(location) {
        const rumeursTab = document.getElementById('rumeurs-tab');
        // Utiliser un champ textarea pour les rumeurs multiples, séparées par des sauts de ligne
        const rumeursString = Array.isArray(location.Rumeurs) ? location.Rumeurs.join('\n') : (location.Rumeur || '');
        rumeursTab.innerHTML = `
            <div class="text-view space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Rumeurs</label>
                    <textarea id="edit-rumeur" rows="6" placeholder="Rumeur" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${rumeursString}</textarea>
                </div>
            </div>
        `;
    }

    function updateTraditionTabForEdit(location) {
        const traditionTab = document.getElementById('tradition-tab');
        traditionTab.innerHTML = `
            <div class="text-view space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Tradition Ancienne</label>
                    <textarea id="edit-tradition" rows="6" placeholder="Tradition Ancienne" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${location.Tradition_Ancienne || ''}</textarea>
                </div>
            </div>
        `;
    }

    function updateTablesTabForEdit(location) {
        const tablesTab = document.getElementById('tables-tab');
        const tables = location.tables || [];
        const tablesHtml = generateTablesEditHTML(tables);

        tablesTab.innerHTML = `
            <div class="space-y-4">
                <div class="bg-gray-700 p-3 rounded-md">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Tables aléatoires (max 5)</label>
                    <div id="edit-tables-container">${tablesHtml}</div>
                    <button id="add-table-btn" class="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm">Ajouter une table</button>
                </div>
            </div>
        `;

        setupTablesEditListeners();
    }

    function generateTablesEditHTML(tables) {
        if (!tables || tables.length === 0) {
            return '<div class="text-gray-400 text-sm">Aucune table</div>';
        }

        return tables.map((table, index) => `
            <div class="table-edit-item flex items-center space-x-2 p-2 rounded">
                <input type="url" class="table-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" value="${table.url || ''}" placeholder="Chemin vers la table (ex: images/Tables/Table-Bois-de-Chet.jpg)">
                <label class="flex items-center text-sm">
                    <input type="checkbox" class="default-table-checkbox mr-1" ${table.isDefault ? 'checked' : ''}>
                    <span class="text-gray-300">Défaut</span>
                </label>
                <button class="remove-table-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${index}">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        `).join('');
    }

    function setupTablesEditListeners() {
        const container = document.getElementById('edit-tables-container');
        const addButton = document.getElementById('add-table-btn');

        if (addButton) {
            addButton.addEventListener('click', addNewTableRow);
        }

        if (container) {
            container.addEventListener('click', (e) => {
                if (e.target.closest('.remove-table-btn')) {
                    const button = e.target.closest('.remove-table-btn');
                    const item = button.closest('.table-edit-item');
                    if (item) {
                        item.remove();
                        updateTableIndices();
                    }
                }
            });

            container.addEventListener('change', (e) => {
                if (e.target.classList.contains('default-table-checkbox') && e.target.checked) {
                    // Uncheck other default checkboxes
                    container.querySelectorAll('.default-table-checkbox').forEach(cb => {
                        if (cb !== e.target) cb.checked = false;
                    });
                }
            });
        }
    }

    function addNewTableRow() {
        const container = document.getElementById('edit-tables-container');
        const currentTables = container.querySelectorAll('.table-edit-item');

        if (currentTables.length >= 5) {
            alert('Maximum 5 tables autorisées');
            return;
        }

        const newIndex = currentTables.length;
        const newRow = document.createElement('div');
        newRow.className = 'table-edit-item flex items-center space-x-2 p-2 rounded';
        newRow.innerHTML = `
            <input type="url" class="table-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" placeholder="Chemin vers la table (ex: images/Tables/Table-Bois-de-Chet.jpg)">
            <label class="flex items-center text-sm">
                <input type="checkbox" class="default-table-checkbox mr-1" ${newIndex === 0 ? 'checked' : ''}>
                <span class="text-gray-300">Défaut</span>
            </label>
            <button class="remove-table-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${newIndex}">
                <i class="fas fa-trash text-xs"></i>
            </button>
        `;

        container.appendChild(newRow);
        updateTableIndices();
    }

    function updateTableIndices() {
        const container = document.getElementById('edit-tables-container');
        container.querySelectorAll('.remove-table-btn').forEach((btn, index) => {
            btn.dataset.index = index;
        });
    }

    function collectTablesFromEdit() {
        const container = document.getElementById('edit-tables-container');
        const tables = [];

        container.querySelectorAll('.table-edit-item').forEach(item => {
            const url = item.querySelector('.table-url-input').value.trim();
            const isDefault = item.querySelector('.default-table-checkbox').checked;

            if (url) {
                tables.push({ url, isDefault });
            }
        });

        // Ensure at least one default if tables exist
        if (tables.length > 0 && !tables.some(table => table.isDefault)) {
            tables[0].isDefault = true;
        }

        return tables;
    }

    function addEditControls() {
        // Add save/cancel buttons at the bottom of the scroll wrapper
        const scrollWrapper = document.getElementById('info-box-scroll-wrapper');
        let editControls = document.getElementById('edit-controls');

        if (!editControls) {
            editControls = document.createElement('div');
            editControls.id = 'edit-controls';
            editControls.className = 'mt-4 pt-4 border-t border-gray-600 flex justify-end space-x-2 bg-gray-900 sticky bottom-0';
            scrollWrapper.appendChild(editControls);
        }

        editControls.innerHTML = `
            <button id="cancel-edit" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm">Annuler</button>
            <button id="save-edit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm">Sauver</button>
        `;

        document.getElementById('save-edit').addEventListener('click', saveEdit);
        document.getElementById('cancel-edit').addEventListener('click', cancelEdit);
    }

    function setupColorPickerListeners() {
        document.getElementById('edit-color-picker').querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                document.querySelector('#edit-color-picker .color-swatch.selected').classList.remove('selected');
                swatch.classList.add('selected');
            });
        });
    }



    function generateImageEditHTML(images) {
        if (!images || images.length === 0) {
            return '<div class="text-gray-400 text-sm">Aucune image</div>';
        }

        return images.map((image, index) => `
            <div class="image-edit-item flex items-center space-x-2 p-2 rounded">
                <input type="url" class="image-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" value="${image.url || ''}" placeholder="URL de l'image">
                <label class="flex items-center text-sm">
                    <input type="checkbox" class="default-image-checkbox mr-1" ${image.isDefault ? 'checked' : ''}>
                    <span class="text-gray-300">Défaut</span>
                </label>
                <button class="remove-image-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${index}">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        `).join('');
    }

    function setupImageEditListeners() {
        const container = document.getElementById('edit-images-container');
        const addButton = document.getElementById('add-image-btn');

        if (addButton) {
            addButton.addEventListener('click', addNewImageRow);
        }

        if (container) {
            container.addEventListener('click', (e) => {
                if (e.target.closest('.remove-image-btn')) {
                    const button = e.target.closest('.remove-image-btn');
                    const item = button.closest('.image-edit-item');
                    if (item) {
                        item.remove();
                        updateImageIndices();
                    }
                }
            });

            container.addEventListener('change', (e) => {
                if (e.target.classList.contains('default-image-checkbox') && e.target.checked) {
                    // Uncheck other default checkboxes
                    container.querySelectorAll('.default-image-checkbox').forEach(cb => {
                        if (cb !== e.target) cb.checked = false;
                    });
                }
            });
        }
    }

    function addNewImageRow() {
        const container = document.getElementById('edit-images-container');
        const currentImages = container.querySelectorAll('.image-edit-item');

        if (currentImages.length >= 5) {
            alert('Maximum 5 images autorisées');
            return;
        }

        const newIndex = currentImages.length;
        const newRow = document.createElement('div');
        newRow.className = 'image-edit-item flex items-center space-x-2 p-2 rounded';
        newRow.innerHTML = `
            <input type="url" class="image-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" placeholder="URL de l'image">
            <label class="flex items-center text-sm">
                <input type="checkbox" class="default-image-checkbox mr-1" ${newIndex === 0 ? 'checked' : ''}>
                <span class="text-gray-300">Défaut</span>
            </label>
            <button class="remove-image-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${newIndex}">
                <i class="fas fa-trash text-xs"></i>
            </button>
        `;

        container.appendChild(newRow);
        updateImageIndices();
    }

    function updateImageIndices() {
        const container = document.getElementById('edit-images-container');
        container.querySelectorAll('.remove-image-btn').forEach((btn, index) => {
            btn.dataset.index = index;
        });
    }

    function setupStatusCheckboxListeners() {
        document.getElementById('edit-visited').addEventListener('change', (e) => {
            if (e.target.checked) {
                document.getElementById('edit-known').checked = true;
            }
        });
    }

    function collectImagesFromEdit() {
        const container = document.getElementById('edit-images-container');
        const images = [];

        container.querySelectorAll('.image-edit-item').forEach(item => {
            const url = item.querySelector('.image-url-input').value.trim();
            const isDefault = item.querySelector('.default-image-checkbox').checked;

            if (url) {
                images.push({ url, isDefault });
            }
        });

        // Ensure at least one default if images exist
        if (images.length > 0 && !images.some(img => img.isDefault)) {
            images[0].isDefault = true;
        }

        return images;
    }

    function saveEdit() {
        const location = locationsData.locations.find(loc => loc.id === activeLocationId);
        if (!location) return;

        location.name = document.getElementById('edit-name').value;
        location.description = document.getElementById('edit-desc').value;
        location.Rumeurs = document.getElementById('edit-rumeur').value.split('\n').filter(r => r.trim() !== ''); // Split by newline for multiple rumors
        location.Tradition_Ancienne = document.getElementById('edit-tradition').value;
        location.color = document.querySelector('#edit-color-picker .color-swatch.selected').dataset.color;
        location.known = document.getElementById('edit-known').checked;
        location.visited = document.getElementById('edit-visited').checked;

        // Handle images
        const images = collectImagesFromEdit();
        if (images.length > 0) {
            location.images = images;
            // Remove old imageUrl if exists
            delete location.imageUrl;
        } else {
            // No images, remove both old and new format
            delete location.images;
            delete location.imageUrl;
        }

        // Handle tables
        const tables = collectTablesFromEdit();
        if (tables.length > 0) {
            location.tables = tables;
        } else {
            delete location.tables;
        }

        saveLocationsToLocal();
        renderLocations();
        hideInfoBox();
    }

    function cancelEdit() {
        // Remove edit mode flag
        delete infoBox.dataset.editMode;
        // Remove edit controls
        const editControls = document.getElementById('edit-controls');
        if (editControls) {
            editControls.remove();
        }

        // Re-show the location info without edit mode - reload fresh content
        const location = locationsData.locations.find(loc => loc.id === activeLocationId);
        if (location) {
            showLocationContent(location);
        }
    }

    function showLocationContent(location) {
        // Update image tab content
        const imageTab = document.getElementById('image-tab');
        const images = getLocationImages(location);

        if (images.length > 0) {
            if (infoBox.classList.contains('expanded') && images.length > 1) {
                // Multi-tab view for expanded mode with multiple images
                const imageTabs = images.map((img, index) =>
                    `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Image ${index + 1}</button>`
                ).join('');

                const imageContents = images.map((img, index) =>
                    `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                        <div class="image-view">
                            <img src="${img}" alt="${location.name}" title="${img.split('/').pop()}" onerror="handleImageError(this)">
                        </div>
                    </div>`
                ).join('');

                imageTab.innerHTML = `
                    <div class="image-tabs-container">
                        <div class="image-tabs">${imageTabs}</div>
                        <div class="image-contents">${imageContents}</div>
                    </div>
                `;

                setupImageTabSwitching();
                setupImageClickHandlers();
            } else {
                // Single image view (compact mode or single image)
                const defaultImage = getDefaultLocationImage(location);
                const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">${location.name}</span>
                            </div>` : '';
                imageTab.innerHTML = `
                    <div class="image-view">
                        ${titleHtml}
                        <img src="${defaultImage}" alt="${location.name}" title="${defaultImage.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
                    </div>
                `;
                setupImageClickHandlers();
            }
        } else {
            // No image - show title instead of placeholder in compact mode
            if (!infoBox.classList.contains('expanded')) {
                imageTab.innerHTML = `
                    <div class="image-view">
                        <div class="compact-title">
                            <span style="font-family: 'Merriweather', serif;">${location.name}</span>
                        </div>
                    </div>
                `;
            } else {
                imageTab.innerHTML = `
                    <div class="image-view">
                        <div class="image-placeholder">Aucune image disponible</div>
                    </div>
                `;
            }
        }

        // Update text tab content
        const textTab = document.getElementById('text-tab');
        textTab.innerHTML = `
            <div class="text-view">
                <h3>${location.name}</h3>
                <p>${location.description || 'Aucune description.'}</p>
            </div>
        `;

        // Update rumeurs tab content
        const rumeursTab = document.getElementById('rumeurs-tab');
        // Ajouter les sections Rumeurs (support multiple) et Tradition_Ancienne si elles existent
        let rumeursContent = '';
        if (location.Rumeurs && location.Rumeurs.length > 0) {
            const rumeursValides = location.Rumeurs.filter(rumeur => rumeur && rumeur !== "A définir");

            if (rumeursValides.length > 0) {
                rumeursContent += `
                    <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                        <div class="font-bold text-yellow-300 mb-2 flex items-center">
                            <i class="fas fa-ear-listen mr-2"></i>
                            ${rumeursValides.length > 1 ? 'Rumeurs' : 'Rumeur'}
                        </div>
                `;

                rumeursValides.forEach((rumeur, index) => {
                    const marginClass = index > 0 ? 'mt-3 pt-3 border-t border-yellow-600 border-opacity-50' : '';
                    rumeursContent += `
                        <div class="${marginClass} text-yellow-100 text-sm italic leading-relaxed">
                            ${rumeur}
                        </div>
                    `;
                });

                rumeursContent += `</div>`;
            }
        }
        // Support de l'ancienne structure avec Rumeur simple
        else if (location.Rumeur && location.Rumeur !== "A définir") {
            rumeursContent += `
                <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                    <div class="font-bold text-yellow-300 mb-2 flex items-center">
                        <i class="fas fa-ear-listen mr-2"></i>
                        Rumeur
                    </div>
                    <div class="text-yellow-100 text-sm italic leading-relaxed">
                        ${location.Rumeur}
                    </div>
                </div>
            `;
        }
        rumeursTab.innerHTML = `<div class="text-view">${rumeursContent || '<p class="text-gray-500 italic">Aucune rumeur connue.</p>'}</div>`;


        // Update tradition tab content
        const traditionTab = document.getElementById('tradition-tab');
        traditionTab.innerHTML = `
            <div class="text-view">
                <h3>Tradition Ancienne</h3>
                <p>${location.Tradition_Ancienne || 'Aucune tradition ancienne connue.'}</p>
            </div>
        `;

        // Update tables tab content - FIX: Utiliser la même logique que dans showInfoBox
        const tablesTab = document.getElementById('tables-tab');
        const tables = getLocationTables(location);

        if (tables.length > 0) {
            if (infoBox.classList.contains('expanded') && tables.length > 1) {
                // Multi-tab view for expanded mode with multiple tables
                const tableTabs = tables.map((table, index) =>
                    `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Table ${index + 1}</button>`
                ).join('');

                const tableContents = tables.map((table, index) =>
                    `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                        <div class="image-view">
                            <img src="${table}" alt="Table aléatoire ${location.name}" title="${table.split('/').pop()}" onerror="handleImageError(this)">
                        </div>
                    </div>`
                ).join('');

                tablesTab.innerHTML = `
                    <div class="image-tabs-container">
                        <div class="image-tabs">${tableTabs}</div>
                        <div class="image-contents">${tableContents}</div>
                    </div>
                `;

                setupImageTabSwitching();
                setupImageClickHandlers();
            } else {
                // Single table view (compact mode or single table)
                const defaultTable = getDefaultLocationTable(location);
                const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">Tables - ${location.name}</span>
                            </div>` : '';
                tablesTab.innerHTML = `
                    <div class="image-view">
                        ${titleHtml}
                        <img src="${defaultTable}" alt="Table aléatoire ${location.name}" title="${defaultTable.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
                    </div>
                `;
                setupImageClickHandlers();
            }
        } else {
            // No tables - show placeholder
            if (!infoBox.classList.contains('expanded')) {
                tablesTab.innerHTML = `
                    <div class="image-view">
                        <div class="compact-title">
                            <span style="font-family: 'Merriweather', serif;">Tables - ${location.name}</span>
                        </div>
                    </div>
                `;
            } else {
                tablesTab.innerHTML = `
                    <div class="image-view">
                        <div class="image-placeholder">Aucune table disponible</div>
                    </div>
                `;
            }
        }
    }

    // --- Info box sizing/positioning ---
    function getToolbarRect() {
        const toolbar = document.getElementById('toolbar');
        return toolbar ? toolbar.getBoundingClientRect() : { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
    }

    function positionInfoBoxCompact(event) {
        const vpRect = viewport.getBoundingClientRect();
        const tbRect = getToolbarRect();
        const margin = 16;

        // Dimensions estimées de la boîte d'information
        const boxWidth = 280;
        const boxHeight = 250;

        // Centrer horizontalement, mais éviter la toolbar
        const centeredLeft = Math.floor((vpRect.width - boxWidth) / 2);
        const minLeft = tbRect.right - vpRect.left + margin;
        const left = Math.max(centeredLeft, minLeft);

        // Centrer verticalement
        const top = Math.floor((vpRect.height - boxHeight) / 2);

        infoBox.style.left = `${left}px`;
        infoBox.style.top = `${top}px`;
        infoBox.style.width = '';
        infoBox.style.height = '';
        infoBox.style.maxWidth = '280px';
        const scrollWrapper = document.getElementById('info-box-scroll-wrapper');
        if (scrollWrapper) {
            scrollWrapper.style.maxHeight = '250px';
            scrollWrapper.style.height = '';
        }
    }

    function positionInfoBoxExpanded() {
        const vpRect = viewport.getBoundingClientRect();
        const tbRect = getToolbarRect();
        const margin = 16;

        // Use 90% of viewport dimensions
        const desiredWidth = Math.floor(vpRect.width * 0.9);
        const desiredHeight = Math.floor(vpRect.height * 0.9);

        // Ensure it doesn't cover the toolbar
        const availableRightOfToolbar = Math.floor(vpRect.width - (tbRect.right - vpRect.left) - margin);
        const finalWidth = Math.min(desiredWidth, availableRightOfToolbar);

        // Center horizontally, but ensure it's to the right of the toolbar
        const centeredLeft = Math.floor((vpRect.width - finalWidth) / 2);
        const minLeft = Math.max(margin, tbRect.right - vpRect.left + margin);
        const left = Math.max(centeredLeft, minLeft);

        // Center vertically
        const top = Math.floor((vpRect.height - desiredHeight) / 2);

        infoBox.style.left = `${left}px`;
        infoBox.style.top = `${top}px`;
        infoBox.style.width = `${finalWidth}px`;
        infoBox.style.height = `${desiredHeight}px`;
        infoBox.style.maxWidth = 'none';

        const scrollWrapper = document.getElementById('info-box-scroll-wrapper');
        if (scrollWrapper) {
            scrollWrapper.style.maxHeight = 'none';
            scrollWrapper.style.height = 'calc(100% - 3rem)';
        }
    }

    function updateInfoBoxHeaderTitle(title) {
        const titleElement = document.getElementById('info-box-title');
        titleElement.textContent = title;

        // Show title only in expanded mode
        if (infoBox.classList.contains('expanded')) {
            titleElement.classList.remove('hidden');
        } else {
            titleElement.classList.add('hidden');
        }
    }

    function toggleInfoBoxExpand() {
        const isExpanded = infoBox.classList.toggle('expanded');
        const expandBtn = document.getElementById('info-box-expand');
        const titleElement = document.getElementById('info-box-title');

        if (expandBtn) {
            expandBtn.className = `fas ${isExpanded ? 'fa-compress' : 'fa-expand'}`;
            expandBtn.title = isExpanded ? 'Vue compacte' : 'Vue étendue';
        }

        // Show/hide title and delete button based on expanded state
        const deleteBtn = document.getElementById('info-box-delete');
        if (isExpanded) {
            titleElement.classList.remove('hidden');
            deleteBtn.classList.remove('hidden');
            positionInfoBoxExpanded();
            // Activate image tab by default when expanding
            activateTab('image');
        } else {
            titleElement.classList.add('hidden');
            deleteBtn.classList.add('hidden');
            // Return to compact mode positioning (centered)
            positionInfoBoxCompact();
        }
    }

    window.addEventListener('resize', () => {
        if (infoBox.style.display === 'block' && infoBox.classList.contains('expanded')) {
            positionInfoBoxExpanded();
        }
    });

       // --- Auto-sync Functions ---
        function enableAutoSync() {
            if (currentUser) {
                autoSyncEnabled = true;
                loadUserData();
                console.log("✅ Auto-sync activé");
                updateSyncStatus("Synchronisation automatique activée.");
            }
        }

        function disableAutoSync() {
            autoSyncEnabled = false;
            console.log("❌ Auto-sync désactivé");
            updateSyncStatus("Synchronisation automatique désactivée.");
        }

        function scheduleAutoSync() {
            if (!autoSyncEnabled || !currentUser) return;

            // Debounce: attendre 2 secondes après la dernière modification
            clearTimeout(window.autoSyncTimeout);
            window.autoSyncTimeout = setTimeout(() => {
                autoSyncUserData();
            }, SYNC_DELAY);
        }

        // --- Calendar Functions ---
        function loadCalendarFromCSV(csvContent) {
            const lines = csvContent.trim().split('\n');
            const calendar = [];

            for (const line of lines) {
                const parts = line.split(',');
                if (parts.length >= 3) {
                    const monthName = parts[0].trim();
                    const season = parts[1].trim();
                    const days = parts.slice(2).map(d => parseInt(d.trim())).filter(d => !isNaN(d));

                    calendar.push({
                        name: monthName,
                        season: season,
                        days: days
                    });
                }
            }

            return calendar;
        }

        function saveCalendarToLocal() {
            if (calendarData) {
                localStorage.setItem('calendarData', JSON.stringify(calendarData));
            }
            if (currentCalendarDate) {
                localStorage.setItem('currentCalendarDate', JSON.stringify(currentCalendarDate));
            }
            localStorage.setItem('isCalendarMode', isCalendarMode.toString());
        }

        function loadCalendarFromLocal() {
            const savedCalendar = localStorage.getItem('calendarData');
            const savedDate = localStorage.getItem('currentCalendarDate');
            const savedMode = localStorage.getItem('isCalendarMode');

            if (savedCalendar) {
                try {
                    calendarData = JSON.parse(savedCalendar);
                } catch (e) {
                    console.error('Error loading calendar:', e);
                }
            }

            if (savedDate) {
                try {
                    currentCalendarDate = JSON.parse(savedDate);
                } catch (e) {
                    console.error('Error loading calendar date:', e);
                }
            }

            isCalendarMode = savedMode === 'true';
        }

        function updateCalendarUI() {
            const calendarStatus = document.getElementById('calendar-status-text');
            const dateSelector = document.getElementById('calendar-date-selector');
            const monthSelect = document.getElementById('calendar-month-select');
            const daySelect = document.getElementById('calendar-day-select');
            const manualSeasons = document.getElementById('manual-seasons-section');
            const seasonModeInfo = document.getElementById('season-mode-info');

            if (calendarData && calendarData.length > 0) {
                isCalendarMode = true;
                calendarStatus.textContent = `Calendrier chargé (${calendarData.length} mois)`;
                calendarStatus.className = 'text-green-400';
                dateSelector.classList.remove('hidden');

                // Populate month selector with season icons
                monthSelect.innerHTML = '<option value="">Sélectionner un mois</option>';
                calendarData.forEach((month, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    // Get season icon
                    const seasonMainName = month.season.toLowerCase().split('-')[0];
                    const seasonIcon = seasonSymbols[seasonMainName] || '🌿';
                    option.textContent = `${seasonIcon} ${month.name}`;
                    monthSelect.appendChild(option);
                });

                // Set current selections
                if (currentCalendarDate) {
                    const monthIndex = calendarData.findIndex(m => m.name === currentCalendarDate.month);
                    if (monthIndex >= 0) {
                        monthSelect.value = monthIndex;
                        updateDaySelector();
                        daySelect.value = currentCalendarDate.day;
                    }
                }

                // Hide manual seasons completely
                manualSeasons.style.display = 'none';
                seasonModeInfo.textContent = 'Mode calendrier : la saison est déterminée automatiquement par la date sélectionnée.';
            } else {
                isCalendarMode = false;
                calendarStatus.textContent = 'Aucun calendrier chargé';
                calendarStatus.className = 'text-gray-400';
                dateSelector.classList.add('hidden');

                // Show manual seasons
                manualSeasons.style.display = 'block';
                seasonModeInfo.textContent = 'Mode manuel : sélectionnez une saison. Importez un calendrier CSV pour synchroniser automatiquement les saisons avec les dates.';
            }
        }

        function updateDaySelector() {
            const monthSelect = document.getElementById('calendar-month-select');
            const daySelect = document.getElementById('calendar-day-select');
            const monthIndex = parseInt(monthSelect.value);

            daySelect.innerHTML = '<option value="">Sélectionner un jour</option>';

            if (monthIndex >= 0 && calendarData[monthIndex]) {
                const month = calendarData[monthIndex];
                month.days.forEach(day => {
                    const option = document.createElement('option');
                    option.value = day;
                    option.textContent = day;
                    daySelect.appendChild(option);
                });
            }
        }

        function updateCalendarDate() {
            const monthSelect = document.getElementById('calendar-month-select');
            const daySelect = document.getElementById('calendar-day-select');
            const monthIndex = parseInt(monthSelect.value);
            const day = parseInt(daySelect.value);

            if (monthIndex >= 0 && !isNaN(day) && calendarData[monthIndex]) {
                const month = calendarData[monthIndex];
                currentCalendarDate = {
                    month: month.name,
                    day: day
                };

                // Update season based on exact calendar season - use the season directly from CSV
                const calendarSeason = month.season.toLowerCase();
                console.log("📅 Saison du calendrier CSV:", calendarSeason, "pour le mois:", month.name);

                // Use the exact season from the CSV as-is
                currentSeason = calendarSeason;

                // Save the season for consistency
                localStorage.setItem('currentSeason', currentSeason);

                updateSeasonDisplay();
                saveCalendarToLocal();
                scheduleAutoSync();
            }
        }

        function exportCalendarToCSV() {
            if (!calendarData || calendarData.length === 0) {
                alert('Aucun calendrier à exporter');
                return;
            }

            const csvLines = calendarData.map(month => {
                const daysStr = month.days.join(',');
                return `${month.name},${month.season},${daysStr}`;
            });

            const csvContent = csvLines.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'calendrier.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

    // --- Narration Functions ---
        function updateJourneyButtonTitle() {
            const button = document.getElementById('describe-journey-btn');
            const narrationStyle = localStorage.getItem('narrationStyle') || 'brief';

            if (button) {
                let styleText = '';
                switch (narrationStyle) {
                    case 'detailed':
                        styleText = ' (Détaillée)';
                        break;
                    case 'brief':
                        styleText = ' (Brève)';
                        break;
                    case 'keywords':
                        styleText = ' (Points clés)';
                        break;
                    default:
                        styleText = ' (Brève)';
                }

                const span = button.querySelector('span:last-child');
                if (span) {
                    span.textContent = `Décrire le voyage${styleText}`;
                }
                console.log("📖 Mise à jour du titre du bouton:", narrationStyle, "Titre mis à jour");
            } else {
                console.log("📖 Mise à jour du titre du bouton:", narrationStyle, "Bouton non trouvé");
            }
        }

        function setupNarrationListeners() {
            console.log("📖 Configuration des listeners de narration...");

            const radioButtons = document.querySelectorAll('input[name="narration-style"]');
            console.log("📖 Radio buttons de narration trouvés:", radioButtons.length);

            radioButtons.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        localStorage.setItem('narrationStyle', e.target.value);
                        updateJourneyButtonTitle();
                        console.log("📖 Style de narration changé:", e.target.value);
                        scheduleAutoSync();
                    }
                });
            });

            // Load saved narration style
            const savedStyle = localStorage.getItem('narrationStyle') || 'brief';
            const savedRadio = document.querySelector(`input[name="narration-style"][value="${savedStyle}"]`);
            if (savedRadio) {
                savedRadio.checked = true;
            }
        }

        function getNarrationPromptAddition() {
            const narrationStyle = localStorage.getItem('narrationStyle') || 'brief';

            switch (narrationStyle) {
                case 'detailed':
                    return '\n\nRédige une narration détaillée avec plusieurs paragraphes, dans un style littéraire évocateur digne des grands récits de fantasy.';
                case 'brief':
                    return '\n\nSois concis, un seul paragraphe par jour de voyage.';
                case 'keywords':
                    return '\n\nFournis seulement des mots-clés évocateurs séparés par des virgules, pour inspiration du Meneur de Jeu.';
                default:
                    return '\n\nSois concis, un seul paragraphe par jour de voyage.';
            }
        }

        // --- Season Functions ---
        function updateSeasonDisplay() {
            const seasonMainName = currentSeason.split('-')[0]; // 'printemps', 'ete', etc.
            const symbol = seasonSymbols[seasonMainName] || '🌿'; // fallback symbol

            // Use the season name from seasonNames if available, otherwise use currentSeason directly
            const fullName = seasonNames[currentSeason] || currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1);

            console.log("🌱 Affichage saison:", {
                currentSeason: currentSeason,
                seasonMainName: seasonMainName,
                symbol: symbol,
                fullName: fullName,
                isCalendarMode: isCalendarMode
            });

            // Update header indicator
            const seasonIndicator = document.getElementById('season-indicator');
            if (seasonIndicator) {
                seasonIndicator.textContent = symbol;
                seasonIndicator.title = `Saison actuelle: ${fullName}`;
            }

            // Update calendar date indicator in header
            const calendarDateIndicator = document.getElementById('calendar-date-indicator');
            if (calendarDateIndicator && currentCalendarDate && isCalendarMode) {
                calendarDateIndicator.textContent = `${currentCalendarDate.day} ${currentCalendarDate.month}`;
                calendarDateIndicator.classList.remove('hidden');
            } else {
                calendarDateIndicator.classList.add('hidden');
            }

            // Update settings display
            const currentSeasonSymbol = document.getElementById('current-season-symbol');
            const currentSeasonText = document.getElementById('current-season-text');
            const currentCalendarDateElement = document.getElementById('current-calendar-date');

            if (currentSeasonSymbol) currentSeasonSymbol.textContent = symbol;
            if (currentSeasonText) currentSeasonText.textContent = fullName;

            if (currentCalendarDateElement && currentCalendarDate && isCalendarMode) {
                currentCalendarDateElement.textContent = `${currentCalendarDate.day} ${currentCalendarDate.month}`;
                currentCalendarDateElement.classList.remove('hidden');
            } else if (currentCalendarDateElement) {
                currentCalendarDateElement.classList.add('hidden');
            }
        }

        function setupSeasonListeners() {
            // Season radio buttons (manual mode)
            document.querySelectorAll('input[name="season"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.checked && !isCalendarMode) {
                        currentSeason = e.target.value;
                        localStorage.setItem('currentSeason', currentSeason);
                        updateSeasonDisplay();
                        scheduleAutoSync();
                    }
                });
            });

            // Calendar upload button
            const uploadBtn = document.getElementById('upload-calendar-btn');
            const fileInput = document.getElementById('calendar-file-input');

            if (uploadBtn && fileInput) {
                uploadBtn.addEventListener('click', () => {
                    fileInput.click();
                });

                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file && file.type === 'text/csv') {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            try {
                                calendarData = loadCalendarFromCSV(event.target.result);
                                if (calendarData.length > 0) {
                                    // Set default date (first day of first month)
                                    currentCalendarDate = {
                                        month: calendarData[0].name,
                                        day: calendarData[0].days[0]
                                    };
                                    updateCalendarUI();
                                    updateCalendarDate();
                                    alert(`Calendrier importé avec succès (${calendarData.length} mois)`);
                                } else {
                                    alert('Fichier CSV invalide ou vide');
                                }
                            } catch (error) {
                                console.error('Error importing calendar:', error);
                                alert('Erreur lors de l\'importation du calendrier');
                            }
                        };
                        reader.readAsText(file);
                    } else {
                        alert('Veuillez sélectionner un fichier CSV valide');
                    }
                    fileInput.value = ''; // Reset input
                });
            }

            // Calendar export button
            const exportBtn = document.getElementById('export-calendar-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', exportCalendarToCSV);
            }

            // Calendar month selector
            const monthSelect = document.getElementById('calendar-month-select');
            if (monthSelect) {
                monthSelect.addEventListener('change', () => {
                    updateDaySelector();
                    updateCalendarDate();
                });
            }

            // Calendar day selector
            const daySelect = document.getElementById('calendar-day-select');
            if (daySelect) {
                daySelect.addEventListener('change', updateCalendarDate);
            }
        }

        function loadSavedSeason() {
            // Load calendar data first
            loadCalendarFromLocal();

            const saved = localStorage.getItem('currentSeason');
            if (saved && seasonNames[saved]) {
                currentSeason = saved;
            }

            // Update UI based on calendar mode
            if (isCalendarMode && calendarData) {
                updateCalendarUI();
            } else {
                // Update radio button for manual mode
                const radioButton = document.querySelector(`input[name="season"][value="${currentSeason}"]`);
                if (radioButton) {
                    radioButton.checked = true;
                }
                updateCalendarUI();
            }

            updateSeasonDisplay();
        }

        async function autoSyncUserData() {
            if (!currentUser || !autoSyncEnabled) return;

            const userData = {
                locations: locationsData,
                regions: regionsData,
                scale: scale,
                panX: panX,
                panY: panY,
                activeFilters: activeFilters,
                filters: activeFilters, // Ajout explicite des filtres pour compatibilité
                journeyPath: journeyPath,
                totalPathPixels: totalPathPixels,
                startPoint: startPoint,
                lastPoint: lastPoint,
                journeyDiscoveries: journeyDiscoveries, // Included journey discoveries
                currentSeason: currentSeason, // Include season data
                calendarData: calendarData, // Include calendar data
                currentCalendarDate: currentCalendarDate,
                isCalendarMode: isCalendarMode
            };

            console.log("🔄 Synchronisation des données:", {
                journeyPathLength: journeyPath.length,
                totalPathPixels: totalPathPixels,
                hasStartPoint: !!startPoint,
                hasLastPoint: !!lastPoint,
                currentSeason: currentSeason
            });

            try {
                const response = await fetch('/api/user/data', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                if (response.ok) {
                    lastSyncTime = Date.now();
                    console.log("✅ Données utilisateur synchronisées automatiquement (tracé et saison inclus)");
                } else {
                    console.error("❌ Erreur lors de la synchronisation automatique");
                }
            } catch (error) {
                console.error("❌ Erreur réseau lors de la synchronisation:", error);
            }
        }

        async function loadUserData() {
            if (!currentUser) return;

            try {
                const response = await fetch('/api/user/data');
                if (response.ok) {
                    const userData = await response.json();

                    // Charger les données utilisateur
                    if (userData.locations) {
                        locationsData = userData.locations;
                        console.log("📍 Lieux utilisateur chargés");
                    }
                    if (userData.regions) {
                        regionsData = userData.regions;
                        console.log("🗺️ Régions utilisateur chargées");
                    }
                    if (userData.scale) {
                        scale = userData.scale;
                        panX = userData.panX || 0;
                        panY = userData.panY || 0;
                        console.log("🔍 Vue utilisateur restaurée");
                    }
                    if (userData.activeFilters) {
                        activeFilters = userData.activeFilters;
                        console.log("🔍 Filtres utilisateur restaurés");
                    }

                    // Charger les tracés de voyage
                    if (userData.journeyPath && Array.isArray(userData.journeyPath)) {
                        journeyPath = userData.journeyPath;
                        totalPathPixels = userData.totalPathPixels || 0;
                        startPoint = userData.startPoint || null;
                        lastPoint = userData.lastPoint || null;

                        // Charger les découvertes de voyage
                        if (userData.journeyDiscoveries && Array.isArray(userData.journeyDiscoveries)) {
                            journeyDiscoveries = userData.journeyDiscoveries;
                            console.log("🌟 Découvertes de voyage chargées");
                        }

                        // Redessiner le tracé sur le canvas
                        if (journeyPath.length > 0) {
                            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                            ctx.beginPath();
                            ctx.moveTo(journeyPath[0].x, journeyPath[0].y);

                            for (let i = 1; i < journeyPath.length; i++) {
                                ctx.lineTo(journeyPath[i].x, journeyPath[i].y);
                            }
                            ctx.stroke();

                            // Mettre à jour l'affichage des distances
                            updateDistanceDisplay();
                            // Réinitialiser les régions traversées et lieux proches
                            updateJourneyInfo();
                        }

                        console.log("🎨 Tracé de voyage restauré");
                    }

                    // Charger les filtres depuis le cloud
                    if (userData.filters) {
                        activeFilters = userData.filters;
                        console.log("🔍 Filtres utilisateur chargés depuis le cloud");
                        // Sauvegarder localement pour synchronisation
                        saveFiltersToLocal();
                    }

                    // Charger la saison depuis le cloud
                    if (userData.currentSeason && seasonNames[userData.currentSeason]) {
                        currentSeason = userData.currentSeason;
                        localStorage.setItem('currentSeason', currentSeason);
                        console.log("🌱 Saison utilisateur chargée depuis le cloud:", currentSeason);
                    }

                    // Charger le calendrier depuis le cloud
                    if (userData.calendarData) {
                        calendarData = userData.calendarData;
                        console.log("📅 Calendrier utilisateur chargé depuis le cloud");
                    }
                    if (userData.currentCalendarDate) {
                        currentCalendarDate = userData.currentCalendarDate;
                        console.log("📅 Date calendrier utilisateur chargée depuis le cloud");
                    }
                    if (userData.isCalendarMode !== undefined) {
                        isCalendarMode = userData.isCalendarMode;
                        console.log("📅 Mode calendrier utilisateur chargé depuis le cloud:", isCalendarMode);
                    }

                    // Re-render everything
                    renderLocations();
                    renderRegions();
                    applyTransform();
                    updateFiltersUI();
                    updateSeasonDisplay();

                    console.log("✅ Données utilisateur complètement chargées");
                } else if (response.status === 404) {
                    console.log("ℹ️ Aucune donnée utilisateur trouvée, utilisation des données par défaut");
                }
            } catch (error) {
                console.error("Erreur lors du chargement des données utilisateur:", error);
            }
        }

        function updateFiltersUI() {
            // Mettre à jour l'interface des filtres
            document.getElementById('filter-known').checked = activeFilters.known;
            document.getElementById('filter-visited').checked = activeFilters.visited;
            document.getElementById('filter-show-regions').checked = true;
            document.querySelectorAll('.filter-color-checkbox').forEach(cb => {
                cb.checked = activeFilters.colors.includes(cb.dataset.color);
            });

            // Sauvegarder les filtres après mise à jour
            saveFiltersToLocal();
        }
    }