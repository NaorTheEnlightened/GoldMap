import { defineNuxtPlugin } from '#app';
import {
  LMap,
  LTileLayer,
  LMarker,
  LPopup,
  LGeoJson,
} from '@vue-leaflet/vue-leaflet';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('LMap', LMap);
  nuxtApp.vueApp.component('LTileLayer', LTileLayer);
  nuxtApp.vueApp.component('LMarker', LMarker);
  nuxtApp.vueApp.component('LPopup', LPopup);
  nuxtApp.vueApp.component('LGeoJson', LGeoJson);
});
