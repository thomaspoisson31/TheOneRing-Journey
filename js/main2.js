// --- DOM Elements nécessaires ---
// viewport et loaderOverlay sont définis dans main.js et accessibles globalement

// --- Start the app ---
        // Ensure the app starts only once when the DOM is ready
        function initializeApp() {
            // Global error handlers
            window.addEventListener('unhandledrejection', function(event) {
                console.error('⚠️ Promesse rejetée non gérée:', event.reason);
                event.preventDefault();
            });

            window.addEventListener('error', function(event) {
                console.error('⚠️ Erreur JavaScript:', event.error);
            });

            console.log('🚀 Starting application...');

            // Global timeout for the application startup
            const startTimeout = setTimeout(() => {
                if (window.loaderOverlay && window.loaderOverlay.style.display !== 'none') {
                    console.error("❌ Application startup timed out");
                    window.loaderOverlay.innerHTML = `<div class="text-2xl text-red-500 text-center p-4">
                        <i class="fas fa-exclamation-triangle mb-4 text-4xl"></i><br>
                        Temps de chargement dépassé.<br>
                        <span class="text-sm text-gray-400 mt-2">Vérifiez votre connexion et les fichiers requis.</span><br>
                        <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Recharger</button>
                    </div>`;
                }
            }, 30000); // 30 seconds timeout

            // Check for authentication errors in the URL
            if (typeof window.checkAuthError === 'function') {
                window.checkAuthError();
            }

            // Vérifier si toutes les fonctions nécessaires sont disponibles
            if (typeof loadInitialLocations !== 'function') {
                console.error("❌ loadInitialLocations not defined, retrying in 100ms...");
                setTimeout(initializeApp, 100);
                return;
            }

            loadInitialLocations().then(() => {
                if (typeof loadRegionsFromLocal === 'function') {
                    loadRegionsFromLocal();
                }
                if (typeof loadSavedContexts === 'function') {
                    loadSavedContexts();
                }
                if (typeof setupFilters === 'function') {
                    setupFilters();
                }
                if (typeof loadSavedSeason === 'function') {
                    loadSavedSeason();
                }
                if (typeof loadMapsData === 'function') {
                    loadMapsData();
                }
                
                if (typeof logAuth === 'function') {
                    logAuth("Initialisation de l'authentification...");
                }

                // Initialize authentication after a short delay to ensure DOM is ready
                setTimeout(() => {
                    if (typeof checkGoogleAuth === 'function') {
                        checkGoogleAuth();
                    }
                }, 100);

                if (mapImage) {
                    mapImage.onload = () => {
                        clearTimeout(startTimeout);
                        if (typeof initializeMap === 'function') {
                            initializeMap();
                        }
                    };
                    mapImage.addEventListener('error', () => {
                        clearTimeout(startTimeout);
                        handleImageError();
                    });

                    console.log("🗺️ Loading map image:", PLAYER_MAP_URL);
                    mapImage.src = PLAYER_MAP_URL;
                }

                if (infoBoxClose && typeof hideInfoBox === 'function') {
                    infoBoxClose.addEventListener('click', hideInfoBox);
                }

                if (typeof logAuth === 'function') {
                    logAuth("Configuration des event listeners d'authentification...");
                }
                
                if (typeof setupAuthEventListeners === 'function') {
                    setupAuthEventListeners();
                }

                // Setup settings event listeners
                if (typeof setupSettingsEventListeners === 'function') {
                    setupSettingsEventListeners();
                }

                // Setup narration listeners
                if (typeof setupNarrationListeners === 'function') {
                    setupNarrationListeners();
                }

                // Test DOM elements after a delay
                setTimeout(() => {
                    if (typeof logAuth === 'function') {
                        logAuth("=== TEST DES ÉLÉMENTS DOM ===");
                        logAuth("authModal element:", !!document.getElementById('auth-modal'));
                        logAuth("auth-btn element:", !!document.getElementById('auth-btn'));
                        logAuth("close-auth-modal element:", !!document.getElementById('close-auth-modal'));
                        logAuth("google-signin-btn element:", !!document.getElementById('google-signin-btn'));
                        logAuth("save-context-btn element:", !!document.getElementById('save-context-btn'));
                        logAuth("settings-btn element:", !!document.getElementById('settings-btn'));
                        logAuth("settings-modal element:", !!document.getElementById('settings-modal'));
                        logAuth("close-settings-modal element:", !!document.getElementById('close-settings-modal'));

                        const testAuthBtn = document.getElementById('auth-btn');
                        if (testAuthBtn) {
                            logAuth("Bouton auth visible:", testAuthBtn.offsetParent !== null);
                            logAuth("Bouton auth cliquable:", !testAuthBtn.disabled);
                            logAuth("Classes du bouton auth:", testAuthBtn.className);
                        }
                        logAuth("=== FIN TEST DES ÉLÉMENTS DOM ===");
                    }
                }, 2000);

            }).catch(error => {
                clearTimeout(startTimeout);
                console.error("❌ Error during app startup:", error);
                if (window.loaderOverlay) {
                    window.loaderOverlay.innerHTML = `<div class="text-2xl text-red-500 text-center p-4">
                        <i class="fas fa-exclamation-triangle mb-4 text-4xl"></i><br>
                        Erreur lors du démarrage.<br>
                        <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Recharger</button>
                    </div>`;
                }
            });

            // Region modal handlers with null checks
            const confirmAddRegionBtn = document.getElementById('confirm-add-region');
            const cancelAddRegionBtn = document.getElementById('cancel-add-region');

            if (confirmAddRegionBtn && typeof saveRegion === 'function') {
                confirmAddRegionBtn.addEventListener('click', saveRegion);
            }

            if (cancelAddRegionBtn) {
                cancelAddRegionBtn.addEventListener('click', () => {
                    if (addRegionModal) {
                        addRegionModal.classList.add('hidden');
                    }
                    if (typeof cancelRegionCreation === 'function') {
                        cancelRegionCreation();
                    }
                });
            }

            // Double-click to complete region
            if (viewport) {
                window.viewport.addEventListener('dblclick', (event) => {
                    if (isAddingRegionMode && currentRegionPoints.length >= 3) {
                        event.preventDefault();
                        if (typeof completeRegion === 'function') {
                            completeRegion();
                        }
                    }
                });
            }
        }

        // --- Region Functions ---
        function renderRegions() {
            regionsLayer.innerHTML = '';

            regionsData.regions.forEach(region => {
                if (region.points && region.points.length >= 3) {
                    const pathData = `M ${region.points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', pathData);
                    path.classList.add('region');
                    path.style.fill = regionColorMap[region.color] || regionColorMap.green;
                    path.style.stroke = colorMap[region.color] || colorMap.green;
                    path.dataset.regionId = region.id;

                    path.addEventListener('click', (e) => {
                        if (!isAddingRegionMode && !isDrawingMode && !isAddingLocationMode) {
                            e.stopPropagation();
                            showRegionInfo(e, region);
                        }
                    });

                    regionsLayer.appendChild(path);
                }
            });
        }

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

            // Update rumeurs tab content
            const rumeursTab = document.getElementById('rumeurs-tab');
            // Ajouter les sections Rumeurs (support multiple) et Tradition_Ancienne si elles existent
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
            }
            // Support de l'ancienne structure avec Rumeur simple
            else if (region.Rumeur && region.Rumeur !== "A définir") {
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

            // Update tables tab content
            const tablesTab = document.getElementById('tables-tab');
            const tables = getRegionTables(region);

            if (tables.length > 0) {
                if (infoBox.classList.contains('expanded') && tables.length > 1) {
                    // Multi-tab view for expanded mode with multiple tables
                    const tableTabs = tables.map((table, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Table ${index + 1}</button>`
                    ).join('');

                    const tableContents = tables.map((table, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="image-view">
                                <img src="${table}" alt="Table aléatoire ${region.name}" title="${table.split('/').pop()}" onerror="handleImageError(this)">
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
                    const defaultTable = getDefaultRegionTable(region);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">Tables - ${region.name}</span>
                                </div>` : '';
                    tablesTab.innerHTML = `
                        <div class="image-view">
                            ${titleHtml}
                            <img src="${defaultTable}" alt="Table aléatoire ${region.name}" title="${defaultTable.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
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
                                <span style="font-family: 'Merriweather', serif;">Tables - ${region.name}</span>
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

            // Set up event listeners for regions
            const editBtn = document.getElementById('info-box-edit');
            editBtn.style.display = 'flex'; // Show edit button for regions

            // Remove any existing event listeners first
            setupInfoBoxEventListeners('region', region.id);

            // Set up tab switching
            setupTabSwitching();
        }

        function enterRegionEditMode() {
            const region = regionsData.regions.find(reg => reg.id === activeLocationId);
            if (!region) return;

            // Mark the info box as being in edit mode
            infoBox.dataset.editMode = 'true';
            infoBox.dataset.editType = 'region';

            // Update image tab to show image editing interface
            updateImageTabForRegionEdit(region);

            // Update text tab to show text editing interface
            updateTextTabForRegionEdit(region);

            // Update rumeurs tab to show rumeurs editing interface
            updateRumeursTabForRegionEdit(region);

            // Update tradition tab to show tradition editing interface
            updateTraditionTabForRegionEdit(region);

            // Update tables tab to show tables editing interface
            updateTablesTabForRegionEdit(region);

            // Add edit controls at the bottom
            addRegionEditControls();
        }

        function updateImageTabForRegionEdit(region) {
            const imageTab = document.getElementById('image-tab');
            const images = getRegionImages(region);
            const imagesHtml = generateImageEditHTML(images);

            const colorPickerHtml = Object.keys(regionColorMap).map(color =>
                `<div class="color-swatch ${region.color === color ? 'selected' : ''}" data-color="${color}" style="background-color: ${regionColorMap[color]}; border: 2px solid ${colorMap[color]};"></div>`
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
                        <div class="flex space-x-2" id="edit-region-color-picker">${colorPickerHtml}</div>
                    </div>
                </div>
            `;

            setupImageEditListeners();
            setupRegionColorPickerListeners();
        }

        function updateTextTabForRegionEdit(region) {
            const textTab = document.getElementById('text-tab');
            textTab.innerHTML = `
                <div class="text-view space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Nom de la région</label>
                        <input type="text" id="edit-region-name" value="${region.name}" placeholder="Nom de la région" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <div class="flex items-start space-x-2">
                            <textarea id="edit-region-desc" rows="4" placeholder="Description" class="flex-1 bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${region.description || ''}</textarea>
                            <button id="generate-edit-region-desc" class="p-2 bg-purple-600 hover:bg-purple-700 rounded-md" title="Générer une description"><span class="gemini-icon">✨</span></button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('generate-edit-region-desc').addEventListener('click', handleGenerateRegionDescription);
        }

        function updateRumeursTabForRegionEdit(region) {
            const rumeursTab = document.getElementById('rumeurs-tab');
            // Utiliser un champ textarea pour les rumeurs multiples, séparées par des sauts de ligne
            const rumeursString = Array.isArray(region.Rumeurs) ? region.Rumeurs.join('\n') : (region.Rumeur || '');
            rumeursTab.innerHTML = `
                <div class="text-view space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Rumeurs</label>
                        <textarea id="edit-region-rumeur" rows="6" placeholder="Rumeur" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${rumeursString}</textarea>
                    </div>
                </div>
            `;
        }

        function updateTraditionTabForRegionEdit(region) {
            const traditionTab = document.getElementById('tradition-tab');
            traditionTab.innerHTML = `
                <div class="text-view space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Tradition Ancienne</label>
                        <textarea id="edit-region-tradition" rows="6" placeholder="Tradition Ancienne" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${region.Tradition_Ancienne || ''}</textarea>
                    </div>
                </div>
            `;
        }

        function updateTablesTabForRegionEdit(region) {
            const tablesTab = document.getElementById('tables-tab');
            const tables = region.tables || [];
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

        function addRegionEditControls() {
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
                <button id="cancel-region-edit" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm">Annuler</button>
                <button id="save-region-edit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm">Sauver</button>
            `;

            document.getElementById('save-region-edit').addEventListener('click', saveRegionEdit);
            document.getElementById('cancel-region-edit').addEventListener('click', cancelRegionEdit);
        }

        function setupRegionColorPickerListeners() {
            document.getElementById('edit-region-color-picker').querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.addEventListener('click', () => {
                    document.querySelector('#edit-region-color-picker .color-swatch.selected').classList.remove('selected');
                    swatch.classList.add('selected');
                });
            });
        }

        function saveRegionEdit() {
            const region = regionsData.regions.find(reg => reg.id === activeLocationId);
            if (!region) return;

            region.name = document.getElementById('edit-region-name').value;
            region.description = document.getElementById('edit-region-desc').value;
            region.Rumeurs = document.getElementById('edit-region-rumeur').value.split('\n').filter(r => r.trim() !== ''); // Split by newline for multiple rumors
            region.Tradition_Ancienne = document.getElementById('edit-region-tradition').value;
            region.color = document.querySelector('#edit-region-color-picker .color-swatch.selected').dataset.color;

            // Handle images
            const images = collectImagesFromEdit();
            if (images.length > 0) {
                region.images = images;
            } else {
                delete region.images;
            }

            // Handle tables
            const tables = collectTablesFromEdit();
            if (tables.length > 0) {
                region.tables = tables;
            } else {
                delete region.tables;
            }

            saveRegionsToLocal();
            renderRegions();
            hideInfoBox();
        }

        function cancelRegionEdit() {
            // Remove edit mode flag
            delete infoBox.dataset.editMode;
            delete infoBox.dataset.editType;

            // Remove edit controls
            const editControls = document.getElementById('edit-controls');
            if (editControls) {
                editControls.remove();
            }

            // Re-show the region info without edit mode
            const region = regionsData.regions.find(reg => reg.id === activeLocationId);
            if (region) {
                showRegionContent(region);
            }
        }

        function showRegionContent(region) {
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

            // Update rumeurs tab content
            const rumeursTab = document.getElementById('rumeurs-tab');
            // Ajouter les sections Rumeurs (support multiple) et Tradition_Ancienne si elles existent
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
            }
            // Support de l'ancienne structure avec Rumeur simple
            else if (region.Rumeur && region.Rumeur !== "A définir") {
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

            // Update tables tab content
            const tablesTab = document.getElementById('tables-tab');
            const tables = getRegionTables(region);

            if (tables.length > 0) {
                if (infoBox.classList.contains('expanded') && tables.length > 1) {
                    // Multi-tab view for expanded mode with multiple tables
                    const tableTabs = tables.map((table, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Table ${index + 1}</button>`
                    ).join('');

                    const tableContents = tables.map((table, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="image-view">
                                <img src="${table}" alt="Table aléatoire ${region.name}" title="${table.split('/').pop()}" onerror="handleImageError(this)">
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
                    const defaultTable = getDefaultRegionTable(region);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">Tables - ${region.name}</span>
                                </div>` : '';
                    tablesTab.innerHTML = `
                        <div class="image-view">
                            ${titleHtml}
                            <img src="${defaultTable}" alt="Table aléatoire ${region.name}" title="${defaultTable.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
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
                                <span style="font-family: 'Merriweather', serif;">Tables - ${region.name}</span>
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
        }

        function deleteLocation(locationId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce lieu ?')) {
                const locationIndex = locationsData.locations.findIndex(loc => loc.id === locationId);
                if (locationIndex !== -1) {
                    locationsData.locations.splice(locationIndex, 1);
                    saveLocationsToLocal();
                    renderLocations();
                    hideInfoBox();
                }
            }
        }

        function deleteRegion(regionId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette région ?')) {
                const regionIndex = regionsData.regions.findIndex(reg => reg.id === regionId);
                if (regionIndex !== -1) {
                    regionsData.regions.splice(regionIndex, 1);
                    saveRegionsToLocal();
                    renderRegions();
                    hideInfoBox();
                }
            }
        }

        async function handleGenerateRegionDescription(event) {
            const button = event.currentTarget;
            const regionName = document.getElementById('edit-region-name').value;
            const descTextarea = document.getElementById('edit-region-desc');

            if (!regionName) {
                alert("Veuillez d'abord entrer un nom pour la région.");
                return;
            }

            const prompt = `Rédige une courte description évocatrice pour une région de la Terre du Milieu nommée '${regionName}'. Décris son apparence, son climat, sa géographie et son histoire possible, dans le style de J.R.R. Tolkien. Sois concis et évocateur.`;

            const result = await callGemini(prompt, button);
            descTextarea.value = result;
        }

        function addRegionPoint(coords) {
            console.log("🌍 Adding region point:", coords);
            currentRegionPoints.push(coords);
            console.log("🌍 Current region points count:", currentRegionPoints.length);

            // Create or update temporary visual feedback
            updateTempRegion();

            // Add visual point indicator
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', coords.x);
            circle.setAttribute('cy', coords.y);
            circle.setAttribute('r', 4);
            circle.classList.add('region-point');
            circle.dataset.tempPoint = 'true';
            regionsLayer.appendChild(circle);
            console.log("🌍 Visual point added to SVG");

            if (currentRegionPoints.length >= 3) {
                console.log("🌍 Region has enough points for completion (double-click to finish)");
            }
        }

        function updateTempRegion() {
            // Remove existing temp path
            const existingTemp = regionsLayer.querySelector('.region-temp');
            if (existingTemp) existingTemp.remove();

            if (currentRegionPoints.length >= 2) {
                const pathData = `M ${currentRegionPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathData);
                path.classList.add('region-temp');
                regionsLayer.appendChild(path);
                tempRegionPath = path;
            }
        }

        function completeRegion() {
            if (currentRegionPoints.length >= 3) {
                // Show modal to get region details
                showAddRegionModal();
            } else {
                alert('Une région doit avoir au moins 3 points.');
            }
        }

        function showAddRegionModal() {
            addRegionModal.classList.remove('hidden');
            document.getElementById('region-name-input').focus();

            // Setup color picker
            const regionColorPicker = document.getElementById('region-color-picker');
            regionColorPicker.innerHTML = Object.keys(regionColorMap).map((color, index) =>
                `<div class="color-swatch ${index === 0 ? 'selected' : ''}" data-color="${color}" style="background-color: ${regionColorMap[color]}; border: 2px solid ${colorMap[color]};"></div>`
            ).join('');

            regionColorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.addEventListener('click', () => {
                    regionColorPicker.querySelector('.color-swatch.selected').classList.remove('selected');
                    swatch.classList.add('selected');
                });
            });
        }

        function cancelRegionCreation() {
            currentRegionPoints = [];
            // Remove temporary visuals
            regionsLayer.querySelectorAll('[data-temp-point]').forEach(el => el.remove());
            if (tempRegionPath) {
                tempRegionPath.remove();
                tempRegionPath = null;
            }

            isAddingRegionMode = false;
            window.viewport.classList.remove('adding-region');
            document.getElementById('add-region-mode').classList.remove('btn-active');
        }

        function saveRegion() {
            const nameInput = document.getElementById('region-name-input');
            const descInput = document.getElementById('region-desc-input');
            const selectedColor = document.querySelector('#region-color-picker .selected').dataset.color;

            if (nameInput.value && currentRegionPoints.length >= 3) {
                const newRegion = {
                    id: Date.now(),
                    name: nameInput.value,
                    description: descInput.value,
                    color: selectedColor,
                    points: [...currentRegionPoints],
                    Rumeurs: [], // Initialize Rumeurs as an empty array
                    Tradition_Ancienne: "A définir"
                };

                regionsData.regions.push(newRegion);
                saveRegionsToLocal();
                renderRegions();

                // Clean up
                currentRegionPoints = [];
                regionsLayer.querySelectorAll('[data-temp-point]').forEach(el => el.remove());
                if (tempRegionPath) {
                    tempRegionPath.remove();
                    tempRegionPath = null;
                }

                addRegionModal.classList.add('hidden');
                nameInput.value = '';
                descInput.value = '';

                isAddingRegionMode = false;
                window.viewport.classList.remove('adding-region');
                document.getElementById('add-region-mode').classList.remove('btn-active');
            }
        }

        function saveRegionsToLocal() {
            localStorage.setItem('middleEarthRegions', JSON.stringify(regionsData));
            scheduleAutoSync(); // Synchroniser après modification
        }

        function loadRegionsFromLocal() {
            const saved = localStorage.getItem('middleEarthRegions');
            if (saved) {
                try {
                    regionsData = JSON.parse(saved);
                    // Ensure Rumeurs is an array for all regions
                    regionsData.regions.forEach(region => {
                        if (!Array.isArray(region.Rumeurs)) {
                            if (region.Rumeur && region.Rumeur !== "A définir") {
                                region.Rumeurs = [region.Rumeur];
                            } else {
                                region.Rumeurs = [];
                            }
                            delete region.Rumeur; // Remove the old Rumeur property
                        }
                    });
                } catch (e) {
                    console.error('Failed to load regions from localStorage:', e);
                    regionsData = getDefaultRegions();
                }
            }
        }

        // Rendre les fonctions globales
        window.loadRegionsFromLocal = loadRegionsFromLocal;
        window.setupFilters = setupFilters;
        window.initializeApp = initializeApp;

        function handleImageError() {
            console.error("❌ Erreur de chargement de l'image de carte");
            if (window.loaderOverlay) {
                window.loaderOverlay.innerHTML = `<div class="text-2xl text-red-500 text-center p-4"><i class="fas fa-exclamation-triangle mb-4 text-4xl"></i><br>Erreur de chargement de la carte.<br><span class="text-sm text-gray-400 mt-2">Vérifiez que les fichiers de carte sont disponibles.</span></div>`;
            }
        }
        function startDragMarker(e) { e.stopPropagation(); draggedMarker = e.target; dragStartX = e.clientX; dragStartY = e.clientY; document.addEventListener('mousemove', dragMarker); document.addEventListener('mouseup', stopDragMarker); }
        function dragMarker(e) { if (!draggedMarker) return; const deltaX = e.clientX - dragStartX; const deltaY = e.clientY - dragStartY; const newX = parseFloat(draggedMarker.style.left) + (deltaX / scale); const newY = parseFloat(draggedMarker.style.top) + (deltaY / scale); draggedMarker.style.left = `${newX}px`; draggedMarker.style.top = `${newY}px`; dragStartX = e.clientX; dragStartY = e.clientY; }
        function stopDragMarker() { if (!draggedMarker) return; const locationId = parseInt(draggedMarker.dataset.id, 10); const location = locationsData.locations.find(loc => loc.id === locationId); if (location) { location.coordinates.x = parseFloat(draggedMarker.style.left); location.coordinates.y = parseFloat(draggedMarker.style.top); } draggedMarker = null; document.removeEventListener('mousemove', dragMarker); document.removeEventListener('mouseup', stopDragMarker); saveLocationsToLocal(); }
        function applyTransform() { mapContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`; }
        function resetView() { const viewportWidth = window.viewport.clientWidth; if (viewportWidth === 0 || MAP_WIDTH === 0) return; scale = viewportWidth / MAP_WIDTH; panX = 0; panY = 0; applyTransform(); }
        function setupFilters() {
            const filterColorPicker = document.getElementById('filter-color-picker');
            filterColorPicker.innerHTML = Object.keys(colorMap).map(color => `
                <label title="${color.charAt(0).toUpperCase() + color.slice(1)}" class="relative cursor-pointer">
                    <input type="checkbox" data-color="${color}" class="filter-color-checkbox sr-only peer">
                    <div class="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-white" style="background-color: ${colorMap[color]}"></div>
                </label>
            `).join('');

            document.getElementById('filter-toggle').addEventListener('click', (e) => {
                e.stopPropagation();
                filterPanel.classList.toggle('hidden');
            });

            // Fermer le panneau de filtre en cliquant en dehors
            document.addEventListener('click', (e) => {
                if (!filterPanel.contains(e.target) && !document.getElementById('filter-toggle').contains(e.target)) {
                    filterPanel.classList.add('hidden');
                }
            });

            // Empêcher la fermeture en cliquant à l'intérieur du panneau
            filterPanel.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            document.getElementById('filter-known').addEventListener('change', updateFilters);
            document.getElementById('filter-visited').addEventListener('change', updateFilters);
            document.querySelectorAll('.filter-color-checkbox').forEach(cb => cb.addEventListener('change', updateFilters));
            document.getElementById('reset-filters').addEventListener('click', resetFilters);
            document.getElementById('filter-show-regions').addEventListener('change', updateFilters); // Add listener for region visibility filter

            // Charger les filtres sauvegardés
            loadFiltersFromLocal();
        }
        function updateFilters() {
            activeFilters.known = document.getElementById('filter-known').checked;
            activeFilters.visited = document.getElementById('filter-visited').checked;
            activeFilters.colors = [];
            document.querySelectorAll('.filter-color-checkbox:checked').forEach(cb => {
                activeFilters.colors.push(cb.dataset.color);
            });
            renderLocations();

            // Show or hide regions based on the checkbox
            const showRegions = document.getElementById('filter-show-regions').checked;
            if (showRegions) {
                renderRegions();
                regionsLayer.style.display = 'block';
            } else {
                regionsLayer.style.display = 'none';
            }

            // Sauvegarder les filtres dans le localStorage
            saveFiltersToLocal();
            scheduleAutoSync();
        }
        function resetFilters() {
            document.getElementById('filter-known').checked = false;
            document.getElementById('filter-visited').checked = false;
            document.querySelectorAll('.filter-color-checkbox').forEach(cb => cb.checked = false);
            document.getElementById('filter-show-regions').checked = true; // Reset region visibility to checked
            updateFilters();
        }

        function saveFiltersToLocal() {
            const filterState = {
                known: activeFilters.known,
                visited: activeFilters.visited,
                colors: activeFilters.colors,
                showRegions: document.getElementById('filter-show-regions').checked
            };
            localStorage.setItem('middleEarthFilters', JSON.stringify(filterState));
        }

        function loadFiltersFromLocal() {
            const saved = localStorage.getItem('middleEarthFilters');
            if (saved) {
                try {
                    const filterState = JSON.parse(saved);
                    activeFilters.known = filterState.known || false;
                    activeFilters.visited = filterState.visited || false;
                    activeFilters.colors = filterState.colors || [];

                    // Appliquer les filtres à l'interface
                    document.getElementById('filter-known').checked = activeFilters.known;
                    document.getElementById('filter-visited').checked = activeFilters.visited;
                    document.getElementById('filter-show-regions').checked = filterState.showRegions !== undefined ? filterState.showRegions : true;

                    // Appliquer les couleurs
                    document.querySelectorAll('.filter-color-checkbox').forEach(cb => {
                        cb.checked = activeFilters.colors.includes(cb.dataset.color);
                    });

                    // Appliquer les filtres
                    renderLocations();
                    const showRegions = document.getElementById('filter-show-regions').checked;
                    if (showRegions) {
                        renderRegions();
                        regionsLayer.style.display = 'block';
                    } else {
                        regionsLayer.style.display = 'none';
                    }
                } catch (e) {
                    console.error('Failed to load filters from localStorage:', e);
                }
            }
        }
        window.viewport.addEventListener('wheel', (event) => { event.preventDefault(); const zoomIntensity = 0.1; const wheel = event.deltaY < 0 ? 1 : -1; const zoom = Math.exp(wheel * zoomIntensity); const rect = window.viewport.getBoundingClientRect(); const mouseX = event.clientX - rect.left; const mouseY = event.clientY - rect.top; panX = mouseX - (mouseX - panX) * zoom; panY = mouseY - (mouseY - panY) * zoom; scale = Math.max(0.1, Math.min(scale * zoom, 5)); applyTransform(); });
        // Gestionnaire mousedown principal du viewport
        function handleViewportMouseDown(event) {
            console.log("🖱️ Main viewport mousedown, mode:", {drawing: isDrawingMode, adding: isAddingLocationMode, region: isAddingRegionMode});

            if (event.target.closest('.location-marker, #info-box')) return;
            hideInfoBox();

            if (isAddingLocationMode) {
                console.log("📍 Adding location mode active");
                addLocation(event);
                return;
            }

            if (isAddingRegionMode) {
                console.log("🌍 Adding region mode active");
                const coords = getCanvasCoordinates(event);
                console.log("🌍 Adding region point at:", coords);
                addRegionPoint(coords);
                return;
            }

            if (isDrawingMode) {
                console.log("🎨 Drawing mode active, mousedown handled by drawing handler");
                return;
            }

            console.log("👆 Starting pan mode");
            event.preventDefault();
            isPanning = true;
            startPanX = event.clientX - panX;
            startPanY = event.clientY - panY;
            window.viewport.classList.add('panning');
        }
        window.viewport.addEventListener('mousemove', (event) => { if (isPanning) { event.preventDefault(); panX = event.clientX - startPanX; panY = event.clientY - startPanY; applyTransform(); } });
        ['mouseup', 'mouseleave'].forEach(event => window.viewport.addEventListener(event, () => { isPanning = false; window.viewport.classList.remove('panning'); }));
        // Gestionnaires d'événements pour le dessin - attachés au viewport au lieu du canvas
        if (window.viewport) {
            window.viewport.addEventListener('mousedown', (event) => {
                console.log("🖱️ Viewport mousedown event fired, isDrawingMode:", isDrawingMode);

            // Handle drawing mode specifically
            if (isDrawingMode) {
                // Vérifier qu'on ne clique pas sur un marqueur ou autre élément
                if (event.target.closest('.location-marker, #info-box')) {
                    console.log("❌ Clicked on marker or info box, ignoring");
                    return;
                }

                console.log("🎨 Starting drawing...");
                event.preventDefault();
                event.stopPropagation();

                ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                isDrawing = true;
                totalPathPixels = 0;

                // Reset journey tracking
                journeyPath = [];
                traversedRegions.clear();
                nearbyLocations.clear();
                journeyDiscoveries = [];

                // Réinitialiser les segments de voyage
                resetVoyageSegments();

                startPoint = getCanvasCoordinates(event);
                lastPoint = startPoint;

                // Add start point to journey path
                journeyPath.push({x: startPoint.x, y: startPoint.y});

                console.log("📍 Start point:", startPoint);
                ctx.beginPath();
                ctx.moveTo(lastPoint.x, lastPoint.y);
                updateDistanceDisplay();
                distanceContainer.classList.remove('hidden');
                console.log("✅ Drawing initialized");
                return;
            }

            // Handle all other modes (panning, adding location, adding region)
            handleViewportMouseDown(event);
        });

        window.viewport.addEventListener('mousemove', (event) => {
                if (!isDrawing || !isDrawingMode) return;

                console.log("✏️ Mouse move during drawing");
                const currentPoint = getCanvasCoordinates(event);
                const segmentLength = Math.sqrt(Math.pow(currentPoint.x - lastPoint.x, 2) + Math.pow(currentPoint.y - lastPoint.y, 2));
                totalPathPixels += segmentLength;

                // Add current point to journey path for region/location detection
                journeyPath.push({x: currentPoint.x, y: currentPoint.y});

                lastPoint = currentPoint;
                ctx.lineTo(currentPoint.x, currentPoint.y);
                ctx.stroke();
                updateDistanceDisplay();
                console.log("✏️ Drawing segment, total pixels:", totalPathPixels.toFixed(1));
            });

            ['mouseup', 'mouseleave'].forEach(eventType => window.viewport.addEventListener(eventType, (event) => {
                if (isDrawing) {
                    console.log("🛑 Drawing stopped on", eventType);
                    isDrawing = false;
                    console.log("🔄 Programmation de la synchronisation après tracé");
                    scheduleAutoSync(); // Synchroniser après avoir terminé un segment de tracé
                }
            }));
        }
        // Les boutons zoom ont été supprimés de l'interface
        // document.getElementById('zoom-in').addEventListener('click', () => { scale *= 1.2; applyTransform(); });
        // document.getElementById('zoom-out').addEventListener('click', () => { scale /= 1.2; applyTransform(); });
        // document.getElementById('reset-zoom').addEventListener('click', resetView);
        document.getElementById('draw-mode').addEventListener('click', (e) => {
            console.log("🎨 Draw mode button clicked");
            isAddingLocationMode = false;
            isAddingRegionMode = false;
            window.viewport.classList.remove('adding-location', 'adding-region');
            document.getElementById('add-location-mode').classList.remove('btn-active');
            document.getElementById('add-region-mode').classList.remove('btn-active');
            cancelRegionCreation();

            // Si on désactive le mode dessin et qu'il y a un tracé, synchroniser
            if (isDrawingMode && journeyPath.length > 0) {
                console.log("🔄 Synchronisation lors de la désactivation du mode dessin");
                scheduleAutoSync();
            }

            isDrawingMode = !isDrawingMode;
            console.log("🎨 Drawing mode is now:", isDrawingMode);
            window.viewport.classList.toggle('drawing', isDrawingMode);
            e.currentTarget.classList.toggle('btn-active', isDrawingMode);

            // Ensure canvas has proper pointer events when in drawing mode
            if (isDrawingMode) {
                drawingCanvas.style.pointerEvents = 'auto';
                console.log("✅ Canvas pointer events enabled");
            } else {
                drawingCanvas.style.pointerEvents = 'none';
                console.log("❌ Canvas pointer events disabled");
            }

            // Re-render locations to update pointer events
            renderLocations();
        });
        document.getElementById('add-location-mode').addEventListener('click', (e) => {
            isDrawingMode = false;
            isAddingRegionMode = false;
            window.viewport.classList.remove('drawing', 'adding-region');
            document.getElementById('draw-mode').classList.remove('btn-active');
            document.getElementById('add-region-mode').classList.remove('btn-active');
            cancelRegionCreation();
            isAddingLocationMode = !isAddingLocationMode;
            window.viewport.classList.toggle('adding-location', isAddingLocationMode);
            e.currentTarget.classList.toggle('btn-active', isAddingLocationMode);
            // Re-render locations to update event handlers
            renderLocations();
        });

        document.getElementById('add-region-mode').addEventListener('click', (e) => {
            isDrawingMode = false;
            isAddingLocationMode = false;
            window.viewport.classList.remove('drawing', 'adding-location');
            document.getElementById('draw-mode').classList.remove('btn-active');
            document.getElementById('add-location-mode').classList.remove('btn-active');
            isAddingRegionMode = !isAddingRegionMode;
            window.viewport.classList.toggle('adding-region', isAddingRegionMode);
            e.currentTarget.classList.toggle('btn-active', isAddingRegionMode);

            if (!isAddingRegionMode) {
                cancelRegionCreation();
            }

            renderLocations();
        });
        document.getElementById('erase').addEventListener('click', () => {
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            totalPathPixels = 0;
            startPoint = null;
            lastPoint = null;
            journeyPath = [];
            traversedRegions.clear();
            nearbyLocations.clear();
            journeyDiscoveries = []; // Clear discoveries as well

            // Réinitialiser les informations de voyage
            resetVoyageSegments();

            // Masquer le bouton de voyage
            const voyageBtn = document.getElementById('voyage-segments-btn');
            if (voyageBtn) voyageBtn.classList.add('hidden');

            updateDistanceDisplay();
            console.log("🔄 Synchronisation après effacement du tracé");
            scheduleAutoSync(); // Synchroniser après effacement du tracé
        });
        document.getElementById('export-locations').addEventListener('click', exportUnifiedData);
        document.getElementById('import-locations').addEventListener('click', () => document.getElementById('import-file-input').click());
        document.getElementById('import-file-input').addEventListener('change', importUnifiedData);

        // Event listeners pour l'import des régions
        const importRegionsBtn = document.getElementById('import-regions');
        const importRegionsInput = document.getElementById('import-regions-input');
        const exportRegionsBtn = document.getElementById('export-regions');

        if (importRegionsBtn && importRegionsInput) {
            importRegionsBtn.addEventListener('click', () => importRegionsInput.click());
            importRegionsInput.addEventListener('change', importUnifiedData);
        }

        if (exportRegionsBtn) {
            exportRegionsBtn.addEventListener('click', exportUnifiedData);
        }
        // document.getElementById('reset-locations').addEventListener('click', () => { if (confirm("Voulez-vous vraiment réinitialiser tous les lieux par défaut ?")) { locationsData = getDefaultLocations(); renderLocations(); saveLocationsToLocal(); } });
        window.mapSwitchBtn.addEventListener('click', () => {
            isPlayerView = !isPlayerView;
            const icon = document.getElementById('map-switch-icon');
            if (isPlayerView) {
                mapImage.style.opacity = '1';
                loremasterMapImage.style.opacity = '0';
                icon.className = 'fas fa-book-open';
                window.mapSwitchBtn.title = "Vue Gardien";
            } else {
                mapImage.style.opacity = '0';
                loremasterMapImage.style.opacity = '1';
                icon.className = 'fas fa-users';
                window.mapSwitchBtn.title = "Vue Joueurs";
            }
        });
        document.getElementById('confirm-add-location').addEventListener('click', () => { const nameInput = document.getElementById('location-name-input'); const descInput = document.getElementById('location-desc-input'); const imageInput = document.getElementById('location-image-input'); const color = document.querySelector('#add-color-picker .selected').dataset.color; const known = document.getElementById('location-known-input').checked; const visited = document.getElementById('location-visited-input').checked; if (nameInput.value && newLocationCoords) { const newLocation = { id: Date.now(), name: nameInput.value, description: descInput.value, imageUrl: imageInput.value, color: color, known: known, visited: visited, type: "custom", coordinates: newLocationCoords, Rumeurs: [], Tradition_Ancienne: "A définir" }; locationsData.locations.push(newLocation); renderLocations(); saveLocationsToLocal(); } addLocationModal.classList.add('hidden'); nameInput.value = ''; descInput.value = ''; imageInput.value = ''; newLocationCoords = null; });
        document.getElementById('cancel-add-location').addEventListener('click', () => { addLocationModal.classList.add('hidden'); document.getElementById('location-name-input').value = ''; document.getElementById('location-desc-input').value = ''; document.getElementById('location-image-input').value = ''; newLocationCoords = null; });
        function addLocation(event) { newLocationCoords = getCanvasCoordinates(event); addLocationModal.classList.remove('hidden'); document.getElementById('location-name-input').focus(); isAddingLocationMode = false; window.viewport.classList.remove('adding-location'); document.getElementById('add-location-mode').classList.remove('btn-active'); const addColorPicker = document.getElementById('add-color-picker'); addColorPicker.innerHTML = Object.keys(colorMap).map((color, index) => `<div class="color-swatch ${index === 0 ? 'selected' : ''}" data-color="${color}" style="background-color: ${colorMap[color]}"></div>`).join(''); addColorPicker.querySelectorAll('.color-swatch').forEach(swatch => { swatch.addEventListener('click', () => { addColorPicker.querySelector('.color-swatch.selected').classList.remove('selected'); swatch.classList.add('selected'); }); }); document.getElementById('generate-add-desc').addEventListener('click', handleGenerateDescription); document.getElementById('location-known-input').checked = true; document.getElementById('location-visited-input').checked = false; const addVisitedCheckbox = document.getElementById('location-visited-input'); const addKnownCheckbox = document.getElementById('location-known-input'); if(addVisitedCheckbox && addKnownCheckbox) { addVisitedCheckbox.addEventListener('change', () => { if (addVisitedCheckbox.checked) { addKnownCheckbox.checked = true; } }); } }
        function saveLocationsToLocal() {
            localStorage.setItem('middleEarthLocations', JSON.stringify(locationsData));
            scheduleAutoSync(); // Synchroniser après modification
        }

// === FONCTIONS UNIFIÉES D'IMPORT/EXPORT ===

function exportUnifiedData() {
    const allLocations = [];

    // Ajouter les lieux normaux
    if (locationsData.locations) {
        locationsData.locations.forEach(location => {
            const exportLocation = {
                id: location.id,
                name: location.name,
                description: location.description || "",
                imageUrl: location.imageUrl || "",
                images: location.images || [],
                color: location.color,
                known: location.known !== undefined ? location.known : true,
                visited: location.visited !== undefined ? location.visited : false,
                type: location.type || "custom",
                coordinates: location.coordinates || { x: 0, y: 0 }
            };

            // Ajouter les rumeurs multiples si elles existent
            if (location.Rumeurs && location.Rumeurs.length > 0) {
                location.Rumeurs.forEach(rumeur => {
                    exportLocation.Rumeur = rumeur;
                });
            }
            // Support de l'ancienne structure avec Rumeur simple
            else if (location.Rumeur) {
                exportLocation.Rumeur = location.Rumeur;
            }

            if (location.Tradition_Ancienne) {
                exportLocation.Tradition_Ancienne = location.Tradition_Ancienne;
            }

            allLocations.push(exportLocation);
        });
    }

    // Ajouter les régions converties en format unifié
    if (regionsData.regions) {
        regionsData.regions.forEach(region => {
            const exportRegion = {
                id: region.id,
                name: region.name,
                description: region.description || "",
                imageUrl: region.imageUrl || "",
                images: region.images || [],
                color: region.color,
                known: region.known !== undefined ? region.known : true,
                visited: region.visited !== undefined ? region.visited : false,
                type: "region",
                coordinates: {
                    points: region.points || []
                }
            };

            // Ajouter les rumeurs multiples si elles existent
            if (region.Rumeurs && region.Rumeurs.length > 0) {
                region.Rumeurs.forEach(rumeur => {
                    exportRegion.Rumeur = rumeur;
                });
            }
            // Support de l'ancienne structure avec Rumeur simple
            else if (region.Rumeur) {
                exportRegion.Rumeur = region.Rumeur;
            }

            if (region.Tradition_Ancienne) {
                exportRegion.Tradition_Ancienne = region.Tradition_Ancienne;
            }

            allLocations.push(exportRegion);
        });
    }

    const unifiedData = {
        locations: allLocations
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(unifiedData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "Landmark.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    document.body.removeChild(downloadAnchorNode);
    console.log(`✅ Export unifié terminé - ${allLocations.length} éléments sauvegardés (lieux et régions)`);
}

// Ancienne fonction de compatibilité (garde pour les anciens liens)
function exportLocationsToFile() {
    exportUnifiedData(); // Rediriger vers la fonction unifiée
}
function importUnifiedData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Supporter les différents formats de fichiers
            let locationsArray = [];

            // Format unifié : { locations: [...] }
            if (importedData.locations && Array.isArray(importedData.locations)) {
                locationsArray = importedData.locations;
            }
            // Format ancien : { regions: [...] } - convertir les régions en locations
            else if (importedData.regions && Array.isArray(importedData.regions)) {
                locationsArray = importedData.regions.map(region => ({
                    id: region.id,
                    name: region.name,
                    description: region.description || "",
                    imageUrl: region.imageUrl || "",
                    color: region.color,
                    known: region.known !== undefined ? region.known : true,
                    visited: region.visited !== undefined ? region.visited : false,
                    type: "region",
                    coordinates: {
                        points: region.points || []
                    },
                    ...(region.Rumeur && { Rumeur: region.Rumeur }), // Ancienne structure Rumeur simple
                    ...(region.Tradition_Ancienne && { Tradition_Ancienne: region.Tradition_Ancienne })
                }));
            }
            // Format très ancien : tableau direct de locations à la racine
            else if (Array.isArray(importedData)) {
                locationsArray = importedData;
            }
            else {
                alert("Fichier JSON invalide. Le fichier doit contenir une propriété 'locations' (tableau) ou 'regions' (tableau), ou être un tableau direct de locations.");
                return;
            }

            // Séparer les lieux normaux des régions basé sur la structure des coordonnées
            const normalLocations = [];
            const regionLocations = [];

            locationsArray.forEach(item => {
                // Déterminer si c'est une région ou un lieu normal
                const isRegion = item.type === "region" ||
                                (item.coordinates && item.coordinates.points && Array.isArray(item.coordinates.points));

                if (isRegion) {
                    // Convertir la location-région vers le format région interne
                    const region = {
                        id: item.id,
                        name: item.name,
                        description: item.description || "",
                        imageUrl: item.imageUrl || "",
                        images: item.images || [], // Conserver les images pour les régions aussi
                        color: item.color,
                        known: item.known !== undefined ? item.known : true,
                        visited: item.visited !== undefined ? item.visited : false,
                        type: item.type || "region",
                        points: item.coordinates?.points || []
                    };

                    // Fonction pour extraire les rumeurs multiples
                    const extractRumeurs = (item) => {
                        const rumeurs = [];
                        // Parcourir toutes les propriétés pour trouver les rumeurs
                        for (const key in item) {
                            if (key.startsWith('Rumeur') && item[key] !== "A définir") { // Check for Rumeur, Rumeur1, Rumeur2 etc.
                                rumeurs.push(item[key]);
                            }
                        }
                        return rumeurs;
                    };

                    region.Rumeurs = extractRumeurs(item);
                    if (item.Tradition_Ancienne) region.Tradition_Ancienne = item.Tradition_Ancienne;

                    regionLocations.push(region);
                } else {
                    // C'est un lieu normal - s'assurer qu'il a la bonne structure de coordonnées
                    const location = {
                        ...item,
                        type: item.type || "custom"
                    };

                    // S'assurer que les coordonnées sont au bon format {x, y}
                    if (item.coordinates && typeof item.coordinates.x === 'number' && typeof item.coordinates.y === 'number') {
                        location.coordinates = {
                            x: item.coordinates.x,
                            y: item.coordinates.y
                        };
                    } else {
                        location.coordinates = { x: 0, y: 0 }; // Coordonnées par défaut si manquantes
                    }

                    // Fonction pour extraire les rumeurs multiples
                    const extractRumeurs = (item) => {
                        const rumeurs = [];
                        // Parcourir toutes les propriétés pour trouver les rumeurs
                        for (const key in item) {
                            if (key.startsWith('Rumeur') && item[key] !== "A définir") { // Check for Rumeur, Rumeur1, Rumeur2 etc.
                                rumeurs.push(item[key]);
                            }
                        }
                        return rumeurs;
                    };

                    location.Rumeurs = extractRumeurs(item);
                    if (item.Tradition_Ancienne) location.Tradition_Ancienne = item.Tradition_Ancienne;

                    normalLocations.push(location);
                }
            });

            // Compter les éléments à importer
            const locationCount = normalLocations.length;
            const regionCount = regionLocations.length;

            let message = `Le fichier contient ${locationsArray.length} éléments :\n`;
            if (locationCount > 0) message += `- ${locationCount} lieux\n`;
            if (regionCount > 0) message += `- ${regionCount} régions\n`;
            message += "\nVoulez-vous :\n- OK : Remplacer toutes les données existantes\n- Annuler : Fusionner avec les données existantes";

            const shouldReplace = confirm(message);

            let addedLocations = 0, updatedLocations = 0;
            let addedRegions = 0, updatedRegions = 0;

            // === TRAITEMENT DES LIEUX ===
            if (locationCount > 0) {
                if (shouldReplace) {
                    locationsData = { locations: normalLocations };
                    addedLocations = normalLocations.length;
                } else {
                    // Fusionner les lieux
                    normalLocations.forEach(importedLocation => {
                        const existingLocation = locationsData.locations.find(
                            loc => loc.name === importedLocation.name
                        );

                        if (existingLocation) {
                            Object.assign(existingLocation, importedLocation);
                            updatedLocations++;
                        } else {
                            // Générer un nouvel ID unique pour éviter les collisions
                            importedLocation.id = Date.now() + Math.floor(Math.random() * 1000);
                            // S'assurer que l'ID est vraiment unique
                            while (locationsData.locations.find(loc => loc.id === importedLocation.id)) {
                                importedLocation.id = Date.now() + Math.floor(Math.random() * 1000);
                            }
                            locationsData.locations.push(importedLocation);
                            addedLocations++;
                        }
                    });
                }
                renderLocations();
                saveLocationsToLocal();
            }

            // === TRAITEMENT DES RÉGIONS ===
            if (regionCount > 0) {
                if (shouldReplace) {
                    regionsData = { regions: regionLocations };
                    addedRegions = regionLocations.length;
                } else {
                    // Fusionner les régions
                    regionLocations.forEach(importedRegion => {
                        const existingRegion = regionsData.regions.find(
                            reg => reg.name === importedRegion.name
                        );

                        if (existingRegion) {
                            Object.assign(existingRegion, importedRegion);
                            updatedRegions++;
                        } else {
                            // Générer un nouvel ID unique pour éviter les collisions
                            importedRegion.id = Date.now() + Math.floor(Math.random() * 1000);
                            // S'assurer que l'ID est vraiment unique
                            while (regionsData.regions.find(reg => reg.id === importedRegion.id)) {
                                importedRegion.id = Date.now() + Math.floor(Math.random() * 1000);
                            }
                            regionsData.regions.push(importedRegion);
                            addedRegions++;
                        }
                    });
                }
                renderRegions();
                saveRegionsToLocal();
            }

            scheduleAutoSync();

            // Message de confirmation
            if (shouldReplace) {
                let confirmMessage = "Import réussi !\n";
                if (addedLocations > 0) confirmMessage += `- ${addedLocations} lieux importés\n`;
                if (addedRegions > 0) confirmMessage += `- ${addedRegions} régions importées\n`;
                alert(confirmMessage);
            } else {
                let confirmMessage = "Import terminé :\n";
                if (addedLocations > 0 || updatedLocations > 0) {
                    confirmMessage += `Lieux : ${addedLocations} ajoutés, ${updatedLocations} mis à jour\n`;
                }
                if (addedRegions > 0 || updatedRegions > 0) {
                    confirmMessage += `Régions : ${addedRegions} ajoutées, ${updatedRegions} mises à jour\n`;
                }
                alert(confirmMessage);
            }

            console.log(`✅ Import unifié terminé - ${addedLocations + addedRegions} éléments traités`);

        } catch (err) {
            alert("Erreur lors de la lecture du fichier JSON : " + err.message);
            console.error("Erreur d'import unifié:", err);
        }

        // Réinitialiser l'input file
        event.target.value = '';
    };

    reader.readAsText(file);
}

// Anciennes fonctions de compatibilité (gardées pour les anciens liens)
function importLocationsFromFile(event) {
    importUnifiedData(event); // Rediriger vers la fonction unifiée
}

function exportRegionsToFile() {
    exportUnifiedData(); // Rediriger vers la fonction unifiée
}

function importRegionsFromFile(event) {
    importUnifiedData(event); // Rediriger vers la fonction unifiée
}

function getCanvasCoordinates(event) { const rect = mapContainer.getBoundingClientRect(); const x = (event.clientX - rect.left) / scale; const y = (event.clientY - rect.top) / scale; return { x, y }; }
function updateDistanceDisplay() {
    const voyageBtn = document.getElementById('voyage-segments-btn');

    if (totalPathPixels === 0 || MAP_WIDTH === 0) {
        distanceContainer.classList.add('hidden');
        if (voyageBtn) voyageBtn.classList.add('hidden');
        return;
    }
    distanceContainer.classList.remove('hidden');
    if (voyageBtn) voyageBtn.classList.remove('hidden');

    const miles = totalPathPixels * (MAP_DISTANCE_MILES / MAP_WIDTH);
    const days = miles / 20;
    const roundedDays = Math.ceil(days * 2) / 2;
    distanceDisplay.innerHTML = `<strong>${Math.round(miles)}</strong> miles &nbsp;&nbsp;|&nbsp;&nbsp; <strong>${roundedDays.toFixed(1)}</strong> jours`;
    updateJourneyInfo();
}

function updateJourneyInfo() {
    updateDiscoveriesChronologically();
    displayJourneyInfo();
}

function updateDiscoveriesChronologically() {
    // Track region segments for duration calculation
    let regionSegments = new Map(); // region name -> {entryIndex, exitIndex}
    let currentRegions = new Set(); // regions currently being traversed

    // Track location proximity types
    let locationProximityTypes = new Map(); // location name -> 'traversed' or 'nearby'

    // Process each point in the journey path to maintain chronological order
    for (let i = 0; i < journeyPath.length; i++) {
        const currentPoint = journeyPath[i];

        // Check which regions this point is in
        let pointRegions = new Set();
        regionsData.regions.forEach(region => {
            if (region.points && region.points.length >= 3) {
                if (isPointInPolygon(currentPoint, region.points)) {
                    pointRegions.add(region.name);

                    if (!traversedRegions.has(region.name)) {
                        traversedRegions.add(region.name);
                        // Add to chronological discoveries if not already present
                        if (!journeyDiscoveries.some(d => d.name === region.name && d.type === 'region')) {
                            journeyDiscoveries.push({
                                name: region.name,
                                type: 'region',
                                discoveryIndex: i
                            });
                        }
                        // Mark entry point for this region
                        regionSegments.set(region.name, {entryIndex: i, exitIndex: i});
                    } else {
                        // Update exit point for this region
                        let segment = regionSegments.get(region.name);
                        if (segment) {
                            segment.exitIndex = i;
                        }
                    }
                }
            }
        });

        // Check for regions we're exiting
        currentRegions.forEach(regionName => {
            if (!pointRegions.has(regionName)) {
                // We've exited this region, finalize its segment
                let segment = regionSegments.get(regionName);
                if (segment) {
                    segment.exitIndex = i - 1; // Previous point was the last point in region
                }
            }
        });

        currentRegions = pointRegions;

        // Check locations at this point
        locationsData.locations.forEach(location => {
            if (!location.coordinates || typeof location.coordinates.x === 'undefined' || typeof location.coordinates.y === 'undefined') {
                return;
            }

            const distance = Math.sqrt(
                Math.pow(location.coordinates.x - currentPoint.x, 2) +
                Math.pow(location.coordinates.y - currentPoint.y, 2)
            );

            if (distance <= PROXIMITY_DISTANCE) {
                if (!nearbyLocations.has(location.name)) {
                    nearbyLocations.add(location.name);

                    // Determine proximity type based on distance
                    let proximityType = 'nearby'; // default for 11-50 pixels
                    if (distance <= 10) {
                        proximityType = 'traversed'; // 0-10 pixels
                    }

                    // If location already exists with 'nearby', upgrade to 'traversed' if applicable
                    const existingType = locationProximityTypes.get(location.name);
                    if (!existingType || (existingType === 'nearby' && proximityType === 'traversed')) {
                        locationProximityTypes.set(location.name, proximityType);
                    }

                    // Add to chronological discoveries if not already present
                    if (!journeyDiscoveries.some(d => d.name === location.name && d.type === 'location')) {
                        journeyDiscoveries.push({
                            name: location.name,
                            type: 'location',
                            discoveryIndex: i,
                            proximityType: locationProximityTypes.get(location.name)
                        });
                    } else {
                        // Update existing discovery with new proximity type if better
                        const existingDiscovery = journeyDiscoveries.find(d => d.name === location.name && d.type === 'location');
                        if (existingDiscovery) {
                            existingDiscovery.proximityType = locationProximityTypes.get(location.name);
                        }
                    }
                } else {
                    // Location already discovered, but check if we need to upgrade proximity type
                    let proximityType = 'nearby';
                    if (distance <= 10) {
                        proximityType = 'traversed';
                    }

                    const existingType = locationProximityTypes.get(location.name);
                    if (existingType === 'nearby' && proximityType === 'traversed') {
                        locationProximityTypes.set(location.name, proximityType);
                        // Update existing discovery
                        const existingDiscovery = journeyDiscoveries.find(d => d.name === location.name && d.type === 'location');
                        if (existingDiscovery) {
                            existingDiscovery.proximityType = proximityType;
                        }
                    }
                }
            }
        });
    }

    // Store region segments and location proximity types for duration calculation
    window.regionSegments = regionSegments;
    window.locationProximityTypes = locationProximityTypes;
}

function isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
            (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
            inside = !inside;
        }
    }
    return inside;
}

function calculatePathDistance(startIndex, endIndex) {
    if (startIndex >= endIndex || startIndex < 0 || endIndex >= journeyPath.length) {
        return 0;
    }

    let distance = 0;
    for (let i = startIndex; i < endIndex; i++) {
        const point1 = journeyPath[i];
        const point2 = journeyPath[i + 1];
        distance += Math.sqrt(
            Math.pow(point2.x - point1.x, 2) +
            Math.pow(point2.y - point1.y, 2)
        );
    }
    return distance;
}

function pixelsToMiles(pixels) {
    return pixels * (MAP_DISTANCE_MILES / MAP_WIDTH);
}

function milesToDays(miles) {
    const days = miles / 20; // 20 miles per day
    return Math.round(days * 2) / 2; // Round to nearest half day
}

function getDiscoveryTooltipContent(discoveryName, type) {
    let data;
    if (type === 'location') {
        data = locationsData.locations.find(loc => loc.name === discoveryName);
    } else if (type === 'region') {
        data = regionsData.regions.find(reg => reg.name === discoveryName);
    }

    if (!data) return '';

    let content = '';
    if (data.description) {
        content += `<div><strong>Description :</strong><br>${data.description}</div>`;
    }

    return content;
}

function displayJourneyInfo() {
    const traversedRegionsInfo = document.getElementById('traversed-regions-info');
    const traversedRegionsList = document.getElementById('traversed-regions-list');
    const nearbyLocationsInfo = document.getElementById('nearby-locations-info');
    const nearbyLocationsList = document.getElementById('nearby-locations-list');

    if (!traversedRegionsInfo || !nearbyLocationsInfo) return;

    // Calculer les durées de traversée des régions
    const regionTraversalInfo = calculateRegionTraversalDurations();

    // Séparer les découvertes par type
    const regions = [];
    const locations = [];

    journeyDiscoveries.forEach(discovery => {
        if (discovery.type === 'region') {
            const traversalData = regionTraversalInfo.get(discovery.name);
            if (traversalData) {
                regions.push({
                    name: discovery.name,
                    duration: traversalData.duration,
                    distance: traversalData.distance
                });
            }
        } else if (discovery.type === 'location') {
            locations.push(discovery);
        }
    });

    // Affichage des régions avec durées
    if (regions.length > 0) {
        traversedRegionsInfo.classList.remove('hidden');
        const regionsHtml = regions.map(region => {
            const durationText = region.duration >= 1 ? 
                `${region.duration.toFixed(1)} jour${region.duration > 1 ? 's' : ''}` : 
                `${Math.round(region.duration * 24)} heures`;
            const distanceText = `(${Math.round(region.distance)} miles)`;

            return `<div class="mb-1">
                <span class="font-medium">${region.name}</span>
                <span class="text-gray-400 text-xs ml-2">${durationText} ${distanceText}</span>
            </div>`;
        }).join('');
        traversedRegionsList.innerHTML = regionsHtml;
    } else {
        traversedRegionsInfo.classList.add('hidden');
    }

    // Affichage des lieux
    if (locations.length > 0) {
        nearbyLocationsInfo.classList.remove('hidden');
        const locationsHtml = locations.map(location => {
            const proximityText = location.proximityType === 'traversed' ? '(traversé)' : '(à proximité)';
            return `<div class="mb-1">
                <span class="font-medium">${location.name}</span>
                <span class="text-gray-400 text-xs ml-2">${proximityText}</span>
            </div>`;
        }).join('');
        nearbyLocationsList.innerHTML = locationsHtml;
    } else {
        nearbyLocationsInfo.classList.add('hidden');
    }
}

function calculateRegionTraversalDurations() {
    const regionTraversalInfo = new Map();

    if (!journeyPath || journeyPath.length < 2 || !regionsData || !regionsData.regions) {
        return regionTraversalInfo;
    }

    // Variables pour suivre l'état de traversée
    let currentRegionsActive = new Map(); // regionName -> {entryIndex, pixelDistance}
    let previousRegions = new Set();

    console.log("🔧 [REGION DURATION] Début du calcul séquentiel pour", journeyPath.length, "points");

    // Parcourir séquentiellement chaque point du tracé (logique étapes 1-5)
    for (let z = 0; z < journeyPath.length; z++) {
        const currentPoint = journeyPath[z];
        const currentRegions = new Set();

        // Étape 1 : Identifier dans quelles régions se trouve le point actuel
        regionsData.regions.forEach(region => {
            if (region.points && region.points.length >= 3) {
                if (isPointInPolygon(currentPoint, region.points)) {
                    currentRegions.add(region.name);
                }
            }
        });

        // Étape 2 : Détecter les changements de région (entrée/sortie)
        currentRegions.forEach(regionName => {
            if (!previousRegions.has(regionName)) {
                // Étape 2 : Entrée dans une nouvelle région A
                console.log(`🔧 [REGION DURATION] Point ${z}: Entrée dans région ${regionName}`);

                // Si un calcul d'une autre région était en cours, le finaliser
                currentRegionsActive.forEach((data, activeRegionName) => {
                    if (activeRegionName !== regionName) {
                        console.log(`🔧 [REGION DURATION] Finalisation région ${activeRegionName} (interrompue par ${regionName})`);
                        finalizeRegionDuration(activeRegionName, data, z - 1, regionTraversalInfo);
                    }
                });

                // Étape 3 : Mémoriser le point d'entrée (x,y,z)
                currentRegionsActive.set(regionName, {
                    entryIndex: z,
                    pixelDistance: 0
                });
            }
        });

        // Détecter les sorties de région
        previousRegions.forEach(regionName => {
            if (!currentRegions.has(regionName)) {
                // Sortie de région
                console.log(`🔧 [REGION DURATION] Point ${z}: Sortie de région ${regionName}`);

                if (currentRegionsActive.has(regionName)) {
                    const regionData = currentRegionsActive.get(regionName);
                    finalizeRegionDuration(regionName, regionData, z - 1, regionTraversalInfo);
                    currentRegionsActive.delete(regionName);
                }
            }
        });

        // Étape 4-5 : Pour chaque région active, calculer la distance du segment précédent
        if (z > 0) {
            const previousPoint = journeyPath[z - 1];

            currentRegionsActive.forEach((data, regionName) => {
                if (currentRegions.has(regionName)) {
                    // Étape 5a : La région continue, incrémenter la distance
                    const segmentDistance = Math.sqrt(
                        Math.pow(currentPoint.x - previousPoint.x, 2) + 
                        Math.pow(currentPoint.y - previousPoint.y, 2)
                    );

                    data.pixelDistance += segmentDistance;
                    console.log(`🔧 [REGION DURATION] Région ${regionName}: +${segmentDistance.toFixed(1)} pixels (total: ${data.pixelDistance.toFixed(1)})`);
                }
            });
        }

        // Mise à jour pour le prochain tour
        previousRegions = new Set(currentRegions);
    }

    // Finaliser toutes les régions encore actives à la fin du tracé
    currentRegionsActive.forEach((data, regionName) => {
        console.log(`🔧 [REGION DURATION] Finalisation région ${regionName} (fin de tracé)`);
        finalizeRegionDuration(regionName, data, journeyPath.length - 1, regionTraversalInfo);
    });

    console.log("🔧 [REGION DURATION] Résultats finaux:", regionTraversalInfo);
    return regionTraversalInfo;
}

function finalizeRegionDuration(regionName, regionData, exitIndex, regionTraversalInfo) {
    // Convertir les pixels en miles puis en jours
    const distanceInMiles = pixelsToMiles(regionData.pixelDistance);
    const durationInDays = milesToDays(distanceInMiles);

    // Arrondir au 0.5 jour le plus proche (minimum 0.5 jour)
    const roundedDuration = Math.max(0.5, Math.round(durationInDays * 2) / 2);

    console.log(`🔧 [REGION DURATION] Région ${regionName}: ${regionData.pixelDistance.toFixed(1)} pixels → ${distanceInMiles.toFixed(1)} miles → ${roundedDuration} jour(s)`);

    regionTraversalInfo.set(regionName, {
        distance: distanceInMiles,
        duration: roundedDuration,
        pixelDistance: regionData.pixelDistance,
        entryIndex: regionData.entryIndex,
        exitIndex: exitIndex
    });
}

function displayJourneyInfo() {
    const traversedRegionsInfo = document.getElementById('traversed-regions-info');
    const traversedRegionsList = document.getElementById('traversed-regions-list');
    const nearbyLocationsInfo = document.getElementById('nearby-locations-info');
    const nearbyLocationsList = document.getElementById('nearby-locations-list');

    if (!traversedRegionsInfo || !nearbyLocationsInfo) return;

    // Sort discoveries by discovery order, keeping them mixed
    const chronologicalDiscoveries = journeyDiscoveries.sort((a, b) => a.discoveryIndex - b.discoveryIndex);

    if (chronologicalDiscoveries.length > 0) {
        // Calculate travel times for each discovery
        const discoveryElements = chronologicalDiscoveries.map((discovery, index) => {
            const icon = discovery.type === 'region' ? '🗺️' : '📍';

            // Calculate reach time for this discovery
            let startIndex = 0;
            if (index > 0) {
                // Find the end point of the previous discovery
                const prevDiscovery = chronologicalDiscoveries[index - 1];
                if (prevDiscovery.type === 'region' && window.regionSegments) {
                    const segment = window.regionSegments.get(prevDiscovery.name);
                    startIndex = segment ? segment.exitIndex : prevDiscovery.discoveryIndex;
                } else {
                    startIndex = prevDiscovery.discoveryIndex;
                }
            }

            const reachDistance = calculatePathDistance(startIndex, discovery.discoveryIndex);
            const reachMiles = pixelsToMiles(reachDistance);
            const reachDays = milesToDays(reachMiles);

            // Check if this is a starting location (close to journey start)
            let travelInfo;
            if (discovery.type === 'location' && startPoint && discovery.discoveryIndex === 0) {
                // Find the actual location to check distance from start point
                const location = locationsData.locations.find(loc => loc.name === discovery.name);
                if (location && location.coordinates) {
                    const distanceFromStart = Math.sqrt(
                        Math.pow(location.coordinates.x - startPoint.x, 2) +
                        Math.pow(location.coordinates.y - startPoint.y, 2)
                    );
                    if (distanceFromStart <= 20) {
                        travelInfo = "(point de départ)";
                    } else {
                        // Add proximity information for locations
                        let proximityText = '';
                        if (discovery.proximityType === 'traversed') {
                            proximityText = ', traversé';
                        } else if (discovery.proximityType === 'nearby') {
                            proximityText = ', passage à proximité';
                        }
                        travelInfo = `(atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}${proximityText})`;
                    }
                } else {
                    // Add proximity information for locations
                    let proximityText = '';
                    if (discovery.proximityType === 'traversed') {
                        proximityText = ', traversé';
                    } else if (discovery.proximityType === 'nearby') {
                        proximityText = ', passage à proximité';
                    }
                    travelInfo = `(atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}${proximityText})`;
                }
            } else {
                // Add proximity information for locations
                let proximityText = '';
                if (discovery.type === 'location') {
                    if (discovery.proximityType === 'traversed') {
                        proximityText = ', traversé';
                    } else if (discovery.proximityType === 'nearby') {
                        proximityText = ', passage à proximité';
                    }
                }
                travelInfo = `(atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}${proximityText})`;
            }

            let displayText = `${icon} ${discovery.name} ${travelInfo}`;

            // For regions, also calculate duration inside the region
            if (discovery.type === 'region') {
                // Utiliser les durées calculées par calculateRegionTraversalDurations
                const regionTraversalInfo = calculateRegionTraversalDurations();
                const traversalData = regionTraversalInfo.get(discovery.name);

                if (traversalData) {
                    const regionDays = traversalData.duration;
                    const regionMiles = traversalData.distance;

                    // Replace travelInfo for regions to include duration
                    if (travelInfo === "(point de départ)") {
                        displayText = `${icon} ${discovery.name} (point de départ, durée ${regionDays.toFixed(1)} jour${regionDays > 1 ? 's' : ''})`;
                    } else {
                        displayText = `${icon} ${discovery.name} (atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}, durée ${regionDays.toFixed(1)} jour${regionDays > 1 ? 's' : ''})`;
                    }
                }
            }

            // Get tooltip content
            const tooltipContent = getDiscoveryTooltipContent(discovery.name, discovery.type);

            // Create span sans tooltip par défaut
            return `<span class="discovery-item clickable-discovery" data-discovery-name="${discovery.name}" data-discovery-type="region">${displayText}</span>`;
        });

        // Join with line breaks instead of commas
        const discoveryListHTML = discoveryElements.join('<br>');

        // Show only one section with all discoveries
        traversedRegionsInfo.classList.remove('hidden');
        traversedRegionsList.innerHTML = discoveryListHTML;
        nearbyLocationsInfo.classList.add('hidden');

        // Update the title to reflect mixed content
        const regionsTitle = traversedRegionsInfo.querySelector('.font-semibold');
        if (regionsTitle) {
            regionsTitle.textContent = 'Découvertes du voyage :';
            regionsTitle.className = 'font-semibold text-blue-400 mb-1';
        }

        // Setup enhanced tooltips
        setupDiscoveryTooltips();

        console.log("🌟 Journey discoveries (chronological):", chronologicalDiscoveries.map(d => `${d.type}: ${d.name}`));
    } else {
        traversedRegionsInfo.classList.add('hidden');
        nearbyLocationsInfo.classList.add('hidden');
        console.log("🌟 No discoveries made");
    }
}

function setupDiscoveryTooltips() {
    // Remove existing tooltips
    const existingTooltips = document.querySelectorAll('.discovery-tooltip');
    existingTooltips.forEach(tooltip => tooltip.remove());

    const discoveryItems = document.querySelectorAll('.discovery-item');

    discoveryItems.forEach(item => {
        const discoveryName = item.dataset.discoveryName;
        const discoveryType = item.dataset.discoveryType;

        item.addEventListener('mouseenter', (e) => {
            // Highlight the corresponding location or region on the map
            highlightDiscoveryOnMap(discoveryName, discoveryType, true);

            const tooltipContent = getDiscoveryTooltipContent(discoveryName, discoveryType);

            if (tooltipContent) {
                const tooltip = document.createElement('div');
                tooltip.className = 'discovery-tooltip';
                tooltip.innerHTML = tooltipContent;
                tooltip.style.cssText = `
                    position: absolute;
                    background: rgba(17, 24, 39, 0.95);
                    color: white;
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid #4b5563;
                    font-size: 14px;
                    max-width: 320px;
                    z-index: 1000;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    line-height: 1.4;
                `;

                document.body.appendChild(tooltip);

                // Position tooltip à gauche de l'élément
                const rect = item.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();

                let left = rect.left + window.scrollX - tooltipRect.width - 10;
                let top = rect.top + window.scrollY;

                // Si le tooltip déborde à gauche, le placer à droite
                if (left < 10) {
                    left = rect.right + window.scrollX + 10;
                }

                // Ajuster si le tooltip déborde en haut
                if (top < window.scrollY + 10) {
                    top = window.scrollY + 10;
                }

                // Ajuster si le tooltip déborde en bas
                if (top + tooltipRect.height > window.innerHeight + window.scrollY - 10) {
                    top = window.innerHeight + window.scrollY - tooltipRect.height - 10;
                }

                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            }
        });

        item.addEventListener('mouseleave', () => {
            // Remove highlight from the map
            highlightDiscoveryOnMap(discoveryName, discoveryType, false);

            const tooltips = document.querySelectorAll('.discovery-tooltip');
            tooltips.forEach(tooltip => tooltip.remove());
        });

        // Add click event listener to open modal
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (discoveryType === 'location') {
                const location = locationsData.locations.find(loc => loc.name === discoveryName);
                if (location) {
                    // Simulate a click event on the location marker to open its info box
                    const fakeEvent = {
                        currentTarget: { dataset: { id: location.id.toString() } },
                        stopPropagation: () => {},
                        preventDefault: () => {}
                    };

                    showInfoBox(fakeEvent);

                    // Force expand the info box
                    if (!infoBox.classList.contains('expanded')) {
                        toggleInfoBoxExpand();
                    }
                }
            } else if (discoveryType === 'region') {
                const region = regionsData.regions.find(reg => reg.name === discoveryName);
                if (region) {
                    // Simulate a click event on the region to open its info box
                    const fakeEvent = {
                        stopPropagation: () => {},
                        preventDefault: () => {}
                    };

                    showRegionInfo(fakeEvent, region);

                    // Force expand the info box
                    if (!infoBox.classList.contains('expanded')) {
                        toggleInfoBoxExpand();
                    }
                }
            }
        });
    });
}

function highlightDiscoveryOnMap(discoveryName, discoveryType, highlight) {
    if (discoveryType === 'location') {
        // Find and highlight location marker
        const locationMarkers = document.querySelectorAll('.location-marker');
        locationMarkers.forEach(marker => {
            const locationId = parseInt(marker.dataset.id, 10);
            const location = locationsData.locations.find(loc => loc.id === locationId);

            if (location && location.name === discoveryName) {
                if (highlight) {
                    marker.style.borderColor = '#60a5fa'; // Light blue
                    marker.style.borderWidth = '6px';
                    marker.style.zIndex = '1000';
                } else {
                    // Restore original border
                    marker.style.borderColor = location.visited ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                    marker.style.borderWidth = '4px';
                    marker.style.zIndex = '';
                }
            }
        });
    } else if (discoveryType === 'region') {
        // Find and highlight region path
        const regionPaths = regionsLayer.querySelectorAll('.region');
        regionPaths.forEach(path => {
            const regionId = parseInt(path.dataset.regionId, 10);
            const region = regionsData.regions.find(reg => reg.id === regionId);

            if (region && region.name === discoveryName) {
                if (highlight) {
                    path.style.stroke = '#1e40af'; // Dark blue
                    path.style.strokeWidth = '6'; // Thicker border
                    path.style.zIndex = '1000';
                } else {
                    // Restore original stroke
                    path.style.stroke = colorMap[region.color] || colorMap.green;
                    path.style.strokeWidth = '2';
                    path.style.zIndex = '';
                }
            }
        });
    }
}
// Le bouton generate-journey-log a été supprimé - la fonctionnalité est maintenant intégrée dans voyage-manager.js
// document.getElementById('generate-journey-log').addEventListener('click', handleGenerateJourneyLog);
document.getElementById('close-journey-log').addEventListener('click', () => journeyLogModal.classList.add('hidden'));