// js/ui/info-box.js

function showInfoBox(event) {
    const marker = event.currentTarget;
    AppState.activeLocationId = parseInt(marker.dataset.id, 10);
    const location = AppState.locationsData.locations.find(loc => loc.id === AppState.activeLocationId);
    if (!location) return;

    updateInfoBoxContent('location', location);
    DOM.infoBox.style.display = 'block';
    if (!DOM.infoBox.classList.contains('expanded')) {
        toggleInfoBoxExpand();
    }
    positionInfoBoxExpanded();
    setupInfoBoxEventListeners('location', location.id);
}

function showRegionInfo(event, region) {
    AppState.activeLocationId = region.id; // Using same var for active item
    updateInfoBoxContent('region', region);
    DOM.infoBox.style.display = 'block';
    if (!DOM.infoBox.classList.contains('expanded')) {
        toggleInfoBoxExpand();
    }
    positionInfoBoxExpanded();
    setupInfoBoxEventListeners('region', region.id);
}

function hideInfoBox() {
    DOM.infoBox.style.display = 'none';
    AppState.activeLocationId = null;
}

function updateInfoBoxContent(type, data) {
    const images = type === 'location' ? getLocationImages(data) : getRegionImages(data);
    const tables = type === 'location' ? getLocationTables(data) : getRegionTables(data);

    updateInfoBoxTab('image', images, data.name);
    updateInfoBoxTab('tables', tables, `Tables - ${data.name}`);

    DOM.getElementById('text-tab').innerHTML = `<div class="text-view"><h3>${data.name}</h3><p>${data.description || 'Aucune description.'}</p></div>`;

    let rumeursContent = '';
    if (data.Rumeurs && data.Rumeurs.length > 0) {
        rumeursContent = data.Rumeurs.map(r => `<p>${r}</p>`).join('');
    } else if (data.Rumeur) {
        rumeursContent = `<p>${data.Rumeur}</p>`;
    }
    DOM.getElementById('rumeurs-tab').innerHTML = `<div class="text-view"><h3>Rumeurs</h3>${rumeursContent || '<p>Aucune rumeur connue.</p>'}</div>`;
    DOM.getElementById('tradition-tab').innerHTML = `<div class="text-view"><h3>Tradition Ancienne</h3><p>${data.Tradition_Ancienne || 'Aucune tradition ancienne connue.'}</p></div>`;

    updateInfoBoxHeaderTitle(data.name);
    setupTabSwitching();
}

function updateInfoBoxTab(tabId, items, title) {
    const tabElement = DOM.getElementById(`${tabId}-tab`);
    if (items.length > 0) {
        let content = '';
        if (DOM.infoBox.classList.contains('expanded') && items.length > 1) {
            const tabs = items.map((item, index) => `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">${tabId === 'image' ? 'Image' : 'Table'} ${index + 1}</button>`).join('');
            const contents = items.map((item, index) => `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}"><div class="image-view"><img src="${item.url || item}" onerror="handleImageError(this)"></div></div>`).join('');
            content = `<div class="image-tabs-container"><div class="image-tabs">${tabs}</div><div class="image-contents">${contents}</div></div>`;
        } else {
            const defaultItem = items.find(i => i.isDefault)?.url || items[0]?.url || items[0];
            content = `<div class="image-view"><img src="${defaultItem}" class="modal-image"></div>`;
        }
        tabElement.innerHTML = content;
        if (DOM.infoBox.classList.contains('expanded') && items.length > 1) setupImageTabSwitching();
        setupImageClickHandlers();
    } else {
        tabElement.innerHTML = `<div class="image-view"><div class="image-placeholder">Aucun(e) ${tabId} disponible</div></div>`;
    }
}


function positionInfoBoxExpanded() {
    const vpRect = DOM.viewport.getBoundingClientRect();
    const tbRect = DOM.getElementById('toolbar').getBoundingClientRect();
    const margin = 16;
    const desiredWidth = Math.floor(vpRect.width * 0.9);
    const desiredHeight = Math.floor(vpRect.height * 0.9);
    const availableRightOfToolbar = Math.floor(vpRect.width - (tbRect.right - vpRect.left) - margin);
    const finalWidth = Math.min(desiredWidth, availableRightOfToolbar);
    const left = Math.max(margin, tbRect.right - vpRect.left + margin);
    const top = Math.floor((vpRect.height - desiredHeight) / 2);

    DOM.infoBox.style.left = `${left}px`;
    DOM.infoBox.style.top = `${top}px`;
    DOM.infoBox.style.width = `${finalWidth}px`;
    DOM.infoBox.style.height = `${desiredHeight}px`;
}

function toggleInfoBoxExpand() {
    const isExpanded = DOM.infoBox.classList.toggle('expanded');
    const expandBtn = DOM.getElementById('info-box-expand');
    const titleElement = DOM.getElementById('info-box-title');
    const deleteBtn = DOM.getElementById('info-box-delete');

    expandBtn.className = `fas ${isExpanded ? 'fa-compress' : 'fa-expand'}`;
    titleElement.classList.toggle('hidden', !isExpanded);
    deleteBtn.classList.toggle('hidden', !isExpanded);

    if (isExpanded) {
        positionInfoBoxExpanded();
        activateTab('image');
    } else {
        // Compact positioning logic can be added here if needed
    }
}

function updateInfoBoxHeaderTitle(title) {
    DOM.getElementById('info-box-title').textContent = title;
}

function getLocationImages(location) {
    if (location.images && Array.isArray(location.images)) return location.images.map(img => img.url).filter(Boolean);
    return location.imageUrl ? [location.imageUrl] : [];
}
function getRegionImages(region) {
    if (region.images && Array.isArray(region.images)) return region.images.map(img => img.url).filter(Boolean);
    return [];
}
function getLocationTables(location) {
    if (location.tables && Array.isArray(location.tables)) return location.tables.map(table => table.url).filter(Boolean);
    return [];
}
function getRegionTables(region) {
    if (region.tables && Array.isArray(region.tables)) return region.tables.map(table => table.url).filter(Boolean);
    return [];
}

function handleImageError(imgElement) {
    imgElement.parentElement.innerHTML = '<div class="image-placeholder">Erreur chargement image</div>';
}