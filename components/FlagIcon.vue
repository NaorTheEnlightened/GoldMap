<template>
  <div class="flag-icon-wrapper">
    <span :class="['fi', `fi-${countryCode}`]"></span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  iso3: {
    type: String,
    required: true,
  },
});

const countryCode = computed(() => {
  const specialCases = {
    ISR: 'il',
    // Add other special cases here
  };

  if (specialCases[props.iso3]) {
    return specialCases[props.iso3];
  }

  return props.iso3.slice(0, 2).toLowerCase();
});
</script>

<style scoped>
.flag-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 20px;
}

.fi {
  font-size: 30px;
}
</style>
