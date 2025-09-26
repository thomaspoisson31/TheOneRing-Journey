// js/features/regions.js

App.features.regions = (function() {

    // --- Private Functions ---

    function updateTempRegion() {
        if (AppState.tempRegionPath) AppState.tempRegionPath.remove();
        if (AppState.currentRegionPoints.length >= 2) {
            const pathData = `M ${AppState.currentRegionPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.classList.add('region-temp');
            DOM.regionsLayer.appendChild(path);
            AppState.tempRegionPath = path;
        }
    }

    // --- Public Functions ---

    function render() {
        DOM.regionsLayer.innerHTML = '';
        AppState.regionsData.regions.forEach(region => {
            if (region.points && region.points.length >= 3) {
                const pathData = `M ${region.points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathData);
                path.classList.add('region');
                path.style.fill = AppConfig.REGION_COLOR_MAP[region.color] || AppConfig.REGION_COLOR_MAP.green;
                path.style.stroke = AppConfig.COLOR_MAP[region.color] || AppConfig.COLOR_MAP.green;
                path.dataset.regionId = region.id;

                path.addEventListener('click', (e) => {
                    if (!AppState.isAddingRegionMode && !AppState.isDrawingMode && !AppState.isAddingLocationMode) {
                        e.stopPropagation();
                        App.ui.infoBox.showRegionInfo(e, region);
                    }
                });
                DOM.regionsLayer.appendChild(path);
            }
        });
    }

    function addPoint(coords) {
        AppState.currentRegionPoints.push(coords);
        updateTempRegion();

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', coords.x);
        circle.setAttribute('cy', coords.y);
        circle.setAttribute('r', 4);
        circle.classList.add('region-point');
        circle.dataset.tempPoint = 'true';
        DOM.get('regionsLayer').appendChild(circle);
    }

    function complete() {
        if (AppState.currentRegionPoints.length >= 3) {
            App.ui.modals.showAddRegionModal();
        } else {
            alert('Une région doit avoir au moins 3 points.');
        }
    }

    function cancelCreation() {
        AppState.currentRegionPoints = [];
        DOM.regionsLayer.querySelectorAll('[data-temp-point]').forEach(el => el.remove());
        if (AppState.tempRegionPath) {
            AppState.tempRegionPath.remove();
            AppState.tempRegionPath = null;
        }
        AppState.isAddingRegionMode = false;
        DOM.viewport.classList.remove('adding-region');
        DOM.getElementById('add-region-mode').classList.remove('btn-active');
    }

    function save() {
        const nameInput = DOM.getElementById('region-name-input');
        const descInput = DOM.getElementById('region-desc-input');
        const selectedColor = DOM.querySelector('#region-color-picker .selected').dataset.color;

        if (nameInput.value && AppState.currentRegionPoints.length >= 3) {
            const newRegion = {
                id: Date.now(),
                name: nameInput.value,
                description: descInput.value,
                color: selectedColor,
                points: [...AppState.currentRegionPoints],
                Rumeurs: [],
                Tradition_Ancienne: "A définir"
            };

            AppState.regionsData.regions.push(newRegion);
            App.api.dataStorage.saveRegionsToLocal();
            render();
            cancelCreation();
            DOM.addRegionModal.classList.add('hidden');
            nameInput.value = '';
            descInput.value = '';
        }
    }

    function loadFromLocal() {
        const saved = localStorage.getItem('middleEarthRegions');
        if (saved) {
            try {
                AppState.regionsData = JSON.parse(saved);
                AppState.regionsData.regions.forEach(region => {
                    if (!Array.isArray(region.Rumeurs)) {
                        if (region.Rumeur && region.Rumeur !== "A définir") {
                            region.Rumeurs = [region.Rumeur];
                        } else {
                            region.Rumeurs = [];
                        }
                        delete region.Rumeur;
                    }
                });
            } catch (e) {
                console.error('Failed to load regions from localStorage:', e);
                AppState.regionsData = AppConfig.DEFAULT_REGIONS();
            }
        }
    }

    function getImages(region) {
        if (region.images && Array.isArray(region.images)) return region.images.map(img => img.url).filter(Boolean);
        return [];
    }

    function getTables(region) {
        if (region.tables && Array.isArray(region.tables)) return region.tables.map(table => table.url).filter(Boolean);
        return [];
    }

    function deleteRegion(regionId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette région ?')) {
            const regionIndex = AppState.regionsData.regions.findIndex(reg => reg.id === regionId);
            if (regionIndex !== -1) {
                AppState.regionsData.regions.splice(regionIndex, 1);
                App.api.dataStorage.saveRegionsToLocal();
                render();
                App.ui.infoBox.hideInfoBox();
            }
        }
    }

    return {
        render,
        addPoint,
        complete,
        cancelCreation,
        save,
        loadFromLocal,
        getImages,
        getTables,
        delete: deleteRegion
    };

})();