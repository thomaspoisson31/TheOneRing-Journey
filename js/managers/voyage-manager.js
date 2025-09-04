
class VoyageManager {
    constructor(domElements) {
        this.dom = domElements;
        this.currentSegmentIndex = 0;
        this.segments = [];
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

        // Navigation buttons
        const prevBtn = this.dom.getElementById('prev-segment-btn');
        const nextBtn = this.dom.getElementById('next-segment-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.navigateToSegment(this.currentSegmentIndex - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.navigateToSegment(this.currentSegmentIndex + 1);
            });
        }

        // Duration slider event listener
        const durationSlider = this.dom.getElementById('current-segment-duration');
        const durationValue = this.dom.getElementById('current-segment-duration-value');
        
        if (durationSlider && durationValue) {
            durationSlider.addEventListener('input', (e) => {
                const newDuration = parseInt(e.target.value);
                if (isNaN(newDuration) || newDuration < 1) {
                    durationValue.textContent = '—';
                    this.showDurationSelectionMessage();
                } else {
                    durationValue.textContent = newDuration;
                    // Store the duration for this segment
                    if (this.segments[this.currentSegmentIndex]) {
                        this.segments[this.currentSegmentIndex].duration = newDuration;
                    }
                    // Regenerate content with new duration
                    this.generateDayByDayContent(newDuration);
                }
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

        // Calculate journey duration in days for reference
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

        // Initialize segments if not done
        this.initializeSegments(journeyDays);

        // Set duration slider to exactly 1-6 days
        const durationSlider = this.dom.getElementById('current-segment-duration');
        const durationValue = this.dom.getElementById('current-segment-duration-value');
        if (durationSlider && durationValue) {
            durationSlider.min = '1';
            durationSlider.max = '6';
            durationSlider.value = '';
            durationValue.textContent = '—';
        }

        // Update navigation buttons state
        this.updateNavigationButtons();

        // Show initial message without content
        this.showDurationSelectionMessage();
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

    showDurationSelectionMessage() {
        const segmentContent = this.dom.getElementById('segment-content');
        if (segmentContent) {
            segmentContent.innerHTML = '<p class="text-gray-400 text-center p-4">Choisissez une durée pour ce segment pour voir la répartition jour par jour.</p>';
        }
    }

    generateDayByDayContent(totalDays) {
        const segmentContent = this.dom.getElementById('segment-content');
        if (!segmentContent || !totalDays || totalDays < 1) return;

        const discoveries = AppState.journey.discoveries.sort((a, b) => a.discoveryIndex - b.discoveryIndex);
        
        // Calculate total journey stats
        const totalMiles = AppState.journey.totalPathPixels * (CONFIG.MAP.DISTANCE_MILES / AppState.mapDimensions.width);
        const totalPathPoints = AppState.journey.path.length;

        // Build the absolute timeline of the complete journey
        const absoluteTimeline = [];
        let currentAbsoluteDay = 1;
        
        discoveries.forEach(discovery => {
            if (discovery.type === 'location') {
                // Location appears at current absolute day
                absoluteTimeline.push({
                    discovery: discovery,
                    absoluteDay: currentAbsoluteDay,
                    type: 'location'
                });
            } else if (discovery.type === 'region') {
                // Calculate region's natural duration
                const segmentLength = discovery.endIndex - discovery.startIndex + 1;
                const segmentRatio = segmentLength / totalPathPoints;
                const segmentMiles = totalMiles * segmentRatio;
                const regionDuration = Math.max(1, Math.ceil(segmentMiles / CONFIG.JOURNEY.MILES_PER_DAY));
                
                // Region spans multiple days
                const regionStartDay = currentAbsoluteDay;
                const regionEndDay = currentAbsoluteDay + regionDuration - 1;
                
                absoluteTimeline.push({
                    discovery: discovery,
                    absoluteStartDay: regionStartDay,
                    absoluteEndDay: regionEndDay,
                    type: 'region'
                });
                
                // Advance absolute day counter
                currentAbsoluteDay += regionDuration;
            }
        });

        // For this segment, only show discoveries that occur within the first totalDays
        const segmentDays = Array(totalDays).fill().map((_, i) => ({ 
            day: i + 1, 
            absoluteDay: i + 1, 
            discoveries: [] 
        }));

        // Filter and assign discoveries to segment days
        absoluteTimeline.forEach(timelineItem => {
            if (timelineItem.type === 'location') {
                // Location appears on a specific day
                if (timelineItem.absoluteDay <= totalDays) {
                    const segmentDayIndex = timelineItem.absoluteDay - 1;
                    segmentDays[segmentDayIndex].discoveries.push(timelineItem.discovery);
                }
            } else if (timelineItem.type === 'region') {
                // Region spans multiple days - add to each day it covers within segment
                for (let day = timelineItem.absoluteStartDay; day <= timelineItem.absoluteEndDay; day++) {
                    if (day <= totalDays) {
                        const segmentDayIndex = day - 1;
                        // Avoid duplicates
                        const exists = segmentDays[segmentDayIndex].discoveries.some(d => 
                            d.name === timelineItem.discovery.name && d.type === timelineItem.discovery.type
                        );
                        if (!exists) {
                            segmentDays[segmentDayIndex].discoveries.push(timelineItem.discovery);
                        }
                    }
                }
            }
        });

        // Generate HTML
        const daysHtml = segmentDays.map(dayData => {
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
        
        // Update progression after generating content
        this.updateProgression(totalDays);
    }

    initializeSegments(totalJourneyDays) {
        // Create default segments structure
        this.segments = [{
            index: 0,
            duration: null,
            totalJourneyDays: totalJourneyDays
        }];
        this.currentSegmentIndex = 0;
    }

    navigateToSegment(targetIndex) {
        if (targetIndex < 0) return;

        // For now, we only support the first segment
        // In the future, this could be expanded to support multiple segments
        if (targetIndex > 0) {
            // Create a new segment if needed
            if (!this.segments[targetIndex]) {
                this.segments[targetIndex] = {
                    index: targetIndex,
                    duration: null,
                    totalJourneyDays: this.segments[0].totalJourneyDays
                };
            }
            this.currentSegmentIndex = targetIndex;
            this.renderCurrentSegment();
        } else if (targetIndex === 0) {
            this.currentSegmentIndex = 0;
            this.renderCurrentSegment();
        }
    }

    updateNavigationButtons() {
        const prevBtn = this.dom.getElementById('prev-segment-btn');
        const nextBtn = this.dom.getElementById('next-segment-btn');
        
        if (prevBtn) {
            prevBtn.style.opacity = this.currentSegmentIndex > 0 ? '1' : '0.3';
            prevBtn.style.cursor = this.currentSegmentIndex > 0 ? 'pointer' : 'not-allowed';
        }
        
        if (nextBtn) {
            // For now, always enable next button for demonstration
            // In a full implementation, this would check if there are remaining days
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }
    }

    updateProgression(currentSegmentDays) {
        // Calculate cumulative days up to current segment
        let cumulativeDays = 0;
        for (let i = 0; i <= this.currentSegmentIndex; i++) {
            if (i < this.currentSegmentIndex) {
                // Previous segments with their defined durations
                cumulativeDays += this.segments[i]?.duration || 0;
            } else {
                // Current segment
                cumulativeDays += currentSegmentDays || 0;
            }
        }

        const totalJourneyDays = this.segments[0]?.totalJourneyDays || 1;
        
        // Update segment title to include progression
        const segmentTitle = this.dom.getElementById('segment-title');
        const discoveries = AppState.journey.discoveries;
        const firstLocation = discoveries.find(d => d.type === 'location');
        const lastLocation = discoveries.slice().reverse().find(d => d.type === 'location');
        
        let baseTitleText;
        if (firstLocation && lastLocation && firstLocation !== lastLocation) {
            baseTitleText = `De ${firstLocation.name} jusqu'à ${lastLocation.name}`;
        } else if (firstLocation) {
            baseTitleText = `Voyage depuis ${firstLocation.name}`;
        } else {
            baseTitleText = 'Voyage en Terre du Milieu';
        }
        
        if (segmentTitle) {
            segmentTitle.innerHTML = `
                <div class="text-center">
                    <div class="text-lg font-semibold">${this.currentSegmentIndex + 1}. ${baseTitleText}</div>
                    <div class="text-sm text-gray-400 mt-1">Progression : ${cumulativeDays} / ${totalJourneyDays} jours</div>
                </div>
            `;
        }
    }
}
