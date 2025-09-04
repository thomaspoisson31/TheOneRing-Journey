
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
        
        // Initialize days content
        const daysContent = [];
        for (let day = 1; day <= totalDays; day++) {
            daysContent.push({
                day: day,
                discoveries: []
            });
        }

        // Calculate the original total journey days based on region durations
        const totalMiles = AppState.journey.totalPathPixels * (CONFIG.MAP.DISTANCE_MILES / AppState.mapDimensions.width);
        const originalTotalDays = Math.max(1, Math.ceil(totalMiles / CONFIG.JOURNEY.MILES_PER_DAY));
        
        // Create a timeline of discoveries with their original day positions
        const timeline = [];
        let currentDay = 1;
        
        discoveries.forEach(discovery => {
            if (discovery.type === 'region') {
                // For regions, calculate their original duration
                const totalPathPoints = AppState.journey.path.length;
                const segmentLength = discovery.endIndex - discovery.startIndex + 1;
                const segmentRatio = segmentLength / totalPathPoints;
                const segmentMiles = totalMiles * segmentRatio;
                const originalRegionDays = Math.max(1, Math.ceil(segmentMiles / CONFIG.JOURNEY.MILES_PER_DAY));
                
                // Add the region for each day it spans
                for (let i = 0; i < originalRegionDays; i++) {
                    timeline.push({
                        day: currentDay + i,
                        discovery: discovery,
                        isRegionDay: i + 1,
                        totalRegionDays: originalRegionDays
                    });
                }
                currentDay += originalRegionDays;
            } else {
                // For locations, add them at the current day
                timeline.push({
                    day: currentDay,
                    discovery: discovery,
                    isRegionDay: false
                });
            }
        });

        // Now redistribute the timeline across the new segment duration
        timeline.forEach(item => {
            // Map original day to new segment day
            const normalizedPosition = (item.day - 1) / (originalTotalDays - 1 || 1);
            const newDay = Math.floor(normalizedPosition * (totalDays - 1)) + 1;
            const targetDayIndex = Math.min(newDay - 1, totalDays - 1);
            
            // Check if this discovery is already in this day to avoid duplicates
            const existingDiscovery = daysContent[targetDayIndex].discoveries.find(d => 
                d.name === item.discovery.name && d.type === item.discovery.type
            );
            
            if (!existingDiscovery) {
                daysContent[targetDayIndex].discoveries.push(item.discovery);
            }
        });

        // Generate HTML
        const daysHtml = daysContent.map(dayData => {
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
