class UIManager {
    constructor(domElements) {
        this.dom = domElements;
    }

    setupEventListeners() {
        // Info box close button
        if (this.dom.infoBoxClose) {
            this.dom.infoBoxClose.addEventListener('click', () => {
                this.hideInfoBox();
            });
        }

        // Info box delete button
        if (this.dom.infoBoxDelete) {
            this.dom.infoBoxDelete.addEventListener('click', () => {
                this.handleDeleteAction();
            });
        }

        // Location modal buttons
        const saveLocation = this.dom.getElementById('save-location');
        if (saveLocation) {
            saveLocation.addEventListener('click', () => {
                window.locationManager?.saveLocation();
            });
        }

        const cancelAddLocation = this.dom.getElementById('cancel-add-location');
        if (cancelAddLocation) {
            cancelAddLocation.addEventListener('click', () => {
                this.dom.hideModal(this.dom.addLocationModal);
                window.locationManager?.clearAddLocationForm();
            });
        }

        // Region modal buttons
        const saveRegion = this.dom.getElementById('save-region');
        if (saveRegion) {
            saveRegion.addEventListener('click', () => {
                window.regionManager?.saveRegion();
            });
        }

        const cancelAddRegion = this.dom.getElementById('cancel-add-region');
        if (cancelAddRegion) {
            cancelAddRegion.addEventListener('click', () => {
                this.dom.hideModal(this.dom.addRegionModal);
                window.regionManager?.cancelCreation();
            });
        }

        // Note: Import/Export and Map switch event listeners are now handled in app.js

        // Modal forms
        this.setupModalForms();

        // Custom events
        this.setupCustomEvents();
    }

    setupModalForms() {
        // Location modal
        const confirmAddLocation = this.dom.getElementById('confirm-add-location');
        const cancelAddLocation = this.dom.getElementById('cancel-add-location');

        if (confirmAddLocation) {
            confirmAddLocation.addEventListener('click', () => {
                window.locationManager?.saveLocation();
            });
        }

        if (cancelAddLocation) {
            cancelAddLocation.addEventListener('click', () => {
                this.dom.hideModal(this.dom.addLocationModal);
                window.locationManager?.clearAddLocationForm();
            });
        }

        // Region modal
        const confirmAddRegion = this.dom.getElementById('confirm-add-region');
        const cancelAddRegion = this.dom.getElementById('cancel-add-region');

        if (confirmAddRegion) {
            confirmAddRegion.addEventListener('click', () => {
                window.regionManager?.saveRegion();
            });
        }

        if (cancelAddRegion) {
            cancelAddRegion.addEventListener('click', () => {
                this.dom.hideModal(this.dom.addRegionModal);
                window.regionManager?.cancelCreation();
            });
        }
    }

    setupCustomEvents() {
        window.addEventListener('showLocationInfo', (event) => {
            this.showLocationInfo(event.detail.location);
        });

        window.addEventListener('showRegionInfo', (event) => {
            this.showRegionInfo(event.detail.region);
        });

        window.addEventListener('hideInfoBox', () => {
            this.hideInfoBox();
        });

        window.addEventListener('scheduleAutoSync', () => {
            // Handle auto-sync if needed
            console.log('Auto-sync scheduled');
        });
    }

    showLocationInfo(location) {
        if (!this.dom.infoBox) return;

        // Store the active location ID for deletion
        AppState.activeLocationId = location.id;
        AppState.activeRegionId = null; // Clear region ID

        // Update info box content for location
        this.updateInfoBoxForLocation(location);
        this.dom.infoBox.style.display = 'block';
        this.positionInfoBox();
    }

    showRegionInfo(region) {
        if (!this.dom.infoBox) return;

        // Store the active region ID for deletion
        AppState.activeRegionId = region.id;
        AppState.activeLocationId = null; // Clear location ID

        // Update info box content for region
        this.updateInfoBoxForRegion(region);
        this.dom.infoBox.style.display = 'block';
        this.positionInfoBox();
    }

    updateInfoBoxForLocation(location) {
        // Basic implementation - can be expanded
        if (this.dom.infoBoxTitle) {
            this.dom.infoBoxTitle.textContent = location.name;
        }

        const imageTab = this.dom.getElementById('image-tab');
        if (imageTab) {
            imageTab.innerHTML = `
                <div class="image-view">
                    <div class="compact-title">
                        <span style="font-family: 'Merriweather', serif;">${location.name}</span>
                    </div>
                </div>
            `;
        }

        const textTab = this.dom.getElementById('text-tab');
        if (textTab) {
            textTab.innerHTML = `
                <div class="text-view">
                    <h3>${location.name}</h3>
                    <p>${location.description || 'Aucune description.'}</p>
                </div>
            `;
        }
    }

    updateInfoBoxForRegion(region) {
        // Basic implementation - can be expanded
        if (this.dom.infoBoxTitle) {
            this.dom.infoBoxTitle.textContent = region.name;
        }

        const imageTab = this.dom.getElementById('image-tab');
        if (imageTab) {
            imageTab.innerHTML = `
                <div class="image-view">
                    <div class="compact-title">
                        <span style="font-family: 'Merriweather', serif;">${region.name}</span>
                    </div>
                </div>
            `;
        }

        const textTab = this.dom.getElementById('text-tab');
        if (textTab) {
            textTab.innerHTML = `
                <div class="text-view">
                    <h3>${region.name}</h3>
                    <p>${region.description || 'Aucune description.'}</p>
                </div>
            `;
        }
    }

    hideInfoBox() {
        if (this.dom.infoBox) {
            this.dom.infoBox.style.display = 'none';
        }
        AppState.activeLocationId = null;
        AppState.activeRegionId = null;
    }

    positionInfoBox() {
        if (!this.dom.infoBox || !this.dom.viewport) return;

        const vpRect = this.dom.viewport.getBoundingClientRect();
        const boxWidth = 280;
        const boxHeight = 250;

        const left = Math.floor((vpRect.width - boxWidth) / 2);
        const top = Math.floor((vpRect.height - boxHeight) / 2);

        this.dom.infoBox.style.left = `${left}px`;
        this.dom.infoBox.style.top = `${top}px`;
        this.dom.infoBox.style.maxWidth = '280px';
    }

    handleDeleteAction() {
        if (AppState.activeLocationId) {
            window.locationManager?.deleteLocation(AppState.activeLocationId);
            AppState.activeLocationId = null;
        } else if (AppState.activeRegionId) {
            window.regionManager?.deleteRegion(AppState.activeRegionId);
            AppState.activeRegionId = null;
        }
        this.hideInfoBox();
    }
}