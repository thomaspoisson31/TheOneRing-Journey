
class LocationManager {
    constructor(domElements) {
        this.dom = domElements;
    }

    async loadInitialData() {
        console.log("Attempting to load locations...");
        
        const savedData = localStorage.getItem('middleEarthLocations');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                if (parsedData && Array.isArray(parsedData.locations)) {
                    AppState.locationsData = parsedData;
                    console.log("✅ Success: Loaded saved locations from localStorage.");
                    return;
                }
            } catch (e) {
                console.error("Failed to parse saved locations, will fetch from URL.", e);
            }
        }

        console.log("No valid saved data found. Fetching from URL:", CONFIG.FILES.LOCATIONS_URL);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(CONFIG.FILES.LOCATIONS_URL, {
                signal: controller.signal,
                cache: 'no-cache'
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data && Array.isArray(data.locations)) {
                AppState.locationsData = data;
                console.log("✅ Success: Loaded default locations from URL.");
                this.saveToLocal();
            } else {
                throw new Error("Invalid JSON structure from URL");
            }
        } catch (error) {
            console.error("❌ Error fetching locations from URL, using empty list as fallback.", error);
            AppState.locationsData = { locations: [] };
            this.saveToLocal();
        }
    }

    render() {
        this.dom.locationsLayer.innerHTML = '';
        const filteredLocations = this.getFilteredLocations();

        filteredLocations.forEach(location => {
            const marker = this.createLocationMarker(location);
            this.dom.locationsLayer.appendChild(marker);
        });
    }

    getFilteredLocations() {
        return AppState.locationsData.locations.filter(location => {
            if (!location.coordinates || 
                typeof location.coordinates.x === 'undefined' || 
                typeof location.coordinates.y === 'undefined') {
                return false;
            }

            const knownMatch = !AppState.activeFilters.known || location.known;
            const visitedMatch = !AppState.activeFilters.visited || location.visited;
            const colorMatch = AppState.activeFilters.colors.length === 0 || 
                              AppState.activeFilters.colors.includes(location.color);
            
            return knownMatch && visitedMatch && colorMatch;
        });
    }

    createLocationMarker(location) {
        const marker = this.dom.createElement('div', 'location-marker');
        marker.style.left = `${location.coordinates.x}px`;
        marker.style.top = `${location.coordinates.y}px`;
        marker.style.backgroundColor = location.known ? 
            (CONFIG.COLORS.locations[location.color] || CONFIG.COLORS.locations.red) : 
            'rgba(107, 114, 128, 0.7)';
        marker.style.borderColor = location.visited ? 
            'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        marker.dataset.id = location.id;
        marker.title = location.name;

        this.setupMarkerEvents(marker);
        return marker;
    }

    setupMarkerEvents(marker) {
        if (AppState.modes.isDrawingMode) {
            marker.style.pointerEvents = 'none';
            return;
        }

        marker.style.pointerEvents = 'auto';

        if (!AppState.modes.isAddingLocationMode && !AppState.modes.isAddingRegionMode) {
            marker.addEventListener('mousedown', (e) => this.startDragMarker(e));
            marker.addEventListener('click', (e) => {
                if (e.detail > 0 && !AppState.modes.isAddingLocationMode && !AppState.modes.isAddingRegionMode) {
                    this.showLocationInfo(e);
                }
            });
        }
    }

    startDragMarker(e) {
        e.stopPropagation();
        AppState.dragState.draggedMarker = e.target;
        AppState.dragState.startX = e.clientX;
        AppState.dragState.startY = e.clientY;
        
        document.addEventListener('mousemove', this.dragMarker.bind(this));
        document.addEventListener('mouseup', this.stopDragMarker.bind(this));
    }

    dragMarker(e) {
        if (!AppState.dragState.draggedMarker) return;
        
        const deltaX = e.clientX - AppState.dragState.startX;
        const deltaY = e.clientY - AppState.dragState.startY;
        const newX = parseFloat(AppState.dragState.draggedMarker.style.left) + (deltaX / AppState.transform.scale);
        const newY = parseFloat(AppState.dragState.draggedMarker.style.top) + (deltaY / AppState.transform.scale);
        
        AppState.dragState.draggedMarker.style.left = `${newX}px`;
        AppState.dragState.draggedMarker.style.top = `${newY}px`;
        
        AppState.dragState.startX = e.clientX;
        AppState.dragState.startY = e.clientY;
    }

    stopDragMarker() {
        if (!AppState.dragState.draggedMarker) return;
        
        const locationId = parseInt(AppState.dragState.draggedMarker.dataset.id, 10);
        const location = AppState.locationsData.locations.find(loc => loc.id === locationId);
        
        if (location) {
            location.coordinates.x = parseFloat(AppState.dragState.draggedMarker.style.left);
            location.coordinates.y = parseFloat(AppState.dragState.draggedMarker.style.top);
        }
        
        AppState.dragState.draggedMarker = null;
        document.removeEventListener('mousemove', this.dragMarker.bind(this));
        document.removeEventListener('mouseup', this.stopDragMarker.bind(this));
        this.saveToLocal();
    }

    showLocationInfo(event) {
        const marker = event.currentTarget;
        AppState.activeLocationId = parseInt(marker.dataset.id, 10);
        const location = AppState.locationsData.locations.find(loc => loc.id === AppState.activeLocationId);
        
        if (!location) return;
        
        // This will be handled by UIManager
        window.dispatchEvent(new CustomEvent('showLocationInfo', { detail: { location } }));
    }

    addLocation(event) {
        const coords = window.mapManager.getCanvasCoordinates(event);
        AppState.newLocationCoords = coords;
        
        this.dom.showModal(this.dom.addLocationModal);
        this.setupAddLocationForm();
        
        // Reset modes
        AppState.modes.isAddingLocationMode = false;
        this.dom.removeClass(this.dom.viewport, 'adding-location');
        this.dom.removeClass(this.dom.addLocationBtn, 'btn-active');
    }

    setupAddLocationForm() {
        // Setup color picker
        const colorPicker = this.dom.getElementById('add-color-picker');
        colorPicker.innerHTML = Object.keys(CONFIG.COLORS.locations).map((color, index) =>
            `<div class="color-swatch ${index === 0 ? 'selected' : ''}" data-color="${color}" style="background-color: ${CONFIG.COLORS.locations[color]}"></div>`
        ).join('');

        colorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                colorPicker.querySelector('.color-swatch.selected').classList.remove('selected');
                swatch.classList.add('selected');
            });
        });

        // Setup form defaults
        this.dom.getElementById('location-known-input').checked = true;
        this.dom.getElementById('location-visited-input').checked = false;

        // Setup visited checkbox behavior
        const visitedCheckbox = this.dom.getElementById('location-visited-input');
        const knownCheckbox = this.dom.getElementById('location-known-input');
        
        visitedCheckbox.addEventListener('change', () => {
            if (visitedCheckbox.checked) {
                knownCheckbox.checked = true;
            }
        });
    }

    saveLocation() {
        const nameInput = this.dom.getElementById('location-name-input');
        const descInput = this.dom.getElementById('location-desc-input');
        const imageInput = this.dom.getElementById('location-image-input');
        const colorSelected = this.dom.querySelector('#add-color-picker .selected');
        const knownInput = this.dom.getElementById('location-known-input');
        const visitedInput = this.dom.getElementById('location-visited-input');

        if (!nameInput.value || !AppState.newLocationCoords) return;

        const newLocation = {
            id: Date.now(),
            name: nameInput.value,
            description: descInput.value,
            imageUrl: imageInput.value,
            color: colorSelected.dataset.color,
            known: knownInput.checked,
            visited: visitedInput.checked,
            type: "custom",
            coordinates: AppState.newLocationCoords,
            Rumeur: "A définir",
            Tradition_Ancienne: "A définir"
        };

        AppState.locationsData.locations.push(newLocation);
        this.render();
        this.saveToLocal();
        this.clearAddLocationForm();
        this.dom.hideModal(this.dom.addLocationModal);
    }

    clearAddLocationForm() {
        this.dom.getElementById('location-name-input').value = '';
        this.dom.getElementById('location-desc-input').value = '';
        this.dom.getElementById('location-image-input').value = '';
        AppState.newLocationCoords = null;
    }

    deleteLocation(locationId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce lieu ?')) return;
        
        const locationIndex = AppState.locationsData.locations.findIndex(loc => loc.id === locationId);
        if (locationIndex !== -1) {
            AppState.locationsData.locations.splice(locationIndex, 1);
            this.saveToLocal();
            this.render();
            window.dispatchEvent(new CustomEvent('hideInfoBox'));
        }
    }

    saveToLocal() {
        localStorage.setItem('middleEarthLocations', JSON.stringify(AppState.locationsData));
        window.dispatchEvent(new CustomEvent('scheduleAutoSync'));
    }

    exportToFile() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState.locationsData, null, 2));
        const downloadAnchorNode = this.dom.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "Landmarks.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    async importFromFile(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const importedData = JSON.parse(text);
            
            if (importedData && Array.isArray(importedData.locations)) {
                AppState.locationsData = importedData;
                this.render();
                this.saveToLocal();
                console.log("✅ Locations imported successfully");
            } else {
                alert("Fichier JSON invalide.");
            }
        } catch (err) {
            alert("Erreur lors de la lecture du fichier.");
            console.error(err);
        }
    }
    }
}
