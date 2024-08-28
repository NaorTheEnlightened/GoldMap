<template>
  <div class="gold-map">
    <client-only>
      <l-map
        ref="map"
        v-model:zoom="zoom"
        :center="center"
        :use-global-leaflet="false"
        @ready="onMapReady"
      >
        <l-tile-layer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          layer-type="base"
          name="OpenStreetMap"
        ></l-tile-layer>
        <l-geo-json
          :geojson="countriesGeoJSON"
          :options="geoJSONOptions"
          @ready="onGeoJsonReady"
        ></l-geo-json>
      </l-map>
    </client-only>
    <div v-if="loading" class="loading-overlay">
      <p>Loading data...</p>
    </div>
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted, computed, h } from 'vue';
import { storeToRefs } from 'pinia';
import { useMapStore } from '~/stores/map';
import 'leaflet/dist/leaflet.css';

let L;
if (process.client) {
  L = await import('leaflet');
}

const mapStore = useMapStore();
const { countries } = storeToRefs(mapStore);
const geoJsonLayer = ref(null);
const error = ref(null);
const map = ref(null);
const zoom = ref(3);
const center = ref([0, 0]);
const isMapReady = ref(false);
const loading = ref(false);

const iso3toiso2 = {
  AFG: 'AF',
  ALA: 'AX',
  ALB: 'AL',
  DZA: 'DZ',
  ASM: 'AS',
  AND: 'AD',
  AGO: 'AO',
  AIA: 'AI',
  ATA: 'AQ',
  ATG: 'AG',
  ARG: 'AR',
  ARM: 'AM',
  ABW: 'AW',
  AUS: 'AU',
  AUT: 'AT',
  AZE: 'AZ',
  BHS: 'BS',
  BHR: 'BH',
  BGD: 'BD',
  BRB: 'BB',
  BLR: 'BY',
  BEL: 'BE',
  BLZ: 'BZ',
  BEN: 'BJ',
  BMU: 'BM',
  BTN: 'BT',
  BOL: 'BO',
  BES: 'BQ',
  BIH: 'BA',
  BWA: 'BW',
  BVT: 'BV',
  BRA: 'BR',
  IOT: 'IO',
  BRN: 'BN',
  BGR: 'BG',
  BFA: 'BF',
  BDI: 'BI',
  CPV: 'CV',
  KHM: 'KH',
  CMR: 'CM',
  CAN: 'CA',
  CYM: 'KY',
  CAF: 'CF',
  TCD: 'TD',
  CHL: 'CL',
  CHN: 'CN',
  CXR: 'CX',
  CCK: 'CC',
  COL: 'CO',
  COM: 'KM',
  COG: 'CG',
  COD: 'CD',
  COK: 'CK',
  CRI: 'CR',
  CIV: 'CI',
  HRV: 'HR',
  CUB: 'CU',
  CUW: 'CW',
  CYP: 'CY',
  CZE: 'CZ',
  DNK: 'DK',
  DJI: 'DJ',
  DMA: 'DM',
  DOM: 'DO',
  ECU: 'EC',
  EGY: 'EG',
  SLV: 'SV',
  GNQ: 'GQ',
  ERI: 'ER',
  EST: 'EE',
  SWZ: 'SZ',
  ETH: 'ET',
  FLK: 'FK',
  FRO: 'FO',
  FJI: 'FJ',
  FIN: 'FI',
  FRA: 'FR',
  GUF: 'GF',
  PYF: 'PF',
  ATF: 'TF',
  GAB: 'GA',
  GMB: 'GM',
  GEO: 'GE',
  DEU: 'DE',
  GHA: 'GH',
  GIB: 'GI',
  GRC: 'GR',
  GRL: 'GL',
  GRD: 'GD',
  GLP: 'GP',
  GUM: 'GU',
  GTM: 'GT',
  GGY: 'GG',
  GIN: 'GN',
  GNB: 'GW',
  GUY: 'GY',
  HTI: 'HT',
  HMD: 'HM',
  VAT: 'VA',
  HND: 'HN',
  HKG: 'HK',
  HUN: 'HU',
  ISL: 'IS',
  IND: 'IN',
  IDN: 'ID',
  IRN: 'IR',
  IRQ: 'IQ',
  IRL: 'IE',
  IMN: 'IM',
  ISR: 'IL',
  ITA: 'IT',
  JAM: 'JM',
  JPN: 'JP',
  JEY: 'JE',
  JOR: 'JO',
  KAZ: 'KZ',
  KEN: 'KE',
  KIR: 'KI',
  PRK: 'KP',
  KOR: 'KR',
  KWT: 'KW',
  KGZ: 'KG',
  LAO: 'LA',
  LVA: 'LV',
  LBN: 'LB',
  LSO: 'LS',
  LBR: 'LR',
  LBY: 'LY',
  LIE: 'LI',
  LTU: 'LT',
  LUX: 'LU',
  MAC: 'MO',
  MDG: 'MG',
  MWI: 'MW',
  MYS: 'MY',
  MDV: 'MV',
  MLI: 'ML',
  MLT: 'MT',
  MHL: 'MH',
  MTQ: 'MQ',
  MRT: 'MR',
  MUS: 'MU',
  MYT: 'YT',
  MEX: 'MX',
  FSM: 'FM',
  MDA: 'MD',
  MCO: 'MC',
  MNG: 'MN',
  MNE: 'ME',
  MSR: 'MS',
  MAR: 'MA',
  MOZ: 'MZ',
  MMR: 'MM',
  NAM: 'NA',
  NRU: 'NR',
  NPL: 'NP',
  NLD: 'NL',
  NCL: 'NC',
  NZL: 'NZ',
  NIC: 'NI',
  NER: 'NE',
  NGA: 'NG',
  NIU: 'NU',
  NFK: 'NF',
  MKD: 'MK',
  MNP: 'MP',
  NOR: 'NO',
  OMN: 'OM',
  PAK: 'PK',
  PLW: 'PW',
  PSE: 'PS',
  PAN: 'PA',
  PNG: 'PG',
  PRY: 'PY',
  PER: 'PE',
  PHL: 'PH',
  PCN: 'PN',
  POL: 'PL',
  PRT: 'PT',
  PRI: 'PR',
  QAT: 'QA',
  REU: 'RE',
  ROU: 'RO',
  RUS: 'RU',
  RWA: 'RW',
  BLM: 'BL',
  SHN: 'SH',
  KNA: 'KN',
  LCA: 'LC',
  MAF: 'MF',
  SPM: 'PM',
  VCT: 'VC',
  WSM: 'WS',
  SMR: 'SM',
  STP: 'ST',
  SAU: 'SA',
  SEN: 'SN',
  SRB: 'RS',
  SYC: 'SC',
  SLE: 'SL',
  SGP: 'SG',
  SXM: 'SX',
  SVK: 'SK',
  SVN: 'SI',
  SLB: 'SB',
  SOM: 'SO',
  ZAF: 'ZA',
  SGS: 'GS',
  SSD: 'SS',
  ESP: 'ES',
  LKA: 'LK',
  SDN: 'SD',
  SUR: 'SR',
  SJM: 'SJ',
  SWE: 'SE',
  CHE: 'CH',
  SYR: 'SY',
  TWN: 'TW',
  TJK: 'TJ',
  TZA: 'TZ',
  THA: 'TH',
  TLS: 'TL',
  TGO: 'TG',
  TKL: 'TK',
  TON: 'TO',
  TTO: 'TT',
  TUN: 'TN',
  TUR: 'TR',
  TKM: 'TM',
  TCA: 'TC',
  TUV: 'TV',
  UGA: 'UG',
  UKR: 'UA',
  ARE: 'AE',
  GBR: 'GB',
  USA: 'US',
  UMI: 'UM',
  URY: 'UY',
  UZB: 'UZ',
  VUT: 'VU',
  VEN: 'VE',
  VNM: 'VN',
  VGB: 'VG',
  VIR: 'VI',
  WLF: 'WF',
  ESH: 'EH',
  YEM: 'YE',
  ZMB: 'ZM',
  ZWE: 'ZW',
};

