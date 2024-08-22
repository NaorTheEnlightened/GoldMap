<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import 'leaflet/dist/leaflet.css';
import 'flag-icons/css/flag-icons.min.css';
const runtimeConfig = useRuntimeConfig();
const appConfig = useAppConfig();
</script>
