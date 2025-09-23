// ====================================
// FONCTIONS MODALES POUR RÉGIONS ET LIEUX  
// ====================================
// Ce fichier contient toutes les fonctions liées à l'affichage et l'édition des modales
// pour les régions et les lieux (InfoBox)

// ====================================
// FONCTIONS UTILITAIRES ET GETTERS
// ====================================

        function getLocationImages(location) {
            // Support both old format (imageUrl) and new format (images array)
            if (location.images && Array.isArray(location.images)) {
                return location.images.map(img => img.url).filter(url => url);
            } else if (location.imageUrl) {
                return [location.imageUrl];
            }
            return [];
        }

        function getDefaultLocationImage(location) {
            if (location.images && Array.isArray(location.images)) {
                const defaultImg = location.images.find(img => img.isDefault);
                return defaultImg ? defaultImg.url : (location.images[0] ? location.images[0].url : '');
            } else if (location.imageUrl) {
                return location.imageUrl;
            }
            return '';
        }

        function getRegionImages(region) {
            if (region.images && Array.isArray(region.images)) {
                return region.images.map(img => img.url).filter(url => url);
            }
            return [];
        }

        function getDefaultRegionImage(region) {
            if (region.images && Array.isArray(region.images)) {
                const defaultImg = region.images.find(img => img.isDefault);
                return defaultImg ? defaultImg.url : (region.images[0] ? region.images[0].url : '');
            }
            return '';
        }

        function getLocationTables(location) {
            if (location.tables && Array.isArray(location.tables)) {
                return location.tables.map(table => table.url).filter(url => url);
            }
            return [];
        }

        function getDefaultLocationTable(location) {
            if (location.tables && Array.isArray(location.tables)) {
                const defaultTable = location.tables.find(table => table.isDefault);
                return defaultTable ? defaultTable.url : (location.tables[0] ? location.tables[0].url : '');
            }
            return '';
        }

        function getRegionTables(region) {
            if (region.tables && Array.isArray(region.tables)) {
                return region.tables.map(table => table.url).filter(url => url);
            }
            return [];
        }

        function getDefaultRegionTable(region) {
            if (region.tables && Array.isArray(region.tables)) {
                const defaultTable = region.tables.find(table => table.isDefault);
                return defaultTable ? defaultTable.url : (region.tables[0] ? region.tables[0].url : '');
            }
            return '';
        }

        function getLocationJsonTables(location) {
            if (location.jsonTables && Array.isArray(location.jsonTables)) {
                return location.jsonTables.map(table => table.content).filter(content => content);
            }
            return [];
        }

        function getDefaultLocationJsonTable(location) {
            if (location.jsonTables && Array.isArray(location.jsonTables)) {
                const defaultTable = location.jsonTables.find(table => table.isDefault);
                return defaultTable ? defaultTable.content : (location.jsonTables[0] ? location.jsonTables[0].content : '');
            }
            return '';
        }

        function getRegionJsonTables(region) {
            if (region.jsonTables && Array.isArray(region.jsonTables)) {
                return region.jsonTables.map(table => table.content).filter(content => content);
            }
            return [];
        }

        function getDefaultRegionJsonTable(region) {
            if (region.jsonTables && Array.isArray(region.jsonTables)) {
                const defaultTable = region.jsonTables.find(table => table.isDefault);
                return defaultTable ? defaultTable.content : (region.jsonTables[0] ? region.jsonTables[0].content : '');
            }
            return '';
        }

