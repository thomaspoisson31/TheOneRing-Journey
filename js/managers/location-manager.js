
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
        console.log("🚀 Starting export...");
        
        // Combine locations and regions data
        const exportData = {
            locations: AppState.locationsData.locations || [],
            regions: AppState.regionsData.regions || []
        };
        
        console.log("📦 Export data prepared:", {
            locationsCount: exportData.locations.length,
            regionsCount: exportData.regions.length
        });
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.href = url;
        downloadAnchorNode.download = 'Landmarks.json';
        downloadAnchorNode.style.display = 'none';
        
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        document.body.removeChild(downloadAnchorNode);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log("✅ Export completed successfully");
    }

    async importFromFile(file) {
        if (!file) {
            console.error("❌ No file provided for import");
            return;
        }
        
        console.log("📥 Starting file import:", file.name, file.size, "bytes");
        
        try {
            const text = await file.text();
            console.log("📄 File content length:", text.length);
            
            const importedData = JSON.parse(text);
            console.log("🔍 Parsed data structure:", {
                hasLocations: !!importedData.locations,
                locationsCount: importedData.locations?.length || 0,
                isArray: Array.isArray(importedData.locations)
            });
            
            if (importedData && Array.isArray(importedData.locations)) {
                // Validate locations structure
                const validLocations = importedData.locations.filter(loc => 
                    loc.id && loc.name && loc.coordinates && 
                    typeof loc.coordinates.x === 'number' && 
                    typeof loc.coordinates.y === 'number'
                );
                
                console.log(`📊 Valid locations: ${validLocations.length}/${importedData.locations.length}`);
                
                if (validLocations.length > 0) {
                    AppState.locationsData = {
                        locations: validLocations
                    };
                    this.render();
                    this.saveToLocal();
                    console.log("✅ Locations imported successfully");
                } else {
                    throw new Error("Aucun lieu valide trouvé dans le fichier");
                }
                
                // Import regions if they exist
                let regionsToImport = [];
                
                // Check if there's a dedicated regions array
                if (Array.isArray(importedData.regions)) {
                    console.log("🔍 Found dedicated regions array");
                    regionsToImport = importedData.regions;
                } else {
                    // Look for regions mixed in with locations or other structures
                    console.log("🔍 Searching for regions in other data structures");
                    
                    // Check if locations array contains region-like objects
                    const allData = [...(importedData.locations || [])];
                    
                    // Add any other top-level arrays or objects that might contain regions
                    Object.keys(importedData).forEach(key => {
                        if (key !== 'locations' && Array.isArray(importedData[key])) {
                            allData.push(...importedData[key]);
                        } else if (key !== 'locations' && typeof importedData[key] === 'object' && importedData[key] !== null) {
                            // Check if it's a region-like object
                            if (importedData[key].points || importedData[key].coordinates) {
                                allData.push(importedData[key]);
                            }
                        }
                    });
                    
                    // Filter for region-like objects
                    regionsToImport = allData.filter(item => 
                        item && (Array.isArray(item.points) || item.type === 'region')
                    );
                }
                
                if (regionsToImport.length > 0) {
                    console.log(`🔍 Found ${regionsToImport.length} potential regions`);
                    
                    const validRegions = regionsToImport.filter(reg => {
                        // More flexible validation for regions
                        if (!reg || !reg.name) return false;
                        
                        // Check for points array
                        if (Array.isArray(reg.points)) {
                            return reg.points.length >= 3 && 
                                   reg.points.every(point => 
                                       typeof point.x === 'number' && 
                                       typeof point.y === 'number'
                                   );
                        }
                        
                        return false;
                    }).map(reg => ({
                        id: reg.id || Date.now() + Math.random(),
                        name: reg.name,
                        description: reg.description || reg.Description || "Description importée",
                        color: reg.color || 'green',
                        points: reg.points,
                        Rumeur: reg.Rumeur || reg.rumeur || "Rumeur importée",
                        Tradition_Ancienne: reg.Tradition_Ancienne || reg.tradition_ancienne || "Tradition importée"
                    }));
                    
                    console.log(`📊 Valid regions after filtering: ${validRegions.length}/${regionsToImport.length}`);
                    
                    if (validRegions.length > 0) {
                        AppState.regionsData = {
                            regions: [...(AppState.regionsData.regions || []), ...validRegions]
                        };
                        window.regionManager?.render();
                        window.regionManager?.saveToLocal();
                        console.log("✅ Regions imported successfully");
                    }
                } else {
                    console.log("ℹ️ No regions found in import data");
                }
            } else {
                throw new Error("Structure JSON invalide - propriété 'locations' manquante ou invalide");
            }
        } catch (err) {
            console.error("❌ Import error details:", err);
            if (err instanceof SyntaxError) {
                throw new Error("Fichier JSON invalide - erreur de syntaxe");
            } else {
                throw new Error(`Erreur lors de l'import: ${err.message}`);
            }
        }
    }
}
