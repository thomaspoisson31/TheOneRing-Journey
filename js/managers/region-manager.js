
class RegionManager {
    constructor(domElements) {
        this.dom = domElements;
    }

    loadFromStorage() {
        const saved = localStorage.getItem('middleEarthRegions');
        if (saved) {
            try {
                AppState.regionsData = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load regions from localStorage:', e);
                AppState.regionsData = { regions: [] };
            }
        }
    }

    render() {
        this.dom.regionsLayer.innerHTML = '';

        AppState.regionsData.regions.forEach(region => {
            if (region.points && region.points.length >= 3) {
                const pathData = `M ${region.points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathData);
                path.classList.add('region');
                path.style.fill = CONFIG.COLORS.regions[region.color] || CONFIG.COLORS.regions.green;
                path.style.stroke = CONFIG.COLORS.locations[region.color] || CONFIG.COLORS.locations.green;
                path.dataset.regionId = region.id;

                path.addEventListener('click', (e) => {
                    if (!AppState.modes.isAddingRegionMode && !AppState.modes.isDrawingMode && !AppState.modes.isAddingLocationMode) {
                        e.stopPropagation();
                        this.showRegionInfo(e, region);
                    }
                });

                this.dom.regionsLayer.appendChild(path);
            }
        });
    }

    showRegionInfo(event, region) {
        window.dispatchEvent(new CustomEvent('showRegionInfo', { detail: { region } }));
    }

    addPoint(event) {
        const coords = window.mapManager.getCanvasCoordinates(event);
        AppState.regionCreation.currentPoints.push(coords);
        this.updateTempRegion();
        this.addVisualPoint(coords);
    }

    updateTempRegion() {
        const existingTemp = this.dom.regionsLayer.querySelector('.region-temp');
        if (existingTemp) existingTemp.remove();

        if (AppState.regionCreation.currentPoints.length >= 2) {
            const pathData = `M ${AppState.regionCreation.currentPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.classList.add('region-temp');
            this.dom.regionsLayer.appendChild(path);
            AppState.regionCreation.tempPath = path;
        }
    }

    addVisualPoint(coords) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', coords.x);
        circle.setAttribute('cy', coords.y);
        circle.setAttribute('r', 4);
        circle.classList.add('region-point');
        circle.dataset.tempPoint = 'true';
        this.dom.regionsLayer.appendChild(circle);
    }

    completeRegion() {
        if (AppState.regionCreation.currentPoints.length >= 3) {
            this.showAddRegionModal();
        } else {
            alert('Une région doit avoir au moins 3 points.');
        }
    }

    showAddRegionModal() {
        this.dom.showModal(this.dom.addRegionModal);
        this.dom.getElementById('region-name-input').focus();
        this.setupColorPicker();
    }

    setupColorPicker() {
        const regionColorPicker = this.dom.getElementById('region-color-picker');
        regionColorPicker.innerHTML = Object.keys(CONFIG.COLORS.regions).map((color, index) =>
            `<div class="color-swatch ${index === 0 ? 'selected' : ''}" data-color="${color}" style="background-color: ${CONFIG.COLORS.regions[color]}; border: 2px solid ${CONFIG.COLORS.locations[color]};"></div>`
        ).join('');

        regionColorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                regionColorPicker.querySelector('.color-swatch.selected').classList.remove('selected');
                swatch.classList.add('selected');
            });
        });
    }

    saveRegion() {
        const nameInput = this.dom.getElementById('region-name-input');
        const descInput = this.dom.getElementById('region-desc-input');
        const selectedColor = this.dom.querySelector('#region-color-picker .selected').dataset.color;

        if (nameInput.value && AppState.regionCreation.currentPoints.length >= 3) {
            const newRegion = {
                id: Date.now(),
                name: nameInput.value,
                description: descInput.value,
                color: selectedColor,
                points: [...AppState.regionCreation.currentPoints],
                Rumeur: "A définir",
                Tradition_Ancienne: "A définir"
            };

            AppState.regionsData.regions.push(newRegion);
            this.saveToLocal();
            this.render();
            this.cancelCreation();
            this.dom.hideModal(this.dom.addRegionModal);
            nameInput.value = '';
            descInput.value = '';
        }
    }

    cancelCreation() {
        AppState.regionCreation.currentPoints = [];
        this.dom.regionsLayer.querySelectorAll('[data-temp-point]').forEach(el => el.remove());
        if (AppState.regionCreation.tempPath) {
            AppState.regionCreation.tempPath.remove();
            AppState.regionCreation.tempPath = null;
        }
    }

    saveToLocal() {
        localStorage.setItem('middleEarthRegions', JSON.stringify(AppState.regionsData));
        window.dispatchEvent(new CustomEvent('scheduleAutoSync'));
    }

    deleteRegion(regionId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette région ?')) return;
        
        const regionIndex = AppState.regionsData.regions.findIndex(reg => reg.id === regionId);
        if (regionIndex !== -1) {
            AppState.regionsData.regions.splice(regionIndex, 1);
            this.saveToLocal();
            this.render();
            window.dispatchEvent(new CustomEvent('hideInfoBox'));
        }
    }
}
