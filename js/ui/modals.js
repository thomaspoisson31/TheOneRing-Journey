// js/ui/modals.js

App.ui.modals = (function() {

    // --- Private Functions ---

    function openMapModal(editIndex = -1) {
        AppState.editingMapIndex = editIndex;
        const modal = DOM.getElementById('map-modal');
        const title = DOM.getElementById('map-modal-title');
        const nameInput = DOM.getElementById('map-name-input');
        const fileInput = DOM.getElementById('map-file-input');
        const previewContainer = DOM.getElementById('map-preview-container');
        const previewImage = DOM.getElementById('map-preview-image');
        const saveText = DOM.getElementById('save-map-text');

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
        DOM.authBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.authModal.classList.toggle('hidden');
        });
        DOM.closeAuthModalBtn.addEventListener('click', () => DOM.authModal.classList.add('hidden'));
        DOM.googleSigninBtn.addEventListener('click', App.api.auth.handleGoogleSignIn);
        DOM.saveContextBtn.addEventListener('click', App.api.dataStorage.saveCurrentContext);

        // Add Location Modal
        DOM.getElementById('confirm-add-location').addEventListener('click', App.features.locations.confirmAdd);
        DOM.getElementById('cancel-add-location').addEventListener('click', App.features.locations.cancelAdd);

        // Add Region Modal
        DOM.getElementById('confirm-add-region').addEventListener('click', App.features.regions.save);
        DOM.getElementById('cancel-add-region').addEventListener('click', () => {
            DOM.addRegionModal.classList.add('hidden');
            App.features.regions.cancelCreation();
        });

        // Settings Modal
        DOM.settingsBtn.addEventListener('click', () => {
            DOM.settingsModal.classList.remove('hidden');
            App.ui.main.loadSettings();
        });
        DOM.closeSettingsModalBtn.addEventListener('click', () => DOM.settingsModal.classList.add('hidden'));

        // Journey Log Modal
        DOM.getElementById('close-journey-log').addEventListener('click', () => DOM.journeyLogModal.classList.add('hidden'));

        // Map Modal
        DOM.getElementById('add-map-btn')?.addEventListener('click', () => openMapModal());
        DOM.getElementById('close-map-modal')?.addEventListener('click', closeMapModal);
        DOM.getElementById('cancel-map-btn')?.addEventListener('click', closeMapModal);
        DOM.getElementById('save-map-btn')?.addEventListener('click', saveMap);
        DOM.getElementById('map-file-input')?.addEventListener('change', handleMapFileSelect);
    }

    return {
        setupEventListeners,
        showAddRegionModal
    };

})();