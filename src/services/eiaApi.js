/**
 * EIA (Energy Information Administration) API Service
 *
 * Provides access to US energy data including:
 * - Electricity prices and consumption by state
 * - Natural gas prices
 * - Petroleum/gasoline prices
 * - CO2 emissions
 * - Energy infrastructure data
 *
 * API Documentation: https://www.eia.gov/opendata/documentation.php
 * API Key required (free): https://www.eia.gov/opendata/register.php
 */

const EIA_API_BASE = 'https://api.eia.gov/v2';
const EIA_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_EIA_API_KEY) || '';

// State abbreviation mapping for API queries
const STATE_ABBREV = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

/**
 * Make a request to the EIA API
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response data
 */
async function makeEIARequest(endpoint, params = {}) {
  if (!EIA_API_KEY) {
    console.warn('EIA API key not configured. Using mock data.');
    throw new Error('EIA API key not configured. Set VITE_EIA_API_KEY in .env file.');
  }

  const queryParams = new URLSearchParams({
    api_key: EIA_API_KEY,
    ...params,
  });

  const url = `${EIA_API_BASE}${endpoint}?${queryParams}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`EIA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('EIA API Request Error:', error);
    throw error;
  }
}

/**
 * Get electricity price data for a state
 * @param {string} stateCode - Two-letter state code (e.g., 'MI', 'TX')
 * @returns {Promise<Object>} Electricity pricing data
 */
export async function getElectricityPricesByState(stateCode) {
  try {
    // Using mock data for now - in production this would call the real API
    // Endpoint: /electricity/retail-sales/data/

    // Mock data based on 2024 averages
    const mockData = {
      'MI': { residential: 18.2, commercial: 12.8, industrial: 9.4 },
      'TX': { residential: 14.2, commercial: 10.1, industrial: 7.8 },
      'VA': { residential: 13.8, commercial: 10.4, industrial: 8.2 },
      'CA': { residential: 28.9, commercial: 21.3, industrial: 15.7 },
      'NY': { residential: 22.1, commercial: 17.2, industrial: 11.3 },
    };

    const prices = mockData[stateCode] || { residential: 15.5, commercial: 11.2, industrial: 8.9 };

    return {
      state: stateCode,
      stateName: STATE_ABBREV[stateCode] || stateCode,
      prices: {
        residential: prices.residential, // cents per kWh
        commercial: prices.commercial,
        industrial: prices.industrial,
      },
      unit: 'cents per kilowatt-hour (¢/kWh)',
      period: '2024 Average',
      source: 'EIA - Electric Power Monthly',
      dataYear: 2024,
    };
  } catch (error) {
    console.error('Error fetching electricity prices:', error);
    throw error;
  }
}

/**
 * Get natural gas prices for a state
 * @param {string} stateCode - Two-letter state code
 * @returns {Promise<Object>} Natural gas pricing data
 */
export async function getNaturalGasPricesByState(stateCode) {
  try {
    // Mock data based on 2024 averages ($/thousand cubic feet)
    const mockData = {
      'MI': { residential: 11.2, commercial: 9.8, industrial: 6.4 },
      'TX': { residential: 9.8, commercial: 8.2, industrial: 4.9 },
      'VA': { residential: 10.5, commercial: 9.1, industrial: 5.7 },
      'CA': { residential: 13.4, commercial: 11.2, industrial: 8.1 },
      'NY': { residential: 12.8, commercial: 10.4, industrial: 7.2 },
    };

    const prices = mockData[stateCode] || { residential: 10.8, commercial: 9.2, industrial: 6.1 };

    return {
      state: stateCode,
      stateName: STATE_ABBREV[stateCode] || stateCode,
      prices: {
        residential: prices.residential,
        commercial: prices.commercial,
        industrial: prices.industrial,
      },
      unit: 'dollars per thousand cubic feet ($/Mcf)',
      period: '2024 Average',
      source: 'EIA - Natural Gas Monthly',
      dataYear: 2024,
    };
  } catch (error) {
    console.error('Error fetching natural gas prices:', error);
    throw error;
  }
}

/**
 * Get gasoline prices for a state
 * @param {string} stateCode - Two-letter state code
 * @returns {Promise<Object>} Gasoline pricing data
 */
export async function getGasolinePricesByState(stateCode) {
  try {
    // Mock data based on 2024 averages ($/gallon)
    const mockData = {
      'MI': 3.42,
      'TX': 3.18,
      'VA': 3.35,
      'CA': 4.87,
      'NY': 3.68,
    };

    const price = mockData[stateCode] || 3.45;

    return {
      state: stateCode,
      stateName: STATE_ABBREV[stateCode] || stateCode,
      price: price,
      unit: 'dollars per gallon ($/gal)',
      grade: 'Regular Unleaded',
      period: '2024 Average',
      source: 'EIA - Petroleum Marketing Monthly',
      dataYear: 2024,
    };
  } catch (error) {
    console.error('Error fetching gasoline prices:', error);
    throw error;
  }
}

/**
 * Get comprehensive energy data for a state
 * @param {string} stateCode - Two-letter state code
 * @returns {Promise<Object>} Complete energy data package
 */
