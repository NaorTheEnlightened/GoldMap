import { defineEventHandler } from 'h3';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const indicators = {
  population: 'SP.POP.TOTL',
  gdp: 'NY.GDP.MKTP.CD',
  // gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  // populationGrowth: 'SP.POP.GROW',
  // populationDensity: 'EN.POP.DNST',
  // surfaceArea: 'AG.SRF.TOTL.K2',
  // netMigration: 'SM.POP.NETM',
  // lifeExpectancy: 'SP.DYN.LE00.IN',
  inflation: 'NY.GDP.DEFL.KD.ZG',
  internetUsage: 'IT.NET.USER.ZS',
  monthlyIncome: 'NY.ADJ.NNTY.PC.CD',
  // fertilityRate: 'SP.DYN.TFRT.IN',
  // militaryExpenditure: 'MS.MIL.XPND.GD.ZS',
  // timeToStartBusiness: 'IC.REG.DURS'
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

const fetchOECDData = async (countryCode) => {
  const url = `https://sdmx.oecd.org/public/rest/data/OECD.WISE.INE,DSD_WISE_IDD@DF_IDD,1.0/${countryCode}.A.INC_DISP.MEDIAN.XDC_HH_EQ._T.METH2012.D_CUR._Z?startPeriod=2015&endPeriod=2023&dimensionAtObservation=AllDimensions&format=jsondata`;

  try {
    const response = await axios.get(url);
    const data = response.data.data;

    if (
      !data ||
      !data.dataSets ||
      !data.dataSets[0] ||
      !data.dataSets[0].observations
    ) {
      console.error('Unexpected data structure:', data);
      return null;
    }

    const observations = data.dataSets[0].observations;
    const timePeriods = data.structures[0].dimensions.observation.find(
      (dim) => dim.id === 'TIME_PERIOD',
    ).values;

    let latestData = null;
    for (const [key, value] of Object.entries(observations)) {
      const timeIndex = parseInt(key.split(':')[9], 10);
      const year = timePeriods[timeIndex].id;
      const disposableIncome = value[0];
      const currency = data.structures[0].attributes.observation.find(
        (attr) => attr.id === 'CURRENCY',
      ).values[0].id;

      if (!latestData || year > latestData.year) {
        latestData = { year, value: disposableIncome, currency };
      }
    }

    return latestData;
  } catch (error) {
    console.error('Error fetching OECD data:', error);
    return null;
  }
};

const fetchOECDHouseholdData = async (countryCode) => {
  const url = `https://sdmx.oecd.org/public/rest/data/OECD.WISE.INE,DSD_WISE_IDD@DF_IDD,1.0/${countryCode}.A.HSH..._T..D_CUR.?startPeriod=2015&dimensionAtObservation=AllDimensions&format=jsondata`;

  try {
    const response = await axios.get(url);
    const data = response.data.data;

    if (
      !data ||
      !data.dataSets ||
      !data.dataSets[0] ||
      !data.dataSets[0].observations
    ) {
      console.error('Unexpected data structure:', data);
      return null;
    }

    const observations = data.dataSets[0].observations;
    const timePeriods = data.structures[0].dimensions.observation.find(
      (dim) => dim.id === 'TIME_PERIOD',
    ).values;
    const measures = data.structures[0].dimensions.observation.find(
      (dim) => dim.id === 'MEASURE',
    ).values;

    let latestData = {};
    for (const [key, value] of Object.entries(observations)) {
      const [, , measureIndex, , , , , , timeIndex] = key
        .split(':')
        .map(Number);
      const year = timePeriods[timeIndex].id;
      const measure = measures[measureIndex].id;
      const householdValue = value[0];

      if (!latestData[measure] || year > latestData[measure].year) {
        latestData[measure] = { year, value: householdValue };
      }
    }

    return latestData;
  } catch (error) {
    console.error('Error fetching OECD household data:', error);
    return null;
  }
};

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/702d85b9a706ac4d457eb0de/latest/${fromCurrency}`,
    );
    const rate = response.data.conversion_rates[toCurrency];
    return amount * rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    return null;
  }
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { country } = query;

  try {
    // Fetch World Bank data (existing code)
    const requests = Object.values(indicators).map((indicator) =>
      axios.get(
        `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}`,
        {
          params: {
            format: 'json',
            date: `2017:${new Date().getFullYear() - 1}`,
          },
        },
      ),
    );

    const responses = await Promise.all(requests);

    const data = Object.keys(indicators).reduce((acc, key, index) => {
      const indicatorData = responses[index].data[1];
      if (indicatorData && indicatorData.length > 0) {
        const latestData = indicatorData.find((d) => d.value !== null);
        if (latestData) {
          acc[key] = {
            value: latestData.value,
            year: latestData.date,
          };
        }
      }
      return acc;
    }, {});

    // Fetch OECD data
    const oecdData = await fetchOECDData(country);
    if (oecdData) {
      data.oecdDisposableIncome = oecdData;

      // Convert to USD
      const usdValue = await convertCurrency(
        oecdData.value,
        oecdData.currency,
        'USD',
      );
      if (usdValue !== null) {
        data.oecdDisposableIncome.usdValue = usdValue.toFixed(2);
      }
    }

    // Fetch OECD household data
    const oecdHouseholdData = await fetchOECDHouseholdData(country);
    if (oecdHouseholdData) {
      data.oecdHouseholdData = oecdHouseholdData;
    }

    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return { error: 'Failed to fetch data' };
  }
});
