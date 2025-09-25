// js/utils/helpers.js

function logAuth(message, data = null) {
    console.log(`🔐 [AUTH] ${message}`, data || '');
}

function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

function getCanvasCoordinates(event) {
    const rect = DOM.mapContainer.getBoundingClientRect();
    const x = (event.clientX - rect.left) / AppState.scale;
    const y = (event.clientY - rect.top) / AppState.scale;
    return { x, y };
}

function pixelsToMiles(pixels) {
    return pixels * (AppConfig.MAP_DISTANCE_MILES / AppState.mapWidth);
}

function milesToDays(miles) {
    const days = miles / 20; // 20 miles per day
    return Math.round(days * 2) / 2; // Round to nearest half day
}

function marked(text) {
    if (!text) return '';
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

function waitForElement(selector, callback, maxWait = 5000) {
    const startTime = Date.now();

    function check() {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
        } else if (Date.now() - startTime < maxWait) {
            setTimeout(check, 100);
        } else {
            console.warn("TIMEOUT: Element not found:", selector);
        }
    }

    check();
}