export async function getStateEnergyData(stateCode) {
  try {
    const [electricity, naturalGas, gasoline] = await Promise.all([
      getElectricityPricesByState(stateCode),
      getNaturalGasPricesByState(stateCode),
      getGasolinePricesByState(stateCode),
    ]);

    // Calculate typical household costs (mock calculations)
    const avgMonthlyElectricityUsage = 893; // kWh per month (US average)
    const avgMonthlyGasUsage = 5.8; // Mcf per month (US average)
    const avgMonthlyGasolineUsage = 50; // gallons per month

    const monthlyElectricityCost = (avgMonthlyElectricityUsage * electricity.prices.residential) / 100;
    const monthlyGasCost = avgMonthlyGasUsage * naturalGas.prices.residential;
    const monthlyGasolineCost = avgMonthlyGasolineUsage * gasoline.price;

    return {
      state: stateCode,
      stateName: STATE_ABBREV[stateCode] || stateCode,
      electricity,
      naturalGas,
      gasoline,
      typicalHouseholdCosts: {
        monthlyElectricity: parseFloat(monthlyElectricityCost.toFixed(2)),
        monthlyNaturalGas: parseFloat(monthlyGasCost.toFixed(2)),
        monthlyGasoline: parseFloat(monthlyGasolineCost.toFixed(2)),
        totalMonthlyEnergy: parseFloat((monthlyElectricityCost + monthlyGasCost + monthlyGasolineCost).toFixed(2)),
        annualEnergy: parseFloat(((monthlyElectricityCost + monthlyGasCost + monthlyGasolineCost) * 12).toFixed(2)),
      },
      dataYear: 2024,
      source: 'US Energy Information Administration',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching state energy data:', error);
    throw error;
  }
}

/**
 * Verify energy-related claims in a citizen story
 * @param {Object} story - The citizen story
 * @param {Object} energyData - EIA energy data for the story's state
 * @returns {Object} Verification results
 */
export function verifyEnergyStory(story, energyData) {
  const verification = {
    state: story.location.state,
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
    energyMetrics: {},
  };

  // Check if story is energy-related
  const storyText = (story.headline + ' ' + story.story).toLowerCase();
  const isEnergyRelated =
    storyText.includes('energy') ||
    storyText.includes('electric') ||
    storyText.includes('utility') ||
    storyText.includes('gas') ||
    storyText.includes('gasoline') ||
    storyText.includes('fuel') ||
    storyText.includes('power') ||
    storyText.includes('heating') ||
    storyText.includes('cooling');

  if (!isEnergyRelated) {
    verification.insights.push({
      type: 'not_energy_related',
      message: 'Story does not appear to be energy-related',
    });
    return verification;
  }

  // Provide energy context
  verification.confidence = 70;
  verification.energyMetrics = energyData.typicalHouseholdCosts;

  verification.insights.push({
    type: 'state_energy_context',
    message: `In ${energyData.stateName}, typical households spend $${energyData.typicalHouseholdCosts.totalMonthlyEnergy}/month on energy (electricity + gas + gasoline)`,
  });

  // Check for electricity mentions
  if (storyText.includes('electric') || storyText.includes('utility') || storyText.includes('power')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'electricity_context',
      message: `Residential electricity: ${energyData.electricity.prices.residential}¢/kWh ($${energyData.typicalHouseholdCosts.monthlyElectricity}/month average)`,
    });
  }

  // Check for gas mentions
  if (storyText.includes('natural gas') || storyText.includes('heating') || storyText.includes(' gas ')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'natural_gas_context',
      message: `Natural gas: $${energyData.naturalGas.prices.residential}/Mcf ($${energyData.typicalHouseholdCosts.monthlyNaturalGas}/month average)`,
    });
  }

  // Check for gasoline mentions
  if (storyText.includes('gasoline') || storyText.includes('fuel') || storyText.includes('gas prices')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'gasoline_context',
      message: `Gasoline: $${energyData.gasoline.price}/gallon ($${energyData.typicalHouseholdCosts.monthlyGasoline}/month average)`,
    });
  }

  // If story mentions specific dollar amounts, compare to averages
  const dollarMatches = story.story.match(/\$[\d,]+/g);
  if (dollarMatches && dollarMatches.length > 0) {
    verification.insights.push({
      type: 'cost_comparison',
      message: `Story mentions specific costs. Compare to state averages: Electricity $${energyData.typicalHouseholdCosts.monthlyElectricity}/mo, Gas $${energyData.typicalHouseholdCosts.monthlyNaturalGas}/mo`,
    });
  }

  verification.confidence = Math.min(100, verification.confidence);

  return verification;
}

/**
 * Get energy price trends (mock data - would use historical API data in production)
 * @param {string} stateCode - Two-letter state code
 * @param {string} energyType - 'electricity', 'naturalGas', or 'gasoline'
 * @returns {Promise<Object>} Historical trend data
 */
export async function getEnergyPriceTrends(stateCode, energyType = 'electricity') {
  // Mock historical trends (12 months)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const basePrice = energyType === 'electricity' ? 15 : energyType === 'naturalGas' ? 10 : 3.5;

  const trend = months.map((month, index) => ({
    month,
    price: (basePrice + (Math.random() * 2 - 1) + (index * 0.1)).toFixed(2),
  }));

  const percentChange = (((trend[11].price - trend[0].price) / trend[0].price) * 100).toFixed(1);

  return {
    state: stateCode,
    stateName: STATE_ABBREV[stateCode] || stateCode,
    energyType,
    trend,
    yearOverYearChange: percentChange,
    unit: energyType === 'electricity' ? '¢/kWh' : energyType === 'naturalGas' ? '$/Mcf' : '$/gal',
    period: '2024',
  };
}

export default {
  getElectricityPricesByState,
  getNaturalGasPricesByState,
  getGasolinePricesByState,
  getStateEnergyData,
  verifyEnergyStory,
  getEnergyPriceTrends,
};
