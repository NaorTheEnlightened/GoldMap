<!-- components/LoginForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="max-w-md mx-auto">
    <div class="mb-4">
      <label for="email" class="block mb-2">Email</label>
      <input
        v-model="email"
        type="email"
        id="email"
        required
        class="w-full px-3 py-2 border rounded"
      />
    </div>
    <div class="mb-4">
      <label for="password" class="block mb-2">Password</label>
      <input
        v-model="password"
        type="password"
        id="password"
        required
        class="w-full px-3 py-2 border rounded"
      />
    </div>
    <button
      type="submit"
      class="w-full bg-blue-500 text-white py-2 rounded"
    >
      Login
    </button>
    <GoogleOAuth />
    <p class="mt-4 text-center">
      Don't have an account?
      <a @click="$emit('switch')" class="text-blue-500 cursor-pointer"
        >Register</a
      >
    </p>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useUserStore } from '~/stores/user';

const email = ref('');
const password = ref('');
const { login } = useAuth();
const userStore = useUserStore();

const handleSubmit = async () => {
  try {
    await login(email.value, password.value);
    if (userStore.isLoggedIn) {
      // Redirect to home page or dashboard
      navigateTo('/');
    }
  } catch (error) {
    console.error('Login failed:', error);
    // Handle error (e.g., show error message to user)
  }
};
</script>
