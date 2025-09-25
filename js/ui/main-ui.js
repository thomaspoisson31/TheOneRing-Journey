// js/ui/main-ui.js

function setupMainUIEventListeners() {
    DOM.mapSwitchBtn.addEventListener('click', () => {
        AppState.isPlayerView = !AppState.isPlayerView;
        const icon = DOM.getElementById('map-switch-icon');
        if (AppState.isPlayerView) {
            DOM.mapImage.style.opacity = '1';
            DOM.loremasterMapImage.style.opacity = '0';
            icon.className = 'fas fa-users';
            DOM.mapSwitchBtn.title = "Vue Gardien";
        } else {
            DOM.mapImage.style.opacity = '0';
            DOM.loremasterMapImage.style.opacity = '1';
            icon.className = 'fas fa-book-open';
            DOM.mapSwitchBtn.title = "Vue Joueurs";
        }
    });

    DOM.getElementById('draw-mode').addEventListener('click', (e) => {
        toggleDrawingMode(e.currentTarget);
    });

    DOM.getElementById('add-location-mode').addEventListener('click', (e) => {
        toggleAddLocationMode(e.currentTarget);
    });

    DOM.getElementById('add-region-mode').addEventListener('click', (e) => {
        toggleAddRegionMode(e.currentTarget);
    });

    DOM.getElementById('erase').addEventListener('click', eraseDrawing);
    DOM.getElementById('export-locations').addEventListener('click', exportUnifiedData);
    DOM.getElementById('import-locations').addEventListener('click', () => DOM.getElementById('import-file-input').click());
    DOM.getElementById('import-file-input').addEventListener('change', importUnifiedData);

    DOM.viewport.addEventListener('wheel', handleZoom);
    DOM.viewport.addEventListener('mousedown', handlePanStart);
    DOM.viewport.addEventListener('mousemove', handlePanMove);
    DOM.viewport.addEventListener('mouseup', handlePanEnd);
    DOM.viewport.addEventListener('mouseleave', handlePanEnd);

    DOM.viewport.addEventListener('mousedown', (e) => {
        if (AppState.isDrawingMode) startDrawing(e);
    });
    DOM.viewport.addEventListener('mousemove', (e) => {
        if (AppState.isDrawingMode) draw(e);
    });
    DOM.viewport.addEventListener('mouseup', (e) => {
        if (AppState.isDrawingMode) stopDrawing(e);
    });
    DOM.viewport.addEventListener('mouseleave', (e) => {
        if (AppState.isDrawingMode) stopDrawing(e);
    });

    DOM.viewport.addEventListener('dblclick', (event) => {
        if (AppState.isAddingRegionMode && AppState.currentRegionPoints.length >= 3) {
            event.preventDefault();
            completeRegion();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && DOM.infoBox.style.display === 'block') {
            hideInfoBox();
        }
    });
}

function toggleDrawingMode(button) {
    AppState.isAddingLocationMode = false;
    AppState.isAddingRegionMode = false;
    DOM.viewport.classList.remove('adding-location', 'adding-region');
    DOM.getElementById('add-location-mode').classList.remove('btn-active');
    DOM.getElementById('add-region-mode').classList.remove('btn-active');
    cancelRegionCreation();

    AppState.isDrawingMode = !AppState.isDrawingMode;
    DOM.viewport.classList.toggle('drawing', AppState.isDrawingMode);
    button.classList.toggle('btn-active', AppState.isDrawingMode);
    renderLocations();
}

function toggleAddLocationMode(button) {
    AppState.isDrawingMode = false;
    AppState.isAddingRegionMode = false;
    DOM.viewport.classList.remove('drawing', 'adding-region');
    DOM.getElementById('draw-mode').classList.remove('btn-active');
    DOM.getElementById('add-region-mode').classList.remove('btn-active');
    cancelRegionCreation();

    AppState.isAddingLocationMode = !AppState.isAddingLocationMode;
    DOM.viewport.classList.toggle('adding-location', AppState.isAddingLocationMode);
    button.classList.toggle('btn-active', AppState.isAddingLocationMode);
    renderLocations();
}

function toggleAddRegionMode(button) {
    AppState.isDrawingMode = false;
    AppState.isAddingLocationMode = false;
    DOM.viewport.classList.remove('drawing', 'adding-location');
    DOM.getElementById('draw-mode').classList.remove('btn-active');
    DOM.getElementById('add-location-mode').classList.remove('btn-active');

    AppState.isAddingRegionMode = !AppState.isAddingRegionMode;
    DOM.viewport.classList.toggle('adding-region', AppState.isAddingRegionMode);
    button.classList.toggle('btn-active', AppState.isAddingRegionMode);
    if (!AppState.isAddingRegionMode) {
        cancelRegionCreation();
    }
    renderLocations();
}

