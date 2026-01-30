/**
 * BEA (Bureau of Economic Analysis) API Service
 *
 * Provides access to U.S. economic data including:
 * - Gross Domestic Product (GDP) - national, state, and regional
 * - Personal income by state and county
 * - Regional economic statistics
 * - Industry-specific data
 * - International transactions
 * - Fixed assets
 *
 * API Documentation: https://apps.bea.gov/api/docs/
 * Registration: Free at https://apps.bea.gov/api/signup/
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - 30-second timeout per request
 * - Maximum 3 retry attempts
 * - Graceful degradation on failure
 */

// Try Vite environment first, then Node.js process.env
const BEA_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BEA_API_BASE) ||
  (typeof process !== 'undefined' && process.env?.VITE_BEA_API_BASE) ||
  'https://apps.bea.gov/api/data';

// BEA UserID (36-character unique identifier)
// Check import.meta.env first (Vite), then process.env (Node.js)
const BEA_USER_ID =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BEA_USER_ID) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_BEA_USER_ID) ||
  null;

// Request configuration
const REQUEST_TIMEOUT_MS = 30000;  // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;  // Base delay: 2 seconds

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make a GET request to BEA API with retry logic
 * @param {Object} params - Query parameters
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} API response data
 */
async function makeRequest(params = {}, retryCount = 0) {
  if (!BEA_USER_ID) {
    throw new Error('BEA UserID not configured. Please set VITE_BEA_USER_ID in .env');
  }

  // Add UserID and default format
  const queryParams = {
    UserID: BEA_USER_ID,
    ResultFormat: 'JSON',
    ...params,
  };

  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${BEA_API_BASE}?${queryString}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    console.log(`BEA API request: ${params.method || 'GetData'} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Democratic-Accountability-Platform/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BEA API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // Check for BEA API errors in response
    if (data.BEAAPI && data.BEAAPI.Error) {
      throw new Error(`BEA API error: ${JSON.stringify(data.BEAAPI.Error)}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`BEA API timeout on attempt ${retryCount + 1}`);

      if (retryCount < MAX_RETRIES) {
        const waitTime = RETRY_DELAY_MS * Math.pow(2, retryCount);  // Exponential backoff
        console.log(`Retrying in ${waitTime / 1000} seconds...`);
        await sleep(waitTime);
        return makeRequest(params, retryCount + 1);
      }

      throw new Error('timeout');
    }

    console.error('BEA API Request Error:', error);

    if (retryCount < MAX_RETRIES) {
      const waitTime = RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.log(`Retrying in ${waitTime / 1000} seconds...`);
      await sleep(waitTime);
      return makeRequest(params, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Get list of available datasets
 * @returns {Promise<Object>} List of datasets
 */
export async function getDatasetList() {
  try {
    const params = {
      method: 'GETDATASETLIST',
    };

    const data = await makeRequest(params);

    return {
      datasets: data.BEAAPI?.Results?.Dataset || [],
      source: 'BEA API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('BEA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'BEA API temporarily unavailable',
      datasets: [],
      source: 'BEA API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get regional personal income data by state
 * @param {string} stateCode - State FIPS code (e.g., '06' for California, '*' for all states)
 * @param {string} year - Year (e.g., '2022')
 * @returns {Promise<Object>} Regional income data
 */
export async function getRegionalIncome(stateCode = '*', year = '2022') {
  try {
    const params = {
      method: 'GetData',
      datasetname: 'Regional',
      TableName: 'SAINC1',  // State Annual Personal Income
      LineCode: '1',        // Personal income
      GeoFips: stateCode,
      Year: year,
    };

    const data = await makeRequest(params);

    const results = data.BEAAPI?.Results?.Data || [];

    return {
      stateCode: stateCode,
      year: year,
      count: results.length,
      data: results,
      source: 'BEA API (Regional)',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('BEA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'BEA API temporarily unavailable',
      stateCode: stateCode,
      year: year,
      count: 0,
      data: [],
      source: 'BEA API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get state GDP data
 * @param {string} stateCode - State FIPS code (e.g., '48' for Texas)
 * @param {string} year - Year (e.g., '2022')
 * @returns {Promise<Object>} State GDP data
 */
export async function getStateGDP(stateCode, year = '2022') {
  try {
    const params = {
      method: 'GetData',
      datasetname: 'Regional',
      TableName: 'SAGDP1',  // State Annual GDP
      LineCode: '1',        // All industries
      GeoFips: stateCode,
      Year: year,
    };

    const data = await makeRequest(params);

    const results = data.BEAAPI?.Results?.Data || [];

    return {
      stateCode: stateCode,
      year: year,
      count: results.length,
      data: results,
      source: 'BEA API (State GDP)',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('BEA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'BEA API temporarily unavailable',
      stateCode: stateCode,
      year: year,
      count: 0,
      data: [],
      source: 'BEA API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get regional per capita personal income
 * @param {string} stateCode - State FIPS code
 * @param {string} year - Year
 * @returns {Promise<Object>} Per capita income data
 */
export async function getPerCapitaIncome(stateCode, year = '2022') {
  try {
    const params = {
      method: 'GetData',
      datasetname: 'Regional',
      TableName: 'SAINC1',  // State Annual Personal Income
      LineCode: '3',        // Per capita personal income
      GeoFips: stateCode,
      Year: year,
    };

    const data = await makeRequest(params);

    const results = data.BEAAPI?.Results?.Data || [];

    return {
      stateCode: stateCode,
      year: year,
      count: results.length,
      data: results,
      source: 'BEA API (Per Capita Income)',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('BEA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'BEA API temporarily unavailable',
      stateCode: stateCode,
      year: year,
      count: 0,
      data: [],
      source: 'BEA API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get economic trend data (multiple years)
 * @param {string} stateCode - State FIPS code
 * @param {string} startYear - Start year
 * @param {string} endYear - End year
 * @returns {Promise<Object>} Trend data
 */
export async function getEconomicTrends(stateCode, startYear = '2020', endYear = '2022') {
  const trendData = [];

  for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
    const yearStr = year.toString();
    const income = await getRegionalIncome(stateCode, yearStr);

    if (!income.error) {
      trendData.push({
        year: yearStr,
        income: income,
      });
    } else {
      console.warn(`Missing BEA data for ${stateCode} in ${yearStr}. Continuing with available years.`);
    }
  }

  if (trendData.length === 0) {
    console.error('No BEA trend data available. Moving to next analysis component.');
    return {
      error: true,
      errorType: 'no_data',
      errorMessage: 'No BEA trend data available for the specified period',
      stateCode: stateCode,
      startYear: startYear,
      endYear: endYear,
      trendData: [],
      source: 'BEA API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }

  return {
    stateCode: stateCode,
    startYear: startYear,
    endYear: endYear,
    yearsAvailable: trendData.length,
    trendData: trendData,
    source: 'BEA API',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get baseline economic comparison
 * @param {string} stateCode - State FIPS code
 * @param {string} baselineYear - Baseline year (default 2022)
 * @param {string} currentYear - Current year (default 2023)
 * @returns {Promise<Object>} Comparison data
 */
export async function getEconomicBaseline(stateCode, baselineYear = '2022', currentYear = '2023') {
  try {
    const baselineData = await getRegionalIncome(stateCode, baselineYear);
    const currentData = await getRegionalIncome(stateCode, currentYear);

    if (baselineData.error || currentData.error) {
      console.warn('Incomplete BEA economic data for baseline comparison. Using partial analysis.');
      return {
        status: 'partial',
        message: 'BEA economic data partially unavailable. Analysis continuing with other data sources.',
        stateCode: stateCode,
        baselineYear: baselineYear,
        currentYear: currentYear,
        baseline: baselineData,
        current: currentData,
        source: 'BEA API (partial)',
        lastUpdated: new Date().toISOString(),
      };
    }

    // Calculate changes if both datasets available
    const changes = calculateEconomicChanges(baselineData.data, currentData.data);

    return {
      status: 'complete',
      stateCode: stateCode,
      baselineYear: baselineYear,
      currentYear: currentYear,
      baseline: baselineData,
      current: currentData,
      changes: changes,
      source: 'BEA API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('BEA API baseline comparison error:', error.message);
    return {
      error: true,
      errorType: 'comparison_failed',
      errorMessage: 'BEA API baseline comparison failed',
      stateCode: stateCode,
      baselineYear: baselineYear,
      currentYear: currentYear,
      source: 'BEA API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Calculate percentage changes between two datasets
 * @param {Array} baseline - Baseline economic data
 * @param {Array} current - Current economic data
 * @returns {Object} Calculated changes
 */
function calculateEconomicChanges(baseline, current) {
  const changes = {};

  if (!baseline || !current || baseline.length === 0 || current.length === 0) {
    return changes;
  }

  try {
    // Find matching data points and calculate changes
    baseline.forEach((baselineItem) => {
      const currentItem = current.find(
        (item) => item.GeoFips === baselineItem.GeoFips && item.LineCode === baselineItem.LineCode
      );

      if (currentItem && baselineItem.DataValue && currentItem.DataValue) {
        const baselineVal = parseFloat(baselineItem.DataValue);
        const currentVal = parseFloat(currentItem.DataValue);

        if (!isNaN(baselineVal) && !isNaN(currentVal) && baselineVal !== 0) {
          const key = `${baselineItem.GeoName}_${baselineItem.LineDescription}`;
          changes[key] = {
            percentChange: ((currentVal - baselineVal) / baselineVal) * 100,
            baselineValue: baselineVal,
            currentValue: currentVal,
            unit: baselineItem.UNIT_MULT || 'dollars',
          };
        }
      }
    });
  } catch (error) {
    console.error('Error calculating economic changes:', error);
  }

  return changes;
}

/**
 * Verify economic-related claims in a citizen story
 * @param {Object} story - The citizen story
 * @param {Object} beaData - BEA economic data
 * @returns {Object} Verification results
 */
export function verifyEconomicStory(story, beaData) {
  const verification = {
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
    economicMetrics: {},
  };

  // Check if API data is unavailable
  if (beaData.error) {
    verification.insights.push({
      type: 'api_unavailable',
      message: beaData.errorMessage || 'BEA API temporarily unavailable',
    });
    verification.confidence = 50;
    return verification;
  }

  // Check if story is economics-related
  const storyText = (story.headline + ' ' + story.story).toLowerCase();
  const isEconomicRelated =
    storyText.includes('income') ||
    storyText.includes('economy') ||
    storyText.includes('economic') ||
    storyText.includes('gdp') ||
    storyText.includes('wage') ||
    storyText.includes('salary') ||
    storyText.includes('earnings') ||
    storyText.includes('poverty') ||
    storyText.includes('unemployment') ||
    storyText.includes('job') ||
    storyText.includes('business') ||
    storyText.includes('cost of living') ||
    storyText.includes('inflation');

  if (!isEconomicRelated) {
    verification.insights.push({
      type: 'not_economic_related',
      message: 'Story does not appear to be economics-related',
    });
    return verification;
  }

  // Provide economic context
  verification.confidence = 65;

  if (beaData.data && beaData.data.length > 0) {
    verification.economicMetrics = {
      stateCode: beaData.stateCode,
      year: beaData.year,
      dataPoints: beaData.count,
    };

    verification.insights.push({
      type: 'economic_data_available',
      message: `BEA economic statistics available for analysis`,
    });
    verification.confidence += 15;
  }

  // Check for specific economic mentions
  if (storyText.includes('income') || storyText.includes('wage') || storyText.includes('salary')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'income_mention',
      message: 'Story mentions income/wages - can be verified through BEA regional data',
    });
  }

  if (storyText.includes('gdp') || storyText.includes('economy') || storyText.includes('growth')) {
    verification.confidence += 5;
    verification.insights.push({
      type: 'gdp_mention',
      message: 'Story mentions GDP/economic growth - can be verified through BEA state GDP data',
    });
  }

  // Flag if mentions specific increase/decrease
  if (
    storyText.includes('increase') ||
    storyText.includes('rising') ||
    storyText.includes('growing') ||
    storyText.includes('higher')
  ) {
    verification.flags.push('economic_increase_claimed');
    verification.insights.push({
      type: 'trend_claim',
      message: 'Story claims economic increase - requires trend analysis verification',
    });
  }

  if (
    storyText.includes('decrease') ||
    storyText.includes('falling') ||
    storyText.includes('declining') ||
    storyText.includes('lower')
  ) {
    verification.flags.push('economic_decrease_claimed');
    verification.insights.push({
      type: 'trend_claim',
      message: 'Story claims economic decrease - requires trend analysis verification',
    });
  }

  // Flag if mentions hardship
  if (
    storyText.includes('struggling') ||
    storyText.includes('hardship') ||
    storyText.includes('difficult') ||
    storyText.includes('cannot afford')
  ) {
    verification.flags.push('economic_hardship_mentioned');
    verification.insights.push({
      type: 'hardship_concern',
      message: 'Story mentions economic hardship - critical indicator requiring verification',
    });
  }

  verification.confidence = Math.min(100, verification.confidence);

  return verification;
}

export default {
  getDatasetList,
  getRegionalIncome,
  getStateGDP,
  getPerCapitaIncome,
  getEconomicTrends,
  getEconomicBaseline,
  verifyEconomicStory,
};
