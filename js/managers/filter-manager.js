
class FilterManager {
    constructor(domElements) {
        this.dom = domElements;
    }

    init() {
        this.setupFilterUI();
        this.setupEventListeners();
    }

    setupFilterUI() {
        if (!this.dom.filterColorPicker) return;
        
        this.dom.filterColorPicker.innerHTML = Object.keys(CONFIG.COLORS.locations).map(color => `
            <label title="${color.charAt(0).toUpperCase() + color.slice(1)}" class="relative cursor-pointer">
                <input type="checkbox" data-color="${color}" class="filter-color-checkbox sr-only peer">
                <div class="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-white" style="background-color: ${CONFIG.COLORS.locations[color]}"></div>
            </label>
        `).join('');
    }

    setupEventListeners() {
        if (this.dom.filterToggleBtn) {
            this.dom.filterToggleBtn.addEventListener('click', () => {
                this.dom.toggleClass(this.dom.filterPanel, 'hidden');
            });
        }

        if (this.dom.filterKnown) {
            this.dom.filterKnown.addEventListener('change', () => this.updateFilters());
        }
        
        if (this.dom.filterVisited) {
            this.dom.filterVisited.addEventListener('change', () => this.updateFilters());
        }
        
        if (this.dom.filterShowRegions) {
            this.dom.filterShowRegions.addEventListener('change', () => this.updateFilters());
        }
        
        if (this.dom.resetFiltersBtn) {
            this.dom.resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        }

        this.dom.querySelectorAll('.filter-color-checkbox').forEach(cb => {
            cb.addEventListener('change', () => this.updateFilters());
        });
    }

    updateFilters() {
        AppState.activeFilters.known = this.dom.filterKnown?.checked || false;
        AppState.activeFilters.visited = this.dom.filterVisited?.checked || false;
        AppState.activeFilters.colors = [];
        
        this.dom.querySelectorAll('.filter-color-checkbox:checked').forEach(cb => {
            AppState.activeFilters.colors.push(cb.dataset.color);
        });

        // Re-render locations and regions
        window.locationManager?.render();
        
        const showRegions = this.dom.filterShowRegions?.checked ?? true;
        if (showRegions) {
            window.regionManager?.render();
            if (this.dom.regionsLayer) this.dom.regionsLayer.style.display = 'block';
        } else {
            if (this.dom.regionsLayer) this.dom.regionsLayer.style.display = 'none';
        }
    }

    resetFilters() {
        if (this.dom.filterKnown) this.dom.filterKnown.checked = false;
        if (this.dom.filterVisited) this.dom.filterVisited.checked = false;
        if (this.dom.filterShowRegions) this.dom.filterShowRegions.checked = true;
        
        this.dom.querySelectorAll('.filter-color-checkbox').forEach(cb => {
            cb.checked = false;
        });
        
        this.updateFilters();
    }
}