const countriesGeoJSON = computed(() => ({
  type: 'FeatureCollection',
  features: countries.value,
}));

const createFlagIcon = (iso3) => {
  if (!leaflet) return null;

  const iso2 = iso3toiso2[iso3];
  if (!iso2) {
    console.warn(`No ISO 3166-1 alpha-2 code found for ${iso3}`);
    return null;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'flag-icon-wrapper';
  wrapper.innerHTML = `<span class="fi fi-${iso2.toLowerCase()}"></span>`;

  return leaflet.divIcon({
    html: wrapper.outerHTML,
    className: 'custom-flag-icon',
    iconSize: [30, 20],
    iconAnchor: [15, 10],
  });
};

const geoJSONOptions = computed(() => ({
  pointToLayer: (feature, latlng) => {
    if (!leaflet) return null;

    const icon = createFlagIcon(feature.properties.iso3);
    return icon ? new leaflet.Marker(latlng, { icon }) : null;
  },
  onEachFeature: (feature, layer) => {
    if (process.client && leaflet) {
      layer.on({
        click: (e) => handleCountryClick(e, feature),
      });
    }
  },
}));

function onGeoJsonReady(layerInstance) {
  geoJsonLayer.value = layerInstance;
}

function getColor(population) {
  if (!population || population === 'N/A') return '#FFEDA0';
  return population > 1000000000
    ? '#800026'
    : population > 500000000
    ? '#BD0026'
    : population > 200000000
    ? '#E31A1C'
    : population > 100000000
    ? '#FC4E2A'
    : population > 50000000
    ? '#FD8D3C'
    : population > 20000000
    ? '#FEB24C'
    : population > 10000000
    ? '#FED976'
    : '#FFEDA0';
}

async function fetchCountryData() {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(
      'https://restcountries.com/v3.1/all?fields=name,latlng,cca3',
    );
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error(
        'Unexpected response format from REST Countries API',
      );
    }
    const countryData = response.data.map((country) => ({
      type: 'Feature',
      properties: {
        name: country.name.common,
        iso3: country.cca3,
      },
      geometry: {
        type: 'Point',
        coordinates: [country.latlng[1], country.latlng[0]],
      },
    }));
    mapStore.setCountries(countryData);
  } catch (err) {
    console.error('Error fetching country data:', err);
    error.value = `Failed to fetch country data: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

function formatGDP(value) {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

async function handleCountryClick(e, feature) {
  if (!process.client || !leaflet) return;

  const { name, iso3 } = feature.properties;
  let popupContent = `
    <h3>${name} (${iso3})</h3>
    <p>Loading data...</p>
  `;

  if (isMapReady.value && map.value) {
    const popup = new leaflet.Popup({
      maxWidth: 300,
      className: 'custom-popup',
    })
      .setLatLng(e.latlng)
      .setContent(popupContent)
      .openOn(map.value.leafletObject);

    try {
      const response = await axios.get(`/api/worldbank?country=${iso3}`);
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const data = response.data;
      feature.properties = { ...feature.properties, ...data };

      const formattedGDP = formatGDP(data.gdp.value);

      popupContent = `
        <h3>${name} (${iso3})</h3>
        <table class="country-data" style="font-weight: bold;">
          <tr><td>Population (${data.population.year}):</td><td>${Number(
        data.population.value,
      ).toLocaleString()}</td></tr>
          <tr><td>GDP (${
            data.gdp.year
          }):</td><td><span style="color: green; font-weight: bold;">${formattedGDP}</span></td></tr>
          <tr><td>Inflation (${
            data.inflation.year
          }):</td><td><span style="color: red; font-weight: bold;">${data.inflation.value?.toFixed(
        2,
      )}%</span></td></tr>
            <tr><td>Monthly Income (${
              data.monthlyIncome.year
            }):</td><td><span style="color: green; font-weight: bold;">$${parseInt(
        data.monthlyIncome.value / 12,
      ).toLocaleString()}/m</span></td></tr>
          <tr><td>Internet Usage (${
            data.internetUsage.year
          }):</td><td>${data.internetUsage.value.toFixed(2)}%</td></tr>
      `;

      if (data.oecdHouseholdData) {
        const householdData = data.oecdHouseholdData;
        if (householdData.HSH) {
          popupContent += `
            <tr><td>Household Size (${
              householdData.HSH.year
            }):</td><td>${Number(
            householdData.HSH.value,
          ).toLocaleString()}</td></tr>
          `;
        }
      }
      /**${parseInt(
              data.oecdDisposableIncome.value / 12,
            ).toLocaleString()} ${data.oecdDisposableIncome.currency}<br> */
      if (data.oecdDisposableIncome) {
        popupContent += `
          <tr><td>Disposable Income (${
            data.oecdDisposableIncome.year
          }):</td><td>
            <span style="color: #228B22; font-weight: bold;">
            ${parseInt(
              data.oecdDisposableIncome.usdValue / 12,
            ).toLocaleString()}/m
          </span></tr>
        `;
      }

      popupContent += `
        </table>
      `;
      popupContent += `
        <a href="https://trends.google.com/trending?geo=${iso3toiso2[iso3]}" target="_blank" rel="noopener noreferrer"><img src="https://studiohawk.com.au/wp-content/uploads/2020/08/1_Fi6masemXJT3Q8YWekQCDQ-821x353-1.png" style="max-width: 100px; height: auto" alt="Google Trends"></a>
      `;
      popup.setContent(popupContent);

      if (geoJsonLayer.value) {
        geoJsonLayer.value.setStyle((f) => ({
          fillColor:
            f.properties.iso3 === iso3
              ? getColor(data.population.value)
              : '#FFEDA0',
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7,
        }));
      }
    } catch (error) {
      console.error(`Error fetching data for ${iso3}:`, error);
      popup.setContent(`
        <h3>${name} (${iso3})</h3>
        <p>Data: Failed to load</p>
      `);
    }
  }
}

function onMapReady(mapObject) {
  map.value = mapObject;
  isMapReady.value = true;
  console.log('Map is ready');
}

onMounted(() => {
  if (process.client) {
    fetchCountryData();
  }
});
</script>

<style scoped>
.gold-map {
  height: 100vh;
  width: 100%;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  z-index: 1000;
}

:global(.custom-flag-icon) {
  background: none !important;
}

:global(.flag-icon-wrapper) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 20px;
}

:global(.flag-icon-wrapper .fi) {
  font-size: 30px;
}
.error-message {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  z-index: 1000;
}

.leaflet-popup-content {
  max-height: 500px;
  overflow-y: auto;
}

:global(.custom-popup .leaflet-popup-content-wrapper) {
  background-color: #f8f9fa;
  color: #212529;
  border-radius: 4px;
  padding: 0;
}

:global(.custom-popup .leaflet-popup-content) {
  margin: 0;
  max-height: 500px;
  overflow-y: auto;
}

:global(.custom-popup h3) {
  background-color: #007bff;
  color: white;
  padding: 10px;
  margin: 0;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

:global(.country-data) {
  width: 100%;
  border-collapse: collapse;
}

:global(.country-data td) {
  padding: 5px 10px;
  border-bottom: 1px solid #dee2e6;
}

:global(.country-data tr:last-child td) {
  border-bottom: none;
}

:global(.country-data td:first-child) {
  font-weight: bold;
}
</style>