function handleZoom(event) {
    event.preventDefault();
    const zoomIntensity = 0.1;
    const wheel = event.deltaY < 0 ? 1 : -1;
    const zoom = Math.exp(wheel * zoomIntensity);
    const rect = DOM.viewport.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    AppState.panX = mouseX - (mouseX - AppState.panX) * zoom;
    AppState.panY = mouseY - (mouseY - AppState.panY) * zoom;
    AppState.scale = Math.max(0.1, Math.min(AppState.scale * zoom, 5));
    applyTransform();
}

function handlePanStart(event) {
    if (event.target.closest('.location-marker, #info-box') || AppState.isDrawingMode || AppState.isAddingLocationMode || AppState.isAddingRegionMode) return;

    hideInfoBox();
    event.preventDefault();
    AppState.isPanning = true;
    AppState.startPanX = event.clientX - AppState.panX;
    AppState.startPanY = event.clientY - AppState.panY;
    DOM.viewport.classList.add('panning');
}

function handlePanMove(event) {
    if (AppState.isPanning) {
        event.preventDefault();
        AppState.panX = event.clientX - AppState.startPanX;
        AppState.panY = event.clientY - AppState.startPanY;
        applyTransform();
    }
}

function handlePanEnd() {
    AppState.isPanning = false;
    DOM.viewport.classList.remove('panning');
}

function updateAuthUI(isAuthenticated) {
    DOM.authStatusPanel.classList.add('hidden');
    DOM.authContentPanel.classList.remove('hidden');

    const authIcon = DOM.getElementById('auth-icon');
    const userProfilePic = DOM.getElementById('user-profile-pic');

    if (isAuthenticated) {
        DOM.loggedInPanel.classList.remove('hidden');
        DOM.loggedOutPanel.classList.add('hidden');
        DOM.authUserName.textContent = AppState.currentUser.name || 'Utilisateur';
        if (AppState.currentUser.picture) {
            userProfilePic.src = AppState.currentUser.picture;
            userProfilePic.classList.remove('hidden');
            authIcon.classList.add('hidden');
        } else {
            authIcon.className = 'fas fa-user-check text-green-400';
        }
        DOM.authBtn.title = `Connecté: ${AppState.currentUser.name}`;
    } else {
        DOM.loggedInPanel.classList.add('hidden');
        DOM.loggedOutPanel.classList.remove('hidden');
        userProfilePic.classList.add('hidden');
        authIcon.classList.remove('hidden');
        authIcon.className = 'fas fa-user';
        DOM.authBtn.title = 'Authentification';
    }
}

function displaySavedContexts(contexts) {
    DOM.savedContextsDiv.innerHTML = '';
    if (!contexts || contexts.length === 0) {
        DOM.savedContextsDiv.innerHTML = '<p class="text-gray-500 italic">Aucun contexte.</p>';
        return;
    }
    contexts.forEach(context => {
        const contextEl = document.createElement('div');
        contextEl.className = 'flex justify-between items-center bg-gray-700 p-2 rounded mb-1';
        contextEl.innerHTML = `
            <span class="text-sm">${context.name}</span>
            <div class="flex space-x-2">
                <button class="load-context-btn text-blue-400 hover:text-blue-300" data-context-id="${context.id}">Charger</button>
                <button class="delete-context-btn text-red-400 hover:text-red-300" data-context-id="${context.id}">Supprimer</button>
            </div>
        `;
        DOM.savedContextsDiv.appendChild(contextEl);
    });

    DOM.savedContextsDiv.querySelectorAll('.load-context-btn').forEach(btn => {
        btn.addEventListener('click', (e) => loadContext(e.target.dataset.contextId));
    });
    DOM.savedContextsDiv.querySelectorAll('.delete-context-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteContext(e.target.dataset.contextId));
    });
}

function openSettingsOnSeasonTab() {
    DOM.settingsModal.classList.remove('hidden');
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

    DOM.getElementById('adventurers-group').value = adventurersGroup || '';
    DOM.getElementById('adventurers-quest').value = adventurersQuest || '';
    updateMarkdownContent('adventurers-content', adventurersGroup);
    updateMarkdownContent('quest-content', adventurersQuest);

    const narrationRadio = document.querySelector(`input[name="narration-style"][value="${narrationStyle}"]`);
    if (narrationRadio) narrationRadio.checked = true;

    loadSavedSeason();
    loadMapsData();
    renderMapsGrid();
}

function updateMarkdownContent(elementId, content) {
    const element = DOM.getElementById(elementId);
    if (element) {
        element.innerHTML = content ? marked(content) : '<p class="text-gray-400 italic">Non défini.</p>';
    }
}