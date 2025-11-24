class TokenManager {
    constructor() {
        this.tokens = {
            accessToken: localStorage.getItem('accessToken'),
            refreshToken: localStorage.getItem('refreshToken')
        };
    }

    getAccessToken() {
        return this.tokens.accessToken;
    }

    getRefreshToken() {
        return this.tokens.refreshToken;
    }

    setTokens(accessToken, refreshToken) {
        this.tokens.accessToken = accessToken;
        this.tokens.refreshToken = refreshToken;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    clearTokens() {
        this.tokens = { accessToken: null, refreshToken: null };
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    isAuthenticated() {
        return !!this.tokens.accessToken;
    }
}

export default TokenManager;