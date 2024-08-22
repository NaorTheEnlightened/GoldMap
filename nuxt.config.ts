// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  debug: true,
  plugins: [
    '~/plugins/prisma.js',
    '~/plugins/auth.js',
    { src: '~/plugins/vue-leaflet.client.js', mode: 'client' },
  ],
  build: {
    transpile: ['leaflet'],
  },
  sourcemap: {
    server: true,
    client: true,
  },
  runtimeConfig: {
    // Keys within public are also exposed client-side
    public: {
      apiBase: '/api',
    },
    // The private keys which are only available server-side
    apiSecret: '123',
    jwtSecret: process.env.JWT_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
  },
  modules: ['@pinia/nuxt', 'nuxt-vue3-google-signin', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css', 'leaflet/dist/leaflet.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  googleSignIn: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
});
