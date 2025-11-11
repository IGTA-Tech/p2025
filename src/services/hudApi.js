/**
 * HUD (Housing and Urban Development) API Service
 *
 * Provides access to US housing data including:
 * - Fair Market Rents (FMR) by location
 * - Income Limits by location
 * - Housing affordability metrics
 * - Section 8 rental assistance data
 * - Public housing data
 *
 * API Documentation: https://www.huduser.gov/portal/dataset/fmr-api.html
 * API Key required (free): https://www.huduser.gov/hudapi/public/register
 */

const HUD_API_BASE = 'https://www.huduser.gov/hudapi/public/fmr';
const HUD_IL_API_BASE = 'https://www.huduser.gov/hudapi/public/il';

/**
 * Get the HUD API key from environment (runtime evaluation)
 * @returns {string} API key
 */
function getHUDApiKey() {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_HUD_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_HUD_API_KEY) ||
    ''
  );
}

// State abbreviation mapping
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

// Sample ZIP codes for each state (major cities)
const STATE_SAMPLE_ZIPS = {
  'MI': '48201', // Detroit
  'TX': '77001', // Houston
  'VA': '23220', // Richmond
  'CA': '90001', // Los Angeles
  'NY': '10001', // New York City
  'FL': '33101', // Miami
  'IL': '60601', // Chicago
};

/**
 * Make a request to the HUD API
 * @param {string} baseUrl - API base URL
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response data
 */
