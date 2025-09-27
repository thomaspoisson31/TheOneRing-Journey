 
// js/ui/main-ui.js

 
App.ui.main = (function() {

    // --- Private Functions ---

    function toggleDrawingMode(button) {
        AppState.isAddingLocationMode = false;
        AppState.isAddingRegionMode = false;
 
        DOM.get('viewport').classList.remove('adding-location', 'adding-region');
        DOM.get('add-location-mode').classList.remove('btn-active');
        DOM.get('add-region-mode').classList.remove('btn-active');
        App.features.regions.cancelCreation();

        AppState.isDrawingMode = !AppState.isDrawingMode;
        DOM.get('viewport').classList.toggle('drawing', AppState.isDrawingMode);
 
        button.classList.toggle('btn-active', AppState.isDrawingMode);
        App.features.locations.render();
    }

    function toggleAddLocationMode(button) {
        AppState.isDrawingMode = false;
        AppState.isAddingRegionMode = false;
        DOM.get('viewport').classList.remove('drawing', 'adding-region');
        DOM.get('draw-mode').classList.remove('btn-active');
        DOM.get('add-region-mode').classList.remove('btn-active');
        App.features.regions.cancelCreation();

        AppState.isAddingLocationMode = !AppState.isAddingLocationMode;
        DOM.get('viewport').classList.toggle('adding-location', AppState.isAddingLocationMode);
        button.classList.toggle('btn-active', AppState.isAddingLocationMode);
        App.features.locations.render();
    }

    function toggleAddRegionMode(button) {
        AppState.isDrawingMode = false;
        AppState.isAddingLocationMode = false;
 
        DOM.get('viewport').classList.remove('drawing', 'adding-location');
        DOM.get('draw-mode').classList.remove('btn-active');
        DOM.get('add-location-mode').classList.remove('btn-active');

        AppState.isAddingRegionMode = !AppState.isAddingRegionMode;
        DOM.get('viewport').classList.toggle('adding-region', AppState.isAddingRegionMode);
 
        button.classList.toggle('btn-active', AppState.isAddingRegionMode);
        if (!AppState.isAddingRegionMode) {
            App.features.regions.cancelCreation();
        }
        App.features.locations.render();
    }

    function handlePanStart(event) {
        if (event.target.closest('.location-marker, #info-box') || AppState.isDrawingMode || AppState.isAddingLocationMode || AppState.isAddingRegionMode) return;

        App.ui.infoBox.hideInfoBox();
        event.preventDefault();
        AppState.isPanning = true;
        AppState.startPanX = event.clientX - AppState.panX;
        AppState.startPanY = event.clientY - AppState.panY;
 
        DOM.get('viewport').classList.add('panning');
 
    }

    function handlePanMove(event) {
        if (AppState.isPanning) {
            event.preventDefault();
            AppState.panX = event.clientX - AppState.startPanX;
            AppState.panY = event.clientY - AppState.startPanY;
            App.features.maps.applyTransform();
        }
    }

    function handlePanEnd() {
        AppState.isPanning = false;
 
        DOM.get('viewport').classList.remove('panning');
 
    }

    function handleZoom(event) {
        event.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = event.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
 
        const rect = DOM.get('viewport').getBoundingClientRect();
 
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        AppState.panX = mouseX - (mouseX - AppState.panX) * zoom;
        AppState.panY = mouseY - (mouseY - AppState.panY) * zoom;
        AppState.scale = Math.max(0.1, Math.min(AppState.scale * zoom, 5));
        App.features.maps.applyTransform();
    }
 
    function updateMarkdownContent(elementId, content) {
        const element = DOM.get(elementId);
        if (element) {
            element.innerHTML = content ? App.utils.helpers.marked(content) : '<p class="text-gray-400 italic">Non défini.</p>';
        }
    }

    // --- Public Functions ---

    function setupEventListeners() {
        DOM.get('mapSwitchBtn').addEventListener('click', () => {
            AppState.isPlayerView = !AppState.isPlayerView;
            const icon = DOM.get('map-switch-icon');
            if (AppState.isPlayerView) {
                DOM.get('mapImage').style.opacity = '1';
                DOM.get('loremasterMapImage').style.opacity = '0';
                icon.className = 'fas fa-users';
                DOM.get('mapSwitchBtn').title = "Vue Gardien";
            } else {
                DOM.get('mapImage').style.opacity = '0';
                DOM.get('loremasterMapImage').style.opacity = '1';
                icon.className = 'fas fa-book-open';
                DOM.get('mapSwitchBtn').title = "Vue Joueurs";
            }
        });

        DOM.get('draw-mode').addEventListener('click', (e) => toggleDrawingMode(e.currentTarget));
        DOM.get('add-location-mode').addEventListener('click', (e) => toggleAddLocationMode(e.currentTarget));
        DOM.get('add-region-mode').addEventListener('click', (e) => toggleAddRegionMode(e.currentTarget));

        DOM.get('erase').addEventListener('click', App.features.journey.erase);
        DOM.get('export-locations').addEventListener('click', App.api.dataStorage.exportUnifiedData);
        DOM.get('import-locations').addEventListener('click', () => DOM.get('import-file-input').click());
        DOM.get('import-file-input').addEventListener('change', App.api.dataStorage.importUnifiedData);

        const viewport = DOM.get('viewport');
        viewport.addEventListener('wheel', handleZoom);
        viewport.addEventListener('mousedown', handlePanStart);
        viewport.addEventListener('mousemove', handlePanMove);
        viewport.addEventListener('mouseup', handlePanEnd);
        viewport.addEventListener('mouseleave', handlePanEnd);

        viewport.addEventListener('mousedown', (e) => { if (AppState.isDrawingMode) App.features.journey.start(e); });
        viewport.addEventListener('mousemove', (e) => { if (AppState.isDrawingMode) App.features.journey.draw(e); });
        viewport.addEventListener('mouseup', (e) => { if (AppState.isDrawingMode) App.features.journey.stop(e); });
        viewport.addEventListener('mouseleave', (e) => { if (AppState.isDrawingMode) App.features.journey.stop(e); });

        viewport.addEventListener('dblclick', (event) => {
            if (AppState.isAddingRegionMode && AppState.currentRegionPoints.length >= 3) {
                event.preventDefault();
                App.features.regions.complete();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && DOM.get('infoBox').style.display === 'block') {
                App.ui.infoBox.hideInfoBox();
            }
        });
    }

    function setupInfoBoxEventListeners(type, id) {
        const editBtn = DOM.get('info-box-edit');
        const deleteBtn = DOM.get('info-box-delete');
        const expandBtn = DOM.get('info-box-expand');
        const closeBtn = DOM.get('info-box-close');

        const newEditBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newEditBtn, editBtn);
        newEditBtn.addEventListener('click', () => {
            if (type === 'location') App.features.locations.enterEditMode();
            else if (type === 'region') App.features.regions.enterEditMode();
        });

        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        newDeleteBtn.addEventListener('click', () => {
            if (type === 'location') App.features.locations.delete(id);
            else if (type === 'region') App.features.regions.delete(id);
        });

        const newExpandBtn = expandBtn.cloneNode(true);
        expandBtn.parentNode.replaceChild(newExpandBtn, expandBtn);
        newExpandBtn.addEventListener('click', App.ui.infoBox.toggleInfoBoxExpand);

        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', App.ui.infoBox.hideInfoBox);
    }

    function updateAuthUI(isAuthenticated) {
        DOM.get('authStatusPanel').classList.add('hidden');
        DOM.get('authContentPanel').classList.remove('hidden');

        const authIcon = DOM.get('auth-icon');
        const userProfilePic = DOM.get('user-profile-pic');

        if (isAuthenticated) {
            DOM.get('loggedInPanel').classList.remove('hidden');
            DOM.get('loggedOutPanel').classList.add('hidden');
            DOM.get('authUserName').textContent = AppState.currentUser.name || 'Utilisateur';
 
            if (AppState.currentUser.picture) {
                userProfilePic.src = AppState.currentUser.picture;
                userProfilePic.classList.remove('hidden');
                authIcon.classList.add('hidden');
            } else {
                authIcon.className = 'fas fa-user-check text-green-400';
            }
 
            DOM.get('auth-btn').title = `Connecté: ${AppState.currentUser.name}`;
        } else {
            DOM.get('loggedInPanel').classList.add('hidden');
            DOM.get('loggedOutPanel').classList.remove('hidden');
            userProfilePic.classList.add('hidden');
            authIcon.classList.remove('hidden');
            authIcon.className = 'fas fa-user';
            DOM.get('auth-btn').title = 'Authentification';
 
        }
    }

    function displaySavedContexts(contexts) {
 
        const savedContextsDiv = DOM.get('savedContexts');
        savedContextsDiv.innerHTML = '';
        if (!contexts || contexts.length === 0) {
            savedContextsDiv.innerHTML = '<p class="text-gray-500 italic">Aucun contexte.</p>';
 
            return;
        }
        contexts.forEach(context => {
            const contextEl = document.createElement('div');
            contextEl.className = 'flex justify-between items-center bg-gray-700 p-2 rounded mb-1';
            contextEl.innerHTML = `
 
                <span class="text-sm">${App.utils.helpers.escapeHtml(context.name)}</span>
 
                <div class="flex space-x-2">
                    <button class="load-context-btn text-blue-400 hover:text-blue-300" data-context-id="${context.id}">Charger</button>
                    <button class="delete-context-btn text-red-400 hover:text-red-300" data-context-id="${context.id}">Supprimer</button>
                </div>
            `;
 
            savedContextsDiv.appendChild(contextEl);
        });

        savedContextsDiv.querySelectorAll('.load-context-btn').forEach(btn => {
            btn.addEventListener('click', (e) => App.api.dataStorage.loadContext(e.target.dataset.contextId));
        });
        savedContextsDiv.querySelectorAll('.delete-context-btn').forEach(btn => {
 
            btn.addEventListener('click', (e) => App.api.dataStorage.deleteContext(e.target.dataset.contextId));
        });
    }

    function openSettingsOnSeasonTab() {
 
        DOM.get('settingsModal').classList.remove('hidden');
 
        loadSettings();
        const seasonTabButton = document.querySelector('.settings-tab-button[data-tab="season"]');
        if (seasonTabButton) {
            seasonTabButton.click();
        }
    }

    function loadSettings() {
        const adventurersGroup = localStorage.getItem('adventurersGroup');
        const adventurersQuest = localStorage.getItem('adventurersQuest');
        const narrationStyle = localStorage.getItem('narrationStyle') || 'brief';

 
        DOM.get('adventurers-group').value = adventurersGroup || '';
        DOM.get('adventurers-quest').value = adventurersQuest || '';
 
        updateMarkdownContent('adventurers-content', adventurersGroup);
        updateMarkdownContent('quest-content', adventurersQuest);

        const narrationRadio = document.querySelector(`input[name="narration-style"][value="${narrationStyle}"]`);
        if (narrationRadio) narrationRadio.checked = true;

        App.features.seasons.loadSaved();
        App.features.maps.loadData();
        App.features.maps.renderGrid();
    }

 
    return {
        setupEventListeners,
        setupInfoBoxEventListeners,
 
        updateAuthUI,
        displaySavedContexts,
        loadSettings,
        openSettingsOnSeasonTab
    };

})();