// ====================================
// FONCTIONS PRINCIPALES POUR LES LIEUX
// ====================================

        function showInfoBox(event) {
            const marker = event.currentTarget;
            activeLocationId = parseInt(marker.dataset.id, 10);
            const location = locationsData.locations.find(loc => loc.id === activeLocationId);
            if (!location) return;

            // Update image tab content
            const imageTab = document.getElementById('image-tab');
            const images = getLocationImages(location);

            if (images.length > 0) {
                if (infoBox.classList.contains('expanded') && images.length > 1) {
                    // Multi-tab view for expanded mode with multiple images
                    const imageTabs = images.map((img, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Image ${index + 1}</button>`
                    ).join('');

                    const imageContents = images.map((img, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="image-view">
                                <img src="${img}" alt="${location.name}" title="${img.split('/').pop()}" onerror="handleImageError(this)">
                            </div>
                        </div>`
                    ).join('');

                    imageTab.innerHTML = `
                        <div class="image-tabs-container">
                            <div class="image-tabs">${imageTabs}</div>
                            <div class="image-contents">${imageContents}</div>
                        </div>
                    `;

                    setupImageTabSwitching();
                    setupImageClickHandlers();
                } else {
                    // Single image view (compact mode or single image)
                    const defaultImage = getDefaultLocationImage(location);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">${location.name}</span>
                                </div>` : '';
                    imageTab.innerHTML = `
                        <div class="image-view">
                            ${titleHtml}
                            <img src="${defaultImage}" alt="${location.name}" title="${defaultImage.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
                        </div>
                    `;
                    setupImageClickHandlers();
                }
            } else {
                // No image - show title instead of placeholder in compact mode
                if (!infoBox.classList.contains('expanded')) {
                    imageTab.innerHTML = `
                        <div class="image-view">
                            <div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">${location.name}</span>
                            </div>
                        </div>
                    `;
                } else {
                    imageTab.innerHTML = `
                        <div class="image-view">
                            <div class="image-placeholder">Aucune image disponible</div>
                        </div>
                    `;
                }
            }

            // Update text tab content
            const textTab = document.getElementById('text-tab');
            textTab.innerHTML = `
                <div class="text-view">
                    <h3>${location.name}</h3>
                    <p>${location.description || 'Aucune description.'}</p>
                </div>
            `;

            // Update rumeurs tab content
            const rumeursTab = document.getElementById('rumeurs-tab');
            // Ajouter les sections Rumeurs (support multiple) et Tradition_Ancienne si elles existent
            let rumeursContent = '';
            if (location.Rumeurs && location.Rumeurs.length > 0) {
                const rumeursValides = location.Rumeurs.filter(rumeur => rumeur && rumeur !== "A définir");

                if (rumeursValides.length > 0) {
                    rumeursContent += `
                        <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                            <div class="font-bold text-yellow-300 mb-2 flex items-center">
                                <i class="fas fa-ear-listen mr-2"></i>
                                ${rumeursValides.length > 1 ? 'Rumeurs' : 'Rumeur'}
                            </div>
                    `;

                    rumeursValides.forEach((rumeur, index) => {
                        const marginClass = index > 0 ? 'mt-3 pt-3 border-t border-yellow-600 border-opacity-50' : '';
                        rumeursContent += `
                            <div class="${marginClass} text-yellow-100 text-sm italic leading-relaxed">
                                ${rumeur}
                            </div>
                        `;
                    });

                    rumeursContent += `</div>`;
                }
            }
            // Support de l'ancienne structure avec Rumeur simple
            else if (location.Rumeur && location.Rumeur !== "A définir") {
                rumeursContent += `
                    <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                        <div class="font-bold text-yellow-300 mb-2 flex items-center">
                            <i class="fas fa-ear-listen mr-2"></i>
                            Rumeur
                        </div>
                        <div class="text-yellow-100 text-sm italic leading-relaxed">
                            ${location.Rumeur}
                        </div>
                    </div>
                `;
            }
            rumeursTab.innerHTML = `<div class="text-view">${rumeursContent || '<p class="text-gray-500 italic">Aucune rumeur connue.</p>'}</div>`;


            // Update tradition tab content
            const traditionTab = document.getElementById('tradition-tab');
            traditionTab.innerHTML = `
                <div class="text-view">
                    <h3>Tradition Ancienne</h3>
                    <p>${location.Tradition_Ancienne || 'Aucune tradition ancienne connue.'}</p>
                </div>
            `;

            // Update tables tab content
            const tablesTab = document.getElementById('tables-tab');
            const tables = getLocationTables(location);

            if (tables.length > 0) {
                if (infoBox.classList.contains('expanded') && tables.length > 1) {
                    // Multi-tab view for expanded mode with multiple tables
                    const tableTabs = tables.map((table, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Table ${index + 1}</button>`
                    ).join('');

                    const tableContents = tables.map((table, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="image-view">
                                <img src="${table}" alt="Table aléatoire ${location.name}" title="${table.split('/').pop()}" onerror="handleImageError(this)">
                            </div>
                        </div>`
                    ).join('');

                    tablesTab.innerHTML = `
                        <div class="image-tabs-container">
                            <div class="image-tabs">${tableTabs}</div>
                            <div class="image-contents">${tableContents}</div>
                        </div>
                    `;

                    setupImageTabSwitching();
                    setupImageClickHandlers();
                } else {
                    // Single table view (compact mode or single table)
                    const defaultTable = getDefaultLocationTable(location);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">Tables - ${location.name}</span>
                                </div>` : '';
                    tablesTab.innerHTML = `
                        <div class="image-view">
                            ${titleHtml}
                            <img src="${defaultTable}" alt="Table aléatoire ${location.name}" title="${defaultTable.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
                        </div>
                    `;
                    setupImageClickHandlers();
                }
            } else {
                // No tables - show placeholder
                if (!infoBox.classList.contains('expanded')) {
                    tablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">Tables - ${location.name}</span>
                            </div>
                        </div>
                    `;
                } else {
                    tablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="image-placeholder">Aucune table disponible</div>
                        </div>
                    `;
                }
            }

            // Update json-tables tab content
            const jsonTablesTab = document.getElementById('json-tables-tab');
            const jsonTables = getLocationJsonTables(location);

            if (jsonTables.length > 0) {
                if (infoBox.classList.contains('expanded') && jsonTables.length > 1) {
                    // Multi-tab view for expanded mode with multiple json tables
                    const jsonTableTabs = jsonTables.map((table, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Table texte ${index + 1}</button>`
                    ).join('');

                    const jsonTableContents = jsonTables.map((table, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="json-table-container">
                                <div class="mb-3 flex justify-end">
                                    <button class="generate-random-event-btn px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm" data-table-index="${index}">
                                        <i class="fas fa-dice mr-1"></i>Générer un événement aléatoire
                                    </button>
                                </div>
                                <div class="random-event-display hidden mb-3 p-3 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg">
                                    <div class="font-bold text-yellow-300 mb-2">Événement aléatoire généré :</div>
                                    <div class="event-content text-yellow-100"></div>
                                </div>
                                ${formatJsonTableForDisplay(table)}
                            </div>
                        </div>`
                    ).join('');

                    jsonTablesTab.innerHTML = `
                        <div class="image-tabs-container">
                            <div class="image-tabs">${jsonTableTabs}</div>
                            <div class="image-contents">${jsonTableContents}</div>
                        </div>
                    `;

                    setupImageTabSwitching();
                    setupRandomEventButtons(location);
                } else {
                    // Single json table view (compact mode or single table)
                    const defaultJsonTable = getDefaultLocationJsonTable(location);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">Tables texte - ${location.name}</span>
                                </div>` : '';
                    jsonTablesTab.innerHTML = `
                        <div class="json-table-container">
                            ${titleHtml}
                            <div class="mb-3 flex justify-end">
                                <button class="generate-random-event-btn px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm" data-table-index="0">
                                    <i class="fas fa-dice mr-1"></i>Générer un événement aléatoire
                                </button>
                            </div>
                            <div class="random-event-display hidden mb-3 p-3 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg">
                                <div class="font-bold text-yellow-300 mb-2">Événement aléatoire généré :</div>
                                <div class="event-content text-yellow-100"></div>
                            </div>
                            ${formatJsonTableForDisplay(defaultJsonTable)}
                        </div>
                    `;
                    setupRandomEventButtons(location);
                }
            } else {
                // No json tables - show placeholder
                if (!infoBox.classList.contains('expanded')) {
                    jsonTablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">Tables texte - ${location.name}</span>
                            </div>
                        </div>
                    `;
                } else {
                    jsonTablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="image-placeholder">Aucune table texte disponible</div>
                        </div>
                    `;
                }
            }

            // Update header title
            updateInfoBoxHeaderTitle(location.name);

            // Show the info box
            document.getElementById('info-box-edit-content').classList.add('hidden');
            document.getElementById('info-box-content').classList.remove('hidden');

            infoBox.style.display = 'block';
            // Ouvrir en mode étendu par défaut
            if (!infoBox.classList.contains('expanded')) {
                infoBox.classList.add('expanded');
                const expandBtn = document.getElementById('info-box-expand');
                if (expandBtn) {
                    expandBtn.className = 'fas fa-compress';
                    expandBtn.title = 'Vue compacte';
                }
                const titleElement = document.getElementById('info-box-title');
                const deleteBtn = document.getElementById('info-box-delete');
                titleElement.classList.remove('hidden');
                deleteBtn.classList.remove('hidden');
            }
            positionInfoBoxExpanded();

            // Set up tab switching
            setupTabSwitching();
            // Set up event listeners for locations
            setupInfoBoxEventListeners('location', location.id);
        }

// ====================================  
// FONCTIONS POUR LES RÉGIONS
// ====================================

        function showRegionInfo(event, region) {
            // Set active region (similar to activeLocationId)
            activeLocationId = region.id;

            // Update image tab content
            const imageTab = document.getElementById('image-tab');
            const images = getRegionImages(region);

            if (images.length > 0) {
                if (infoBox.classList.contains('expanded') && images.length > 1) {
                    // Multi-tab view for expanded mode with multiple images
                    const imageTabs = images.map((img, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Image ${index + 1}</button>`
                    ).join('');

                    const imageContents = images.map((img, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="image-view">
                                <img src="${img}" alt="${region.name}" title="${img.split('/').pop()}" onerror="handleImageError(this)">
                            </div>
                        </div>`
                    ).join('');

                    imageTab.innerHTML = `
                        <div class="image-tabs-container">
                            <div class="image-tabs">${imageTabs}</div>
                            <div class="image-contents">${imageContents}</div>
                        </div>
                    `;

                    setupImageTabSwitching();
                    setupImageClickHandlers();
                } else {
                    // Single image view (compact mode or single image)
                    const defaultImage = getDefaultRegionImage(region);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">${region.name}</span>
                                </div>` : '';
                    imageTab.innerHTML = `
                        <div class="image-view">
                            ${titleHtml}
                            <img src="${defaultImage}" alt="${region.name}" title="${defaultImage.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
                        </div>
                    `;
                    setupImageClickHandlers();
                }
            } else {
                // No image - show title instead of placeholder in compact mode
                if (!infoBox.classList.contains('expanded')) {
                    imageTab.innerHTML = `
                        <div class="image-view">
                            <div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">${region.name}</span>
                            </div>
                        </div>
                    `;
                } else {
                    imageTab.innerHTML = `
                        <div class="image-view">
                            <div class="image-placeholder">Aucune image disponible</div>
                        </div>
                    `;
                }
            }

            // Update text tab content
            const textTab = document.getElementById('text-tab');
            textTab.innerHTML = `
                <div class="text-view">
                    <h3>${region.name}</h3>
                    <p>${region.description || 'Aucune description.'}</p>
                </div>
            `;

            // Update rumeurs tab content (similar to locations)
            const rumeursTab = document.getElementById('rumeurs-tab');
            let rumeursContent = '';
            if (region.Rumeurs && region.Rumeurs.length > 0) {
                const rumeursValides = region.Rumeurs.filter(rumeur => rumeur && rumeur !== "A définir");
                if (rumeursValides.length > 0) {
                    rumeursContent += `
                        <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                            <div class="font-bold text-yellow-300 mb-2 flex items-center">
                                <i class="fas fa-ear-listen mr-2"></i>
                                ${rumeursValides.length > 1 ? 'Rumeurs' : 'Rumeur'}
                            </div>
                    `;
                    rumeursValides.forEach((rumeur, index) => {
                        const marginClass = index > 0 ? 'mt-3 pt-3 border-t border-yellow-600 border-opacity-50' : '';
                        rumeursContent += `
                            <div class="${marginClass} text-yellow-100 text-sm italic leading-relaxed">
                                ${rumeur}
                            </div>
                        `;
                    });
                    rumeursContent += `</div>`;
                }
            } else if (region.Rumeur && region.Rumeur !== "A définir") {
                rumeursContent += `
                    <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                        <div class="font-bold text-yellow-300 mb-2 flex items-center">
                            <i class="fas fa-ear-listen mr-2"></i>
                            Rumeur
                        </div>
                        <div class="text-yellow-100 text-sm italic leading-relaxed">
                            ${region.Rumeur}
                        </div>
                    </div>
                `;
            }
            rumeursTab.innerHTML = `<div class="text-view">${rumeursContent || '<p class="text-gray-500 italic">Aucune rumeur connue.</p>'}</div>`;

            // Update tradition tab content
            const traditionTab = document.getElementById('tradition-tab');
            traditionTab.innerHTML = `
                <div class="text-view">
                    <h3>Tradition Ancienne</h3>
                    <p>${region.Tradition_Ancienne || 'Aucune tradition ancienne connue.'}</p>
                </div>
            `;

            // Update header title
            updateInfoBoxHeaderTitle(region.name);

            // Show the info box
            document.getElementById('info-box-edit-content').classList.add('hidden');
            document.getElementById('info-box-content').classList.remove('hidden');

            infoBox.style.display = 'block';
            // Ouvrir en mode étendu par défaut
            if (!infoBox.classList.contains('expanded')) {
                infoBox.classList.add('expanded');
                const expandBtn = document.getElementById('info-box-expand');
                if (expandBtn) {
                    expandBtn.className = 'fas fa-compress';
                    expandBtn.title = 'Vue compacte';
                }
                const titleElement = document.getElementById('info-box-title');
                const deleteBtn = document.getElementById('info-box-delete');
                titleElement.classList.remove('hidden');
                deleteBtn.classList.remove('hidden');
            }
            positionInfoBoxExpanded();

            // Set up tab switching
            setupTabSwitching();
            // Set up event listeners for regions
            setupInfoBoxEventListeners('region', region.id);
        }

// ====================================
// FONCTIONS D'ÉDITION POUR LES LIEUX
// ====================================

        function enterEditMode() {
            const location = locationsData.locations.find(loc => loc.id === activeLocationId);
            if (!location) return;

            // Mark the info box as being in edit mode
            infoBox.dataset.editMode = 'true';

            // Update image tab to show image editing interface
            updateImageTabForEdit(location);

            // Update text tab to show text editing interface
            updateTextTabForEdit(location);

            // Update rumeurs tab to show rumeurs editing interface
            updateRumeursTabForEdit(location);

            // Update tradition tab to show tradition editing interface
            updateTraditionTabForEdit(location);

            // Update tables tab to show tables editing interface
            updateTablesTabForEdit(location);

            // Update json-tables tab to show json-tables editing interface
            updateJsonTablesTabForEdit(location);

            // Add edit controls at the bottom
            addEditControls();
        }

        function saveEdit() {
            const location = locationsData.locations.find(loc => loc.id === activeLocationId);
            if (!location) return;

            location.name = document.getElementById('edit-name').value;
            location.description = document.getElementById('edit-desc').value;
            location.Rumeurs = document.getElementById('edit-rumeur').value.split('\n').filter(r => r.trim() !== ''); // Split by newline for multiple rumors
            location.Tradition_Ancienne = document.getElementById('edit-tradition').value;
            location.color = document.querySelector('#edit-color-picker .color-swatch.selected').dataset.color;
            location.known = document.getElementById('edit-known').checked;
            location.visited = document.getElementById('edit-visited').checked;

            // Handle images
            const images = collectImagesFromEdit();
            if (images.length > 0) {
                location.images = images;
                // Remove old imageUrl if exists
                delete location.imageUrl;
            } else {
                // No images, remove both old and new format
                delete location.images;
                delete location.imageUrl;
            }

            // Handle tables
            const tables = collectTablesFromEdit();
            if (tables.length > 0) {
                location.tables = tables;
            } else {
                delete location.tables;
            }

            // Handle json tables
            const jsonTables = collectJsonTablesFromEdit();
            if (jsonTables.length > 0) {
                location.jsonTables = jsonTables;
            } else {
                delete location.jsonTables;
            }

            saveLocationsToLocal();
            renderLocations();
            hideInfoBox();
        }

        function cancelEdit() {
            // Remove edit mode flag
            delete infoBox.dataset.editMode;
            // Remove edit controls
            const editControls = document.getElementById('edit-controls');
            if (editControls) {
                editControls.remove();
            }

            // Re-show the location info without edit mode - reload fresh content
            const location = locationsData.locations.find(loc => loc.id === activeLocationId);
            if (location) {
                showLocationContent(location);
            }
        }

        function deleteLocation(locationId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce lieu ?')) {
                locationsData.locations = locationsData.locations.filter(loc => loc.id !== locationId);
                saveLocationsToLocal();
                renderLocations();
                hideInfoBox();
            }
        }

        function deleteRegion(regionId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette région ?')) {
                regionsData.regions = regionsData.regions.filter(reg => reg.id !== regionId);
                saveRegionsToLocal();
                renderRegions();
                hideInfoBox();
            }
        }

        function updateImageTabForEdit(location) {
            const imageTab = document.getElementById('image-tab');
            const images = location.images || [];
            const imagesHtml = generateImageEditHTML(images);

            const colorPickerHtml = Object.keys(colorMap).map(color =>
                `<div class="color-swatch ${location.color === color ? 'selected' : ''}" data-color="${color}" style="background-color: ${colorMap[color]}"></div>`
            ).join('');

            imageTab.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gray-700 p-3 rounded-md">
                        <label class="block text-sm font-medium text-gray-300 mb-2">Images (max 5)</label>
                        <div id="edit-images-container">${imagesHtml}</div>
                        <button id="add-image-btn" class="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm">Ajouter une image</button>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Couleur</label>
                        <div class="flex space-x-2" id="edit-color-picker">${colorPickerHtml}</div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center">
                            <input id="edit-known" type="checkbox" ${location.known ? 'checked' : ''} class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <label for="edit-known" class="ml-2 block text-sm text-gray-300">Connu</label>
                        </div>
                        <div class="flex items-center">
                            <input id="edit-visited" type="checkbox" ${location.visited ? 'checked' : ''} class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <label for="edit-visited" class="ml-2 block text-sm text-gray-300">Visité</label>
                        </div>
                    </div>
                </div>
            `;

            setupImageEditListeners();
            setupColorPickerListeners();
            setupStatusCheckboxListeners();
        }

        function updateTextTabForEdit(location) {
            const textTab = document.getElementById('text-tab');
            textTab.innerHTML = `
                <div class="text-view space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Nom</label>
                        <input type="text" id="edit-name" value="${location.name}" placeholder="Nom" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <div class="flex items-start space-x-2">
                            <textarea id="edit-desc" rows="4" placeholder="Description" class="flex-1 bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${location.description || ''}</textarea>
                            <button id="generate-edit-desc" class="p-2 bg-purple-600 hover:bg-purple-700 rounded-md" title="Générer une description"><span class="gemini-icon">✨</span></button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('generate-edit-desc').addEventListener('click', handleGenerateDescription);
        }

        function updateRumeursTabForEdit(location) {
            const rumeursTab = document.getElementById('rumeurs-tab');
            // Utiliser un champ textarea pour les rumeurs multiples, séparées par des sauts de ligne
            const rumeursString = Array.isArray(location.Rumeurs) ? location.Rumeurs.join('\n') : (location.Rumeur || '');
            rumeursTab.innerHTML = `
                <div class="text-view space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Rumeurs</label>
                        <textarea id="edit-rumeur" rows="6" placeholder="Rumeur" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${rumeursString}</textarea>
                    </div>
                </div>
            `;
        }

        function updateTraditionTabForEdit(location) {
            const traditionTab = document.getElementById('tradition-tab');
            traditionTab.innerHTML = `
                <div class="text-view space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Tradition Ancienne</label>
                        <textarea id="edit-tradition" rows="6" placeholder="Tradition Ancienne" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${location.Tradition_Ancienne || ''}</textarea>
                    </div>
                </div>
            `;
        }

        function updateTablesTabForEdit(location) {
            const tablesTab = document.getElementById('tables-tab');
            const tables = location.tables || [];
            const tablesHtml = generateTablesEditHTML(tables);

            tablesTab.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gray-700 p-3 rounded-md">
                        <label class="block text-sm font-medium text-gray-300 mb-2">Tables aléatoires (max 5)</label>
                        <div id="edit-tables-container">${tablesHtml}</div>
                        <button id="add-table-btn" class="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm">Ajouter une table</button>
                    </div>
                </div>
            `;

            setupTablesEditListeners();
        }

        function updateJsonTablesTabForEdit(location) {
            const jsonTablesTab = document.getElementById('json-tables-tab');
            const jsonTables = location.jsonTables || [];
            const jsonTablesHtml = generateJsonTablesEditHTML(jsonTables);

            jsonTablesTab.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gray-700 p-3 rounded-md">
                        <label class="block text-sm font-medium text-gray-300 mb-2">Tables aléatoires - Texte (max 5)</label>
                        <div id="edit-json-tables-container">${jsonTablesHtml}</div>
                        <button id="add-json-table-btn" class="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm">Ajouter une table texte</button>
                    </div>
                </div>
            `;

            setupJsonTablesEditListeners();
        }

        function addEditControls() {
            // Add save/cancel buttons at the bottom of the scroll wrapper
            const scrollWrapper = document.getElementById('info-box-scroll-wrapper');
            let editControls = document.getElementById('edit-controls');

            if (!editControls) {
                editControls = document.createElement('div');
                editControls.id = 'edit-controls';
                editControls.className = 'mt-4 pt-4 border-t border-gray-600 flex justify-end space-x-2 bg-gray-900 sticky bottom-0';
                scrollWrapper.appendChild(editControls);
            }

            editControls.innerHTML = `
                <button id="cancel-edit" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm">Annuler</button>
                <button id="save-edit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm">Sauver</button>
            `;

            document.getElementById('save-edit').addEventListener('click', saveEdit);
            document.getElementById('cancel-edit').addEventListener('click', cancelEdit);
        }

        function setupColorPickerListeners() {
            document.getElementById('edit-color-picker').querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.addEventListener('click', () => {
                    document.querySelector('#edit-color-picker .color-swatch.selected').classList.remove('selected');
                    swatch.classList.add('selected');
                });
            });
        }

        function collectImagesFromEdit() {
            const container = document.getElementById('edit-images-container');
            const images = [];

            container.querySelectorAll('.image-edit-item').forEach(item => {
                const url = item.querySelector('.image-url-input').value.trim();
                const isDefault = item.querySelector('.default-image-checkbox').checked;

                if (url) {
                    images.push({ url, isDefault });
                }
            });

            // Ensure at least one default if images exist
            if (images.length > 0 && !images.some(image => image.isDefault)) {
                images[0].isDefault = true;
            }

            return images;
        }

        function setupImageEditListeners() {
            const container = document.getElementById('edit-images-container');
            const addButton = document.getElementById('add-image-btn');

            if (addButton) {
                addButton.addEventListener('click', addNewImageRow);
            }

            if (container) {
                container.addEventListener('click', (e) => {
                    if (e.target.closest('.remove-image-btn')) {
                        const button = e.target.closest('.remove-image-btn');
                        const item = button.closest('.image-edit-item');
                        if (item) {
                            item.remove();
                            updateImageIndices();
                        }
                    }
                });

                container.addEventListener('change', (e) => {
                    if (e.target.classList.contains('default-image-checkbox') && e.target.checked) {
                        // Uncheck other default checkboxes
                        container.querySelectorAll('.default-image-checkbox').forEach(cb => {
                            if (cb !== e.target) cb.checked = false;
                        });
                    }
                });
            }
        }

        function addNewImageRow() {
            const container = document.getElementById('edit-images-container');
            const currentImages = container.querySelectorAll('.image-edit-item');

            if (currentImages.length >= 5) {
                alert('Maximum 5 images autorisées');
                return;
            }

            const newIndex = currentImages.length;
            const newRow = document.createElement('div');
            newRow.className = 'image-edit-item flex items-center space-x-2 p-2 rounded';
            newRow.innerHTML = `
                <input type="url" class="image-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" placeholder="URL de l'image">
                <label class="flex items-center text-sm">
                    <input type="checkbox" class="default-image-checkbox mr-1" ${newIndex === 0 ? 'checked' : ''}>
                    <span class="text-gray-300">Défaut</span>
                </label>
                <button class="remove-image-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${newIndex}">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            `;

            container.appendChild(newRow);
            updateImageIndices();
        }

        function updateImageIndices() {
            const container = document.getElementById('edit-images-container');
            container.querySelectorAll('.remove-image-btn').forEach((btn, index) => {
                btn.dataset.index = index;
            });
        }

        function setupRandomEventButtons(location) {
            const buttons = document.querySelectorAll('.generate-random-event-btn');
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const tableIndex = parseInt(e.currentTarget.dataset.tableIndex);
                    const jsonTables = getLocationJsonTables(location);

                    if (jsonTables[tableIndex]) {
                        try {
                            const eventText = generateRandomEvent(jsonTables[tableIndex]);
                            const eventDisplay = e.currentTarget.closest('.json-table-container, .image-content').querySelector('.random-event-display');
                            const eventContent = eventDisplay.querySelector('.event-content');
                            eventContent.textContent = eventText;
                            eventDisplay.classList.remove('hidden');
                        } catch (error) {
                            console.error('Erreur lors de la génération de l\'événement aléatoire:', error);
                            alert('Erreur lors de la génération de l\'événement aléatoire. Vérifiez le format de la table.');
                        }
                    }
                });
            });
        }

        function showLocationContent(location) {
            // Reset edit mode and show normal content
            delete infoBox.dataset.editMode;
            const editControls = document.getElementById('edit-controls');
            if (editControls) {
                editControls.remove();
            }

            document.getElementById('info-box-edit-content').classList.add('hidden');
            document.getElementById('info-box-content').classList.remove('hidden');

            // Trigger showInfoBox with fake event to repopulate content
            const fakeEvent = { currentTarget: { dataset: { id: location.id.toString() } } };
            showInfoBox(fakeEvent);
        }

        async function handleGenerateDescription(event) {
            const location = locationsData.locations.find(loc => loc.id === activeLocationId);
            if (!location) return;

            event.preventDefault();
            const button = event.currentTarget;
            const originalContent = button.innerHTML;

            try {
                button.innerHTML = '<span class="animate-spin">⏳</span>';
                button.disabled = true;

                const response = await fetch('/generate_location_description', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ location_name: location.name })
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = await response.json();
                if (data.success && data.description) {
                    document.getElementById('edit-desc').value = data.description;
                } else {
                    throw new Error(data.error || 'Erreur inconnue');
                }
            } catch (error) {
                console.error('Erreur lors de la génération de la description:', error);
                alert('Erreur lors de la génération de la description: ' + error.message);
            } finally {
                button.innerHTML = originalContent;
                button.disabled = false;
            }
        }