async function makeHUDRequest(baseUrl, endpoint, params = {}) {
  const apiKey = getHUDApiKey();

  if (!apiKey) {
    console.warn('HUD API key not configured. Using mock data.');
    throw new Error('HUD API key not configured. Set VITE_HUD_API_KEY in .env file.');
  }

  const queryParams = new URLSearchParams(params);
  const queryString = queryParams.toString();
  const url = `${baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HUD API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('HUD API Request Error:', error);
    throw error;
  }
}

/**
 * Get Fair Market Rent data for a ZIP code or county
 * @param {string} zip - ZIP code (5 digits)
 * @param {number} year - Year for FMR data (default: current year)
 * @returns {Promise<Object>} Fair Market Rent data
 */
export async function getFairMarketRent(zip, year = 2024) {
  try {
    // Real API call - HUD API expects ZIP as entityid in the path
    // Note: Only use year parameter if not current year, as latest year might not be available yet
    const params = year === new Date().getFullYear() ? {} : { year };
    const data = await makeHUDRequest(HUD_API_BASE, `/data/${zip}`, params);

    // HUD API returns data in a specific format
    const fmrData = data.data?.results?.[0] || data;

    return {
      zip,
      year,
      areaName: fmrData.area_name || fmrData.areaName || 'Unknown',
      countyName: fmrData.county_name || fmrData.countyName || 'Unknown',
      state: fmrData.state_alpha || fmrData.stateAlpha || '',
      fmrRates: {
        efficiency: fmrData.fmr_0 || fmrData.efficiency || 0,
        oneBedroom: fmrData.fmr_1 || fmrData.oneBedroom || 0,
        twoBedroom: fmrData.fmr_2 || fmrData.twoBedroom || 0,
        threeBedroom: fmrData.fmr_3 || fmrData.threeBedroom || 0,
        fourBedroom: fmrData.fmr_4 || fmrData.fourBedroom || 0,
      },
      source: 'HUD Fair Market Rents',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Fair Market Rent:', error);

    // Return mock data as fallback
    return getMockFairMarketRent(zip, year);
  }
}

/**
 * Get Income Limits for a state/county
 * @param {string} stateCode - Two-letter state code
 * @param {string} countyCode - County FIPS code (optional)
 * @param {number} year - Year for income limit data
 * @returns {Promise<Object>} Income limits data
 */
export async function getIncomeLimits(stateCode, countyCode = null, year = 2024) {
  try {
    // Use statedata endpoint for state-level data
    const endpoint = countyCode ? `/data/${countyCode}` : `/statedata/${stateCode}`;
    const params = year === new Date().getFullYear() ? {} : { year };
    const data = await makeHUDRequest(HUD_IL_API_BASE, endpoint, params);

    const ilData = data.data?.results?.[0] || data.data || data;

    // HUD IL API returns data with specific field names
    return {
      state: stateCode,
      stateName: STATE_ABBREV[stateCode] || stateCode,
      county: ilData.county_name || ilData.countyName || ilData.Area_Name || 'Statewide',
      year: ilData.year || year,
      incomeLimits: {
        veryLow: parseInt(ilData.l50_4 || ilData.veryLow || 0),      // 50% AMI for 4-person household
        low: parseInt(ilData.l80_4 || ilData.low || 0),              // 80% AMI for 4-person household
        median: parseInt(ilData.median_4 || ilData.medianIncome || ilData.Median || 0), // 100% AMI (Area Median Income)
      },
      familySize: 4,
      source: 'HUD Income Limits',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Income Limits:', error);

    // Return mock data as fallback
    return getMockIncomeLimits(stateCode, year);
  }
}

/**
 * Get comprehensive housing data for a state
 * @param {string} stateCode - Two-letter state code
 * @param {string} zip - Optional ZIP code for more specific data
 * @returns {Promise<Object>} Complete housing data package
 */
export async function getStateHousingData(stateCode, zip = null) {
  try {
    const year = new Date().getFullYear();
    const zipToUse = zip || STATE_SAMPLE_ZIPS[stateCode] || '00000';

    const [fmrData, incomeLimits] = await Promise.all([
      getFairMarketRent(zipToUse, year),
      getIncomeLimits(stateCode, null, year),
    ]);

    // Calculate affordability metrics
    const medianIncome = incomeLimits.incomeLimits.median;
    const monthlyMedianIncome = medianIncome / 12;
    const twoBedRent = fmrData.fmrRates.twoBedroom;

    // HUD standard: housing costs should not exceed 30% of income
    const affordableRent = monthlyMedianIncome * 0.30;
    const rentBurdenRatio = (twoBedRent / affordableRent) * 100;
    const isAffordable = rentBurdenRatio <= 100;

    return {
      state: stateCode,
      stateName: STATE_ABBREV[stateCode] || stateCode,
      year,
      fairMarketRents: fmrData,
      incomeLimits,
      affordabilityMetrics: {
        medianAnnualIncome: medianIncome,
        medianMonthlyIncome: parseFloat(monthlyMedianIncome.toFixed(2)),
        affordableMonthlyRent: parseFloat(affordableRent.toFixed(2)),
        fairMarketRent2BR: twoBedRent,
        rentBurdenRatio: parseFloat(rentBurdenRatio.toFixed(1)),
        isAffordable,
        housingCostBurden: rentBurdenRatio > 100 ? 'High' : rentBurdenRatio > 80 ? 'Moderate' : 'Low',
      },
      source: 'US Department of Housing and Urban Development',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching state housing data:', error);
    throw error;
  }
}

/**
 * Verify housing-related claims in a citizen story
 * @param {Object} story - The citizen story
 * @param {Object} housingData - HUD housing data for the story's state
 * @returns {Object} Verification results
 */
export function verifyHousingStory(story, housingData) {
  const verification = {
    state: story.location.state,
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
    housingMetrics: {},
  };

  // Check if story is housing-related
  const storyText = (story.headline + ' ' + story.story).toLowerCase();
  const isHousingRelated =
    storyText.includes('rent') ||
    storyText.includes('housing') ||
    storyText.includes('apartment') ||
    storyText.includes('evict') ||
    storyText.includes('afford') ||
    storyText.includes('homeless') ||
    storyText.includes('section 8') ||
    storyText.includes('public housing') ||
    storyText.includes('landlord') ||
    storyText.includes('lease');

  if (!isHousingRelated) {
    verification.insights.push({
      type: 'not_housing_related',
      message: 'Story does not appear to be housing-related',
    });
    return verification;
  }

  // Provide housing context
  verification.confidence = 70;
  verification.housingMetrics = housingData.affordabilityMetrics;

  const metrics = housingData.affordabilityMetrics;

  verification.insights.push({
    type: 'state_housing_context',
    message: `In ${housingData.stateName}, the median income is $${metrics.medianAnnualIncome.toLocaleString()}/year ($${metrics.medianMonthlyIncome.toLocaleString()}/month)`,
  });

  verification.insights.push({
    type: 'rent_context',
    message: `Fair Market Rent (2BR): $${metrics.fairMarketRent2BR}/month. Affordable rent at 30% of median income: $${metrics.affordableMonthlyRent}/month`,
  });

  // Check affordability burden
  if (metrics.rentBurdenRatio > 100) {
    verification.confidence += 15;
    verification.insights.push({
      type: 'affordability_crisis',
      message: `Housing cost burden is HIGH (${metrics.rentBurdenRatio}%). Fair market rents exceed what median-income families can afford.`,
    });
  } else if (metrics.rentBurdenRatio > 80) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'affordability_concern',
      message: `Housing cost burden is MODERATE (${metrics.rentBurdenRatio}%). Rents are approaching unaffordable levels.`,
    });
  }

  // Check for specific rent amounts mentioned in story
  const rentMatches = story.story.match(/\$[\d,]+/g);
  if (rentMatches && rentMatches.length > 0) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'rent_comparison',
      message: `Story mentions specific costs. Compare to Fair Market Rents: Studio $${housingData.fairMarketRents.fmrRates.efficiency}, 1BR $${housingData.fairMarketRents.fmrRates.oneBedroom}, 2BR $${housingData.fairMarketRents.fmrRates.twoBedroom}, 3BR $${housingData.fairMarketRents.fmrRates.threeBedroom}`,
    });
  }

  // Check for eviction mentions
  if (storyText.includes('evict')) {
    verification.confidence += 5;
    verification.flags.push('eviction_mentioned');
    verification.insights.push({
      type: 'eviction_context',
      message: 'Story mentions eviction. This is a critical housing instability indicator.',
    });
  }

  // Check for Section 8 / housing assistance mentions
  if (storyText.includes('section 8') || storyText.includes('housing assistance') || storyText.includes('voucher')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'housing_assistance',
      message: `Story mentions housing assistance. Very Low Income limit (50% AMI): $${housingData.incomeLimits.incomeLimits.veryLow.toLocaleString()}/year`,
    });
  }

  verification.confidence = Math.min(100, verification.confidence);

  return verification;
}

/**
 * Mock Fair Market Rent data (fallback when API fails)
 */
function getMockFairMarketRent(zip, year) {
  // Mock data based on 2024 national averages
  const mockData = {
    '48201': { area: 'Detroit-Warren-Dearborn, MI HUD Metro FMR Area', state: 'MI', eff: 752, br1: 891, br2: 1087, br3: 1419, br4: 1672 },
    '77001': { area: 'Houston-The Woodlands-Sugar Land, TX HUD Metro FMR Area', state: 'TX', eff: 890, br1: 1045, br2: 1287, br3: 1732, br4: 2087 },
    '23220': { area: 'Richmond, VA HUD Metro FMR Area', state: 'VA', eff: 845, br1: 967, br2: 1198, br3: 1587, br4: 1876 },
    '90001': { area: 'Los Angeles-Long Beach-Anaheim, CA HUD Metro FMR Area', state: 'CA', eff: 1523, br1: 1876, br2: 2398, br3: 3287, br4: 3876 },
    '10001': { area: 'New York, NY HUD Metro FMR Area', state: 'NY', eff: 1687, br1: 2098, br2: 2687, br3: 3498, br4: 4087 },
  };

  const data = mockData[zip] || { area: 'Unknown Area', state: 'US', eff: 800, br1: 950, br2: 1200, br3: 1600, br4: 1900 };

  return {
    zip,
    year,
    areaName: data.area,
    countyName: 'Mock County',
    state: data.state,
    fmrRates: {
      efficiency: data.eff,
      oneBedroom: data.br1,
      twoBedroom: data.br2,
      threeBedroom: data.br3,
      fourBedroom: data.br4,
    },
    source: 'HUD Fair Market Rents (Mock Data)',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Mock Income Limits data (fallback when API fails)
 */
function getMockIncomeLimits(stateCode, year) {
  // Mock data based on 2024 estimates
  const mockData = {
    'MI': { veryLow: 38750, low: 62000, median: 77500 },
    'TX': { veryLow: 42500, low: 68000, median: 85000 },
    'VA': { veryLow: 45000, low: 72000, median: 90000 },
    'CA': { veryLow: 55000, low: 88000, median: 110000 },
    'NY': { veryLow: 52000, low: 83200, median: 104000 },
  };

  const data = mockData[stateCode] || { veryLow: 40000, low: 64000, median: 80000 };

  return {
    state: stateCode,
    stateName: STATE_ABBREV[stateCode] || stateCode,
    county: 'Statewide Average',
    year,
    incomeLimits: {
      veryLow: data.veryLow,
      low: data.low,
      median: data.median,
    },
    familySize: 4,
    source: 'HUD Income Limits (Mock Data)',
    lastUpdated: new Date().toISOString(),
  };
}

export default {
  getFairMarketRent,
  getIncomeLimits,
  getStateHousingData,
  verifyHousingStory,
};
