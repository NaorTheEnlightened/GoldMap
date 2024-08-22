// composables/useAuth.js
import { useUserStore } from '~/stores/user';
import { useFetch } from '#app';

export const useAuth = () => {
  const userStore = useUserStore();

  const login = async (email, password) => {
    try {
      const { data, error } = await useFetch('/api/auth', {
        method: 'POST',
        body: { email, password },
      });

      if (error.value) {
        throw new Error(error.value.statusMessage || 'Login failed');
      }

      userStore.setUser(data.value.user);
      userStore.setToken(data.value.token);
      localStorage.setItem('token', data.value.token);
      return data.value.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  const googleLogin = async (user, token) => {
    try {
      const { data, error } = await useFetch('/api/auth', {
        method: 'POST',
        body: { token },
      });

      if (!user) {
        throw new Error(error.value.statusMessage || 'Login failed');
      }

      userStore.setUser(data.value.user);
      userStore.setToken(data.value.token);

      localStorage.setItem('token', data.value.token);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data, error } = await useFetch('/api/auth', {
        method: 'POST',
        body: { name, email, password },
      });

      if (error.value) {
        throw new Error(
          error.value.statusMessage || 'Registration failed',
        );
      }

      userStore.setUser(data.value.user);
      userStore.setToken(data.value.token);
      localStorage.setItem('token', data.value.token);
      return data.value.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      userStore.clearUser();
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const checkAuth = async () => {
    try {
      if (userStore.isLoggedIn) return;

      userStore.initializeFromStorage();
      if (userStore.isLoggedIn) {
        const token = localStorage.getItem('token');
        if (!token) {
          return null;
        }

        const { data, error } = await useFetch('/api/auth', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (error.value) {
          throw new Error('Authentication failed');
        }

        userStore.setUser(data.value);
        userStore.setToken(token);
        return data.value;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      userStore.clearUser();
      localStorage.removeItem('token');
      return null;
    }
  };

  return {
    login,
    googleLogin,
    register,
    logout,
    checkAuth,
  };
};
