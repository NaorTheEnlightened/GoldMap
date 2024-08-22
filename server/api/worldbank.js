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
  // fertilityRate: 'SP.DYN.TFRT.IN',
  // militaryExpenditure: 'MS.MIL.XPND.GD.ZS',
  // timeToStartBusiness: 'IC.REG.DURS'
};

const parser = new XMLParser();

const fetchOECDData = async (countryCode) => {
  const url = `https://sdmx.oecd.org/public/rest/data/OECD.WISE.INE,DSD_WISE_IDD@DF_IDD,1.0/${countryCode}.A.INC_DISP.MEDIAN.XDC_HH_EQ._T.METH2012.D_CUR._Z?startPeriod=2011&endPeriod=2023&dimensionAtObservation=AllDimensions`;

  try {
    const response = await axios.get(url);
    const result = parser.parse(response.data);
    const observations =
      result['message:GenericData']['message:DataSet']['generic:Obs'];

    let latestData = null;
    for (const obs of observations) {
      const year = obs['generic:ObsKey']['generic:Value'].find(
        (v) => v['@_id'] === 'TIME_PERIOD',
      )['@_value'];
      const value = obs['generic:ObsValue']['@_value'];
      const currency = obs['generic:Attributes']['generic:Value'].find(
        (v) => v['@_id'] === 'CURRENCY',
      )['@_value'];

      if (!latestData || year > latestData.year) {
        latestData = { year, value, currency };
      }
    }

    return latestData;
  } catch (error) {
    console.error('Error fetching OECD data:', error);
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

    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return { error: 'Failed to fetch data' };
  }
});
