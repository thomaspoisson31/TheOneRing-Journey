// js/api/auth.js

App.api.auth = (function() {

    async function checkStatus() {
        App.utils.helpers.logAuth("🔐 [AUTH] Checking authentication status...");
        try {
            const response = await fetch('/api/auth/user');
            App.utils.helpers.logAuth("🔐 [AUTH] Response received:", response.status);

            if (response.ok) {
                const data = await response.json();
                App.utils.helpers.logAuth("🔐 [AUTH] Authentication data received:", data);

                if (data.authenticated && data.user) {
                    AppState.currentUser = data.user;
                    App.utils.helpers.logAuth("🔐 [AUTH] User authenticated:", AppState.currentUser.name);
                    App.ui.main.updateAuthUI(true);
                    await App.api.dataStorage.loadSavedContexts();
                    App.api.dataStorage.enableAutoSync();
                } else {
                    AppState.currentUser = null;
                    App.utils.helpers.logAuth("🔐 [AUTH] User not authenticated", "");
                    App.ui.main.updateAuthUI(false);
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            App.utils.helpers.logAuth("🔐 [AUTH] Error checking authentication:", error.message || error);
            AppState.currentUser = null;
            App.ui.main.updateAuthUI(false);
        }
    }

    function handleGoogleSignIn() {
        App.utils.helpers.logAuth("Redirecting to Google OAuth...");
        window.location.href = '/auth/google';
    }

    function checkError() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth_error')) {
            App.utils.helpers.logAuth("ERROR: Google authentication failed.", urlParams.get('desc'));
            alert("Erreur lors de l'authentification Google. Veuillez réessayer.");
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlParams.get('auth_success') === '1') {
            App.utils.helpers.logAuth("SUCCESS: Google authentication successful.");
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => {
                checkStatus();
            }, 500);
        }
    }

    return {
        checkStatus,
        handleGoogleSignIn,
        checkError
    };

})();