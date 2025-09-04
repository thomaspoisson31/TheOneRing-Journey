class DOMElements {
    constructor() {
        this.initializeElements();
    }

    initializeElements() {
        // Main containers
        this.viewport = document.getElementById('viewport');
        this.mapContainer = document.getElementById('map-container');
        this.mapImage = document.getElementById('map-image');
        this.loremasterMapImage = document.getElementById('loremaster-map-image');
        this.drawingCanvas = document.getElementById('drawing-canvas');
        this.regionsLayer = document.getElementById('regions-layer');
        this.locationsLayer = document.getElementById('locations-layer');
        this.loaderOverlay = document.getElementById('loader-overlay');

        // Validate critical elements
        if (!this.viewport) {
            console.error('❌ Critical: viewport element not found');
        }
        if (!this.loaderOverlay) {
            console.error('❌ Critical: loader-overlay element not found');
        }

        // Toolbar buttons
        this.drawModeBtn = document.getElementById('draw-mode');
        this.addLocationBtn = document.getElementById('add-location-mode');
        this.addRegionBtn = document.getElementById('add-region-mode');
        this.eraseBtn = document.getElementById('erase');
        this.filterToggleBtn = document.getElementById('filter-toggle');
        this.mapSwitchBtn = document.getElementById('map-switch');
        this.exportBtn = document.getElementById('export-locations');
        this.importBtn = document.getElementById('import-locations');
        this.importFileInput = document.getElementById('import-file-input');
        this.authBtn = document.getElementById('auth-btn');

        // Info box
        this.infoBox = document.getElementById('info-box');
        this.infoBoxClose = document.getElementById('info-box-close');
        this.infoBoxTitle = document.getElementById('info-box-title');
        this.infoBoxEdit = document.getElementById('info-box-edit');
        this.infoBoxDelete = document.getElementById('info-box-delete');
        this.infoBoxExpand = document.getElementById('info-box-expand');

        // Distance display
        this.distanceContainer = document.getElementById('distance-container');
        this.distanceDisplay = document.getElementById('distance-display');
        this.journeyInfoDiv = document.getElementById('journey-info');
        this.traversedRegionsInfo = document.getElementById('traversed-regions-info');
        this.traversedRegionsList = document.getElementById('traversed-regions-list');
        this.nearbyLocationsInfo = document.getElementById('nearby-locations-info');
        this.nearbyLocationsList = document.getElementById('nearby-locations-list');

        // Modals
        this.addLocationModal = document.getElementById('add-location-modal');
        this.addRegionModal = document.getElementById('add-region-modal');
        this.journeyLogModal = document.getElementById('journey-log-modal');
        this.authModal = document.getElementById('auth-modal');
        this.voyageSegmentsModal = document.getElementById('voyage-segments-modal');

        // Filter panel
        this.filterPanel = document.getElementById('filter-panel');
        this.filterKnown = document.getElementById('filter-known');
        this.filterVisited = document.getElementById('filter-visited');
        this.filterShowRegions = document.getElementById('filter-show-regions');
        this.filterColorPicker = document.getElementById('filter-color-picker');
        this.resetFiltersBtn = document.getElementById('reset-filters');

        // Canvas context
        this.ctx = this.drawingCanvas?.getContext('2d');

        // Validate critical elements
        this.validateElements();
    }

    validateElements() {
        const criticalElements = [
            'viewport', 'mapContainer', 'mapImage', 'drawingCanvas', 
            'locationsLayer', 'regionsLayer', 'ctx'
        ];

        criticalElements.forEach(elementName => {
            if (!this[elementName]) {
                console.error(`❌ Critical element missing: ${elementName}`);
            }
        });
    }

    // Helper methods for common DOM operations
    getElementById(id) {
        return document.getElementById(id);
    }

    querySelector(selector) {
        return document.querySelector(selector);
    }

    querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }

    createElement(tagName, className = '', innerHTML = '') {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }

    // Modal helpers
    showModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('hidden');
        }
    }

    hideModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('hidden');
        }
    }

    // Form helpers
    getFormData(formSelector) {
        const form = document.querySelector(formSelector);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    // Class manipulation helpers
    toggleClass(element, className, force) {
        return element?.classList.toggle(className, force);
    }

    addClass(element, className) {
        if (element) {
            element.classList.add(className);
        }
    }

    removeClass(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    }

    hasClass(element, className) {
        return element?.classList.contains(className) || false;
    }
}