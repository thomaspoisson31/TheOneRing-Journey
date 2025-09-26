// js/core/state.js

const AppState = {
    // --- Data ---
    locationsData: null,
    regionsData: AppConfig.DEFAULT_REGIONS(),

    // --- Map state ---
    mapWidth: 0,
    mapHeight: 0,
    isPlayerView: true,

    // --- Transformation state ---
    scale: 1,
    panX: 0,
    panY: 0,

    // --- Interaction states ---
    isPanning: false,
    startPanX: 0,
    startPanY: 0,
    isDrawingMode: false,
    isDrawing: false,
    isAddingLocationMode: false,
    isAddingRegionMode: false,
    totalPathPixels: 0,
    lastPoint: null,
    startPoint: null,
    draggedMarker: null,
    dragStartX: 0,
    dragStartY: 0,
    newLocationCoords: null,
    activeLocationId: null,
    activeFilters: { known: false, visited: false, colors: [] },

    // --- Journey tracking ---
    journeyPath: [],
    traversedRegions: new Set(),
    nearbyLocations: new Set(),
    journeyDiscoveries: [],

    // --- Voyage Segments ---
    currentVoyage: null,
    voyageSegments: [],
    currentSegmentIndex: -1,
    isVoyageActive: false,
    activatedSegments: new Set(),

    // --- Region creation states ---
    currentRegionPoints: [],
    tempRegionPath: null,

    // --- Authentication state ---
    currentUser: null,
    savedContexts: [],

    // --- Season state ---
    currentSeason: 'printemps-debut',

    // --- Calendar state ---
    calendarData: null,
    currentCalendarDate: null,
    isCalendarMode: false,

    // --- Auto-sync state ---
    autoSyncEnabled: false,
    lastSyncTime: 0,

    // --- Maps management ---
    availableMaps: [],
    currentMapConfig: {
        playerMap: 'fr_tor_2nd_eriadors_map_page-0001.webp',
        loremasterMap: 'fr_tor_2nd_eriadors_map_page_loremaster.webp'
    },
    editingMapIndex: -1,
};