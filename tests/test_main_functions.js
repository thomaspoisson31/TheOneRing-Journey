
// Tests unitaires pour les fonctionnalités principales
describe('Application Tests', () => {
    
    // Tests de transformation de carte
    describe('Map Transformations', () => {
        test('should calculate correct scale', () => {
            // Test des calculs de zoom
            expect(calculateNewScale(1, 1.2)).toBe(1.2);
            expect(calculateNewScale(2, 0.5)).toBe(1);
        });
        
        test('should apply transform correctly', () => {
            // Test des transformations CSS
            const result = applyTransform(100, 200, 1.5);
            expect(result).toContain('translate(100px, 200px) scale(1.5)');
        });
    });
    
    // Tests de gestion des distances
    describe('Distance Calculations', () => {
        test('should convert pixels to miles correctly', () => {
            // Avec MAP_WIDTH = 5103 et MAP_DISTANCE_MILES = 1150
            const pixels = 1000;
            const expectedMiles = Math.round(pixels * (1150 / 5103));
            expect(pixelsToMiles(pixels)).toBe(expectedMiles);
        });
        
        test('should convert miles to days correctly', () => {
            const miles = 40;
            const expectedDays = 2; // 20 miles par jour
            expect(milesToDays(miles)).toBe(expectedDays);
        });
    });
    
    // Tests de validation des données
    describe('Data Validation', () => {
        test('should validate location data', () => {
            const validLocation = {
                id: 1,
                name: 'Test Location',
                coordinates: { x: 100, y: 200 },
                color: 'blue'
            };
            expect(validateLocation(validLocation)).toBe(true);
            
            const invalidLocation = {
                id: 1,
                name: '',
                coordinates: null
            };
            expect(validateLocation(invalidLocation)).toBe(false);
        });
        
        test('should validate region data', () => {
            const validRegion = {
                id: 1,
                name: 'Test Region',
                points: [
                    { x: 100, y: 100 },
                    { x: 200, y: 100 },
                    { x: 150, y: 200 }
                ],
                color: 'green'
            };
            expect(validateRegion(validRegion)).toBe(true);
        });
    });
    
    // Tests des utilitaires
    describe('Utility Functions', () => {
        test('should escape HTML correctly', () => {
            expect(escapeHtml('<script>alert("test")</script>'))
                .toBe('&lt;script&gt;alert("test")&lt;/script&gt;');
        });
        
        test('should find nearest location', () => {
            const point = { x: 100, y: 100 };
            const locations = [
                { id: 1, name: 'Close', coordinates: { x: 105, y: 105 }},
                { id: 2, name: 'Far', coordinates: { x: 500, y: 500 }}
            ];
            
            const nearest = findNearestLocation(point, locations);
            expect(nearest.name).toBe('Close');
        });
    });
    
    // Tests de sauvegarde locale
    describe('Local Storage', () => {
        beforeEach(() => {
            localStorage.clear();
        });
        
        test('should save and load locations', () => {
            const testData = {
                locations: [
                    { id: 1, name: 'Test', coordinates: { x: 100, y: 100 }}
                ]
            };
            
            saveLocationsToLocal(testData);
            const loaded = loadLocationsFromLocal();
            expect(loaded.locations).toHaveLength(1);
            expect(loaded.locations[0].name).toBe('Test');
        });
        
        test('should save and load regions', () => {
            const testData = {
                regions: [
                    { id: 1, name: 'Test Region', points: [] }
                ]
            };
            
            saveRegionsToLocal(testData);
            const loaded = loadRegionsFromLocal();
            expect(loaded.regions).toHaveLength(1);
        });
    });
});

// Fonctions utilitaires pour les tests
function validateLocation(location) {
    return location && 
           location.name && 
           location.name.trim() !== '' &&
           location.coordinates &&
           typeof location.coordinates.x === 'number' &&
           typeof location.coordinates.y === 'number';
}

function validateRegion(region) {
    return region &&
           region.name &&
           region.name.trim() !== '' &&
           region.points &&
           Array.isArray(region.points) &&
           region.points.length >= 3;
}

function pixelsToMiles(pixels) {
    return Math.round(pixels * (1150 / 5103));
}

function milesToDays(miles) {
    return Math.ceil(miles / 20);
}
