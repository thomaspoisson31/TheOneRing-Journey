// js/features/locations.js

App.features.locations = (function() {

    function startDragMarker(e) {
        e.stopPropagation();
        AppState.draggedMarker = e.target;
        AppState.dragStartX = e.clientX;
        AppState.dragStartY = e.clientY;
        document.addEventListener('mousemove', dragMarker);
        document.addEventListener('mouseup', stopDragMarker);
    }

    function dragMarker(e) {
        if (!AppState.draggedMarker) return;
        const deltaX = e.clientX - AppState.dragStartX;
        const deltaY = e.clientY - AppState.dragStartY;
        const newX = parseFloat(AppState.draggedMarker.style.left) + (deltaX / AppState.scale);
        const newY = parseFloat(AppState.draggedMarker.style.top) + (deltaY / AppState.scale);
        AppState.draggedMarker.style.left = `${newX}px`;
        AppState.draggedMarker.style.top = `${newY}px`;
        AppState.dragStartX = e.clientX;
        AppState.dragStartY = e.clientY;
    }

    function stopDragMarker() {
        if (!AppState.draggedMarker) return;
        const locationId = parseInt(AppState.draggedMarker.dataset.id, 10);
        const location = AppState.locationsData.locations.find(loc => loc.id === locationId);
        if (location) {
            location.coordinates.x = parseFloat(AppState.draggedMarker.style.left);
            location.coordinates.y = parseFloat(AppState.draggedMarker.style.top);
        }
        AppState.draggedMarker = null;
        document.removeEventListener('mousemove', dragMarker);
        document.removeEventListener('mouseup', stopDragMarker);
        App.api.dataStorage.saveLocationsToLocal();
    }

    // --- Public Functions ---

    async function loadInitial() {
        console.log("Attempting to load locations...");
        try {
            const saved = localStorage.getItem('middleEarthLocations');
            if (saved) {
                try {
                    AppState.locationsData = JSON.parse(saved);
                    console.log("✅ Loaded saved locations from localStorage.");
                    return;
                } catch (parseError) {
                    console.warn("⚠️ Failed to parse saved locations, loading defaults.");
                }
            }

            const response = await fetch(AppConfig.LOCATIONS_URL);
            if (response.ok) {
                AppState.locationsData = await response.json();
                console.log("✅ Loaded locations from file.");
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error("❌ Error loading locations:", error);
            AppState.locationsData = AppConfig.DEFAULT_LOCATIONS();
        }
    }

    function render() {
 
        const locationsLayer = DOM.get('locationsLayer');
        locationsLayer.innerHTML = '';
 
        const filteredLocations = AppState.locationsData.locations.filter(location => {
            if (!location.coordinates || typeof location.coordinates.x === 'undefined' || typeof location.coordinates.y === 'undefined') {
                return false;
            }
            const knownMatch = !AppState.activeFilters.known || location.known;
            const visitedMatch = !AppState.activeFilters.visited || location.visited;
            const colorMatch = AppState.activeFilters.colors.length === 0 || AppState.activeFilters.colors.includes(location.color);
            return knownMatch && visitedMatch && colorMatch;
        });

        filteredLocations.forEach(location => {
            const marker = document.createElement('div');
            marker.className = 'location-marker';
            marker.style.left = `${location.coordinates.x}px`;
            marker.style.top = `${location.coordinates.y}px`;
            marker.style.backgroundColor = location.known ? (AppConfig.COLOR_MAP[location.color] || AppConfig.COLOR_MAP.red) : 'rgba(107, 114, 128, 0.7)';
            marker.style.borderColor = location.visited ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
            marker.dataset.id = location.id;
            marker.title = location.name;

            if (AppState.isDrawingMode) {
                marker.style.pointerEvents = 'none';
            } else {
                marker.style.pointerEvents = 'auto';
                if (!AppState.isAddingLocationMode && !AppState.isAddingRegionMode) {
                    marker.addEventListener('mousedown', startDragMarker);
                }
                marker.addEventListener('click', (e) => {
                    if (!AppState.isAddingLocationMode && !AppState.isAddingRegionMode) {
                        App.ui.infoBox.showInfoBox(e);
                    }
                });
            }
 
            locationsLayer.appendChild(marker);
 
        });
    }

    function add(event) {
        AppState.newLocationCoords = App.utils.helpers.getCanvasCoordinates(event);
        DOM.get('addLocationModal').classList.remove('hidden');
        DOM.get('location-name-input').focus();
        AppState.isAddingLocationMode = false;
        DOM.get('viewport').classList.remove('adding-location');
        DOM.get('add-location-mode').classList.remove('btn-active');

        const addColorPicker = DOM.get('add-color-picker');
        addColorPicker.innerHTML = Object.keys(AppConfig.COLOR_MAP).map((color, index) => `<div class="color-swatch ${index === 0 ? 'selected' : ''}" data-color="${color}" style="background-color: ${AppConfig.COLOR_MAP[color]}"></div>`).join('');

        addColorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                addColorPicker.querySelector('.color-swatch.selected').classList.remove('selected');
                swatch.classList.add('selected');
            });
        });

        DOM.get('generate-add-desc').addEventListener('click', App.api.gemini.handleGenerateDescription);
        DOM.get('location-known-input').checked = true;
        DOM.get('location-visited-input').checked = false;
    }

    function confirmAdd() {
        const nameInput = DOM.get('location-name-input');
        const descInput = DOM.get('location-desc-input');
        const imageInput = DOM.get('location-image-input');
 
        const colorPicker = DOM.get('add-color-picker');
        const color = colorPicker.querySelector('.selected').dataset.color;
 
        const known = DOM.get('location-known-input').checked;
        const visited = DOM.get('location-visited-input').checked;

        if (nameInput.value && AppState.newLocationCoords) {
            const newLocation = {
                id: Date.now(),
                name: nameInput.value,
                description: descInput.value,
                imageUrl: imageInput.value,
                color: color,
                known: known,
                visited: visited,
                type: "custom",
                coordinates: AppState.newLocationCoords,
                Rumeurs: [],
                Tradition_Ancienne: "A définir"
            };
            AppState.locationsData.locations.push(newLocation);
            render();
            App.api.dataStorage.saveLocationsToLocal();
        }

 
        DOM.get('addLocationModal').classList.add('hidden');
 
        nameInput.value = '';
        descInput.value = '';
        imageInput.value = '';
        AppState.newLocationCoords = null;
    }

    function cancelAdd() {
 
        DOM.get('addLocationModal').classList.add('hidden');
        DOM.get('location-name-input').value = '';
        DOM.get('location-desc-input').value = '';
        DOM.get('location-image-input').value = '';
 
        AppState.newLocationCoords = null;
    }

    function findNearest(point) {
        if (!point) return { name: 'un lieu sauvage' };
        let nearest = null;
        let minDistance = Infinity;
        AppState.locationsData.locations.forEach(loc => {
            if (loc.coordinates && typeof loc.coordinates.x !== 'undefined' && typeof loc.coordinates.y !== 'undefined') {
                const distance = Math.sqrt(Math.pow(loc.coordinates.x - point.x, 2) + Math.pow(loc.coordinates.y - point.y, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = loc;
                }
            }
        });
        return nearest || { name: 'un lieu inconnu' };
    }

    function getImages(location) {
        if (location.images && Array.isArray(location.images)) return location.images.map(img => img.url).filter(Boolean);
        return location.imageUrl ? [location.imageUrl] : [];
    }

    function getTables(location) {
        if (location.tables && Array.isArray(location.tables)) return location.tables.map(table => table.url).filter(Boolean);
        return [];
    }

    function deleteLocation(locationId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce lieu ?')) {
            const locationIndex = AppState.locationsData.locations.findIndex(loc => loc.id === locationId);
            if (locationIndex !== -1) {
                AppState.locationsData.locations.splice(locationIndex, 1);
                App.api.dataStorage.saveLocationsToLocal();
                render();
                App.ui.infoBox.hideInfoBox();
            }
        }
    }

    return {
        loadInitial,
        render,
        add,
        confirmAdd,
        cancelAdd,
        findNearest,
        getImages,
        getTables,
        delete: deleteLocation
    };

})();