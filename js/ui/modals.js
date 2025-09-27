// js/ui/modals.js

App.ui.modals = (function() {

    // --- Private Functions ---

    function openMapModal(editIndex = -1) {
        AppState.editingMapIndex = editIndex;
        const modal = DOM.get('map-modal');
        const title = DOM.get('map-modal-title');
        const nameInput = DOM.get('map-name-input');
        const fileInput = DOM.get('map-file-input');
        const previewContainer = DOM.get('map-preview-container');
        const previewImage = DOM.get('map-preview-image');
        const saveText = DOM.get('save-map-text');

        if (editIndex >= 0) {
            const map = AppState.availableMaps[editIndex];
            title.innerHTML = '<i class="fas fa-map-marked-alt mr-2"></i>Modifier la carte';
            nameInput.value = map.name;
            previewContainer.classList.remove('hidden');
            previewImage.src = map.filename;
            document.querySelector(`input[name="map-type"][value="${map.type}"]`).checked = true;
            saveText.textContent = 'Modifier';
        } else {
            title.innerHTML = '<i class="fas fa-map-marked-alt mr-2"></i>Ajouter une carte';
            nameInput.value = '';
            fileInput.value = '';
            previewContainer.classList.add('hidden');
            document.querySelector('input[name="map-type"][value="player"]').checked = true;
            saveText.textContent = 'Ajouter';
        }
        modal.classList.remove('hidden');
    }

    function closeMapModal() {
        DOM.getElementById('map-modal').classList.add('hidden');
        AppState.editingMapIndex = -1;
    }

    function handleMapFileSelect(event) {
        const file = event.target.files[0];
        const previewContainer = DOM.getElementById('map-preview-container');
        const previewImage = DOM.getElementById('map-preview-image');

        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    function saveMap() {
        const nameInput = DOM.getElementById('map-name-input');
        const fileInput = DOM.getElementById('map-file-input');
        const mapType = document.querySelector('input[name="map-type"]:checked').value;

        if (!nameInput.value.trim()) {
            alert('Veuillez entrer un nom pour la carte.');
            return;
        }

        if (AppState.editingMapIndex >= 0) {
            const map = AppState.availableMaps[AppState.editingMapIndex];
            map.name = nameInput.value.trim();
            map.type = mapType;
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                map.filename = `map_${Date.now()}_${file.name}`;
            }
        } else {
            if (fileInput.files.length === 0) {
                alert('Veuillez sélectionner un fichier image.');
                return;
            }
            const file = fileInput.files[0];
            const newMap = {
                id: Date.now(),
                name: nameInput.value.trim(),
                filename: `map_${Date.now()}_${file.name}`,
                type: mapType,
                isDefault: false,
            };
            AppState.availableMaps.push(newMap);
        }

        App.features.maps.saveData();
        App.features.maps.renderGrid();
        closeMapModal();
    }

    function showAddRegionModal() {
        DOM.addRegionModal.classList.remove('hidden');
        DOM.getElementById('region-name-input').focus();
        const regionColorPicker = DOM.getElementById('region-color-picker');
        regionColorPicker.innerHTML = Object.keys(AppConfig.REGION_COLOR_MAP).map((color, index) =>
            `<div class="color-swatch ${index === 0 ? 'selected' : ''}" data-color="${color}" style="background-color: ${AppConfig.REGION_COLOR_MAP[color]}; border: 2px solid ${AppConfig.COLOR_MAP[color]};"></div>`
        ).join('');
        regionColorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                regionColorPicker.querySelector('.color-swatch.selected').classList.remove('selected');
                swatch.classList.add('selected');
            });
        });
    }

    // --- Public Functions ---

    function setupEventListeners() {
        // Auth Modal
 
        DOM.get('auth-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.get('authModal').classList.toggle('hidden');
        });
        DOM.get('close-auth-modal').addEventListener('click', () => DOM.get('authModal').classList.add('hidden'));
        DOM.get('google-signin-btn').addEventListener('click', App.api.auth.handleGoogleSignIn);
        DOM.get('save-context-btn').addEventListener('click', App.api.dataStorage.saveCurrentContext);

        // Add Location Modal
        DOM.get('confirm-add-location').addEventListener('click', App.features.locations.confirmAdd);
        DOM.get('cancel-add-location').addEventListener('click', App.features.locations.cancelAdd);

        // Add Region Modal
        DOM.get('confirm-add-region').addEventListener('click', App.features.regions.save);
        DOM.get('cancel-add-region').addEventListener('click', () => {
            DOM.get('addRegionModal').classList.add('hidden');
 
            App.features.regions.cancelCreation();
        });

        // Settings Modal
 
        DOM.get('settings-btn').addEventListener('click', () => {
            DOM.get('settingsModal').classList.remove('hidden');
            App.ui.main.loadSettings();
        });
        DOM.get('close-settings-modal').addEventListener('click', () => DOM.get('settingsModal').classList.add('hidden'));

        // Journey Log Modal
        DOM.get('close-journey-log').addEventListener('click', () => DOM.get('journeyLogModal').classList.add('hidden'));

        // Map Modal
        DOM.get('add-map-btn')?.addEventListener('click', () => openMapModal());
        DOM.get('close-map-modal')?.addEventListener('click', closeMapModal);
        DOM.get('cancel-map-btn')?.addEventListener('click', closeMapModal);
        DOM.get('save-map-btn')?.addEventListener('click', saveMap);
        DOM.get('map-file-input')?.addEventListener('change', handleMapFileSelect);
 
    }

    return {
        setupEventListeners,
        showAddRegionModal
    };

})();