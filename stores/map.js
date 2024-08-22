import { defineStore } from 'pinia';

export const useMapStore = defineStore('map', {
  state: () => ({
    countries: [],
  }),
  actions: {
    setCountries(countries) {
      this.countries = countries;
    },
  },
});
