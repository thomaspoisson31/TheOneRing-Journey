// js/utils/dom.js

App.utils.dom = (function() {
    const elements = {
        // --- Viewport & Map ---
        viewport: document.getElementById('viewport'),
        mapContainer: document.getElementById('map-container'),
        mapImage: document.getElementById('map-image'),
        loremasterMapImage: document.getElementById('loremaster-map-image'),
        drawingCanvas: document.getElementById('drawing-canvas'),
        locationsLayer: document.getElementById('locations-layer'),
        regionsLayer: document.getElementById('regions-layer'),
        ctx: document.getElementById('drawing-canvas').getContext('2d'),

        // --- UI Panels ---
        infoBox: document.getElementById('info-box'),
        distanceContainer: document.getElementById('distance-container'),
        filterPanel: document.getElementById('filter-panel'),
        loaderOverlay: document.getElementById('loader-overlay'),

        // --- Buttons ---
        infoBoxClose: document.getElementById('info-box-close'),
        mapSwitchBtn: document.getElementById('map-switch'),
        authBtn: document.getElementById('auth-btn'),
        settingsBtn: document.getElementById('settings-btn'),

        // --- Modals ---
        addLocationModal: document.getElementById('add-location-modal'),
        addRegionModal: document.getElementById('add-region-modal'),
        journeyLogModal: document.getElementById('journey-log-modal'),
        authModal: document.getElementById('auth-modal'),
        settingsModal: document.getElementById('settings-modal'),

        // --- Auth Modal Elements ---
        closeAuthModalBtn: document.getElementById('close-auth-modal'),
        authStatusPanel: document.getElementById('auth-status-panel'),
        authContentPanel: document.getElementById('auth-content-panel'),
        loggedInPanel: document.getElementById('logged-in-panel'),
        loggedOutPanel: document.getElementById('logged-out-panel'),
        authUserName: document.getElementById('auth-user-name'),
        contextNameInput: document.getElementById('context-name-input'),
        saveContextBtn: document.getElementById('save-context-btn'),
        savedContextsDiv: document.getElementById('saved-contexts'),
        googleSigninBtn: document.getElementById('google-signin-btn'),

        // --- Settings Modal Elements ---
        closeSettingsModalBtn: document.getElementById('close-settings-modal'),

        // --- Voyage Segments ---
        voyageSegmentsModal: document.getElementById('voyage-segments-modal'),
        distanceDisplay: document.getElementById('distance-display'),
    };

    function get(id) {
        return elements[id];
    }

    function querySelector(selector) {
        return document.querySelector(selector);
    }

    function getElementById(id) {
        return document.getElementById(id);
    }

    function showModal(modal) {
        if (modal) modal.classList.remove('hidden');
    }

    function hideModal(modal) {
        if (modal) modal.classList.add('hidden');
    }

    return {
        get,
        querySelector,
        getElementById,
        showModal,
        hideModal
    };
})();

// For easier access, we can still use DOM as a shorthand
const DOM = App.utils.dom;