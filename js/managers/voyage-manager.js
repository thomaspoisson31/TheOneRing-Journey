class VoyageManager {
    constructor(domElements) {
        this.dom = domElements;
        this.currentDayIndex = 0;
        this.totalJourneyDays = 0;
        this.dayByDayData = [];
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const voyageBtn = this.dom.getElementById('voyage-segments-btn');
        const closeBtn = this.dom.getElementById('close-voyage-segments');

        if (voyageBtn) {
            voyageBtn.addEventListener('click', () => {
                this.dom.showModal(this.dom.voyageSegmentsModal);
                // Appliquer le style fond blanc
                const modalContent = this.dom.voyageSegmentsModal.querySelector('.bg-gray-900');
                if (modalContent) {
                    modalContent.classList.add('voyage-modal-white');
                }
                this.updateDisplay();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.dom.hideModal(this.dom.voyageSegmentsModal);
            });
        }

        // Navigation buttons (now for day navigation)
        const prevBtn = this.dom.getElementById('prev-segment-btn');
        const nextBtn = this.dom.getElementById('next-segment-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.navigateToDay(this.currentDayIndex - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.navigateToDay(this.currentDayIndex + 1);
            });
        }
    }

    updateDisplay() {
        const noVoyageMessage = this.dom.getElementById('no-voyage-message');
        const currentSegmentDisplay = this.dom.getElementById('current-segment-display');

        // Utiliser les variables globales existantes
        if (journeyPath.length === 0) {
            noVoyageMessage.classList.remove('hidden');
            currentSegmentDisplay.classList.add('hidden');
        } else {
            noVoyageMessage.classList.add('hidden');
            currentSegmentDisplay.classList.remove('hidden');
            this.generateJourneyData();
            this.renderCurrentDay();
        }
    }

    generateJourneyData() {
        // Calculate total journey duration using global variables
        const miles = totalPathPixels * (MAP_DISTANCE_MILES / MAP_WIDTH);
        const days = Math.ceil(miles / 20); // 20 miles per day
        this.totalJourneyDays = Math.max(1, days);

        // Récupérer ou définir la date de début du voyage
        this.journeyStartDate = this.getJourneyStartDate();

        // Build absolute timeline
        const absoluteTimeline = this.buildAbsoluteTimeline();

        // Generate day by day data
        this.dayByDayData = [];
        for (let day = 1; day <= this.totalJourneyDays; day++) {
            const dayData = {
                day: day,
                discoveries: [],
                calendarDate: this.getCalendarDateForDay(day)
            };

            // Find discoveries for this day
            absoluteTimeline.forEach(timelineItem => {
                if (timelineItem.type === 'location') {
                    if (timelineItem.absoluteDay === day) {
                        dayData.discoveries.push(timelineItem.discovery);
                    }
                } else if (timelineItem.type === 'region') {
                    if (day >= timelineItem.absoluteStartDay && day <= timelineItem.absoluteEndDay) {
                        const exists = dayData.discoveries.some(d => 
                            d.name === timelineItem.discovery.name && d.type === timelineItem.discovery.type
                        );
                        if (!exists) {
                            dayData.discoveries.push(timelineItem.discovery);
                        }
                    }
                }
            });

            this.dayByDayData.push(dayData);
        }

        // Initialize to first day if not set
        if (this.currentDayIndex >= this.totalJourneyDays) {
            this.currentDayIndex = 0;
        }
    }

    buildAbsoluteTimeline() {
        // Utiliser les variables globales journeyDiscoveries
        const discoveries = journeyDiscoveries.sort((a, b) => a.discoveryIndex - b.discoveryIndex);
        const totalMiles = totalPathPixels * (MAP_DISTANCE_MILES / MAP_WIDTH);
        const totalPathPoints = journeyPath.length;

        const absoluteTimeline = [];
        let currentAbsoluteDay = 1;

        discoveries.forEach(discovery => {
            if (discovery.type === 'location') {
                // Calculer le jour où le lieu est atteint
                const discoveryRatio = discovery.discoveryIndex / totalPathPoints;
                const discoveryDay = Math.max(1, Math.ceil(discoveryRatio * this.totalJourneyDays));

                absoluteTimeline.push({
                    discovery: discovery,
                    absoluteDay: discoveryDay,
                    type: 'location'
                });
            } else if (discovery.type === 'region') {
                // Utiliser les segments de région s'ils existent
                if (window.regionSegments && window.regionSegments.has(discovery.name)) {
                    const regionSegment = window.regionSegments.get(discovery.name);

                    // Calculer les jours basés sur les indices
                    const startRatio = regionSegment.entryIndex / totalPathPoints;
                    const endRatio = regionSegment.exitIndex / totalPathPoints;

                    const regionStartDay = Math.max(1, Math.ceil(startRatio * this.totalJourneyDays));
                    const regionEndDay = Math.max(regionStartDay, Math.ceil(endRatio * this.totalJourneyDays));

                    absoluteTimeline.push({
                        discovery: discovery,
                        absoluteStartDay: regionStartDay,
                        absoluteEndDay: regionEndDay,
                        type: 'region'
                    });
                } else {
                    // Fallback si pas de segment
                    const discoveryRatio = discovery.discoveryIndex / totalPathPoints;
                    const discoveryDay = Math.max(1, Math.ceil(discoveryRatio * this.totalJourneyDays));

                    absoluteTimeline.push({
                        discovery: discovery,
                        absoluteStartDay: discoveryDay,
                        absoluteEndDay: discoveryDay,
                        type: 'region'
                    });
                }
            }
        });

        return absoluteTimeline;
    }

    getJourneyStartDate() {
        // Vérifier si une date de début est déjà enregistrée pour ce voyage
        const savedJourneyData = this.getSavedJourneyData();
        if (savedJourneyData && savedJourneyData.startDate) {
            return savedJourneyData.startDate;
        }

        // Si pas de date sauvée, utiliser la date courante et l'enregistrer
        if (typeof isCalendarMode !== 'undefined' && isCalendarMode && 
            typeof currentCalendarDate !== 'undefined' && currentCalendarDate && 
            typeof calendarData !== 'undefined' && calendarData) {
            
            const startDate = {
                month: currentCalendarDate.month,
                day: currentCalendarDate.day,
                monthIndex: calendarData.findIndex(m => m.name === currentCalendarDate.month)
            };

            // Sauvegarder la date de début
            this.saveJourneyStartDate(startDate);
            return startDate;
        }

        return null;
    }

    getSavedJourneyData() {
        if (typeof journeyPath === 'undefined' || journeyPath.length === 0) return null;
        
        // Créer une signature unique du voyage basée sur les points du tracé
        const pathSignature = this.createPathSignature(journeyPath);
        const savedData = localStorage.getItem(`journey_${pathSignature}`);
        
        return savedData ? JSON.parse(savedData) : null;
    }

    saveJourneyStartDate(startDate) {
        if (typeof journeyPath === 'undefined' || journeyPath.length === 0) return;
        
        const pathSignature = this.createPathSignature(journeyPath);
        const journeyData = {
            startDate: startDate,
            pathSignature: pathSignature,
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(`journey_${pathSignature}`, JSON.stringify(journeyData));
        console.log(`📅 Date de début du voyage sauvegardée : ${startDate.day} ${startDate.month}`);
    }

    createPathSignature(path) {
        // Créer une signature basée sur les premiers et derniers points + longueur totale
        if (path.length === 0) return 'empty';
        
        const start = path[0];
        const end = path[path.length - 1];
        const length = path.length;
        
        return `${Math.round(start.x)}_${Math.round(start.y)}_${Math.round(end.x)}_${Math.round(end.y)}_${length}`;
    }

    getCalendarDateForDay(day) {
        // Utiliser la date de début fixe du voyage plutôt que la date courante
        if (this.journeyStartDate && typeof calendarData !== 'undefined' && calendarData) {
            let monthIndex = this.journeyStartDate.monthIndex;
            let calendarDay = this.journeyStartDate.day + day - 1;

            // Navigate through months if necessary
            while (calendarDay > calendarData[monthIndex].days.length) {
                calendarDay -= calendarData[monthIndex].days.length;
                monthIndex = (monthIndex + 1) % calendarData.length;
            }

            return `${calendarDay} ${calendarData[monthIndex].name}`;
        }

        return `Jour ${day}`;
    }

    renderCurrentDay() {
        if (this.dayByDayData.length === 0) {
            this.renderEmptyDay();
            return;
        }

        const currentDay = this.dayByDayData[this.currentDayIndex];

        // Update title with calendar date
        this.updateDayTitle(currentDay);

        // Update content
        this.updateDayContent(currentDay);

        // Update navigation buttons
        this.updateNavigationButtons();

        // Update progress bar
        this.updateProgressBar();
    }

    updateDayTitle(dayData) {
        const segmentTitle = this.dom.getElementById('segment-title');
        if (segmentTitle) {
            segmentTitle.textContent = dayData.calendarDate;
        }
    }

    updateDayContent(dayData) {
        const segmentContent = this.dom.getElementById('segment-content');
        if (!segmentContent) return;

        let contentHtml = '';

        if (dayData.discoveries.length === 0) {
            contentHtml = '<p class="text-gray-500 text-sm italic text-center p-4">Voyage tranquille...</p>';
        } else {
            const discoveriesHtml = dayData.discoveries.map(discovery => {
                const icon = discovery.type === 'region' ? '🗺️' : '📍';
                const typeText = discovery.type === 'region' ? 'Région' : 'Lieu';
                let actionText = '';

                if (discovery.proximityType) {
                    actionText = discovery.proximityType === 'traversed' ? 'traversée' : 'passage à proximité';
                } else if (discovery.type === 'region') {
                    actionText = 'traversée';
                } else {
                    actionText = 'découvert';
                }

                return `
                    <div class="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors discovery-item" data-discovery-name="${discovery.name}" data-discovery-type="${discovery.type}">
                        <span class="text-2xl">${icon}</span>
                        <div class="flex-1">
                            <div class="font-medium text-white">${discovery.name}</div>
                            <div class="text-sm text-gray-400">${typeText} - ${actionText}</div>
                        </div>
                    </div>
                `;
            }).join('');

            contentHtml = `
                <div class="space-y-3">
                    ${discoveriesHtml}
                </div>
            `;
        }

        // Ajouter les boutons en bas
        let buttonsHtml = `
            <div class="mt-6 pt-4 border-t border-gray-600 space-y-3">
                <button id="describe-journey-btn" class="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-colors">
                    <span class="gemini-icon">✨</span>
                    <span>Décrire le voyage</span>
                </button>
        `;

        // Ajouter le bouton "Terminer le voyage" si on est au dernier jour
        const isLastDay = this.currentDayIndex === (this.totalJourneyDays - 1);
        if (isLastDay) {
            buttonsHtml += `
                <button id="finish-journey-btn" class="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-colors">
                    <i class="fas fa-flag-checkered"></i>
                    <span>Terminer le voyage</span>
                </button>
            `;
        }

        buttonsHtml += `</div>`;
        contentHtml += buttonsHtml;

        segmentContent.innerHTML = contentHtml;

        // Setup event listeners for discoveries
        this.setupDiscoveryInteractions();

        // Setup event listener for describe journey button
        const describeBtn = this.dom.getElementById('describe-journey-btn');
        if (describeBtn) {
            describeBtn.addEventListener('click', () => {
                this.generateJourneyDescription();
            });
        }

        // Setup event listener for finish journey button if it exists
        if (isLastDay) {
            const finishBtn = this.dom.getElementById('finish-journey-btn');
            if (finishBtn) {
                finishBtn.addEventListener('click', () => {
                    this.finishJourney();
                });
            }
        }
    }

    navigateToDay(targetDayIndex) {
        if (targetDayIndex < 0 || targetDayIndex >= this.totalJourneyDays) {
            return;
        }

        this.currentDayIndex = targetDayIndex;
        this.renderCurrentDay();
    }

    updateNavigationButtons() {
        const prevBtn = this.dom.getElementById('prev-segment-btn');
        const nextBtn = this.dom.getElementById('next-segment-btn');

        if (prevBtn) {
            prevBtn.style.opacity = this.currentDayIndex > 0 ? '1' : '0.3';
            prevBtn.style.cursor = this.currentDayIndex > 0 ? 'pointer' : 'not-allowed';
            prevBtn.title = this.currentDayIndex > 0 ? 'Jour précédent' : 'Premier jour';
        }

        if (nextBtn) {
            const canGoNext = this.currentDayIndex < (this.totalJourneyDays - 1);
            nextBtn.style.opacity = canGoNext ? '1' : '0.3';
            nextBtn.style.cursor = canGoNext ? 'pointer' : 'not-allowed';
            nextBtn.title = canGoNext ? 'Jour suivant' : 'Dernier jour';
        }
    }

    updateProgressBar() {
        const progressFill = this.dom.getElementById('progress-fill');
        const progressMarker = this.dom.getElementById('progress-marker');
        const progressBar = this.dom.getElementById('voyage-progress-bar');

        if (progressBar) {
            progressBar.classList.remove('hidden');
        }

        if (progressFill && progressMarker) {
            const progressPercentage = ((this.currentDayIndex + 1) / this.totalJourneyDays) * 100;
            progressFill.style.width = `${progressPercentage}%`;
            progressMarker.style.left = `calc(${progressPercentage}% - 12px)`;

            // Update tooltip
            progressMarker.title = `Progression : ${this.currentDayIndex + 1} / ${this.totalJourneyDays} jours`;
        }
    }

    renderEmptyDay() {
        const segmentTitle = this.dom.getElementById('segment-title');
        const segmentContent = this.dom.getElementById('segment-content');

        if (segmentTitle) {
            segmentTitle.textContent = 'Aucun voyage tracé';
        }

        if (segmentContent) {
            segmentContent.innerHTML = '<p class="text-gray-400 text-center p-4">Tracez un chemin sur la carte pour voir les détails du voyage.</p>';
        }

        // Hide progress bar
        const progressBar = this.dom.getElementById('voyage-progress-bar');
        if (progressBar) {
            progressBar.classList.add('hidden');
        }
    }

    setupDiscoveryInteractions() {
        const discoveryItems = document.querySelectorAll('.discovery-item');

        discoveryItems.forEach(item => {
            const discoveryName = item.dataset.discoveryName;
            const discoveryType = item.dataset.discoveryType;

            // Survol - highlight sur la carte
            item.addEventListener('mouseenter', () => {
                this.highlightDiscoveryOnMap(discoveryName, discoveryType, true);
            });

            item.addEventListener('mouseleave', () => {
                this.highlightDiscoveryOnMap(discoveryName, discoveryType, false);
            });

            // Clic - ouvrir la modal
            item.addEventListener('click', () => {
                this.openDiscoveryModal(discoveryName, discoveryType);
            });
        });
    }

    highlightDiscoveryOnMap(discoveryName, discoveryType, highlight) {
        if (discoveryType === 'location') {
            // Utiliser la fonction globale pour les lieux
            if (typeof highlightDiscoveryOnMap === 'function') {
                highlightDiscoveryOnMap(discoveryName, discoveryType, highlight);
            }
        } else if (discoveryType === 'region') {
            // Utiliser la fonction globale pour les régions
            if (typeof highlightDiscoveryOnMap === 'function') {
                highlightDiscoveryOnMap(discoveryName, discoveryType, highlight);
            }
        }
    }

    openDiscoveryModal(discoveryName, discoveryType) {
        // Fermer la modal des segments de voyage
        this.dom.hideModal(this.dom.voyageSegmentsModal);

        if (discoveryType === 'location') {
            // Trouver le lieu et ouvrir sa modal
            if (typeof locationsData !== 'undefined' && locationsData.locations) {
                const location = locationsData.locations.find(loc => loc.name === discoveryName);
                if (location) {
                    // Simuler un événement de clic sur le marqueur
                    const fakeEvent = {
                        currentTarget: { dataset: { id: location.id.toString() } },
                        stopPropagation: () => {},
                        preventDefault: () => {}
                    };

                    if (typeof showInfoBox === 'function') {
                        showInfoBox(fakeEvent);

                        // Forcer l'expansion de la info box
                        const infoBox = document.getElementById('info-box');
                        if (infoBox && !infoBox.classList.contains('expanded')) {
                            if (typeof toggleInfoBoxExpand === 'function') {
                                toggleInfoBoxExpand();
                            }
                        }
                    }
                }
            }
        } else if (discoveryType === 'region') {
            // Trouver la région et ouvrir sa modal
            if (typeof regionsData !== 'undefined' && regionsData.regions) {
                const region = regionsData.regions.find(reg => reg.name === discoveryName);
                if (region) {
                    // Simuler un événement de clic sur la région
                    const fakeEvent = {
                        stopPropagation: () => {},
                        preventDefault: () => {}
                    };

                    if (typeof showRegionInfo === 'function') {
                        showRegionInfo(fakeEvent, region);

                        // Forcer l'expansion de la info box
                        const infoBox = document.getElementById('info-box');
                        if (infoBox && !infoBox.classList.contains('expanded')) {
                            if (typeof toggleInfoBoxExpand === 'function') {
                                toggleInfoBoxExpand();
                            }
                        }
                    }
                }
            }
        }
    }

    finishJourney() {
        // Obtenir la date du dernier jour
        const lastDayData = this.dayByDayData[this.totalJourneyDays - 1];
        if (!lastDayData) return;

        // Mettre à jour la date du calendrier principal si on est en mode calendrier
        if (typeof isCalendarMode !== 'undefined' && isCalendarMode && 
            this.journeyStartDate && typeof calendarData !== 'undefined' && calendarData) {

            // Calculer la nouvelle date basée sur la date de début fixe du voyage
            let monthIndex = this.journeyStartDate.monthIndex;
            let newDay = this.journeyStartDate.day + this.totalJourneyDays - 1;

            // Naviguer à travers les mois si nécessaire
            while (newDay > calendarData[monthIndex].days.length) {
                newDay -= calendarData[monthIndex].days.length;
                monthIndex = (monthIndex + 1) % calendarData.length;
            }

            // Mettre à jour la date courante globale
            currentCalendarDate = {
                month: calendarData[monthIndex].name,
                day: newDay
            };

            // Sauvegarder la nouvelle date
            if (typeof saveCalendarToLocal === 'function') {
                saveCalendarToLocal();
            }

            // Mettre à jour l'affichage de la saison
            if (typeof updateSeasonDisplay === 'function') {
                updateSeasonDisplay();
            }

            // Programmer une synchronisation
            if (typeof scheduleAutoSync === 'function') {
                scheduleAutoSync();
            }
        }

        // Fermer la modal des segments de voyage
        this.dom.hideModal(this.dom.voyageSegmentsModal);

        // Afficher un message de confirmation (optionnel)
        console.log(`🏁 Voyage terminé ! Date finale : ${lastDayData.calendarDate}`);
    }

    async generateJourneyDescription() {
        if (this.dayByDayData.length === 0) {
            alert('Aucune journée de voyage à décrire.');
            return;
        }

        // Collecter les données pour toutes les journées
        const allJourneyData = this.collectAllJourneyDataForPrompt();
        
        // Créer le prompt pour toutes les journées
        const prompt = this.createCompleteJourneyDescriptionPrompt(allJourneyData);
        
        // Appeler Gemini via la fonction globale callGemini
        const button = this.dom.getElementById('describe-journey-btn');
        if (typeof callGemini === 'function') {
            try {
                const jsonResponse = await callGemini(prompt, button);
                this.processAndDisplayJourneyDescriptions(jsonResponse);
            } catch (error) {
                console.error('Erreur lors de la génération de la description:', error);
                alert('Erreur lors de la génération de la description de voyage.');
            }
        } else {
            alert('La fonction de génération de texte n\'est pas disponible.');
        }
    }

    collectAllJourneyDataForPrompt() {
        // Récupérer les données du groupe d'aventuriers et de la quête
        const adventurersGroup = localStorage.getItem('adventurersGroup') || '';
        const adventurersQuest = localStorage.getItem('adventurersQuest') || '';
        
        // Récupérer la saison actuelle
        const currentSeason = typeof window.currentSeason !== 'undefined' ? window.currentSeason : 'printemps-debut';
        const seasonNames = {
            'printemps-debut': 'Printemps-début',
            'printemps-milieu': 'Printemps-milieu',
            'printemps-fin': 'Printemps-fin',
            'ete-debut': 'Été-début',
            'ete-milieu': 'Été-milieu',
            'ete-fin': 'Été-fin',
            'automne-debut': 'Automne-début',
            'automne-milieu': 'Automne-milieu',
            'automne-fin': 'Automne-fin',
            'hiver-debut': 'Hiver-début',
            'hiver-milieu': 'Hiver-milieu',
            'hiver-fin': 'Hiver-fin'
        };
        const seasonName = seasonNames[currentSeason] || currentSeason;

        // Collecter toutes les journées avec leurs découvertes
        const allDays = this.dayByDayData.map((dayData, index) => {
            const discoveriesWithDescriptions = dayData.discoveries.map(discovery => {
                let description = '';
                
                if (discovery.type === 'location' && typeof locationsData !== 'undefined') {
                    const location = locationsData.locations.find(loc => loc.name === discovery.name);
                    if (location) {
                        description = location.description || '';
                    }
                } else if (discovery.type === 'region' && typeof regionsData !== 'undefined') {
                    const region = regionsData.regions.find(reg => reg.name === discovery.name);
                    if (region) {
                        description = region.description || '';
                    }
                }

                let actionText = '';
                if (discovery.proximityType) {
                    actionText = discovery.proximityType === 'traversed' ? 'traversé' : 'passage à proximité';
                } else if (discovery.type === 'region') {
                    actionText = 'traversé';
                } else {
                    actionText = 'découvert';
                }

                return {
                    name: discovery.name,
                    type: discovery.type === 'region' ? 'Région' : 'Lieu',
                    action: actionText,
                    description: description
                };
            });

            return {
                dayNumber: index + 1,
                calendarDate: dayData.calendarDate,
                discoveries: discoveriesWithDescriptions
            };
        });

        return {
            adventurersGroup,
            adventurersQuest,
            season: seasonName,
            totalDays: this.totalJourneyDays,
            days: allDays
        };
    }

    createCompleteJourneyDescriptionPrompt(allJourneyData) {
        let prompt = `Rédige des descriptions évocatrices pour un voyage complet en Terre du Milieu, au présent de la deuxième personne du pluriel ("Vous traversez...").

Ces descriptions sont destinées à un meneur de jeu qui va les lire à ses joueurs pour les immerger dans l'ambiance du voyage.

**Contexte du groupe :**
${allJourneyData.adventurersGroup || 'Groupe d\'aventuriers non défini'}

**Nature de la quête :**
${allJourneyData.adventurersQuest || 'Quête non définie'}

**Saison actuelle :** ${allJourneyData.season}
**Durée totale du voyage :** ${allJourneyData.totalDays} jours

**Détail des journées :**
`;

        allJourneyData.days.forEach(day => {
            prompt += `\n**Jour ${day.dayNumber} (${day.calendarDate}) :**\n`;
            if (day.discoveries.length > 0) {
                prompt += `Lieux et régions :\n`;
                day.discoveries.forEach(discovery => {
                    prompt += `- ${discovery.type} : ${discovery.name} (${discovery.action})`;
                    if (discovery.description) {
                        prompt += `\n  Description : ${discovery.description}`;
                    }
                    prompt += '\n';
                });
            } else {
                prompt += `Voyage tranquille sans découverte particulière.\n`;
            }
        });

        prompt += `
**Instructions importantes :**
- Répondez UNIQUEMENT par un objet JSON structuré
- Variez les descriptions selon les jours :
  * Tantôt des descriptions de paysages et d'environnement
  * Tantôt le temps qu'il fait et les conditions météorologiques
  * Tantôt les impressions de voyage et l'ambiance du groupe
  * Tantôt l'accumulation de la fatigue physique et mentale
  * Tantôt l'attitude et les interactions entre membres du groupe
- Évitez les redondances entre les journées
- Rédigez au présent de la 2ème personne du pluriel
- Faites appel à plusieurs sens (vue, ouïe, odorat, toucher)
- Adaptez l'ambiance à la saison
- Chaque description doit faire 2-3 paragraphes maximum
- Le ton doit être immersif et narratif, adapté à une lecture en jeu de rôle

**Format de réponse attendu :**
{
  "voyage": {
    "jour_1": {
      "date": "${allJourneyData.days[0]?.calendarDate || 'Jour 1'}",
      "description": "Description de la première journée..."
    },
    "jour_2": {
      "date": "Date du jour 2",
      "description": "Description de la deuxième journée..."
    }
    // ... etc pour tous les jours
  }
}
`;

        return prompt;
    }

    processAndDisplayJourneyDescriptions(jsonResponse) {
        try {
            // Nettoyer la réponse pour extraire le JSON
            let cleanResponse = jsonResponse.trim();
            
            // Supprimer les balises markdown potentielles
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            // Parser le JSON
            const descriptionsData = JSON.parse(cleanResponse);
            
            if (!descriptionsData.voyage) {
                throw new Error('Format de réponse invalide: propriété "voyage" manquante');
            }
            
            // Stocker les descriptions pour chaque jour
            this.journeyDescriptions = {};
            Object.keys(descriptionsData.voyage).forEach(dayKey => {
                const dayInfo = descriptionsData.voyage[dayKey];
                if (dayInfo && dayInfo.description) {
                    // Extraire le numéro du jour
                    const dayMatch = dayKey.match(/jour_(\d+)/);
                    if (dayMatch) {
                        const dayNumber = parseInt(dayMatch[1]);
                        this.journeyDescriptions[dayNumber] = {
                            date: dayInfo.date,
                            description: dayInfo.description
                        };
                    }
                }
            });
            
            // Afficher la description du jour actuel
            this.displayCurrentJourneyDescription();
            
        } catch (error) {
            console.error('Erreur lors du parsing JSON:', error);
            console.log('Réponse reçue:', jsonResponse);
            
            // Fallback: afficher la réponse brute comme avant
            this.displayJourneyDescription(jsonResponse);
        }
    }

    displayCurrentJourneyDescription() {
        const currentDayNumber = this.currentDayIndex + 1;
        const currentDescription = this.journeyDescriptions[currentDayNumber];
        
        if (!currentDescription) {
            alert('Description non disponible pour cette journée.');
            return;
        }
        
        this.displayJourneyDescription(currentDescription.description, currentDescription.date);
    }

    displayJourneyDescription(description, dayDate = null) {
        // Créer ou réutiliser une modal pour afficher la description
        let descriptionModal = document.getElementById('journey-description-modal');
        
        if (!descriptionModal) {
            // Créer la modal si elle n'existe pas
            descriptionModal = document.createElement('div');
            descriptionModal.id = 'journey-description-modal';
            descriptionModal.className = 'hidden absolute inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4';
            
            descriptionModal.innerHTML = `
                <div class="bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col journey-description-modal-white">
                    <div class="flex justify-between items-center mb-4">
                        <h3 id="journey-description-title" class="text-xl font-bold text-white">Description de la journée</h3>
                        <div class="flex space-x-2">
                            <button id="prev-day-description" class="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button id="next-day-description" class="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                            <button id="close-journey-description" class="text-gray-400 hover:text-white">
                                <i class="fas fa-times fa-lg"></i>
                            </button>
                        </div>
                    </div>
                    <div id="journey-description-content" class="prose prose-invert overflow-y-auto text-gray-300 leading-relaxed flex-1"></div>
                    <div class="mt-4 pt-4 border-t border-gray-600 flex justify-between">
                        <button id="copy-all-descriptions" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors">
                            <i class="fas fa-copy mr-2"></i>Copier tout le voyage
                        </button>
                        <button id="copy-current-description" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
                            <i class="fas fa-copy mr-2"></i>Copier cette journée
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(descriptionModal);
            
            this.setupDescriptionModalEventListeners();
        }
        
        // Mettre à jour le titre et le contenu
        const title = document.getElementById('journey-description-title');
        const content = document.getElementById('journey-description-content');
        
        if (dayDate) {
            title.textContent = `Description - ${dayDate}`;
        } else {
            title.textContent = 'Description de la journée';
        }
        
        content.innerHTML = description.replace(/\n/g, '<br>');
        
        // Mettre à jour les boutons de navigation
        this.updateDescriptionNavigationButtons();
        
        descriptionModal.classList.remove('hidden');
    }

    setupDescriptionModalEventListeners() {
        // Fermer la modal
        document.getElementById('close-journey-description').addEventListener('click', () => {
            document.getElementById('journey-description-modal').classList.add('hidden');
        });

        // Navigation entre les jours
        document.getElementById('prev-day-description').addEventListener('click', () => {
            if (this.currentDayIndex > 0) {
                this.currentDayIndex--;
                this.displayCurrentJourneyDescription();
                this.updateDescriptionNavigationButtons();
            }
        });

        document.getElementById('next-day-description').addEventListener('click', () => {
            if (this.currentDayIndex < this.totalJourneyDays - 1) {
                this.currentDayIndex++;
                this.displayCurrentJourneyDescription();
                this.updateDescriptionNavigationButtons();
            }
        });

        // Copier la description actuelle
        document.getElementById('copy-current-description').addEventListener('click', () => {
            const currentDayNumber = this.currentDayIndex + 1;
            const currentDescription = this.journeyDescriptions[currentDayNumber];
            
            if (currentDescription) {
                navigator.clipboard.writeText(currentDescription.description).then(() => {
                    const button = document.getElementById('copy-current-description');
                    const originalText = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-check mr-2"></i>Copié !';
                    setTimeout(() => {
                        button.innerHTML = originalText;
                    }, 2000);
                });
            }
        });

        // Copier toutes les descriptions
        document.getElementById('copy-all-descriptions').addEventListener('click', () => {
            let allDescriptions = '';
            for (let day = 1; day <= this.totalJourneyDays; day++) {
                const dayDesc = this.journeyDescriptions[day];
                if (dayDesc) {
                    allDescriptions += `=== ${dayDesc.date} ===\n\n${dayDesc.description}\n\n`;
                }
            }
            
            navigator.clipboard.writeText(allDescriptions).then(() => {
                const button = document.getElementById('copy-all-descriptions');
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check mr-2"></i>Tout copié !';
                setTimeout(() => {
                    button.innerHTML = originalText;
                }, 2000);
            });
        });
    }

    updateDescriptionNavigationButtons() {
        const prevBtn = document.getElementById('prev-day-description');
        const nextBtn = document.getElementById('next-day-description');

        if (prevBtn) {
            prevBtn.style.opacity = this.currentDayIndex > 0 ? '1' : '0.3';
            prevBtn.style.cursor = this.currentDayIndex > 0 ? 'pointer' : 'not-allowed';
        }

        if (nextBtn) {
            const canGoNext = this.currentDayIndex < (this.totalJourneyDays - 1);
            nextBtn.style.opacity = canGoNext ? '1' : '0.3';
            nextBtn.style.cursor = canGoNext ? 'pointer' : 'not-allowed';
        }
    }
}