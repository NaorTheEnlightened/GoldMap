// plugins/auth.js
import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin(async (nuxtApp) => {
  const { checkAuth } = useAuth();
  await checkAuth();
});
