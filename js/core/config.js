// js/core/config.js

const AppConfig = {
    // --- Data ---
    COLOR_MAP: {
        red: 'rgba(239, 68, 68, 0.8)',
        blue: 'rgba(59, 130, 246, 0.8)',
        green: 'rgba(34, 197, 94, 0.8)',
        violet: 'rgba(139, 92, 246, 0.8)',
        orange: 'rgba(252, 169, 3, 0.8)',
        black: 'rgba(17, 24, 39, 0.8)'
    },
    REGION_COLOR_MAP: {
        red: 'rgba(239, 68, 68, 0.15)',
        blue: 'rgba(59, 130, 246, 0.15)',
        green: 'rgba(34, 197, 94, 0.15)',
        violet: 'rgba(139, 92, 246, 0.15)',
        orange: 'rgba(252, 169, 3, 0.15)',
        black: 'rgba(17, 24, 39, 0.15)'
    },
    DEFAULT_LOCATIONS: () => ({ "locations": [] }),
    DEFAULT_REGIONS: () => ({ "regions": [] }),

    // --- Map settings ---
    MAP_DISTANCE_MILES: 1150,
    PLAYER_MAP_URL: "fr_tor_2nd_eriadors_map_page-0001.webp",
    LOREMASTER_MAP_URL: "fr_tor_2nd_eriadors_map_page_loremaster.webp",
    LOCATIONS_URL: "Landmarks1.json",

    // --- Journey tracking ---
    PROXIMITY_DISTANCE: 50,

    // --- Auto-sync ---
    SYNC_DELAY: 2000, // 2 seconds delay before auto-sync

    // --- Season settings ---
    SEASON_SYMBOLS: {
        'printemps': '🌱',
        'ete': '☀️',
        'automne': '🍂',
        'hiver': '❄️'
    },
    SEASON_NAMES: {
        'printemps-debut': 'Printemps-début',
        'printemps-milieu': 'Printemps-milieu',
        'printemps-fin': 'Printemps-fin',
        'ete-debut': 'Été-début',
        'ete-milieu': 'Été-milieu',
        'ete-fin': 'Été-fin',
        'automne-debut': 'Automne-début',
        'automne-milieu': 'Automne-milieu',
        'automne-fin': 'Automne-fin',
        'hiver-debut': 'Hiver-début',
        'hiver-milieu': 'Hiver-milieu',
        'hiver-fin': 'Hiver-fin'
    }
};