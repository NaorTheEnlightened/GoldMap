<!-- pages/login.vue -->
<template>
  <div class="container mx-auto mt-10">
    <h1 class="text-3xl font-bold mb-5 text-center">
      {{ isLogin ? 'Login' : 'Register' }}
    </h1>
    <LoginForm v-if="isLogin" @switch="toggleForm" />
    <RegisterForm v-else @switch="toggleForm" />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isLogin = ref(true);

const toggleForm = () => {
  isLogin.value = !isLogin.value;
};
</script>
