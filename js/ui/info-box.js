// js/ui/info-box.js

App.ui.infoBox = (function() {

    // --- Private Functions ---

    function setupTabSwitching() {
        const infoBox = DOM.get('infoBox');
        const tabButtons = infoBox.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                activateTab(button.dataset.tab);
            });
        });
    }

    function activateTab(tabName) {
        const infoBox = DOM.get('infoBox');
        const tabButtons = infoBox.querySelectorAll('.tab-button');
        const tabContents = infoBox.querySelectorAll('.tab-content');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        const activeButton = infoBox.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) activeButton.classList.add('active');
        tabContents.forEach(content => content.classList.remove('active'));
        const activeContent = DOM.get(`${tabName}-tab`);
        if (activeContent) activeContent.classList.add('active');
    }

    function setupImageTabSwitching() {
        const infoBox = DOM.get('infoBox');
        const imageTabButtons = infoBox.querySelectorAll('.image-tab-button');
        const imageContents = infoBox.querySelectorAll('.image-content');
        imageTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetIndex = button.dataset.imageIndex;
                imageTabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                imageContents.forEach(content => content.classList.remove('active'));
                infoBox.querySelector(`.image-content[data-image-index="${targetIndex}"]`).classList.add('active');
            });
        });
    }

    function setupImageClickHandlers() {
        const infoBox = DOM.get('infoBox');
        infoBox.querySelectorAll('.modal-image').forEach(img => {
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    img.parentElement.requestFullscreen().catch(err => console.error(err));
                }
            });
        });
    }

    function updateInfoBoxTab(tabId, items, title) {
 
        const tabElement = DOM.get(`${tabId}-tab`);
        const infoBox = DOM.get('infoBox');
        if (items.length > 0) {
            let content = '';
            if (infoBox.classList.contains('expanded') && items.length > 1) {
 
                const tabs = items.map((item, index) => `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">${tabId === 'image' ? 'Image' : 'Table'} ${index + 1}</button>`).join('');
                const itemHtml = items.map((item, index) => `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}"><div class="image-view"><img src="${item.url || item}" onerror="App.ui.infoBox.handleImageError(this)"></div></div>`).join('');
                content = `<div class="image-tabs-container"><div class="image-tabs">${tabs}</div><div class="image-contents">${itemHtml}</div></div>`;
            } else {
                const defaultItem = items.find(i => i.isDefault)?.url || items[0]?.url || items[0];
                content = `<div class="image-view"><img src="${defaultItem}" class="modal-image" onerror="App.ui.infoBox.handleImageError(this)"></div>`;
            }
            tabElement.innerHTML = content;
 
            if (infoBox.classList.contains('expanded') && items.length > 1) setupImageTabSwitching();
 
            setupImageClickHandlers();
        } else {
            tabElement.innerHTML = `<div class="image-view"><div class="image-placeholder">Aucun(e) ${tabId} disponible</div></div>`;
        }
    }

    function updateInfoBoxContent(type, data) {
 
        const images = App.features.locations.getImages(data);
        const tables = App.features.locations.getTables(data);
 

        updateInfoBoxTab('image', images, data.name);
        updateInfoBoxTab('tables', tables, `Tables - ${data.name}`);

 
        DOM.get('text-tab').innerHTML = `<div class="text-view"><h3>${data.name}</h3><p>${data.description || 'Aucune description.'}</p></div>`;

        let rumeursContent = '';
        if (data.Rumeurs && data.Rumeurs.length > 0) {
            rumeursContent = data.Rumeurs.map(r => `<p>${App.utils.helpers.escapeHtml(r)}</p>`).join('');
        } else if (data.Rumeur) {
            rumeursContent = `<p>${App.utils.helpers.escapeHtml(data.Rumeur)}</p>`;
        }
        DOM.get('rumeurs-tab').innerHTML = `<div class="text-view"><h3>Rumeurs</h3>${rumeursContent || '<p>Aucune rumeur connue.</p>'}</div>`;
        DOM.get('tradition-tab').innerHTML = `<div class="text-view"><h3>Tradition Ancienne</h3><p>${App.utils.helpers.escapeHtml(data.Tradition_Ancienne) || 'Aucune tradition ancienne connue.'}</p></div>`;
 

        updateInfoBoxHeaderTitle(data.name);
        setupTabSwitching();
    }

    function positionInfoBoxExpanded() {
 
        const infoBox = DOM.get('infoBox');
        const vpRect = DOM.get('viewport').getBoundingClientRect();
        const tbRect = DOM.get('toolbar').getBoundingClientRect();
 
        const margin = 16;
        const desiredWidth = Math.floor(vpRect.width * 0.9);
        const desiredHeight = Math.floor(vpRect.height * 0.9);
        const availableRightOfToolbar = Math.floor(vpRect.width - (tbRect.right - vpRect.left) - margin);
        const finalWidth = Math.min(desiredWidth, availableRightOfToolbar);
        const left = Math.max(margin, tbRect.right - vpRect.left + margin);
        const top = Math.floor((vpRect.height - desiredHeight) / 2);

 
        infoBox.style.left = `${left}px`;
        infoBox.style.top = `${top}px`;
        infoBox.style.width = `${finalWidth}px`;
        infoBox.style.height = `${desiredHeight}px`;
    }

    function updateInfoBoxHeaderTitle(title) {
        DOM.get('info-box-title').textContent = title;
 
    }

    // --- Public Functions ---

    function showInfoBox(event) {
        const marker = event.currentTarget;
        AppState.activeLocationId = parseInt(marker.dataset.id, 10);
        const location = AppState.locationsData.locations.find(loc => loc.id === AppState.activeLocationId);
        if (!location) return;
 
        const infoBox = DOM.get('infoBox');

        updateInfoBoxContent('location', location);
        infoBox.style.display = 'block';
        if (!infoBox.classList.contains('expanded')) {
            toggleInfoBoxExpand();
        }
        positionInfoBoxExpanded();
        App.ui.main.setupInfoBoxEventListeners('location', location.id);
 
    }

    function showRegionInfo(event, region) {
        AppState.activeLocationId = region.id; // Using same var for active item
 
        const infoBox = DOM.get('infoBox');
        updateInfoBoxContent('region', region);
        infoBox.style.display = 'block';
        if (!infoBox.classList.contains('expanded')) {
            toggleInfoBoxExpand();
        }
        positionInfoBoxExpanded();
        App.ui.main.setupInfoBoxEventListeners('region', region.id);
    }

    function hideInfoBox() {
        const infoBox = DOM.get('infoBox');
        if(infoBox) infoBox.style.display = 'none';
 
        AppState.activeLocationId = null;
    }

    function toggleInfoBoxExpand() {
 
        const infoBox = DOM.get('infoBox');
        const isExpanded = infoBox.classList.toggle('expanded');
        const expandBtn = DOM.get('info-box-expand');
        const titleElement = DOM.get('info-box-title');
        const deleteBtn = DOM.get('info-box-delete');
 

        expandBtn.className = `fas ${isExpanded ? 'fa-compress' : 'fa-expand'}`;
        titleElement.classList.toggle('hidden', !isExpanded);
        deleteBtn.classList.toggle('hidden', !isExpanded);

        if (isExpanded) {
            positionInfoBoxExpanded();
            activateTab('image');
        }
    }

    function handleImageError(imgElement) {
        imgElement.parentElement.innerHTML = '<div class="image-placeholder">Erreur chargement image</div>';
    }

    return {
        showInfoBox,
        showRegionInfo,
        hideInfoBox,
        toggleInfoBoxExpand,
        handleImageError
    };
})();