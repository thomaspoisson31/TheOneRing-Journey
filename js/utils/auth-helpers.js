
// Auth error checking function
function checkAuthError() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === 'access_denied') {
        console.log("Connexion Google annulée par l'utilisateur");
        // Clean URL
        const url = new URL(window.location);
        url.searchParams.delete('error');
        window.history.replaceState({}, document.title, url.pathname);
    }
}

// Export for global use
window.checkAuthError = checkAuthError;
