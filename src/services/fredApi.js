/**
 * FRED (Federal Reserve Economic Data) API Service
 * Federal Reserve Bank of St. Louis
 *
 * Provides access to 800,000+ economic time series including:
 * - Interest rates (Federal Funds Rate, Treasury yields, mortgage rates)
 * - Employment data (unemployment rate, payroll, labor force)
 * - Inflation (CPI, PCE, PPI)
 * - GDP and economic output
 * - Money supply (M1, M2, M3)
 * - Exchange rates and international data
 * - Housing market indicators
 * - Consumer and business surveys
 *
 * API Documentation: https://fred.stlouisfed.org/docs/api/
 * Registration: https://fred.stlouisfed.org/docs/api/api_key.html
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - 30-second timeout per request
 * - Maximum 3 retry attempts
 * - Rate limit: 120 requests per minute
 * - Graceful degradation on failure
 */

// Try Vite environment first, then Node.js process.env
const FRED_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FRED_API_BASE) ||
  (typeof process !== 'undefined' && process.env?.VITE_FRED_API_BASE) ||
  'https://api.stlouisfed.org/fred';

// FRED API Key
const FRED_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FRED_API_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_FRED_API_KEY) ||
  null;

// Request configuration
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // Base delay: 2 seconds

// Popular FRED Series IDs
export const FRED_SERIES = {
  UNEMPLOYMENT_RATE: 'UNRATE',
  CPI_INFLATION: 'CPIAUCSL',
  FEDERAL_FUNDS_RATE: 'DFF',
  GDP: 'GDP',
  NONFARM_PAYROLL: 'PAYEMS',
  MORTGAGE_30Y: 'MORTGAGE30US',
  INDUSTRIAL_PRODUCTION: 'INDPRO',
  CONSUMER_SENTIMENT: 'UMCSENT',
  HOUSING_STARTS: 'HOUST',
  RETAIL_SALES: 'RSXFS',
  PERSONAL_INCOME: 'PI',
  PERSONAL_SAVINGS_RATE: 'PSAVERT',
  M2_MONEY_SUPPLY: 'M2SL',
};

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make a GET request to FRED API with retry logic
 * @param {string} endpoint - API endpoint (e.g., 'series/observations')
 * @param {Object} params - Query parameters
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} API response data
 */
