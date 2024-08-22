// stores/user.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    getUser: (state) => state.user,
    getToken: (state) => state.token,
  },
  actions: {
    setUser(user) {
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    setToken(token) {
      this.token = token;
      localStorage.setItem('token', token);
    },
    clearUser() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    initializeFromStorage() {
      if (process.client) {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
          this.user = JSON.parse(storedUser);
          this.token = storedToken;
        }
      }
    },
    async googleSignIn(googleUser) {
      try {
        const { id_token } = googleUser.getAuthResponse();
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id_token }),
        });
        const data = await response.json();
        this.setUser(data.user);
        this.setToken(data.token);
      } catch (error) {
        console.error('Google sign-in error:', error);
      }
    },
  },
});
