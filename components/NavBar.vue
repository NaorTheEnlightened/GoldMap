<!-- components/NavBar.vue -->
<template>
  <nav>
    <ul class="flex justify-center items-center">
      <li class="px-2" v-for="route in filteredRoutes" :key="route.path">
        <NuxtLink :to="route.path">{{
          route.name || route.path
        }}</NuxtLink>
      </li>
      <li v-if="userStore.isLoggedIn" class="px-2">
        {{ greeting }} {{ userStore.getUser.name }}!
      </li>
      <li v-if="userStore.isLoggedIn" class="px-2">
        <a @click="handleLogout" class="cursor-pointer">Sign out</a>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { useRouter } from 'nuxt/app';
import { computed, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useUserStore } from '~/stores/user';

const { logout, checkAuth } = useAuth();
const userStore = useUserStore();

const router = useRouter();
const allRoutes = router.options.routes;

// Check authentication status when the component is mounted
onMounted(async () => {
  await checkAuth();
});

const filteredRoutes = computed(() => {
  const routes = allRoutes.filter(
    (route) => !route.meta?.layout && !route.name?.endsWith('*'),
  );
  return routes.filter((route) => {
    if (userStore.isLoggedIn) {
      // If user is logged in, hide the login route
      return route.path !== '/login';
    }
    //  else {
    //   // If user is not logged in, show only public routes
    //   return ['/', '/login', '/register'].includes(route.path);
    // }
    return true;
  });
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
});

const handleLogout = async () => {
  await logout();
  navigateTo('/login');
};
</script>