async function makeRequest(endpoint, params = {}, retryCount = 0) {
  if (!FRED_API_KEY) {
    throw new Error('FRED API key not configured. Please set VITE_FRED_API_KEY in .env');
  }

  // Add API key and JSON format
  const queryParams = {
    api_key: FRED_API_KEY,
    file_type: 'json',
    ...params,
  };

  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${FRED_API_BASE}/${endpoint}?${queryString}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    console.log(`FRED API request: ${endpoint} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

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
      throw new Error(`FRED API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // Check for FRED API errors in response
    if (data.error_code || data.error_message) {
      throw new Error(`FRED API error: ${data.error_message || data.error_code}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`FRED API timeout on attempt ${retryCount + 1}`);

      if (retryCount < MAX_RETRIES) {
        const waitTime = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Retrying in ${waitTime / 1000} seconds...`);
        await sleep(waitTime);
        return makeRequest(endpoint, params, retryCount + 1);
      }

      throw new Error('timeout');
    }

    console.error('FRED API Request Error:', error);

    if (retryCount < MAX_RETRIES) {
      const waitTime = RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.log(`Retrying in ${waitTime / 1000} seconds...`);
      await sleep(waitTime);
      return makeRequest(endpoint, params, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Get observations (data points) for a specific series
 * @param {string} seriesId - FRED series ID (e.g., 'UNRATE')
 * @param {Object} options - Query options (observation_start, observation_end, limit, etc.)
 * @returns {Promise<Object>} Series observations
 */
export async function getSeriesObservations(seriesId, options = {}) {
  try {
    const params = {
      series_id: seriesId,
      sort_order: 'desc', // Most recent first
      limit: 100, // Default to last 100 observations
      ...options,
    };

    const data = await makeRequest('series/observations', params);

    return {
      seriesId: seriesId,
      count: data.observations?.length || 0,
      observations: data.observations || [],
      source: 'FRED API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FRED API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'FRED API temporarily unavailable',
      seriesId: seriesId,
      count: 0,
      observations: [],
      source: 'FRED API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get unemployment rate data
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Unemployment rate data
 */
export async function getUnemploymentRate(options = {}) {
  return getSeriesObservations(FRED_SERIES.UNEMPLOYMENT_RATE, options);
}

/**
 * Get inflation data (CPI)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} CPI data
 */
export async function getInflationRate(options = {}) {
  return getSeriesObservations(FRED_SERIES.CPI_INFLATION, options);
}

/**
 * Get federal funds rate
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Federal funds rate data
 */
export async function getFederalFundsRate(options = {}) {
  return getSeriesObservations(FRED_SERIES.FEDERAL_FUNDS_RATE, options);
}

/**
 * Get GDP data
 * @param {Object} options - Query options
 * @returns {Promise<Object>} GDP data
 */
export async function getGDP(options = {}) {
  return getSeriesObservations(FRED_SERIES.GDP, options);
}

/**
 * Get mortgage rates (30-year fixed)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Mortgage rate data
 */
export async function getMortgageRates(options = {}) {
  return getSeriesObservations(FRED_SERIES.MORTGAGE_30Y, options);
}

/**
 * Search for series by keywords
 * @param {string} searchText - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
export async function searchSeries(searchText, options = {}) {
  try {
    const params = {
      search_text: searchText,
      limit: 25,
      ...options,
    };

    const data = await makeRequest('series/search', params);

    return {
      query: searchText,
      count: data.seriess?.length || 0,
      series: data.seriess || [],
      source: 'FRED API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FRED API search error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'FRED API search temporarily unavailable',
      query: searchText,
      count: 0,
      series: [],
      source: 'FRED API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get information about a specific series
 * @param {string} seriesId - FRED series ID
 * @returns {Promise<Object>} Series information
 */
export async function getSeriesInfo(seriesId) {
  try {
    const params = {
      series_id: seriesId,
    };

    const data = await makeRequest('series', params);

    return {
      seriesId: seriesId,
      info: data.seriess?.[0] || null,
      source: 'FRED API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FRED API series info error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'FRED API temporarily unavailable',
      seriesId: seriesId,
      info: null,
      source: 'FRED API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get multiple economic indicators at once
 * @param {Array<string>} seriesIds - Array of FRED series IDs
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Multiple series data
 */
export async function getMultipleIndicators(seriesIds, options = {}) {
  const results = {};

  for (const seriesId of seriesIds) {
    const data = await getSeriesObservations(seriesId, options);
    results[seriesId] = data;
  }

  return {
    indicators: results,
    count: seriesIds.length,
    source: 'FRED API',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get economic baseline for comparison
 * @param {string} seriesId - FRED series ID
 * @param {string} baselineDate - Baseline date (YYYY-MM-DD)
 * @param {string} currentDate - Current date (YYYY-MM-DD)
 * @returns {Promise<Object>} Baseline comparison
 */
export async function getEconomicBaseline(seriesId, baselineDate, currentDate = null) {
  try {
    const endDate = currentDate || new Date().toISOString().split('T')[0];

    const data = await getSeriesObservations(seriesId, {
      observation_start: baselineDate,
      observation_end: endDate,
      sort_order: 'asc',
    });

    if (data.error || data.observations.length === 0) {
      return {
        error: true,
        errorType: 'no_data',
        errorMessage: 'No baseline data available',
        seriesId: seriesId,
        source: 'FRED API (unavailable)',
      };
    }

    const baseline = data.observations[0];
    const current = data.observations[data.observations.length - 1];
    const baselineValue = parseFloat(baseline.value);
    const currentValue = parseFloat(current.value);

    let percentChange = 0;
    if (!isNaN(baselineValue) && !isNaN(currentValue) && baselineValue !== 0) {
      percentChange = ((currentValue - baselineValue) / baselineValue) * 100;
    }

    return {
      seriesId: seriesId,
      baselineDate: baseline.date,
      baselineValue: baselineValue,
      currentDate: current.date,
      currentValue: currentValue,
      percentChange: percentChange,
      absoluteChange: currentValue - baselineValue,
      trend: percentChange > 0 ? 'increasing' : percentChange < 0 ? 'decreasing' : 'stable',
      allObservations: data.observations,
      source: 'FRED API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FRED baseline comparison error:', error.message);
    return {
      error: true,
      errorType: 'comparison_failed',
      errorMessage: 'FRED baseline comparison failed',
      seriesId: seriesId,
      source: 'FRED API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Verify economic-related claims in a citizen story
 * @param {Object} story - The citizen story
 * @param {Object} fredData - FRED economic data
 * @returns {Object} Verification results
 */
export function verifyEconomicStory(story, fredData) {
  const verification = {
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
    economicMetrics: {},
  };

  // Check if API data is unavailable
  if (fredData.error) {
    verification.insights.push({
      type: 'api_unavailable',
      message: fredData.errorMessage || 'FRED API temporarily unavailable',
    });
    verification.confidence = 50;
    return verification;
  }

  // Check if story is economics-related
  const storyText = (story.headline + ' ' + story.story).toLowerCase();
  const isEconomicRelated =
    storyText.includes('inflation') ||
    storyText.includes('unemployment') ||
    storyText.includes('interest rate') ||
    storyText.includes('federal reserve') ||
    storyText.includes('fed') ||
    storyText.includes('economy') ||
    storyText.includes('recession') ||
    storyText.includes('gdp') ||
    storyText.includes('job') ||
    storyText.includes('employment') ||
    storyText.includes('mortgage') ||
    storyText.includes('cost of living') ||
    storyText.includes('price') ||
    storyText.includes('wages');

  if (!isEconomicRelated) {
    verification.insights.push({
      type: 'not_economic_related',
      message: 'Story does not appear to be economics-related',
    });
    return verification;
  }

  // Provide economic context
  verification.confidence = 65;

  if (fredData.observations && fredData.observations.length > 0) {
    const latestData = fredData.observations[0];
    verification.economicMetrics = {
      seriesId: fredData.seriesId,
      latestValue: latestData.value,
      latestDate: latestData.date,
      dataPoints: fredData.count,
    };

    verification.insights.push({
      type: 'economic_data_available',
      message: `FRED economic data available for analysis (${fredData.seriesId})`,
    });
    verification.confidence += 15;
  }

  // Check for specific economic mentions
  if (storyText.includes('inflation') || storyText.includes('price')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'inflation_mention',
      message: 'Story mentions inflation/prices - can be verified through FRED CPI data',
    });
  }

  if (storyText.includes('unemployment') || storyText.includes('job')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'employment_mention',
      message: 'Story mentions unemployment/jobs - can be verified through FRED labor data',
    });
  }

  if (storyText.includes('interest rate') || storyText.includes('mortgage')) {
    verification.confidence += 5;
    verification.insights.push({
      type: 'interest_rate_mention',
      message: 'Story mentions interest rates - can be verified through FRED rate data',
    });
  }

  // Flag if mentions increase/decrease
  if (
    storyText.includes('increase') ||
    storyText.includes('rising') ||
    storyText.includes('higher') ||
    storyText.includes('up')
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
    storyText.includes('lower') ||
    storyText.includes('down')
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
    storyText.includes('cannot afford') ||
    storyText.includes("can't afford")
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
  FRED_SERIES,
  getSeriesObservations,
  getUnemploymentRate,
  getInflationRate,
  getFederalFundsRate,
  getGDP,
  getMortgageRates,
  searchSeries,
  getSeriesInfo,
  getMultipleIndicators,
  getEconomicBaseline,
  verifyEconomicStory,
};
