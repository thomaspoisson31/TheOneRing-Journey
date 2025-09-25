// js/ui/filters.js

function setupFilters() {
    const filterColorPicker = DOM.getElementById('filter-color-picker');
    filterColorPicker.innerHTML = Object.keys(AppConfig.COLOR_MAP).map(color => `
        <label title="${color.charAt(0).toUpperCase() + color.slice(1)}" class="relative cursor-pointer">
            <input type="checkbox" data-color="${color}" class="filter-color-checkbox sr-only peer">
            <div class="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-white" style="background-color: ${AppConfig.COLOR_MAP[color]}"></div>
        </label>
    `).join('');

    DOM.getElementById('filter-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.filterPanel.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!DOM.filterPanel.contains(e.target) && !DOM.getElementById('filter-toggle').contains(e.target)) {
            DOM.filterPanel.classList.add('hidden');
        }
    });

    DOM.filterPanel.addEventListener('click', (e) => e.stopPropagation());

    DOM.getElementById('filter-known').addEventListener('change', updateFilters);
    DOM.getElementById('filter-visited').addEventListener('change', updateFilters);
    document.querySelectorAll('.filter-color-checkbox').forEach(cb => cb.addEventListener('change', updateFilters));
    DOM.getElementById('reset-filters').addEventListener('click', resetFilters);
    DOM.getElementById('filter-show-regions').addEventListener('change', updateFilters);

    loadFiltersFromLocal();
}

function updateFilters() {
    AppState.activeFilters.known = DOM.getElementById('filter-known').checked;
    AppState.activeFilters.visited = DOM.getElementById('filter-visited').checked;
    AppState.activeFilters.colors = [];
    document.querySelectorAll('.filter-color-checkbox:checked').forEach(cb => {
        AppState.activeFilters.colors.push(cb.dataset.color);
    });

    renderLocations();

    const showRegions = DOM.getElementById('filter-show-regions').checked;
    DOM.regionsLayer.style.display = showRegions ? 'block' : 'none';

    saveFiltersToLocal();
    scheduleAutoSync();
}

function resetFilters() {
    DOM.getElementById('filter-known').checked = false;
    DOM.getElementById('filter-visited').checked = false;
    document.querySelectorAll('.filter-color-checkbox').forEach(cb => cb.checked = false);
    DOM.getElementById('filter-show-regions').checked = true;
    updateFilters();
}

function updateFiltersUI(showRegions = true) {
    DOM.getElementById('filter-known').checked = AppState.activeFilters.known;
    DOM.getElementById('filter-visited').checked = AppState.activeFilters.visited;
    DOM.getElementById('filter-show-regions').checked = showRegions;
    document.querySelectorAll('.filter-color-checkbox').forEach(cb => {
        cb.checked = AppState.activeFilters.colors.includes(cb.dataset.color);
    });
    saveFiltersToLocal();
}