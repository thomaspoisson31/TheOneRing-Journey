
class AuthManager {
    constructor(domElements) {
        this.dom = domElements;
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        const authBtn = this.dom.authBtn;
        const closeBtn = this.dom.getElementById('close-auth-modal');
        const googleSigninBtn = this.dom.getElementById('google-signin-btn');
        
        if (authBtn) {
            authBtn.addEventListener('click', () => {
                this.dom.showModal(this.dom.authModal);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.dom.hideModal(this.dom.authModal);
            });
        }
        
        if (googleSigninBtn) {
            googleSigninBtn.addEventListener('click', () => {
                window.location.href = '/auth/google';
            });
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/user');
            const data = await response.json();
            
            if (data.authenticated) {
                AppState.auth.googleUser = data.user;
            } else {
                AppState.auth.googleUser = null;
            }
            
            this.displayAuthStatus();
        } catch (error) {
            console.error('Auth check failed:', error);
            AppState.auth.googleUser = null;
            this.displayAuthStatus();
        }
    }

    displayAuthStatus() {
        const authStatusPanel = this.dom.getElementById('auth-status-panel');
        const authContentPanel = this.dom.getElementById('auth-content-panel');
        const loggedInPanel = this.dom.getElementById('logged-in-panel');
        const loggedOutPanel = this.dom.getElementById('logged-out-panel');
        
        if (authStatusPanel) authStatusPanel.classList.add('hidden');
        if (authContentPanel) authContentPanel.classList.remove('hidden');
        
        if (AppState.auth.googleUser) {
            if (loggedInPanel) loggedInPanel.classList.remove('hidden');
            if (loggedOutPanel) loggedOutPanel.classList.add('hidden');
        } else {
            if (loggedInPanel) loggedInPanel.classList.add('hidden');
            if (loggedOutPanel) loggedOutPanel.classList.remove('hidden');
        }
    }
}
