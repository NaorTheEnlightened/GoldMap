<template>
  <div>
    <header>
      <h1>{{ pageTitle }}</h1>
    </header>
    <NuxtSlot />
  </div>
</template>

<script setup>
const route = useRoute();

const pageTitle = computed(() => {
  const fileName = route.fullPath.split('/').pop()?.replace('.vue', '');
  return fileName || 'Index';
});

definePageMeta({
  title: pageTitle,
});
</script>
