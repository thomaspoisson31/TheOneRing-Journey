
class VoyageManager {
    constructor(domElements) {
        this.dom = domElements;
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

        // Duration slider event listener
        const durationSlider = this.dom.getElementById('current-segment-duration');
        const durationValue = this.dom.getElementById('current-segment-duration-value');
        
        if (durationSlider && durationValue) {
            durationSlider.addEventListener('input', (e) => {
                const newDuration = parseInt(e.target.value);
                durationValue.textContent = newDuration;
                // Regenerate content with new duration
                this.generateDayByDayContent(newDuration);
            });
        }
    }

    updateDisplay() {
        const noVoyageMessage = this.dom.getElementById('no-voyage-message');
        const currentSegmentDisplay = this.dom.getElementById('current-segment-display');
        
        if (AppState.journey.path.length === 0) {
            noVoyageMessage.classList.remove('hidden');
            currentSegmentDisplay.classList.add('hidden');
        } else {
            noVoyageMessage.classList.add('hidden');
            currentSegmentDisplay.classList.remove('hidden');
            this.renderCurrentSegment();
        }
    }

    renderCurrentSegment() {
        console.log('Rendering voyage segments...');
        
        if (!AppState.journey.discoveries || AppState.journey.discoveries.length === 0) {
            this.renderEmptySegment();
            return;
        }

        // Calculate journey duration in days
        const miles = AppState.journey.totalPathPixels * (CONFIG.MAP.DISTANCE_MILES / AppState.mapDimensions.width);
        const days = Math.ceil(miles / CONFIG.JOURNEY.MILES_PER_DAY);
        const journeyDays = Math.max(1, days);

        // Update segment title
        const segmentTitle = this.dom.getElementById('segment-title');
        const discoveries = AppState.journey.discoveries;
        const firstLocation = discoveries.find(d => d.type === 'location');
        const lastLocation = discoveries.slice().reverse().find(d => d.type === 'location');
        
        if (firstLocation && lastLocation && firstLocation !== lastLocation) {
            segmentTitle.textContent = `1. De ${firstLocation.name} jusqu'à ${lastLocation.name}`;
        } else if (firstLocation) {
            segmentTitle.textContent = `1. Voyage depuis ${firstLocation.name}`;
        } else {
            segmentTitle.textContent = '1. Voyage en Terre du Milieu';
        }

        // Update duration slider
        const durationSlider = this.dom.getElementById('current-segment-duration');
        const durationValue = this.dom.getElementById('current-segment-duration-value');
        if (durationSlider && durationValue) {
            durationSlider.value = journeyDays;
            durationValue.textContent = journeyDays;
        }

        // Generate day-by-day content
        this.generateDayByDayContent(journeyDays);
    }

    renderEmptySegment() {
        const segmentTitle = this.dom.getElementById('segment-title');
        const segmentContent = this.dom.getElementById('segment-content');
        
        if (segmentTitle) {
            segmentTitle.textContent = 'Aucun voyage tracé';
        }
        
        if (segmentContent) {
            segmentContent.innerHTML = '<p class="text-gray-400 text-center p-4">Tracez un chemin sur la carte pour voir les détails du voyage.</p>';
        }
    }

    generateDayByDayContent(totalDays) {
        const segmentContent = this.dom.getElementById('segment-content');
        if (!segmentContent) return;

        const discoveries = AppState.journey.discoveries.sort((a, b) => a.discoveryIndex - b.discoveryIndex);
        
        // Calculate total journey stats
        const totalMiles = AppState.journey.totalPathPixels * (CONFIG.MAP.DISTANCE_MILES / AppState.mapDimensions.width);
        const totalPathPoints = AppState.journey.path.length;

        // Create timeline with actual durations from the "Découvertes du voyage"
        const timeline = [];
        let timelineDay = 1;
        
        discoveries.forEach(discovery => {
            if (discovery.type === 'region') {
                // Calculate region duration from segment ratio
                const segmentLength = discovery.endIndex - discovery.startIndex + 1;
                const segmentRatio = segmentLength / totalPathPoints;
                const segmentMiles = totalMiles * segmentRatio;
                const regionDuration = Math.max(1, Math.ceil(segmentMiles / CONFIG.JOURNEY.MILES_PER_DAY));
                
                // Add each day of the region
                for (let day = 0; day < regionDuration; day++) {
                    timeline.push({
                        originalDay: timelineDay + day,
                        discovery: discovery,
                        isRegionDay: day + 1,
                        totalRegionDays: regionDuration
                    });
                }
                timelineDay += regionDuration;
            } else {
                // Location discovery
                timeline.push({
                    originalDay: timelineDay,
                    discovery: discovery,
                    isLocation: true
                });
                // Locations don't consume time by themselves
            }
        });

        const originalTotalDays = timelineDay - 1;

        // Initialize segment days
        const segmentDays = [];
        for (let day = 1; day <= totalDays; day++) {
            segmentDays.push({
                day: day,
                discoveries: []
            });
        }

        // Distribute timeline elements across segment days
        timeline.forEach(timelineItem => {
            // Map original timeline day to segment day
            const ratio = (timelineItem.originalDay - 1) / Math.max(1, originalTotalDays - 1);
            const segmentDayIndex = Math.min(
                Math.floor(ratio * (totalDays - 1)),
                totalDays - 1
            );
            
            // Avoid duplicate discoveries on same day
            const existingDiscovery = segmentDays[segmentDayIndex].discoveries.find(d => 
                d.discovery.name === timelineItem.discovery.name && 
                d.discovery.type === timelineItem.discovery.type
            );
            
            if (!existingDiscovery) {
                segmentDays[segmentDayIndex].discoveries.push(timelineItem);
            }
        });

        // Generate HTML
        const daysHtml = segmentDays.map(dayData => {
            const discoveriesHtml = dayData.discoveries.map(item => {
                const discovery = item.discovery;
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
                    <div class="flex items-center space-x-2 p-2 bg-gray-800 rounded">
                        <span class="text-lg">${icon}</span>
                        <div class="flex-1">
                            <div class="font-medium text-white">${discovery.name}</div>
                            <div class="text-xs text-gray-400">${typeText} • ${actionText}</div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="day-section mb-4">
                    <h5 class="font-semibold text-blue-400 mb-2">Jour ${dayData.day} :</h5>
                    <div class="space-y-2">
                        ${discoveriesHtml || '<p class="text-gray-500 text-sm italic">Voyage tranquille...</p>'}
                    </div>
                </div>
            `;
        }).join('');

        segmentContent.innerHTML = `<div class="space-y-3">${daysHtml}</div>`;
    }
}
