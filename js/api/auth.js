// js/api/auth.js

async function checkAuthStatus() {
    logAuth("🔐 [AUTH] Checking authentication status...");
    try {
        const response = await fetch('/api/auth/user');
        logAuth("🔐 [AUTH] Response received:", response.status);

        if (response.ok) {
            const data = await response.json();
            logAuth("🔐 [AUTH] Authentication data received:", data);

            if (data.authenticated && data.user) {
                AppState.currentUser = data.user;
                logAuth("🔐 [AUTH] User authenticated:", AppState.currentUser.name);
                updateAuthUI(true);
                await loadSavedContexts();
                enableAutoSync();
            } else {
                AppState.currentUser = null;
                logAuth("🔐 [AUTH] User not authenticated", "");
                updateAuthUI(false);
            }
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        logAuth("🔐 [AUTH] Error checking authentication:", error.message || error);
        AppState.currentUser = null;
        updateAuthUI(false);
    }
}

function handleGoogleSignIn() {
    logAuth("Redirecting to Google OAuth...");
    window.location.href = '/auth/google';
}

function checkAuthError() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_error')) {
        logAuth("ERROR: Google authentication failed.", urlParams.get('desc'));
        alert("Erreur lors de l'authentification Google. Veuillez réessayer.");
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('auth_success') === '1') {
        logAuth("SUCCESS: Google authentication successful.");
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
            checkAuthStatus();
        }, 500);
    }
}