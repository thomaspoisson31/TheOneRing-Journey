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

    getCalendarDateForDay(day) {
        // Utiliser les variables globales du calendrier
        if (typeof isCalendarMode !== 'undefined' && isCalendarMode && 
            typeof currentCalendarDate !== 'undefined' && currentCalendarDate && 
            typeof calendarData !== 'undefined' && calendarData) {

            const currentMonthIndex = calendarData.findIndex(m => m.name === currentCalendarDate.month);
            if (currentMonthIndex === -1) return `Jour ${day}`;

            let monthIndex = currentMonthIndex;
            let calendarDay = currentCalendarDate.day + day - 1;

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

        if (dayData.discoveries.length === 0) {
            segmentContent.innerHTML = '<p class="text-gray-500 text-sm italic text-center p-4">Voyage tranquille...</p>';
            return;
        }

        const discoveriesHtml = dayData.discoveries.map(discovery => {
            const icon = discovery.type === 'region' ? '🗺️' : '📍';
            const typeText = discovery.type === 'region' ? 'Région' : 'Lieu';
            let actionText = '';

            if (discovery.proximityType) {
                actionText = discovery.proximityType === 'traversed' ? 'Traversé' : 'Passage à proximité';
            } else if (discovery.type === 'region') {
                actionText = 'Traversée';
            } else {
                actionText = 'Découvert';
            }

            return `
                <div class="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors discovery-item" data-discovery-name="${discovery.name}" data-discovery-type="${discovery.type}">
                    <span class="text-2xl">${icon}</span>
                    <div class="flex-1">
                        <div class="font-medium text-white">${discovery.name}</div>
                        <div class="text-sm text-gray-400">${typeText} • ${actionText}</div>
                    </div>
                </div>
            `;
        }).join('');

        segmentContent.innerHTML = `
            <div class="space-y-3">
                <h5 class="font-semibold text-blue-400 mb-3">Lieux et régions traversés :</h5>
                ${discoveriesHtml}
            </div>
        `;

        // Setup event listeners for discoveries
        this.setupDiscoveryInteractions();
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
        const progressIndicator = this.dom.getElementById('progress-indicator');
        const progressFill = this.dom.getElementById('progress-fill');
        const progressMarker = this.dom.getElementById('progress-marker');
        const totalDaysSpan = this.dom.getElementById('total-days');
        const progressBar = this.dom.getElementById('voyage-progress-bar');

        if (progressBar) {
            progressBar.classList.remove('hidden');
        }

        if (progressIndicator) {
            progressIndicator.textContent = `Progression : ${this.currentDayIndex + 1} / ${this.totalJourneyDays} jours`;
        }

        if (totalDaysSpan) {
            totalDaysSpan.textContent = this.totalJourneyDays;
        }

        if (progressFill && progressMarker) {
            const progressPercentage = ((this.currentDayIndex + 1) / this.totalJourneyDays) * 100;
            progressFill.style.width = `${progressPercentage}%`;
            progressMarker.style.left = `calc(${progressPercentage}% - 12px)`;

            // Update marker text
            const markerText = progressMarker.querySelector('span');
            if (markerText) {
                markerText.textContent = this.currentDayIndex + 1;
            }
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
}