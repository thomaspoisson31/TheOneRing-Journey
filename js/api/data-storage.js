// js/api/data-storage.js

App.api.dataStorage = (function() {

    // --- Public Functions ---

    function enableAutoSync() {
        if (AppState.currentUser) {
            AppState.autoSyncEnabled = true;
            loadUserData();
            console.log("✅ Auto-sync enabled");
        }
    }

    function disableAutoSync() {
        AppState.autoSyncEnabled = false;
        console.log("❌ Auto-sync disabled");
    }

    function scheduleAutoSync() {
        if (!AppState.autoSyncEnabled || !AppState.currentUser) return;

        clearTimeout(window.autoSyncTimeout);
        window.autoSyncTimeout = setTimeout(() => {
            autoSyncUserData();
        }, AppConfig.SYNC_DELAY);
    }

    async function autoSyncUserData() {
        if (!AppState.currentUser || !AppState.autoSyncEnabled) return;

        const userData = {
            locations: AppState.locationsData,
            regions: AppState.regionsData,
            scale: AppState.scale,
            panX: AppState.panX,
            panY: AppState.panY,
            activeFilters: AppState.activeFilters,
            journeyPath: AppState.journeyPath,
            totalPathPixels: AppState.totalPathPixels,
            startPoint: AppState.startPoint,
            lastPoint: AppState.lastPoint,
            journeyDiscoveries: AppState.journeyDiscoveries,
            currentSeason: AppState.currentSeason,
            calendarData: AppState.calendarData,
            currentCalendarDate: AppState.currentCalendarDate,
            isCalendarMode: AppState.isCalendarMode
        };

        try {
            const response = await fetch('/api/user/data', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                AppState.lastSyncTime = Date.now();
                console.log("✅ User data auto-synced");
            } else {
                console.error("❌ Auto-sync failed");
            }
        } catch (error) {
            console.error("❌ Network error during sync:", error);
        }
    }

    async function loadUserData() {
        if (!AppState.currentUser) return;

        try {
            const response = await fetch('/api/user/data');
            if (response.ok) {
                const userData = await response.json();

                if (userData.locations) AppState.locationsData = userData.locations;
                if (userData.regions) AppState.regionsData = userData.regions;
                if (userData.scale) {
                    AppState.scale = userData.scale;
                    AppState.panX = userData.panX || 0;
                    AppState.panY = userData.panY || 0;
                }
                if (userData.activeFilters) AppState.activeFilters = userData.activeFilters;
                if (userData.journeyPath) {
                    AppState.journeyPath = userData.journeyPath;
                    AppState.totalPathPixels = userData.totalPathPixels || 0;
                    AppState.startPoint = userData.startPoint || null;
                    AppState.lastPoint = userData.lastPoint || null;
                    AppState.journeyDiscoveries = userData.journeyDiscoveries || [];
                    App.features.journey.redraw();
                    App.features.journey.updateDistanceDisplay();
                }
                if (userData.currentSeason) AppState.currentSeason = userData.currentSeason;
                if (userData.calendarData) AppState.calendarData = userData.calendarData;
                if (userData.currentCalendarDate) AppState.currentCalendarDate = userData.currentCalendarDate;
                if (userData.isCalendarMode !== undefined) AppState.isCalendarMode = userData.isCalendarMode;

                App.features.locations.render();
                App.features.regions.render();
                App.features.maps.applyTransform();
                App.ui.filters.updateUI();
                App.features.seasons.updateDisplay();

                console.log("✅ User data loaded successfully");
            } else if (response.status === 404) {
                console.log("ℹ️ No user data found, using defaults.");
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }

    async function saveCurrentContext() {
        const contextNameInput = DOM.get('contextNameInput');
        const contextName = contextNameInput.value.trim();
        if (!contextName) {
            alert("Veuillez entrer un nom pour le contexte.");
            return;
        }
        if (!AppState.currentUser) {
            alert("Vous devez être connecté pour sauvegarder des contextes.");
            return;
        }

        const currentData = {
            locations: AppState.locationsData,
            regions: AppState.regionsData,
            scale: AppState.scale,
            panX: AppState.panX,
            panY: AppState.panY,
            activeFilters: AppState.activeFilters,
            journeyPath: AppState.journeyPath,
            totalPathPixels: AppState.totalPathPixels,
            startPoint: AppState.startPoint,
            lastPoint: AppState.lastPoint,
            journeyDiscoveries: AppState.journeyDiscoveries,
            currentSeason: AppState.currentSeason,
        };

        try {
            const response = await fetch('/api/contexts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: contextName, data: currentData })
            });

            if (response.ok) {
                alert(`Contexte "${contextName}" sauvegardé !`);
                contextNameInput.value = '';
                loadSavedContexts();
            } else {
                const errorData = await response.json();
                alert(`Erreur: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error saving context:", error);
            alert("Erreur réseau lors de la sauvegarde.");
        }
    }

    async function loadSavedContexts() {
        if (!AppState.currentUser) return;

        const savedContextsDiv = DOM.get('savedContexts');
        savedContextsDiv.innerHTML = '<p class="text-gray-500 italic">Chargement...</p>';
        try {
            const response = await fetch('/api/contexts');
            if (response.ok) {
                const contexts = await response.json();
                AppState.savedContexts = contexts;
                App.ui.main.displaySavedContexts(contexts);
            } else {
                throw new Error(`HTTP Error: ${response.status}`);
            }
        } catch (error) {
            console.error('Erreur chargement contextes:', error);
            savedContextsDiv.innerHTML = '<p class="text-red-500">Erreur chargement.</p>';
        }
    }

    async function loadContext(contextId) {
        try {
            const response = await fetch(`/api/contexts/${contextId}`);
            if (!response.ok) throw new Error(`Failed to load: ${response.status}`);

            const context = await response.json();
            const data = context.data;

            AppState.locationsData = data.locations || { locations: [] };
            AppState.regionsData = data.regions || { regions: [] };
            AppState.scale = data.scale || 1;
            AppState.panX = data.panX || 0;
            AppState.panY = data.panY || 0;
            AppState.activeFilters = data.activeFilters || { known: false, visited: false, colors: [] };
            AppState.journeyPath = data.journeyPath || [];
            AppState.totalPathPixels = data.totalPathPixels || 0;
            AppState.startPoint = data.startPoint || null;
            AppState.lastPoint = data.lastPoint || null;
            AppState.journeyDiscoveries = data.journeyDiscoveries || [];
            AppState.currentSeason = data.currentSeason || 'printemps-debut';

            App.features.journey.redraw();
            App.features.locations.render();
            App.features.regions.render();
            App.features.maps.applyTransform();
            App.ui.filters.updateUI();
            App.features.seasons.updateDisplay();

            alert(`Contexte "${context.name}" chargé.`);
            DOM.get('authModal').classList.add('hidden');
        } catch (error) {
            console.error("Error loading context:", error);
            alert("Erreur chargement contexte.");
        }
    }

    async function deleteContext(contextId) {
        if (!confirm("Supprimer ce contexte ?")) return;

        try {
            const response = await fetch(`/api/contexts/${contextId}`, { method: 'DELETE' });
            if (response.ok) {
                AppState.savedContexts = AppState.savedContexts.filter(c => c.id !== contextId);
                App.ui.main.displaySavedContexts(AppState.savedContexts);
                alert("Contexte supprimé.");
            } else {
                throw new Error(`Failed to delete: ${response.status}`);
            }
        } catch (error) {
            console.error("Error deleting context:", error);
            alert("Erreur suppression contexte.");
        }
    }

    function saveLocationsToLocal() {
        localStorage.setItem('middleEarthLocations', JSON.stringify(AppState.locationsData));
        scheduleAutoSync();
    }

    function saveRegionsToLocal() {
        localStorage.setItem('middleEarthRegions', JSON.stringify(AppState.regionsData));
        scheduleAutoSync();
    }

    function saveFiltersToLocal() {
        const filterState = {
            known: AppState.activeFilters.known,
            visited: AppState.activeFilters.visited,
            colors: AppState.activeFilters.colors,
            showRegions: DOM.get('filter-show-regions').checked
        };
        localStorage.setItem('middleEarthFilters', JSON.stringify(filterState));
    }

    function loadFiltersFromLocal() {
        const saved = localStorage.getItem('middleEarthFilters');
        if (saved) {
            try {
                const fs = JSON.parse(saved);
                AppState.activeFilters.known = fs.known || false;
                AppState.activeFilters.visited = fs.visited || false;
                AppState.activeFilters.colors = fs.colors || [];
                App.ui.filters.updateUI(fs.showRegions);
            } catch (e) {
                console.error('Failed to load filters from localStorage:', e);
            }
        }
    }

    function exportUnifiedData() {
        const allData = {
            locations: AppState.locationsData.locations || [],
            regions: AppState.regionsData.regions || [],
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "Landmark.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    function importUnifiedData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                const locations = importedData.locations || [];
                const regions = importedData.regions || [];

                if (confirm("Remplacer les données actuelles par le contenu du fichier ?")) {
                    AppState.locationsData.locations = locations;
                    AppState.regionsData.regions = regions;
                } else {
                    AppState.locationsData.locations.push(...locations);
                    AppState.regionsData.regions.push(...regions);
                }

                App.features.locations.render();
                App.features.regions.render();
                saveLocationsToLocal();
                saveRegionsToLocal();
                alert("Importation terminée !");

            } catch (err) {
                alert("Erreur: " + err.message);
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }

    function saveCalendarToLocal() {
        if (AppState.calendarData) localStorage.setItem('calendarData', JSON.stringify(AppState.calendarData));
        if (AppState.currentCalendarDate) localStorage.setItem('currentCalendarDate', JSON.stringify(AppState.currentCalendarDate));
        localStorage.setItem('isCalendarMode', AppState.isCalendarMode.toString());
    }

    function loadCalendarFromLocal() {
        const savedCalendar = localStorage.getItem('calendarData');
        const savedDate = localStorage.getItem('currentCalendarDate');
        const savedMode = localStorage.getItem('isCalendarMode');

        if (savedCalendar) AppState.calendarData = JSON.parse(savedCalendar);
        if (savedDate) AppState.currentCalendarDate = JSON.parse(savedDate);
        AppState.isCalendarMode = savedMode === 'true';
    }

    return {
        enableAutoSync,
        disableAutoSync,
        scheduleAutoSync,
        loadUserData,
        saveCurrentContext,
        loadSavedContexts,
        loadContext,
        deleteContext,
        saveLocationsToLocal,
        saveRegionsToLocal,
        saveFiltersToLocal,
        loadFiltersFromLocal,
        exportUnifiedData,
        importUnifiedData,
        saveCalendarToLocal,
        loadCalendarFromLocal
    };

})();