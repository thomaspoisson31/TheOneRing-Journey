// js/features/seasons.js

App.features.seasons = (function() {

    // --- Private Functions ---

    function updateDaySelector() {
        const monthSelect = DOM.get('calendar-month-select');
        const daySelect = DOM.get('calendar-day-select');
        const monthIndex = parseInt(monthSelect.value);

        daySelect.innerHTML = '<option value="">Jour</option>';
        if (monthIndex >= 0 && AppState.calendarData[monthIndex]) {
            AppState.calendarData[monthIndex].days.forEach(day => {
                daySelect.innerHTML += `<option value="${day}">${day}</option>`;
            });
        }
    }

    function updateCalendarDate() {
        const monthIndex = parseInt(DOM.get('calendar-month-select').value);
        const day = parseInt(DOM.get('calendar-day-select').value);

        if (monthIndex >= 0 && !isNaN(day) && AppState.calendarData[monthIndex]) {
            const month = AppState.calendarData[monthIndex];
            AppState.currentCalendarDate = { month: month.name, day: day };
            AppState.currentSeason = month.season.toLowerCase();

            localStorage.setItem('currentSeason', AppState.currentSeason);
            updateDisplay();
            App.api.dataStorage.saveCalendarToLocal();
            App.api.dataStorage.scheduleAutoSync();
        }
    }

    function handleCalendarUpload(e) {
        const file = e.target.files[0];
        if (file && file.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    AppState.calendarData = loadCalendarFromCSV(event.target.result);
                    if (AppState.calendarData.length > 0) {
                        AppState.currentCalendarDate = {
                            month: AppState.calendarData[0].name,
                            day: AppState.calendarData[0].days[0]
                        };
                        updateCalendarUI();
                        updateCalendarDate();
                        alert(`Calendrier importé (${AppState.calendarData.length} mois)`);
                    } else {
                        alert('Fichier CSV invalide.');
                    }
                } catch (error) {
                    console.error('Error importing calendar:', error);
                    alert('Erreur importation calendrier.');
                }
            };
            reader.readAsText(file);
        } else {
            alert('Veuillez sélectionner un fichier CSV.');
        }
        e.target.value = '';
    }

    function loadCalendarFromCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        const calendar = [];
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 3) {
                calendar.push({
                    name: parts[0].trim(),
                    season: parts[1].trim(),
                    days: parts.slice(2).map(d => parseInt(d.trim())).filter(d => !isNaN(d))
                });
            }
        }
        return calendar;
    }

    function exportCalendarToCSV() {
        if (!AppState.calendarData || AppState.calendarData.length === 0) {
            alert('Aucun calendrier à exporter');
            return;
        }
        const csvContent = AppState.calendarData.map(m => `${m.name},${m.season},${m.days.join(',')}`).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'calendrier.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function updateCalendarUI() {
        const status = DOM.getElementById('calendar-status-text');
        const selector = DOM.getElementById('calendar-date-selector');
        const monthSelect = DOM.getElementById('calendar-month-select');
        const manualSeasons = DOM.getElementById('manual-seasons-section');
        const info = DOM.getElementById('season-mode-info');

        if (AppState.calendarData && AppState.calendarData.length > 0) {
            AppState.isCalendarMode = true;
            status.textContent = `Calendrier chargé (${AppState.calendarData.length} mois)`;
            status.className = 'text-green-400';
            selector.classList.remove('hidden');

            monthSelect.innerHTML = '<option value="">Mois</option>';
            AppState.calendarData.forEach((month, index) => {
                const seasonIcon = AppConfig.SEASON_SYMBOLS[month.season.toLowerCase().split('-')[0]] || '🌿';
                monthSelect.innerHTML += `<option value="${index}">${seasonIcon} ${month.name}</option>`;
            });

            if (AppState.currentCalendarDate) {
                const monthIndex = AppState.calendarData.findIndex(m => m.name === AppState.currentCalendarDate.month);
                if (monthIndex >= 0) {
                    monthSelect.value = monthIndex;
                    updateDaySelector();
                    DOM.getElementById('calendar-day-select').value = AppState.currentCalendarDate.day;
                }
            }
            manualSeasons.style.display = 'none';
            info.textContent = 'Mode calendrier : la saison est déterminée par la date.';
        } else {
            AppState.isCalendarMode = false;
            status.textContent = 'Aucun calendrier chargé';
            status.className = 'text-gray-400';
            selector.classList.add('hidden');
            manualSeasons.style.display = 'block';
            info.textContent = 'Mode manuel : sélectionnez une saison.';
        }
    }

    // --- Public Functions ---

    function setupEventListeners() {
        DOM.get('season-indicator')?.addEventListener('click', App.ui.main.openSettingsOnSeasonTab);
        DOM.get('calendar-date-indicator')?.addEventListener('click', App.ui.main.openSettingsOnSeasonTab);

        document.querySelectorAll('input[name="season"]')?.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked && !AppState.isCalendarMode) {
                    AppState.currentSeason = e.target.value;
                    localStorage.setItem('currentSeason', AppState.currentSeason);
                    updateDisplay();
                    App.api.dataStorage.scheduleAutoSync();
                }
            });
        });

        const uploadBtn = DOM.get('upload-calendar-btn');
        const fileInput = DOM.get('calendar-file-input');

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', handleCalendarUpload);
        }

        DOM.get('export-calendar-btn')?.addEventListener('click', exportCalendarToCSV);
        DOM.get('calendar-month-select')?.addEventListener('change', () => {
            updateDaySelector();
            updateCalendarDate();
        });
        DOM.get('calendar-day-select')?.addEventListener('change', updateCalendarDate);
    }

    function updateDisplay() {
        const seasonMainName = AppState.currentSeason.split('-')[0];
        const symbol = AppConfig.SEASON_SYMBOLS[seasonMainName] || '🌿';
        const fullName = AppConfig.SEASON_NAMES[AppState.currentSeason] || AppState.currentSeason;

        const seasonIndicator = DOM.get('season-indicator');
        if (seasonIndicator) {
            seasonIndicator.textContent = symbol;
            seasonIndicator.title = `Saison: ${fullName}`;
        }

        const calendarDateIndicator = DOM.get('calendar-date-indicator');
        if (calendarDateIndicator && AppState.currentCalendarDate && AppState.isCalendarMode) {
            calendarDateIndicator.textContent = `${AppState.currentCalendarDate.day} ${AppState.currentCalendarDate.month}`;
            calendarDateIndicator.classList.remove('hidden');
        } else if (calendarDateIndicator) {
            calendarDateIndicator.classList.add('hidden');
        }

        const settingsSymbol = DOM.get('current-season-symbol');
        const settingsText = DOM.get('current-season-text');
        const settingsDate = DOM.get('current-calendar-date');

        if (settingsSymbol) settingsSymbol.textContent = symbol;
        if (settingsText) settingsText.textContent = fullName;
        if (settingsDate) {
            if (AppState.currentCalendarDate && AppState.isCalendarMode) {
                settingsDate.textContent = `${AppState.currentCalendarDate.day} ${AppState.currentCalendarDate.month}`;
                settingsDate.classList.remove('hidden');
            } else {
                settingsDate.classList.add('hidden');
            }
        }
    }

    function loadSaved() {
        App.api.dataStorage.loadCalendarFromLocal();
        const saved = localStorage.getItem('currentSeason');
        if (saved && AppConfig.SEASON_NAMES[saved]) {
            AppState.currentSeason = saved;
        }

        if (AppState.isCalendarMode && AppState.calendarData) {
            updateCalendarUI();
        } else {
            const radioButton = document.querySelector(`input[name="season"][value="${AppState.currentSeason}"]`);
            if (radioButton) radioButton.checked = true;
            updateCalendarUI();
        }
        updateDisplay();
    }

    return {
        setupEventListeners,
        updateDisplay,
        loadSaved
    };

})();