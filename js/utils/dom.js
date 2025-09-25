// js/utils/dom.js

App.utils.dom = (function() {
    const cache = {};

    function get(id) {
        if (cache[id]) {
            return cache[id];
        }
        const element = document.getElementById(id);
        if (element) {
            cache[id] = element;
        } else {
            // This console.error is useful for debugging if an ID is misspelled or the element doesn't exist.
            console.error(`DOM element with id "${id}" not found.`);
        }
        return element;
    }

    function getCtx() {
        const canvas = get('drawing-canvas');
        if (canvas) {
            return canvas.getContext('2d');
        }
        return null;
    }

    function querySelector(selector) {
        return document.querySelector(selector);
    }

    function showModal(modalElement) {
        if (modalElement) modalElement.classList.remove('hidden');
    }

    function hideModal(modalElement) {
        if (modalElement) modalElement.classList.add('hidden');
    }

    return {
        get,
        getCtx,
        querySelector,
        showModal,
        hideModal
    };
})();

// For easier access, we can still use DOM as a shorthand
const DOM = App.utils.dom;