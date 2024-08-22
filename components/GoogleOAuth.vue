<script setup>
import { GoogleSignInButton } from 'vue3-google-signin';
import { useUserStore } from '~/stores/user';

// handle success event

const handleLoginSuccess = async (response) => {
  const { googleLogin } = useAuth();
  const { credential } = response;
  const userStore = useUserStore();
  let user;
  if (credential) {
    user = await useFetch('/api/auth', {
      method: 'POST',
      body: {
        token: credential,
      },
    });
    try {
      await googleLogin(user.data.value.user, credential);
      if (userStore.isLoggedIn) {
        // Redirect to home page or dashboard
        navigateTo('/');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Handle error (e.g., show error message to user)
    }
  }
  console.log('Access Token', credential);
};

// handle an error event
const handleLoginError = async () => {
  console.error('Login failed');
};
</script>

<template>
  <GoogleSignInButton
    class="mt-4"
    @success="handleLoginSuccess"
    @error="handleLoginError"
  ></GoogleSignInButton>
</template>
