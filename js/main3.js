
        // --- Gemini API Functions ---
        async function callGemini(prompt, button) {
            const buttonIcon = button.querySelector('.gemini-icon') || button;
            const originalContent = buttonIcon.innerHTML;
            buttonIcon.innerHTML = `<i class="fas fa-spinner gemini-btn-spinner"></i>`;
            button.disabled = true;

            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };

            try {
                // Récupérer la clé API depuis le serveur
                const configResponse = await fetch('/api/gemini/config');
                const config = await configResponse.json();

                if (!config.api_key_configured || !config.api_key) {
                    console.error("Gemini API key not configured on server.");
                    buttonIcon.innerHTML = originalContent;
                    button.disabled = false;
                    return "Erreur: Clé API Gemini non configurée sur le serveur.";
                }

                const apiModel = 'gemini-2.0-flash-exp';
                const apiVersion = 'v1beta';
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${config.api_key}`;

                // Logs pour debug
                console.log("🤖 [GEMINI API] Version:", apiVersion);
                console.log("🤖 [GEMINI API] Modèle:", apiModel);
                console.log("🤖 [GEMINI API] Prompt envoyé:");
                console.log("📝", prompt);
                console.log("🤖 [GEMINI API] URL complète:", apiUrl.replace(config.api_key, '[API_KEY_HIDDEN]'));

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                console.log("🤖 [GEMINI API] Statut de réponse:", response.status);

                if (!response.ok) {
                    // Try to get more details from the response body if available
                    let errorMsg = `API request failed with status ${response.status}`;
                    try {
                        const errorData = await response.json();
                        console.error("🤖 [GEMINI API] Erreur détaillée:", errorData);
                        errorMsg += `: ${errorData.error?.message || JSON.stringify(errorData)}`;
                    } catch (jsonError) {
                        // Ignore JSON parsing errors
                    }
                    throw new Error(errorMsg);
                }

                const result = await response.json();
                console.log("🤖 [GEMINI API] Réponse reçue:", result);

                if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                    const responseText = result.candidates[0].content.parts[0].text;
                    console.log("✅ [GEMINI API] Texte généré (longueur: " + responseText.length + " caractères)");
                    return responseText;
                } else {
                    // Handle cases where the response might be empty or malformed
                    console.warn("🤖 [GEMINI API] Réponse vide ou malformée:", result);
                    throw new Error("Invalid response structure from API");
                }
            } catch (error) {
                console.error("❌ [GEMINI API] Échec de l'appel:", error);
                return `Désolé, une erreur est survenue lors de la génération du texte: ${error.message}`;
            } finally {
                buttonIcon.innerHTML = originalContent;
                button.disabled = false;
            }
        }

        function findNearestLocation(point) {
            if (!point) return { name: 'un lieu sauvage' };
            let nearest = null;
            let minDistance = Infinity;
            locationsData.locations.forEach(loc => {
                // Ensure location has valid coordinates before calculating distance
                if (loc.coordinates && typeof loc.coordinates.x !== 'undefined' && typeof loc.coordinates.y !== 'undefined') {
                    const distance = Math.sqrt(Math.pow(loc.coordinates.x - point.x, 2) + Math.pow(loc.coordinates.y - point.y, 2));
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearest = loc;
                    }
                }
            });
            return nearest || { name: 'un lieu inconnu' };
        }

        async function handleGenerateJourneyLog(event) {
            const button = event.currentTarget;
            if (!startPoint || !lastPoint) {
                alert("Vous devez commencer un tracé sur la carte pour générer une chronique de voyage.");
                return;
            }

            const startLocation = findNearestLocation(startPoint);
            const endLocation = findNearestLocation(lastPoint);
            const miles = Math.round(totalPathPixels * (MAP_DISTANCE_MILES / MAP_WIDTH));
            const days = (Math.ceil((miles / 20) * 2) / 2).toFixed(1);

            // Générer la liste des découvertes chronologiques pour le prompt
            let journeyDetails = '';
            if (journeyDiscoveries && journeyDiscoveries.length > 0) {
                // Trier par ordre de découverte
                const chronologicalDiscoveries = journeyDiscoveries.sort((a, b) => a.discoveryIndex - b.discoveryIndex);

                const discoveryList = chronologicalDiscoveries.map((discovery, index) => {
                    const icon = discovery.type === 'region' ? '🗺️' : '📍';

                    // Calculate reach time for this discovery
                    let startIndex = 0;
                    if (index > 0) {
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

                    // Pour les régions, ajouter la durée de traversée
                    if (discovery.type === 'region' && window.regionSegments) {
                        const segment = window.regionSegments.get(discovery.name);
                        if (segment) {
                            const regionDistance = calculatePathDistance(segment.entryIndex, segment.exitIndex);
                            const regionMiles = pixelsToMiles(regionDistance);
                            const regionDays = milesToDays(regionMiles);

                            // Replace travelInfo for regions to include duration
                            if (travelInfo === "(point de départ)") {
                                displayText = `${icon} ${discovery.name} (point de départ, durée ${regionDays} jour${regionDays !== 1 ? 's' : ''})`;
                            } else {
                                displayText = `${icon} ${discovery.name} (atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}, durée ${regionDays} jour${regionDays !== 1 ? 's' : ''})`;
                            }
                        }
                    }

                    return displayText;
                }).join(', ');

                journeyDetails = `\n\nVoici les étapes de ce voyage :\n${discoveryList}`;
            }

            const narrationAddition = getNarrationPromptAddition();
            const prompt = `Rédige une courte chronique de voyage, dans le style de J.R.R. Tolkien, pour un périple en Terre du Milieu. Le voyage a débuté à ${startLocation.name} et s'est terminé près de ${endLocation.name}, couvrant une distance d'environ ${miles} miles, soit environ ${days} jours de marche. ${journeyDetails}.${narrationAddition}`;


            const journeyLogContent = document.getElementById('journey-log-content');
            journeyLogContent.innerHTML = '<p>Génération de la chronique en cours...</p>';
            journeyLogModal.classList.remove('hidden');

            const result = await callGemini(prompt, button);
            journeyLogContent.innerHTML = result.replace(/\n/g, '<br>');
        }

        async function handleGenerateDescription(event) {
            const button = event.currentTarget;
            const modal = button.closest('.bg-gray-900');
            const nameInput = modal.querySelector('input[type="text"]');
            const descTextarea = modal.querySelector('textarea');
            const locationName = nameInput.value;

            if (!locationName) {
                alert("Veuillez d'abord entrer un nom pour le lieu.");
                return;
            }

            const prompt = `Rédige une courte description évocatrice pour un lieu de la Terre du Milieu nommé '${locationName}'. Décris son apparence, son atmosphère et son histoire possible, dans le style de J.R.R. Tolkien. Sois concis.`;

            const result = await callGemini(prompt, button);
            descTextarea.value = result;
        }

        // --- Google Authentication Functions ---
        async function checkAuthStatus() {
            logAuth("🔐 [AUTH] Vérification du statut d'authentification...", "");
            try {
                const response = await fetch('/api/auth/user');
                logAuth("🔐 [AUTH] Réponse reçue:", response.status);

                if (response.ok) {
                    const data = await response.json();
                    logAuth("🔐 [AUTH] Données d'authentification reçues:", data);

                    if (data.authenticated && data.user) {
                        currentUser = data.user;
                        logAuth("🔐 [AUTH] Utilisateur authentifié:", currentUser.name);
                        updateAuthUI(true);
                        await loadSavedContexts();
                        enableAutoSync();
                    } else {
                        currentUser = null;
                        logAuth("🔐 [AUTH] Utilisateur non authentifié", "");
                        updateAuthUI(false);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                logAuth("🔐 [AUTH] Erreur lors de la vérification d'authentification:", error.message || error);
                currentUser = null;
                updateAuthUI(false);
            }
        }

        function handleGoogleSignIn() {
            logAuth("Redirection vers Google OAuth...");
            // Redirect to Google OAuth flow on the server
            window.location.href = '/auth/google';
        }

        function updateAuthUI(isAuthenticated) {
            logAuth("Mise à jour de l'interface utilisateur d'authentification");
            authStatusPanel.classList.add('hidden');
            authContentPanel.classList.remove('hidden');

            const authIcon = document.getElementById('auth-icon');
            const userProfilePic = document.getElementById('user-profile-pic');
            const authBtn = document.getElementById('auth-btn');

            if (isAuthenticated) {
                logAuth("Affichage du panneau utilisateur connecté");
                loggedInPanel.classList.remove('hidden');
                loggedOutPanel.classList.add('hidden');
                authUserName.textContent = currentUser.name || currentUser.email || 'Utilisateur';

                // Afficher la photo de profil si disponible
                if (currentUser.picture) {
                    userProfilePic.src = currentUser.picture;
                    userProfilePic.classList.remove('hidden');
                    authIcon.classList.add('hidden');
                    authBtn.title = `Connecté en tant que ${currentUser.name || currentUser.email}`;
                } else {
                    // Pas de photo, garder l'icône mais changer le style
                    userProfilePic.classList.add('hidden');
                    authIcon.classList.remove('hidden');
                    authIcon.className = 'fas fa-user-check text-green-400';
                    authBtn.title = `Connecté en tant que ${currentUser.name || currentUser.email}`;
                }

                // loadSavedContexts() est appelé dans checkAuthStatus après la confirmation de connexion
                // enableAutoSync() est appelé dans checkAuthStatus après la confirmation de connexion
            } else {
                logAuth("Affichage du panneau utilisateur non connecté");
                loggedInPanel.classList.add('hidden');
                loggedOutPanel.classList.remove('hidden');

                // Remettre l'icône par défaut
                userProfilePic.classList.add('hidden');
                authIcon.classList.remove('hidden');
                authIcon.className = 'fas fa-user';
                authBtn.title = 'Authentification et sauvegarde';

                disableAutoSync(); // Désactiver la synchronisation
            }
        }

        async function saveCurrentContext() {
            const contextName = contextNameInput.value.trim();
            if (!contextName) {
                alert("Veuillez entrer un nom pour le contexte.");
                return;
            }
            if (!currentUser) {
                alert("Vous devez être connecté pour sauvegarder des contextes.");
                return;
            }

            const currentData = {
                locations: locationsData,
                regions: regionsData,
                scale: scale,
                panX: panX,
                panY: panY,
                activeFilters: activeFilters,
                filters: activeFilters, // Ajout explicite des filtres pour compatibilité
                journeyPath: journeyPath,
                totalPathPixels: totalPathPixels,
                startPoint: startPoint,
                lastPoint: lastPoint,
                journeyDiscoveries: journeyDiscoveries, // Included journey discoveries
                currentSeason: currentSeason // Included season data
            };

            try {
                const response = await fetch('/api/contexts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: contextName, data: currentData })
                });

                if (response.ok) {
                    alert(`Contexte "${contextName}" sauvegardé avec succès !`);
                    contextNameInput.value = ''; // Clear input
                    loadSavedContexts(); // Refresh list
                } else {
                    const errorData = await response.json();
                    alert(`Erreur lors de la sauvegarde du contexte: ${errorData.error}`);
                }
            } catch (error) {
                console.error("Error saving context:", error);
                alert("Erreur réseau lors de la sauvegarde du contexte.");
            }
        }

        async function loadSavedContexts() {
            if (!currentUser) return;

            savedContextsDiv.innerHTML = '<p class="text-gray-500 italic">Chargement des contextes...</p>';
            if (!currentUser) {
                savedContextsDiv.innerHTML = '<p class="text-gray-500 italic">Connectez-vous pour voir vos contextes.</p>';
                return;
            }

            try {
                const response = await fetch('/api/contexts');
                if (response.ok) {
                    const contexts = await response.json();
                    savedContexts = contexts; // Store fetched contexts
                    displaySavedContexts(contexts);
                } else {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des contextes:', error.message || error);
                savedContextsDiv.innerHTML = '<p class="text-red-500">Impossible de charger les contextes.</p>';
            }
        }

        function setupSettingsEventListeners() {
            // Settings modal event listeners
            const settingsBtn = document.getElementById('settings-btn');
            const settingsModal = document.getElementById('settings-modal');
            const closeSettingsBtn = document.getElementById('close-settings-modal');

            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    settingsModal.classList.remove('hidden');
                });
                console.log("🔐 [AUTH] Bouton paramètres trouvé et configuré");
            }

            if (closeSettingsBtn) {
                closeSettingsBtn.addEventListener('click', () => {
                    settingsModal.classList.add('hidden');
                });
            }

            // Settings tabs
            const settingsTabs = document.querySelectorAll('.settings-tab-button');
            const settingsTabContents = document.querySelectorAll('.settings-tab-content');

            settingsTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetTab = tab.dataset.tab;
                    
                    // Update active tab
                    settingsTabs.forEach(t => t.classList.remove('active', 'text-white', 'border-blue-500'));
                    settingsTabs.forEach(t => t.classList.add('text-gray-400', 'border-transparent'));
                    tab.classList.remove('text-gray-400', 'border-transparent');
                    tab.classList.add('active', 'text-white', 'border-blue-500');
                    
                    // Update active content
                    settingsTabContents.forEach(content => {
                        content.classList.remove('active');
                        content.style.display = 'none';
                    });
                    
                    const targetContent = document.getElementById(`${targetTab}-tab`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                        targetContent.style.display = 'flex';
                    }
                });
            });

            // Maps management listeners
            setupMapsEventListeners();
            
            // Season indicator click
            const seasonIndicator = document.getElementById('season-indicator');
            const calendarDateIndicator = document.getElementById('calendar-date-indicator');
            
            if (seasonIndicator) {
                seasonIndicator.addEventListener('click', () => {
                    settingsModal.classList.remove('hidden');
                    // Switch to season tab
                    const seasonTab = document.querySelector('[data-tab="season"]');
                    if (seasonTab) {
                        seasonTab.click();
                    }
                });
            }
            
            if (calendarDateIndicator) {
                calendarDateIndicator.addEventListener('click', () => {
                    settingsModal.classList.remove('hidden');
                    // Switch to season tab
                    const seasonTab = document.querySelector('[data-tab="season"]');
                    if (seasonTab) {
                        seasonTab.click();
                    }
                });
            }

            // Adventurers tab functionality
            setupAdventurersTab();
            
            // Quest tab functionality
            setupQuestTab();
        }

        function setupAdventurersTab() {
            const editBtn = document.getElementById('edit-adventurers-btn');
            const readMode = document.getElementById('adventurers-read-mode');
            const editMode = document.getElementById('adventurers-edit-mode');
            const textarea = document.getElementById('adventurers-group');
            const content = document.getElementById('adventurers-content');
            const saveBtn = document.getElementById('save-adventurers-edit');
            const cancelBtn = document.getElementById('cancel-adventurers-edit');

            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    readMode.classList.add('hidden');
                    editMode.classList.remove('hidden');
                    textarea.focus();
                });
            }

            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    const adventurersData = textarea.value;
                    localStorage.setItem('adventurersGroup', adventurersData);
                    content.innerHTML = adventurersData ? marked(adventurersData) : '<p class="text-gray-400 italic">Aucune description d\'aventuriers définie.</p>';
                    editMode.classList.add('hidden');
                    readMode.classList.remove('hidden');
                    scheduleAutoSync();
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    editMode.classList.add('hidden');
                    readMode.classList.remove('hidden');
                });
            }

            // Load saved data
            const savedAdventurers = localStorage.getItem('adventurersGroup');
            if (savedAdventurers && textarea) {
                textarea.value = savedAdventurers;
                content.innerHTML = marked(savedAdventurers);
            }
        }

        function setupQuestTab() {
            const editBtn = document.getElementById('edit-quest-btn');
            const readMode = document.getElementById('quest-read-mode');
            const editMode = document.getElementById('quest-edit-mode');
            const textarea = document.getElementById('adventurers-quest');
            const content = document.getElementById('quest-content');
            const saveBtn = document.getElementById('save-quest-edit');
            const cancelBtn = document.getElementById('cancel-quest-edit');

            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    readMode.classList.add('hidden');
                    editMode.classList.remove('hidden');
                    textarea.focus();
                });
            }

            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    const questData = textarea.value;
                    localStorage.setItem('adventurersQuest', questData);
                    content.innerHTML = questData ? marked(questData) : '<p class="text-gray-400 italic">Aucune description de quête définie.</p>';
                    editMode.classList.add('hidden');
                    readMode.classList.remove('hidden');
                    scheduleAutoSync();
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    editMode.classList.add('hidden');
                    readMode.classList.remove('hidden');
                });
            }

            // Load saved data
            const savedQuest = localStorage.getItem('adventurersQuest');
            if (savedQuest && textarea) {
                textarea.value = savedQuest;
                content.innerHTML = marked(savedQuest);
            }
        }

        // Simple markdown parser for basic formatting
        function marked(text) {
            return text
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*)\*/g, '<em>$1</em>')
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                .replace(/\n/g, '<br>');
        }

        function displaySavedContexts(contexts) {
            savedContextsDiv.innerHTML = ''; // Clear previous content
            if (!contexts || contexts.length === 0) {
                savedContextsDiv.innerHTML = '<p class="text-gray-500 italic">Aucun contexte sauvegardé.</p>';
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
                savedContextsDiv.appendChild(contextEl);
            });

            // Add event listeners for load and delete buttons
            savedContextsDiv.querySelectorAll('.load-context-btn').forEach(btn => {
                btn.addEventListener('click', (e) => loadContext(e.target.dataset.contextId));
            });
            savedContextsDiv.querySelectorAll('.delete-context-btn').forEach(btn => {
                btn.addEventListener('click', (e) => deleteContext(e.target.dataset.contextId));
            });
        }

        async function loadContext(contextId) {
            try {
                const response = await fetch(`/api/contexts/${contextId}`);
                if (!response.ok) {
                    throw new Error(`Failed to load context: ${response.status}`);
                }

                const context = await response.json();

                // Load data
                locationsData = context.data.locations || { locations: [] };
                regionsData = context.data.regions || { regions: [] };
                scale = context.data.scale || 1;
                panX = context.data.panX || 0;
                panY = context.data.panY || 0;
                activeFilters = context.data.activeFilters || context.data.filters || { known: false, visited: false, colors: [] };

                // Load journey data
                journeyPath = context.data.journeyPath || [];
                totalPathPixels = context.data.totalPathPixels || 0;
                startPoint = context.data.startPoint || null;
                lastPoint = context.data.lastPoint || null;
                journeyDiscoveries = context.data.journeyDiscoveries || []; // Load journey discoveries

                // Load season data
                if (context.data.currentSeason && seasonNames[context.data.currentSeason]) {
                    currentSeason = context.data.currentSeason;
                    localStorage.setItem('currentSeason', currentSeason);
                }

                // Load calendar data
                if (context.data.calendarData) {
                    calendarData = context.data.calendarData;
                }
                if (context.data.currentCalendarDate) {
                    currentCalendarDate = context.data.currentCalendarDate;
                }
                if (context.data.isCalendarMode !== undefined) {
                    isCalendarMode = context.data.isCalendarMode;
                }

                // Save calendar data locally
                saveCalendarToLocal();

                // Redraw journey path if it exists
                if (journeyPath.length > 0) {
                    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                    ctx.beginPath();
                    ctx.moveTo(journeyPath[0].x, journeyPath[0].y);

                    for (let i = 1; i < journeyPath.length; i++) {
                        ctx.lineTo(journeyPath[i].x, journeyPath[i].y);
                    }
                    ctx.stroke();

                    // Update distance display
                    updateDistanceDisplay();
                    updateJourneyInfo();
                } else {
                    // Clear canvas if no journey path
                    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                    distanceContainer.classList.add('hidden');
                }

                // Re-render everything
                renderLocations();
                renderRegions();
                applyTransform();
                updateFilters(); // Apply loaded filters

                // Update UI elements
                document.getElementById('filter-known').checked = activeFilters.known;
                document.getElementById('filter-visited').checked = activeFilters.visited;
                document.getElementById('filter-show-regions').checked = true;
                document.querySelectorAll('.filter-color-checkbox').forEach(cb => {
                    cb.checked = activeFilters.colors.includes(cb.dataset.color);
                });

                // Update season UI
                const seasonRadio = document.querySelector(`input[name="season"][value="${currentSeason}"]`);
                if (seasonRadio) {
                    seasonRadio.checked = true;
                }
                updateSeasonDisplay();

                alert(`Contexte "${context.name}" chargé.`);
                authModal.classList.add('hidden'); // Close modal after loading
            } catch (error) {
                console.error("Error loading context:", error);
                alert("Error loading context.");
            }
        }

        async function deleteContext(contextId) {
            if (!confirm("Êtes-vous sûr de vouloir supprimer ce contexte ?")) return;

            try {
                const response = await fetch(`/api/contexts/${contextId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    savedContexts = savedContexts.filter(c => c.id !== contextId);
                    displaySavedContexts(savedContexts);
                    alert("Contexte supprimé.");
                } else {
                    throw new Error(`Failed to delete context: ${response.status}`);
                }
            } catch (error) {
                console.error("Error deleting context:", error);
                alert("Erreur lors de la suppression du contexte.");
            }
        }

        // Setup authentication event listeners
        function setupAuthEventListeners() {
            logAuth("Configuration des event listeners d'authentification...");

            waitForElement('#auth-btn', (authBtn) => {
                logAuth("Bouton d'authentification trouvé et configuré");
                authBtn.addEventListener('click', (event) => {
                    logAuth("Clic sur le bouton d'authentification détecté!");
                    event.preventDefault();
                    event.stopPropagation();
                    toggleAuthModal();
                });
            });

            waitForElement('#close-auth-modal', (closeAuthModalBtn) => {
                logAuth("Bouton de fermeture modal trouvé et configuré");
                closeAuthModalBtn.addEventListener('click', (event) => {
                    logAuth("Clic sur le bouton de fermeture modal détecté!");
                    event.preventDefault();
                    event.stopPropagation();
                    const authModal = document.getElementById('auth-modal');
                    if (authModal) {
                        authModal.classList.add('hidden');
                    }
                });
            });

            waitForElement('#save-context-btn', (saveContextBtn) => {
                logAuth("Bouton de sauvegarde contexte trouvé et configuré");
                saveContextBtn.addEventListener('click', saveCurrentContext);
            });

            waitForElement('#google-signin-btn', (googleSigninBtn) => {
                logAuth("Bouton Google Sign-In trouvé et configuré");
                googleSigninBtn.addEventListener('click', handleGoogleSignIn);
            });
        }

        // Helper function to wait for an element and then execute a callback
        function waitForElement(selector, callback, maxWait = 5000) {
            const startTime = Date.now();

            function check() {
                const element = document.querySelector(selector);
                if (element) {
                    callback(element);
                } else if (Date.now() - startTime < maxWait) {
                    setTimeout(check, 100);
                } else {
                    logAuth("TIMEOUT: Élément non trouvé:", selector);
                }
            }

            check();
        }

        // --- Voyage Segments Functions ---
        function resetVoyageSegments() {
            currentVoyage = null;
            voyageSegments = [];
            isVoyageActive = false;
            currentSegmentIndex = 0;
            activatedSegments.clear();
            console.log("🧹 Segments de voyage réinitialisés");
        }

        function handleStartVoyage() {
            if (journeyPath.length === 0 || journeyDiscoveries.length === 0) {
                alert("Vous devez d'abord tracer un chemin sur la carte pour démarrer un voyage.");
                return;
            }

            // Initialize voyage
            currentVoyage = {
                startPoint: startPoint,
                journeyPath: [...journeyPath],
                journeyDiscoveries: [...journeyDiscoveries],
                totalDistance: totalPathPixels,
                createdAt: new Date().toISOString()
            };

            // Générer automatiquement tous les segments basés sur les régions traversées
            voyageSegments = generateVoyageSegments();

            // Réinitialiser l'état d'activation
            activatedSegments.clear();

            isVoyageActive = true;
            currentSegmentIndex = 0;

            console.log("🚢 Voyage démarré:", currentVoyage);
            console.log("🗺️ Segments générés:", voyageSegments);
            console.log("🎯 Index initial:", currentSegmentIndex);
            console.log("📊 État voyage:", {
                isVoyageActive: isVoyageActive,
                totalSegments: voyageSegments.length,
                currentIndex: currentSegmentIndex,
                activatedSegments: Array.from(activatedSegments)
            });
            updateVoyageSegmentsDisplay();
            scheduleAutoSync();
        }

        function generateVoyageSegments() {
            const segments = [];

            // Extraire les régions dans l'ordre chronologique
            const regionDiscoveries = journeyDiscoveries
                .filter(d => d.type === 'region')
                .sort((a, b) => a.discoveryIndex - b.discoveryIndex);

            if (regionDiscoveries.length === 0) {
                // Pas de régions, créer un segment simple
                return [{
                    id: 1,
                    duration: 1, // Par défaut 1 jour
                    startLocation: 'Point de départ',
                    endLocation: 'Point d\'arrivée',
                    status: 'active',
                    createdAt: new Date().toISOString()
                }];
            }

            // Créer des segments basés sur les transitions entre régions
            for (let i = 0; i < regionDiscoveries.length; i++) {
                const currentRegion = regionDiscoveries[i];
                const nextRegion = regionDiscoveries[i + 1];

                segments.push({
                    id: i + 1,
                    duration: 1, // Par défaut 1 jour
                    startLocation: currentRegion.name,
                    endLocation: nextRegion ? nextRegion.name : findEndLocation(),
                    status: 'active',
                    createdAt: new Date().toISOString()
                });
            }

            return segments;
        }

        function findEndLocation() {
            // Trouver le dernier lieu ou région significatif
            const lastDiscoveries = journeyDiscoveries
                .sort((a, b) => b.discoveryIndex - a.discoveryIndex)
                .slice(0, 3);

            for (const discovery of lastDiscoveries) {
                if (discovery.type === 'region') {
                    return discovery.name;
                }
            }

            for (const discovery of lastDiscoveries) {
                if (discovery.type === 'location') {
                    return discovery.name;
                }
            }

            return 'Point d\'arrivée';
        }

        function generateSegmentName(segmentIndex) {
            console.log("🏷️ Génération nom segment:", {
                segmentIndex: segmentIndex,
                hasVoyage: !!currentVoyage,
                segmentsLength: voyageSegments.length,
                segmentExists: !!voyageSegments[segmentIndex]
            });

            if (!currentVoyage || voyageSegments.length === 0 || !voyageSegments[segmentIndex]) {
                console.log("⚠️ Segment par défaut utilisé");
                return "Segment de voyage";
            }

            const segment = voyageSegments[segmentIndex];
            const name = segment.startLocation;
            console.log("✅ Nom généré:", name);
            return name;
        }

        function findLocationAtDay(dayTarget) {
            if (!currentVoyage || !journeyPath.length) return "lieu inconnu";

            const totalDays = getTotalJourneyDays();
            const targetRatio = Math.min(dayTarget / totalDays, 1);
            const targetPathIndex = Math.floor(targetRatio * (journeyPath.length - 1));
            const targetPoint = journeyPath[targetPathIndex];

            // Chercher le lieu le plus proche
            let nearestLocation = null;
            let minDistance = Infinity;

            locationsData.locations.forEach(location => {
                if (!location.coordinates) return;

                const distance = Math.sqrt(Math.pow(location.coordinates.x - targetPoint.x, 2) + Math.pow(location.coordinates.y - targetPoint.y, 2));

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestLocation = location;
                }
            });

            return nearestLocation ? nearestLocation.name : "lieu inconnu";
        }

        function calculateSegmentDailyContent(segmentIndex) {
            if (!currentVoyage || !voyageSegments[segmentIndex]) return [];

            // Ne calculer que si le segment est activé
            if (!activatedSegments.has(segmentIndex)) {
                return [{
                    day: 1,
                    chronologicalItems: [],
                    activities: ["🚶 Voyage le long du chemin tracé"],
                    calendarDate: getCalendarDateForSegmentDay(segmentIndex, 1)
                }];
            }

            const segment = voyageSegments[segmentIndex];
            const dailyContent = [];

            // Calculer les jours cumulés jusqu'au segment actuel (inclus)
            let segmentStartDays = 0;
            for (let i = 0; i < segmentIndex; i++) {
                segmentStartDays += voyageSegments[i].duration;
            }

            // Calculer les indices de chemin pour ce segment
            const totalDays = getTotalJourneyDays();
            const segmentStartRatio = segmentStartDays / totalDays;
            const segmentEndRatio = (segmentStartDays + segment.duration) / totalDays;

            const segmentStartIndex = Math.floor(segmentStartRatio * (journeyPath.length - 1));
            const segmentEndIndex = Math.min(
                Math.floor(segmentEndRatio * (journeyPath.length - 1)),
                journeyPath.length - 1
            );

            // Créer le contenu journalier
            for (let day = 1; day <= segment.duration; day++) {
                const currentDay = segmentStartDays + day;
                const dayContent = {
                    day: day,
                    chronologicalItems: [],
                    activities: []
                };

                // Calculer la plage d'indices de chemin pour ce jour
                const dayStartRatio = (currentDay - 1) / totalDays;
                const dayEndRatio = currentDay / totalDays;
                const dayStartIndex = Math.floor(dayStartRatio * (journeyPath.length - 1));
                const dayEndIndex = Math.floor(dayEndRatio * (journeyPath.length - 1));

                // Collecter toutes les découvertes pour ce jour avec leur index de découverte
                const dayDiscoveries = [];

                // Ajouter les découvertes de régions
                journeyDiscoveries.forEach(discovery => {
                    if (discovery.type === 'region' && window.regionSegments) {
                        const regionSegment = window.regionSegments.get(discovery.name);
                        if (regionSegment) {
                            // Vérifier si cette région est traversée pendant ce jour
                            const regionOverlapsDay = (
                                regionSegment.entryIndex <= dayEndIndex &&
                                regionSegment.exitIndex >= dayStartIndex
                            );

                            if (regionOverlapsDay) {
                                dayDiscoveries.push({
                                    ...discovery,
                                    sortIndex: discovery.discoveryIndex,
                                    content: `🗺️ ${escapeHtml(discovery.name)}`,
                                    isEntry: discovery.discoveryIndex >= dayStartIndex && discovery.discoveryIndex <= dayEndIndex,
                                    isExit: regionSegment.exitIndex >= dayStartIndex && regionSegment.exitIndex <= dayEndIndex
                                });
                            }
                        }
                    }
                });

                // Ajouter les découvertes de lieux
                journeyDiscoveries.forEach(discovery => {
                    if (discovery.type === 'location') {
                        // Vérifier si ce lieu est découvert pendant ce jour
                        if (discovery.discoveryIndex >= dayStartIndex && discovery.discoveryIndex <= dayEndIndex) {
                            dayDiscoveries.push({
                                ...discovery,
                                sortIndex: discovery.discoveryIndex,
                                content: `📍 ${escapeHtml(discovery.name)}`
                            });
                        }
                    }
                });

                // Trier toutes les découvertes par ordre chronologique (index de découverte)
                dayDiscoveries.sort((a, b) => a.sortIndex - b.sortIndex);

                // Ajouter au contenu du jour
                dayContent.chronologicalItems = dayDiscoveries.map(item => item.content);

                // Ajouter des activités génériques si nécessaire
                if (dayContent.chronologicalItems.length === 0) {
                    dayContent.activities.push("🚶 Voyage le long du chemin tracé");
                }

                dailyContent.push(dayContent);
            }

            return dailyContent;
        }

        function getCalendarDateForSegmentDay(segmentIndex, dayInSegment) {
            if (!isCalendarMode || !currentCalendarDate || !calendarData) {
                return null;
            }

            // Calculer le jour absolu depuis le début du voyage
            let absoluteDay = dayInSegment;
            for (let i = 0; i < segmentIndex; i++) {
                absoluteDay += voyageSegments[i].duration;
            }

            // Trouver le mois et jour actuels dans le calendrier
            const currentMonthIndex = calendarData.findIndex(m => m.name === currentCalendarDate.month);
            if (currentMonthIndex === -1) return null;

            let monthIndex = currentMonthIndex;
            let day = currentCalendarDate.day + absoluteDay - 1;

            // Naviguer à travers les mois si nécessaire
            while (day > calendarData[monthIndex].days.length) {
                day -= calendarData[monthIndex].days.length;
                monthIndex = (monthIndex + 1) % calendarData.length;
            }

            return {
                month: calendarData[monthIndex].name,
                day: day
            };
        }

        function renderSegmentContent(segmentIndex) {
            const segmentContentDiv = document.getElementById('segment-content');
            const dailyContent = calculateSegmentDailyContent(segmentIndex);

            if (dailyContent.length === 0) {
                segmentContentDiv.innerHTML = '<div class="text-gray-500 text-center">Aucun contenu pour ce segment</div>';
                return;
            }

            const contentHtml = dailyContent.map(dayData => {
                let dayTitle = `Jour ${dayData.day}`;

                // Ajouter la date du calendrier si disponible
                const calendarDate = getCalendarDateForSegmentDay(segmentIndex, dayData.day);
                if (calendarDate) {
                    dayTitle += ` (${calendarDate.day} ${calendarDate.month})`;
                }

                let dayActivities = [];

                // Ajouter les découvertes dans l'ordre chronologique
                if (dayData.chronologicalItems && dayData.chronologicalItems.length > 0) {
                    dayActivities = [...dayData.chronologicalItems];
                }

                // Ajouter les activités génériques
                if (dayData.activities && dayData.activities.length > 0) {
                    dayActivities = dayActivities.concat(dayData.activities);
                }

                return `
                    <div class="day-section">
                        <h5 class="font-semibold text-blue-300 mb-2">${dayTitle}</h5>
                        <div class="ml-4 text-sm text-gray-300 space-y-1">
                            ${dayActivities.map(activity => {
                                // Analyser l'activité pour détecter les lieux et régions
                                const processedActivity = processActivityForHighlight(activity);
                                return `<p class="leading-relaxed">${processedActivity}</p>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('');

            // Use innerHTML to properly render HTML content
            segmentContentDiv.innerHTML = contentHtml;
            setupSegmentDiscoveryHighlight();
        }

        function updateCurrentSegmentDisplay() {
            console.log("🔄 Mise à jour segment:", {
                currentSegmentIndex: currentSegmentIndex,
                totalSegments: voyageSegments.length,
                isVoyageActive: isVoyageActive,
                currentSegment: voyageSegments[currentSegmentIndex],
                activatedSegments: Array.from(activatedSegments)
            });

            const currentSegmentDiv = document.getElementById('current-segment-display');
            const noVoyageMessage = document.getElementById('no-voyage-message');
            const progressBar = document.getElementById('voyage-progress-bar');
            const endMessage = document.getElementById('voyage-end-message');
            const modalTitle = document.getElementById('voyage-modal-title');

            if (!isVoyageActive || voyageSegments.length === 0) {
                console.log("❌ Pas de voyage actif oupas de segments");
                currentSegmentDiv.classList.add('hidden');
                noVoyageMessage.classList.remove('hidden');
                progressBar.classList.add('hidden');
                endMessage.classList.add('hidden');
                modalTitle.textContent = "Segments de Voyage";
                return;
            }

            // Vérifier que l'index est valide
            if (currentSegmentIndex < 0 || currentSegmentIndex >= voyageSegments.length) {
                console.error("❌ Index de segment invalide:", currentSegmentIndex, "segments disponibles:", voyageSegments.length);
                currentSegmentIndex = Math.max(0, Math.min(currentSegmentIndex, voyageSegments.length - 1));
                console.log("🔧 Index corrigé à:", currentSegmentIndex);
            }

            // Activer automatiquement le premier segment
            if (currentSegmentIndex === 0) {
                activatedSegments.add(0);
            }

            noVoyageMessage.classList.add('hidden');
            currentSegmentDiv.classList.remove('hidden');

            // Mettre à jour le titre du segment avec indicateur d'activation
            const segmentTitle = document.getElementById('segment-title');
            const segmentName = generateSegmentName(currentSegmentIndex);
            const isActivated = activatedSegments.has(currentSegmentIndex);
            segmentTitle.innerHTML = isActivated ? segmentName : `${segmentName} <span class="text-gray-500">(non activé)</span>`;

            console.log("📝 Titre du segment mis à jour:", segmentName, "Activé:", isActivated);

            // Mettre à jour les boutons de navigation
            const prevBtn = document.getElementById('prev-segment-btn');
            const nextBtn = document.getElementById('next-segment-btn');

            // Bouton précédent : masqué si premier segment
            if (currentSegmentIndex === 0) {
                prevBtn.style.visibility = 'hidden';
            } else {
                prevBtn.style.visibility = 'visible';
            }

            // Bouton suivant : vérifier s'il peut y avoir un segment suivant
            const canHaveNextSegment = checkIfMoreSegmentsNeeded() || currentSegmentIndex < voyageSegments.length - 1;

            if (!canHaveNextSegment) {
                nextBtn.style.visibility = 'hidden';
            } else {
                nextBtn.style.visibility = 'visible';
                const nextSegmentExists = currentSegmentIndex + 1 < voyageSegments.length;
                if (nextSegmentExists) {
                    const nextSegmentActivated = activatedSegments.has(currentSegmentIndex + 1);
                    nextBtn.title = nextSegmentActivated ? "Segment suivant" : "Activer le segment suivant";
                    nextBtn.innerHTML = nextSegmentActivated ? '<i class="fas fa-chevron-right"></i>' : '<i class="fas fa-play"></i>';
                } else {
                    // Le segment suivant n'existe pas encore mais peut être créé
                    nextBtn.title = "Créer et activer le segment suivant";
                    nextBtn.innerHTML = '<i class="fas fa-plus"></i>';
                }
            }

            // Vérifier si c'est la fin du voyage (plus de segments possibles et on est au dernier segment)
            if (!canHaveNextSegment && currentSegmentIndex === voyageSegments.length - 1) {
                endMessage.classList.remove('hidden');
            } else {
                endMessage.classList.add('hidden');
            }

            // Mettre à jour le slider de durée
            const durationSlider = document.getElementById('current-segment-duration');
            const durationValue = document.getElementById('current-segment-duration-value');
            const currentSegment = voyageSegments[currentSegmentIndex];

            durationSlider.value = currentSegment.duration;
            durationValue.textContent = currentSegment.duration;

            // Mettre à jour le contenu du segment
            renderSegmentContent(currentSegmentIndex);

            // Mettre à jour la barre de progression basée sur le segment
            updateSegmentProgressBar();
            progressBar.classList.remove('hidden');
        }

        function navigateToSegment(direction) {
            console.log("🧭 Navigation segment:", {
                direction: direction,
                currentIndex: currentSegmentIndex,
                totalSegments: voyageSegments.length,
                activatedSegments: Array.from(activatedSegments),
                segmentNames: voyageSegments.map((s, i) => `${i}: ${s.startLocation} -> ${s.endLocation}`)
            });

            if (direction === 'prev' && currentSegmentIndex > 0) {
                currentSegmentIndex--;
                console.log("⬅️ Navigation précédente vers segment", currentSegmentIndex);
            } else if (direction === 'next') {
                const nextIndex = currentSegmentIndex + 1;

                // Si le segment suivant n'existe pas, le créer dynamiquement
                if (nextIndex >= voyageSegments.length) {
                    const needsMoreSegments = checkIfMoreSegmentsNeeded();
                    if (needsMoreSegments) {
                        createNextSegment();
                        console.log("🆕 Nouveau segment créé:", voyageSegments.length - 1);
                    } else {
                        console.log("🏁 Voyage terminé, pas de segment suivant nécessaire");
                        return; // Pas de segment suivant possible
                    }
                }

                // Si le segment suivant n'est pas activé, l'activer
                if (!activatedSegments.has(nextIndex)) {
                    activatedSegments.add(nextIndex);
                    console.log("🎬 Activation du segment", nextIndex);
                }

                currentSegmentIndex = nextIndex;
                console.log("➡️ Navigation suivante vers segment", currentSegmentIndex);
            } else {
                console.log("🚫 Navigation impossible:", direction, "currentIndex:", currentSegmentIndex, "totalSegments:", voyageSegments.length);
                return; // Arrêter ici si la navigation n'est pas possible
            }

            updateCurrentSegmentDisplay();
            scheduleAutoSync();
        }

        function handleSegmentDurationChange() {
            const newDuration = parseInt(document.getElementById('current-segment-duration').value);
            const durationValue = document.getElementById('current-segment-duration-value');

            durationValue.textContent = newDuration;

            if (voyageSegments[currentSegmentIndex]) {
                voyageSegments[currentSegmentIndex].duration = newDuration;

                // Supprimer tous les segments suivants
                removeFollowingSegments();

                // Recalculer le contenu du segment actuel
                renderSegmentContent(currentSegmentIndex);

                // Mettre à jour l'affichage complet (y compris le message de fin)
                updateCurrentSegmentDisplay();
                scheduleAutoSync();
            }
        }        function removeFollowingSegments() {
            // Supprimer tous les segments après le segment actuel
            voyageSegments = voyageSegments.slice(0, currentSegmentIndex + 1);

            // Supprimer les activations des segments supprimés
            const segmentsToRemove = [];
            activatedSegments.forEach(index => {
                if (index > currentSegmentIndex) {
                    segmentsToRemove.push(index);
                }
            });
            segmentsToRemove.forEach(index => {
                activatedSegments.delete(index);
            });

            console.log("🗑️ Segments suivants supprimés. Nouveaux segments:", voyageSegments.length);
            console.log("🗑️ Segments activés restants:", Array.from(activatedSegments));
        }

        function updateVoyageSegmentsDisplay() {
            // Cette fonction est maintenant simplifiée car on utilise updateCurrentSegmentDisplay
            if (isVoyageActive) {
                updateCurrentSegmentDisplay();
            } else {
                // Cacher tous les éléments du voyage
                document.getElementById('current-segment-display').classList.add('hidden');
                document.getElementById('voyage-progress-bar').classList.add('hidden');
                document.getElementById('voyage-end-message').classList.add('hidden');
                document.getElementById('no-voyage-message').classList.remove('hidden');
            }
        }

        function getTotalJourneyDays() {
            // Utiliser la distance totale du tracé actuel ou sauvegardé
            let distanceToUse = totalPathPixels;
            if (currentVoyage && currentVoyage.totalDistance) {
                distanceToUse = currentVoyage.totalDistance;
            }

            if (distanceToUse === 0) {
                return 0;
            }

            const totalMiles = pixelsToMiles(distanceToUse);
            return milesToDays(totalMiles);
        }



        function getRemainingJourneyDays() {
            const totalJourneyDays = getTotalJourneyDays();
            const segmentDays = voyageSegments.reduce((total, segment) => total + segment.duration, 0);
            return Math.max(0, totalJourneyDays - segmentDays);
        }

        function checkIfMoreSegmentsNeeded() {
            const totalJourneyDays = getTotalJourneyDays();
            const currentSegmentDays = voyageSegments.reduce((total, segment) => total + segment.duration, 0);

            // Il faut plus de segments si on n'a pas encore couvert toute la durée du voyage
            return currentSegmentDays < totalJourneyDays;
        }

        function createNextSegment() {
            if (!currentVoyage || !journeyDiscoveries) return;

            const nextSegmentIndex = voyageSegments.length;

            // Calculer les jours déjà couverts
            const coveredDays = voyageSegments.reduce((total, segment) => total + segment.duration, 0);
            const totalJourneyDays = getTotalJourneyDays();

            // Calculer la position dans le voyage pour ce nouveau segment
            const segmentStartRatio = coveredDays / totalJourneyDays;
            const segmentStartPathIndex = Math.floor(segmentStartRatio * (journeyPath.length - 1));

            // Trouver la prochaine découverte significative après le point actuel
            const remainingDiscoveries = journeyDiscoveries.filter(discovery =>
                discovery.discoveryIndex > segmentStartPathIndex
            ).sort((a, b) => a.discoveryIndex - b.discoveryIndex);

            let startLocation, endLocation;

            // Déterminer le point de départ (fin du segment précédent)
            if (voyageSegments.length > 0) {
                const prevSegment = voyageSegments[voyageSegments.length - 1];
                startLocation = prevSegment.endLocation;
            } else {
                startLocation = 'Point de départ';
            }

            // Déterminer le point d'arrivée du nouveau segment
            if (remainingDiscoveries.length > 0) {
                // Utiliser la prochaine découverte comme destination
                const nextDiscovery = remainingDiscoveries[0];
                endLocation = nextDiscovery.name;
            } else {
                // Pas de découverte restante, utiliser la fin du voyage
                endLocation = findEndLocation();
            }

            // Créer le nouveau segment
            const newSegment = {
                id: nextSegmentIndex + 1,
                duration: 1, // Par défaut 1 jour
                startLocation: startLocation,
                endLocation: endLocation,
                status: 'active',
                createdAt: new Date().toISOString()
            };

            voyageSegments.push(newSegment);
            console.log("🆕 Nouveau segment créé:", newSegment);
        }

        // Navigation globale pour les segments
        window.navigateToSegment = navigateToSegment;

        function processActivityForHighlight(activity) {
            // Nettoyer d'abord le texte de tout HTML résiduel
            const cleanActivity = activity.replace(/<[^>]*>/g, '');
            let processedActivity = cleanActivity;

            // Chercher les noms de lieux (en évitant les doublons)
            locationsData.locations.forEach(location => {
                const locationName = location.name;
                // Échapper les caractères spéciaux pour la regex
                const escapedName = locationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');

                // Vérifier si le nom n'est pas déjà dans un span
                if (!processedActivity.includes(`data-discovery-name="${locationName}"`)) {
                    processedActivity = processedActivity.replace(regex, (match) => {
                        return `<span class="segment-discovery-item" data-discovery-name="${escapeHtml(locationName)}" data-discovery-type="location">${escapeHtml(match)}</span>`;
                    });
                }
            });

            // Chercher les noms de régions (en évitant les doublons)
            regionsData.regions.forEach(region => {
                const regionName = region.name;
                // Échapper les caractères spéciaux pour la regex
                const escapedName = regionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');

                // Vérifier si le nom n'est pas déjà dans un span
                if (!processedActivity.includes(`data-discovery-name="${regionName}"`)) {
                    processedActivity = processedActivity.replace(regex, (match) => {
                        return `<span class="segment-discovery-item" data-discovery-name="${escapeHtml(regionName)}" data-discovery-type="region">${escapeHtml(match)}</span>`;
                    });
                }
            });

            return processedActivity;
        }

        function setupSegmentDiscoveryHighlight() {
            // Remove existing tooltips
            const existingTooltips = document.querySelectorAll('.discovery-tooltip');
            existingTooltips.forEach(tooltip => tooltip.remove());

            const discoveryItems = document.querySelectorAll('.segment-discovery-item');

            discoveryItems.forEach(item => {
                const discoveryName = item.dataset.discoveryName;
                const discoveryType = item.dataset.discoveryType;

                item.addEventListener('mouseenter', () => {
                    highlightDiscoveryOnMap(discoveryName, discoveryType, true);
                });

                item.addEventListener('mouseleave', () => {
                    highlightDiscoveryOnMap(discoveryName, discoveryType, false);
                });

                // Add click event listener to open modal
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (discoveryType === 'location') {
                        const location = locationsData.locations.find(loc => loc.name === discoveryName);
                        if (location) {
                            const fakeEvent = {
                                currentTarget: { dataset: { id: location.id.toString() } },
                                stopPropagation: () => {},
                                preventDefault: () => {}
                            };
                            showInfoBox(fakeEvent);
                            if (!infoBox.classList.contains('expanded')) {
                                toggleInfoBoxExpand();
                            }
                        }
                    } else if (discoveryType === 'region') {
                        const region = regionsData.regions.find(reg => reg.name === discoveryName);
                        if (region) {
                            const fakeEvent = {
                                stopPropagation: () => {},
                                preventDefault: () => {}
                            };
                            showRegionInfo(fakeEvent, region);
                            if (!infoBox.classList.contains('expanded')) {
                                toggleInfoBoxExpand();
                            }
                        }
                    }
                });
            });
        }

        // --- Event listeners pour les segments de voyage ---
        // Les event listeners pour les segments de voyage sont maintenant gérés par VoyageManager

        // --- Settings Modal Functions ---
        function openSettingsOnSeasonTab() {
            try {
                settingsModal.classList.remove('hidden');
                    loadSettings();
                    setupSettingsTabSwitching();

                    // Ouvrir directement l'onglet "Saisons"
                    setTimeout(() => {
                        const seasonTabButton = document.querySelector('.settings-tab-button[data-tab="season"]');
                        if (seasonTabButton) {
                            seasonTabButton.click();
                        }
                    }, 100);
                } catch (error) {
                    console.error('Erreur lors de l\'ouverture des paramètres:', error);
                }
            }

            function setupSettingsEventListeners() {
                waitForElement('#settings-btn', (settingsBtn) => {
                    settingsBtn.addEventListener('click', () => {
                        settingsModal.classList.remove('hidden');
                        loadSettings();
                        setupSettingsTabSwitching();
                    });
                });

                waitForElement('#close-settings-modal', (closeSettingsModalBtn) => {
                    closeSettingsModalBtn.addEventListener('click', () => {
                        settingsModal.classList.add('hidden');
                    });
                });

                // Event listeners pour les styles de narration
                setupNarrationStyleListeners();

                // Event listener pour le bouton Wizard
                waitForElement('#generate-adventurers-wizard', (wizardBtn) => {
                    wizardBtn.addEventListener('click', handleGenerateAdventurers);
                });

                // Event listeners pour les indicateurs de saison dans le header
                waitForElement('#season-indicator', (seasonIndicator) => {
                    seasonIndicator.addEventListener('click', openSettingsOnSeasonTab);
                });

                waitForElement('#calendar-date-indicator', (calendarIndicator) => {
                    calendarIndicator.addEventListener('click', openSettingsOnSeasonTab);
                });

                // Initialiser les événements des cartes
                setupMapsEventListeners();
            }

            function setupSettingsTabSwitching() {
                // Attendre que le DOM soit complètement chargé
                setTimeout(() => {
                    const tabButtons = document.querySelectorAll('.settings-tab-button');
                    const tabContents = document.querySelectorAll('.settings-tab-content');

                    console.log('🔧 Setup tabs:', tabButtons.length, 'buttons,', tabContents.length, 'contents');

                    tabButtons.forEach((button, index) => {
                        // Supprimer les anciens event listeners en clonant
                        const newButton = button.cloneNode(true);
                        button.parentNode.replaceChild(newButton, button);

                        // Ajouter le nouvel event listener
                        newButton.addEventListener('click', (e) => {
                            e.preventDefault();
                            const targetTab = newButton.dataset.tab;
                            console.log('🔧 Tab clicked:', targetTab);

                            // Mettre à jour les références après le clonage
                            const currentTabButtons = document.querySelectorAll('.settings-tab-button');
                            const currentTabContents = document.querySelectorAll('.settings-tab-content');

                            // Update active tab button
                            currentTabButtons.forEach(btn => {
                                btn.classList.remove('active', 'border-blue-500', 'text-white');
                                btn.classList.add('border-transparent', 'text-gray-400');
                            });
                            newButton.classList.add('active', 'border-blue-500', 'text-white');
                            newButton.classList.remove('border-transparent', 'text-gray-400');

                            // Update active tab content
                            currentTabContents.forEach(content => {
                                content.classList.remove('active');
                                content.classList.add('hidden');
                            });

                            const targetContent = document.getElementById(`${targetTab}-tab`);
                            console.log('🔧 Target content:', targetContent);
                            if (targetContent) {
                                targetContent.classList.add('active');
                                targetContent.classList.remove('hidden');
                            }
                        });
                    });

                    // Setup edit mode listeners
                    setupEditModeListeners();
                }, 100);
            }

            function setupEditModeListeners() {
                // Adventurers edit listeners
                const editAdventurersBtn = document.getElementById('edit-adventurers-btn');
                const cancelAdventurersEdit = document.getElementById('cancel-adventurers-edit');
                const saveAdventurersEdit = document.getElementById('save-adventurers-edit');
                const adventurersReadMode = document.getElementById('adventurers-read-mode');
                const adventurersEditMode = document.getElementById('adventurers-edit-mode');
                const adventurersTextarea = document.getElementById('adventurers-group');

                if (editAdventurersBtn) {
                    editAdventurersBtn.addEventListener('click', () => {
                        adventurersReadMode.classList.add('hidden');
                        adventurersEditMode.classList.remove('hidden');
                    });
                }

                if (cancelAdventurersEdit) {
                    cancelAdventurersEdit.addEventListener('click', () => {
                        adventurersEditMode.classList.add('hidden');
                        adventurersReadMode.classList.remove('hidden');
                        // Reload original content
                        const saved = localStorage.getItem('adventurersGroup');
                        if (adventurersTextarea) {
                            adventurersTextarea.value = saved || '';
                        }
                    });
                }

                if (saveAdventurersEdit) {
                    saveAdventurersEdit.addEventListener('click', () => {
                        const content = adventurersTextarea.value;
                        localStorage.setItem('adventurersGroup', content);
                        updateMarkdownContent('adventurers-content', content);
                        adventurersEditMode.classList.add('hidden');
                        adventurersReadMode.classList.remove('hidden');
                        scheduleAutoSync();
                    });
                }

                // Quest edit listeners
                const editQuestBtn = document.getElementById('edit-quest-btn');
                const cancelQuestEdit = document.getElementById('cancel-quest-edit');
                const saveQuestEdit = document.getElementById('save-quest-edit');
                const questReadMode = document.getElementById('quest-read-mode');
                const questEditMode = document.getElementById('quest-edit-mode');
                const questTextarea = document.getElementById('adventurers-quest');

                if (editQuestBtn) {
                    editQuestBtn.addEventListener('click', () => {
                        questReadMode.classList.add('hidden');
                        questEditMode.classList.remove('hidden');
                    });
                }

                if (cancelQuestEdit) {
                    cancelQuestEdit.addEventListener('click', () => {
                        questEditMode.classList.add('hidden');
                        questReadMode.classList.remove('hidden');
                        // Reload original content
                        const saved = localStorage.getItem('adventurersQuest');
                        if (questTextarea) {
                            questTextarea.value = saved || '';
                        }
                    });
                }

                if (saveQuestEdit) {
                    saveQuestEdit.addEventListener('click', () => {
                        const content = questTextarea.value;
                        localStorage.setItem('adventurersQuest', content);
                        updateMarkdownContent('quest-content', content);
                        questEditMode.classList.add('hidden');
                        questReadMode.classList.remove('hidden');
                        scheduleAutoSync();
                    });
                }
            }

            function loadSettings() {
                // Charger les données sauvegardées des aventuriers et quête
                const adventurersGroup = localStorage.getItem('adventurersGroup');
                const adventurersQuest = localStorage.getItem('adventurersQuest');

                // Charger le style de narration (par défaut: brief)
                const narrationStyle = localStorage.getItem('narrationStyle') || 'brief';

                // Update textareas
                const groupTextarea = document.getElementById('adventurers-group');
                const questTextarea = document.getElementById('adventurers-quest');

                if (groupTextarea && adventurersGroup) {
                    groupTextarea.value = adventurersGroup;
                }

                if (questTextarea && adventurersQuest) {
                    questTextarea.value = adventurersQuest;
                }

                // Update markdown content displays
                updateMarkdownContent('adventurers-content', adventurersGroup);
                updateMarkdownContent('quest-content', adventurersQuest);

                // Charger le style de narration sélectionné
                const narrationRadio = document.querySelector(`input[name="narration-style"][value="${narrationStyle}"]`);
                if (narrationRadio) {
                    narrationRadio.checked = true;
                }

                // Mettre à jour le titre du bouton de génération de voyage
                updateJourneyButtonTitle();

                // Load season settings
                loadSavedSeason();
                setupSeasonListeners();

                // Load and render maps
                renderMapsGrid();
            }

            function updateMarkdownContent(elementId, content) {
                const element = document.getElementById(elementId);
                if (!element) return;

                if (!content || content.trim() === '') {
                    if (elementId === 'adventurers-content') {
                        element.innerHTML = '<p class="text-gray-400 italic">Aucune description d\'aventuriers définie.</p>';
                    } else {
                        element.innerHTML = '<p class="text-gray-400 italic">Aucune description de quête définie.</p>';
                    }
                    return;
                }

                // Simple Markdown parsing
                let html = content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
                    .replace(/`(.*?)`/g, '<code>$1</code>')
                    .replace(/^- (.*$)/gim, '<li>$1</li>')
                    .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>');

                // Wrap with paragraph tags and handle lists
                html = '<p>' + html + '</p>';
                html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
                html = html.replace(/<\/ul><ul>/g, '');
                html = html.replace(/<p><\/p>/g, '');
                html = html.replace(/<p>(<h[123]>)/g, '$1').replace(/(<\/h[123]>)<\/p>/g, '$1');
                html = html.replace(/<p>(<ul>)/g, '$1').replace(/(<\/ul>)<\/p>/g, '$1');
                html = html.replace(/<p>(<blockquote>)/g, '$1').replace(/(<\/blockquote>)<\/p>/g, '$1');

                element.innerHTML = html;
            }

            // === FONCTIONS POUR LE STYLE DE NARRATION ===

            function setupNarrationStyleListeners() {
                console.log('📖 Configuration des listeners de narration...');

                // Utiliser waitForElement pour s'assurer que les éléments existent
                waitForElement('input[name="narration-style"]', () => {
                    const narrationRadios = document.querySelectorAll('input[name="narration-style"]');
                    console.log('📖 Radio buttons de narration trouvés:', narrationRadios.length);

                    narrationRadios.forEach(radio => {
                        radio.addEventListener('change', () => {
                            if (radio.checked) {
                                console.log('📖 Style de narration changé:', radio.value);
                                localStorage.setItem('narrationStyle', radio.value);
                                updateJourneyButtonTitle();
                            }
                        });
                    });
                });
            }

            function updateJourneyButtonTitle() {
                const narrationStyle = localStorage.getItem('narrationStyle') || 'brief';
                const journeyButton = document.getElementById('generate-journey-log');
                const styleLabel = document.getElementById('journey-style-label');

                console.log('📖 Mise à jour du titre du bouton:', narrationStyle, journeyButton ? 'Bouton trouvé' : 'Bouton non trouvé');

                if (!journeyButton) return;

                let styleText = '';
                let shortStyleText = '';
                switch (narrationStyle) {
                    case 'detailed':
                        styleText = '(Narration détaillée)';
                        shortStyleText = 'Voyage – Détaillée';
                        break;
                    case 'brief':
                        styleText = '(Narration brève)';
                        shortStyleText = 'Voyage – Brève';
                        break;
                    case 'keywords':
                        styleText = '(Points clés seulement)';
                        shortStyleText = 'Voyage – Points clés';
                        break;
                    default:
                        styleText = '(Narration brève)';
                        shortStyleText = 'Voyage – Brève';
                }

                // Mettre à jour l'infobulle (title) et aria-label
                journeyButton.title = `Générer une chronique de voyage ${styleText}`;
                journeyButton.setAttribute('aria-label', `Générer une chronique de voyage ${styleText}`);

                // Mettre à jour le texte visible du bouton
                if (styleLabel) {
                    styleLabel.textContent = shortStyleText;
                }

                console.log('📖 Nouveau titre du bouton:', journeyButton.title);
                console.log('📖 Nouveau texte du bouton:', shortStyleText);
            }

            function getNarrationPromptAddition() {
                const narrationStyle = localStorage.getItem('narrationStyle') || 'brief';
                console.log('📖 Style de narration pour le prompt:', narrationStyle);

                let addition = '';
                switch (narrationStyle) {
                    case 'detailed':
                        addition = ' Organise le récit jour par jour. Pour chaque journée, rédige plusieurs paragraphes dans un style littéraire évocateur et riche. Décris l\'atmosphère, les sensations, les conversations entre les personnages, les détails du paysage et les émotions ressenties avec un style narratif immersif et poétique.';
                        break;

                    case 'keywords':
                        addition = ' Organise le récit jour par jour. Pour chaque journée, plutôt que des phrases complètes, présente une liste structurée de mots-clés et expressions évocateurs organisés par thèmes (Météo/Climat, Ambiance du groupe, Paysages traversés, Événements marquants, Sensations/Émotions). Utilise un vocabulaire riche et évocateur que le Meneur de Jeu pourra utiliser pour créer ses propres descriptions.';
                        break;

                    case 'brief':
                    default:
                        addition = ' Organise le récit par étapes journalières, en décrivant brièvement l\'ambiance et les paysages rencontrés dans un style concis mais évocateur, avec un paragraphe par jour.';
                        break;
                }

                console.log('📖 Addition au prompt:', addition.substring(0, 100) + '...');
                return addition;
            }

            async function handleGenerateAdventurers(event) {
                const button = event.currentTarget;

                const prompt = `Crée un groupe d'aventuriers pour les Terres du Milieu dans l'Eriador de la fin du Troisième Âge.

Voici la procédure à suivre :

a- Choisis aléatoirement un nombre d'aventurier entre 2 et 5
b- Pour chaque individu du nombre d'aventurier fais les choses suivantes dans l'ordre :
- Choisis un peuple aléatoirement (parmi : "Hobbits de la Comté", "Hommes de Bree", "Rôdeur du Nord", "Elfes du Lindon", "Nains des Montagnes Bleues"). Il faut que cette sélection soit réellement aléatoire.
- Choisis un Nom (dans le style des noms utilisés parmi les races de Tolkien, mais sans utiliser de noms trop connus comme Aragorn, Legolas, Frodo, etc)
- Choisis Occupation/rôle (garde-forestier, marchand, érudit, guerrier, etc.)
- Choisis un lien cohérent (famille, ami, collègue, redevable, etc) entre les aventuriers, en faisant en sorte que les aventuriers de races différentes ne soient pas de la même famille.

Puis décris leur quête ou objectif commun qui les unit dans cette aventure, sans préciser ce qu'ils devront faire pour l'atteindre. Explique pourquoi ce sont eux et pas d'autres aventuriers qui poursuivent cette quête.

Format de réponse en Markdown:
## Groupe d'aventuriers
[Description de chaque membre avec nom (en gras), peuple (en italique), occupation, lien avec les autres aventuriers]

## Quête
[Description de leur mission commune]

Reste fidèle à l'univers de Tolkien, à la géographie et l'histoire de l'Eriador.`;

                // Appeler Gemini pour générer le contenu
                const result = await callGemini(prompt, button);

                // Analyser le résultat pour séparer groupe et quête
                const parts = result.split('## Quête');
                if (parts.length === 2) {
                    const groupPart = parts[0].replace('## Groupe d\'aventuriers', '').trim();
                    const questPart = parts[1].trim();

                    // Update textareas
                    const groupTextarea = document.getElementById('adventurers-group');
                    const questTextarea = document.getElementById('adventurers-quest');

                    if (groupTextarea) groupTextarea.value = groupPart;
                    if (questTextarea) questTextarea.value = questPart;

                    // Update displays
                    updateMarkdownContent('adventurers-content', groupPart);
                    updateMarkdownContent('quest-content', questPart);

                    // Sauvegarder
                    localStorage.setItem('adventurersGroup', groupPart);
                    localStorage.setItem('adventurersQuest', questPart);
                    scheduleAutoSync();
                } else {
                    // Si le format n'est pas comme attendu, mettre tout dans le groupe
                    const groupTextarea = document.getElementById('adventurers-group');
                    if (groupTextarea) groupTextarea.value = result;
                    updateMarkdownContent('adventurers-content', result);
                    localStorage.setItem('adventurersGroup', result);
                    scheduleAutoSync();
                }
            }

            // --- Sync Status Display Function ---
            function updateSyncStatus(message) {
                console.log(`🔄 Sync Status: ${message}`);
                // You can also display this message in the UI if there's a status element
                const statusElement = document.getElementById('sync-status');
                if (statusElement) {
                    statusElement.textContent = message;
                    statusElement.style.opacity = '1';
                    setTimeout(() => {
                        statusElement.style.opacity = '0';
                    }, 3000); // Hide after 3 seconds
                }
            }

            // Démarrer l'application quand le DOM est prêt
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeApp);
            } else {
                initializeApp();
            }