// ====================================
// FONCTIONS UTILITAIRES POUR L'ÉDITION
// ====================================

        function generateImageEditHTML(images) {
            if (!images || images.length === 0) {
                return '<div class="text-gray-400 text-sm">Aucune image</div>';
            }

            return images.map((image, index) => `
                <div class="image-edit-item flex items-center space-x-2 p-2 rounded">
                    <input type="url" class="image-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" value="${image.url || ''}" placeholder="URL de l'image">
                    <label class="flex items-center text-sm">
                        <input type="checkbox" class="default-image-checkbox mr-1" ${image.isDefault ? 'checked' : ''}>
                        <span class="text-gray-300">Défaut</span>
                    </label>
                    <button class="remove-image-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${index}">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            `).join('');
        }

        function generateTablesEditHTML(tables) {
            if (!tables || tables.length === 0) {
                return '<div class="text-gray-400 text-sm">Aucune table</div>';
            }

            return tables.map((table, index) => `
                <div class="table-edit-item flex items-center space-x-2 p-2 rounded">
                    <input type="url" class="table-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" value="${table.url || ''}" placeholder="Chemin vers la table (ex: images/Tables/Table-Bois-de-Chet.jpg)">
                    <label class="flex items-center text-sm">
                        <input type="checkbox" class="default-table-checkbox mr-1" ${table.isDefault ? 'checked' : ''}>
                        <span class="text-gray-300">Défaut</span>
                    </label>
                    <button class="remove-table-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${index}">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            `).join('');
        }

        function generateJsonTablesEditHTML(jsonTables) {
            if (!jsonTables || jsonTables.length === 0) {
                return '<div class="text-gray-400 text-sm">Aucune table texte</div>';
            }

            return jsonTables.map((table, index) => `
                <div class="json-table-edit-item space-y-2 p-3 border border-gray-600 rounded-md">
                    <div class="flex items-center space-x-2">
                        <label class="flex items-center text-sm">
                            <input type="checkbox" class="default-json-table-checkbox mr-1" ${table.isDefault ? 'checked' : ''}>
                            <span class="text-gray-300">Table par défaut</span>
                        </label>
                        <button class="remove-json-table-btn text-red-400 hover:text-red-300 px-2 py-1 ml-auto" data-index="${index}">
                            <i class="fas fa-trash text-xs"></i> Supprimer
                        </button>
                    </div>
                    <textarea class="json-table-content-input w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm font-mono" rows="8" placeholder="Collez votre JSON ici...">${table.content || ''}</textarea>
                    <div class="json-validation-message text-xs"></div>
                </div>
            `).join('');
        }

        function setupJsonTablesEditListeners() {
            const container = document.getElementById('edit-json-tables-container');
            const addButton = document.getElementById('add-json-table-btn');

            if (addButton) {
                addButton.addEventListener('click', addNewJsonTableRow);
            }

            if (container) {
                container.addEventListener('click', (e) => {
                    if (e.target.closest('.remove-json-table-btn')) {
                        const button = e.target.closest('.remove-json-table-btn');
                        const item = button.closest('.json-table-edit-item');
                        if (item) {
                            item.remove();
                            updateJsonTableIndices();
                        }
                    }
                });

                container.addEventListener('change', (e) => {
                    if (e.target.classList.contains('default-json-table-checkbox') && e.target.checked) {
                        // Uncheck other default checkboxes
                        container.querySelectorAll('.default-json-table-checkbox').forEach(cb => {
                            if (cb !== e.target) cb.checked = false;
                        });
                    }
                });

                container.addEventListener('input', (e) => {
                    if (e.target.classList.contains('json-table-content-input')) {
                        const validation = validateJsonTable(e.target.value);
                        const messageDiv = e.target.closest('.json-table-edit-item').querySelector('.json-validation-message');

                        if (e.target.value.trim() === '') {
                            messageDiv.textContent = '';
                            messageDiv.className = 'json-validation-message text-xs';
                        } else if (validation.valid) {
                            messageDiv.textContent = '✓ Format JSON valide';
                            messageDiv.className = 'json-validation-message text-xs text-green-400';
                        } else {
                            messageDiv.textContent = `⚠ ${validation.message}`;
                            messageDiv.className = validation.warning ?
                                'json-validation-message text-xs text-yellow-400' :
                                'json-validation-message text-xs text-red-400';
                        }
                    }
                });
            }
        }

        function addNewJsonTableRow() {
            const container = document.getElementById('edit-json-tables-container');
            const currentTables = container.querySelectorAll('.json-table-edit-item');

            if (currentTables.length >= 5) {
                alert('Maximum 5 tables texte autorisées');
                return;
            }

            const newIndex = currentTables.length;
            const newRow = document.createElement('div');
            newRow.className = 'json-table-edit-item space-y-2 p-3 border border-gray-600 rounded-md';
            newRow.innerHTML = `
                <div class="flex items-center space-x-2">
                    <label class="flex items-center text-sm">
                        <input type="checkbox" class="default-json-table-checkbox mr-1" ${newIndex === 0 ? 'checked' : ''}>
                        <span class="text-gray-300">Table par défaut</span>
                    </label>
                    <button class="remove-json-table-btn text-red-400 hover:text-red-300 px-2 py-1 ml-auto" data-index="${newIndex}">
                        <i class="fas fa-trash text-xs"></i> Supprimer
                    </button>
                </div>
                <textarea class="json-table-content-input w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm font-mono" rows="8" placeholder="Collez votre JSON ici..."></textarea>
                <div class="json-validation-message text-xs"></div>
            `;

            container.appendChild(newRow);
            updateJsonTableIndices();
        }

        function updateJsonTableIndices() {
            const container = document.getElementById('edit-json-tables-container');
            container.querySelectorAll('.remove-json-table-btn').forEach((btn, index) => {
                btn.dataset.index = index;
            });
        }

        function collectJsonTablesFromEdit() {
            const container = document.getElementById('edit-json-tables-container');
            const jsonTables = [];

            container.querySelectorAll('.json-table-edit-item').forEach(item => {
                const content = item.querySelector('.json-table-content-input').value.trim();
                const isDefault = item.querySelector('.default-json-table-checkbox').checked;

                if (content) {
                    jsonTables.push({ content, isDefault });
                }
            });

            // Ensure at least one default if tables exist
            if (jsonTables.length > 0 && !jsonTables.some(table => table.isDefault)) {
                jsonTables[0].isDefault = true;
            }

            return jsonTables;
        }

        function setupTablesEditListeners() {
            const container = document.getElementById('edit-tables-container');
            const addButton = document.getElementById('add-table-btn');

            if (addButton) {
                addButton.addEventListener('click', addNewTableRow);
            }

            if (container) {
                container.addEventListener('click', (e) => {
                    if (e.target.closest('.remove-table-btn')) {
                        const button = e.target.closest('.remove-table-btn');
                        const item = button.closest('.table-edit-item');
                        if (item) {
                            item.remove();
                            updateTableIndices();
                        }
                    }
                });

                container.addEventListener('change', (e) => {
                    if (e.target.classList.contains('default-table-checkbox') && e.target.checked) {
                        // Uncheck other default checkboxes
                        container.querySelectorAll('.default-table-checkbox').forEach(cb => {
                            if (cb !== e.target) cb.checked = false;
                        });
                    }
                });
            }
        }

        function addNewTableRow() {
            const container = document.getElementById('edit-tables-container');
            const currentTables = container.querySelectorAll('.table-edit-item');

            if (currentTables.length >= 5) {
                alert('Maximum 5 tables autorisées');
                return;
            }

            const newIndex = currentTables.length;
            const newRow = document.createElement('div');
            newRow.className = 'table-edit-item flex items-center space-x-2 p-2 rounded';
            newRow.innerHTML = `
                <input type="url" class="table-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" placeholder="Chemin vers la table (ex: images/Tables/Table-Bois-de-Chet.jpg)">
                <label class="flex items-center text-sm">
                    <input type="checkbox" class="default-table-checkbox mr-1" ${newIndex === 0 ? 'checked' : ''}>
                    <span class="text-gray-300">Défaut</span>
                </label>
                <button class="remove-table-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${newIndex}">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            `;

            container.appendChild(newRow);
            updateTableIndices();
        }

        function updateTableIndices() {
            const container = document.getElementById('edit-tables-container');
            container.querySelectorAll('.remove-table-btn').forEach((btn, index) => {
                btn.dataset.index = index;
            });
        }

        function collectTablesFromEdit() {
            const container = document.getElementById('edit-tables-container');
            const tables = [];

            container.querySelectorAll('.table-edit-item').forEach(item => {
                const url = item.querySelector('.table-url-input').value.trim();
                const isDefault = item.querySelector('.default-table-checkbox').checked;

                if (url) {
                    tables.push({ url, isDefault });
                }
            });

            // Ensure at least one default if tables exist
            if (tables.length > 0 && !tables.some(table => table.isDefault)) {
                tables[0].isDefault = true;
            }

            return tables;
        }