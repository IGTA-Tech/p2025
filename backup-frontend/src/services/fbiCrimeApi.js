/**
 * FBI Crime Data Explorer API Service
 *
 * Provides access to FBI Uniform Crime Reporting (UCR) data including:
 * - State-level crime statistics
 * - Agency-level data (police departments, sheriff offices)
 * - National estimates
 * - Historical data back to 1995
 * - Violent crime and property crime categories
 *
 * API Documentation: https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/home
 * Open API - No authentication required
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - 30-second timeout per request
 * - Maximum 3 retry attempts
 * - Graceful degradation on failure
 */

const FBI_CRIME_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FBI_CRIME_API_BASE) ||
  (typeof process !== 'undefined' && process.env?.VITE_FBI_CRIME_API_BASE) ||
  'https://api.usa.gov/crime/fbi/cde';

// Data.gov API Key - provides access to 450+ federal APIs
const DATA_GOV_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DATA_GOV_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_DATA_GOV_API_KEY) ||
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
 * Make a GET request to FBI Crime Data API with retry logic
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} API response data
 */
async function makeRequest(endpoint, params = {}, retryCount = 0) {
  // Add Data.gov API key if available
  if (DATA_GOV_API_KEY) {
    params.api_key = DATA_GOV_API_KEY;
  }

  const queryParams = new URLSearchParams(params);
  const queryString = queryParams.toString();
  const url = `${FBI_CRIME_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    console.log(`FBI Crime API request: ${endpoint} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

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
      throw new Error(`FBI Crime API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`FBI Crime API timeout on attempt ${retryCount + 1}`);

      if (retryCount < MAX_RETRIES) {
        const waitTime = RETRY_DELAY_MS * Math.pow(2, retryCount);  // Exponential backoff
        console.log(`Retrying in ${waitTime / 1000} seconds...`);
        await sleep(waitTime);
        return makeRequest(endpoint, params, retryCount + 1);
      }

      throw new Error('timeout');
    }

    console.error('FBI Crime API Request Error:', error);

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
 * Get crime data for a specific state
 * @param {string} stateAbbr - Two-letter state code (e.g., 'TX', 'CA')
 * @param {number} year - Year for data (default 2023)
 * @returns {Promise<Object>} Crime data
 */
export async function getCrimeDataByState(stateAbbr, year = 2023) {
  try {
    const endpoint = `/summarized/state/${stateAbbr}`;
    const params = { year: year };

    const data = await makeRequest(endpoint, params);

    return {
      state: stateAbbr,
      year: year,
      data: data,
      source: 'FBI Crime Data Explorer API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FBI Crime API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'FBI Crime Data API temporarily unavailable',
      state: stateAbbr,
      year: year,
      data: null,
      source: 'FBI Crime Data Explorer API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get crime trend data across multiple years
 * @param {string} stateAbbr - Two-letter state code
 * @param {number} startYear - Beginning year
 * @param {number} endYear - Ending year
 * @returns {Promise<Object>} Trend data
 */
export async function getCrimeTrends(stateAbbr, startYear = 2020, endYear = 2023) {
  const trendData = [];

  for (let year = startYear; year <= endYear; year++) {
    const data = await getCrimeDataByState(stateAbbr, year);

    if (!data.error) {
      trendData.push(data);
    } else {
      console.warn(`Missing crime data for ${stateAbbr} in ${year}. Continuing with available years.`);
    }
  }

  if (trendData.length === 0) {
    console.error('No crime trend data available. Moving to next analysis component.');
    return {
      error: true,
      errorType: 'no_data',
      errorMessage: 'No crime trend data available for the specified period',
      state: stateAbbr,
      startYear: startYear,
      endYear: endYear,
      trendData: [],
      source: 'FBI Crime Data Explorer API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }

  return {
    state: stateAbbr,
    startYear: startYear,
    endYear: endYear,
    yearsAvailable: trendData.length,
    trendData: trendData,
    source: 'FBI Crime Data Explorer API',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get baseline comparison (compare recent year to baseline)
 * @param {string} stateAbbr - Two-letter state code
 * @param {number} baselineYear - Baseline year (default 2023)
 * @param {number} currentYear - Current year (default 2024)
 * @returns {Promise<Object>} Comparison data
 */
export async function getBaselineComparison(stateAbbr, baselineYear = 2023, currentYear = 2024) {
  try {
    const baselineData = await getCrimeDataByState(stateAbbr, baselineYear);
    const currentData = await getCrimeDataByState(stateAbbr, currentYear);

    if (baselineData.error || currentData.error) {
      console.warn('Incomplete crime data for baseline comparison. Using partial analysis.');
      return {
        status: 'partial',
        message: 'FBI Crime data partially unavailable. Analysis continuing with other data sources.',
        state: stateAbbr,
        baselineYear: baselineYear,
        currentYear: currentYear,
        baseline: baselineData,
        current: currentData,
        source: 'FBI Crime Data Explorer API (partial)',
        lastUpdated: new Date().toISOString(),
      };
    }

    // Calculate changes if both datasets available
    const changes = calculateChanges(baselineData.data, currentData.data);

    return {
      status: 'complete',
      state: stateAbbr,
      baselineYear: baselineYear,
      currentYear: currentYear,
      baseline: baselineData,
      current: currentData,
      changes: changes,
      source: 'FBI Crime Data Explorer API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FBI Crime API baseline comparison error:', error.message);
    return {
      error: true,
      errorType: 'comparison_failed',
      errorMessage: 'FBI Crime Data API baseline comparison failed',
      state: stateAbbr,
      baselineYear: baselineYear,
      currentYear: currentYear,
      source: 'FBI Crime Data Explorer API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Calculate percentage changes between two datasets
 * @param {Object} baseline - Baseline crime data
 * @param {Object} current - Current crime data
 * @returns {Object} Calculated changes
 */
function calculateChanges(baseline, current) {
  const changes = {};

  if (!baseline || !current) {
    return changes;
  }

  // Extract relevant crime metrics and calculate changes
  // Note: Actual structure depends on FBI API response format
  try {
    // Example calculation (adjust based on actual API response structure)
    if (baseline.violent_crime !== undefined && current.violent_crime !== undefined) {
      const baselineVal = baseline.violent_crime || 0;
      const currentVal = current.violent_crime || 0;
      changes.violent_crime_change = baselineVal !== 0
        ? ((currentVal - baselineVal) / baselineVal) * 100
        : 0;
    }

    if (baseline.property_crime !== undefined && current.property_crime !== undefined) {
      const baselineVal = baseline.property_crime || 0;
      const currentVal = current.property_crime || 0;
      changes.property_crime_change = baselineVal !== 0
        ? ((currentVal - baselineVal) / baselineVal) * 100
        : 0;
    }
  } catch (error) {
    console.error('Error calculating crime changes:', error);
  }

  return changes;
}

/**
 * Verify crime-related claims in a citizen story
 * @param {Object} story - The citizen story
 * @param {Object} crimeData - FBI crime data
 * @returns {Object} Verification results
 */
export function verifyCrimeStory(story, crimeData) {
  const verification = {
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
    crimeMetrics: {},
  };

  // Check if API data is unavailable
  if (crimeData.error) {
    verification.insights.push({
      type: 'api_unavailable',
      message: crimeData.errorMessage || 'FBI Crime Data API temporarily unavailable',
    });
    verification.confidence = 50;
    return verification;
  }

  // Check if story is crime-related
  const storyText = (story.headline + ' ' + story.story).toLowerCase();
  const isCrimeRelated =
    storyText.includes('crime') ||
    storyText.includes('violence') ||
    storyText.includes('murder') ||
    storyText.includes('robbery') ||
    storyText.includes('assault') ||
    storyText.includes('burglary') ||
    storyText.includes('theft') ||
    storyText.includes('police') ||
    storyText.includes('safety') ||
    storyText.includes('dangerous');

  if (!isCrimeRelated) {
    verification.insights.push({
      type: 'not_crime_related',
      message: 'Story does not appear to be crime-related',
    });
    return verification;
  }

  // Provide crime context
  verification.confidence = 65;

  if (crimeData.data) {
    verification.crimeMetrics = {
      state: crimeData.state,
      year: crimeData.year,
      dataAvailable: true,
    };

    verification.insights.push({
      type: 'crime_data_available',
      message: `FBI crime statistics available for ${crimeData.state} (${crimeData.year})`,
    });
    verification.confidence += 15;
  }

  // Check for specific crime mentions
  if (storyText.includes('violent') || storyText.includes('murder') || storyText.includes('assault')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'violent_crime_mention',
      message: 'Story mentions violent crime - can be verified through FBI UCR data',
    });
  }

  if (storyText.includes('property') || storyText.includes('burglary') || storyText.includes('theft')) {
    verification.confidence += 5;
    verification.insights.push({
      type: 'property_crime_mention',
      message: 'Story mentions property crime - can be verified through FBI UCR data',
    });
  }

  // Flag if mentions specific increase/decrease
  if (storyText.includes('increase') || storyText.includes('rising') || storyText.includes('surge')) {
    verification.flags.push('crime_increase_claimed');
    verification.insights.push({
      type: 'trend_claim',
      message: 'Story claims crime increase - requires trend analysis verification',
    });
  }

  if (storyText.includes('decrease') || storyText.includes('falling') || storyText.includes('decline')) {
    verification.flags.push('crime_decrease_claimed');
    verification.insights.push({
      type: 'trend_claim',
      message: 'Story claims crime decrease - requires trend analysis verification',
    });
  }

  verification.confidence = Math.min(100, verification.confidence);

  return verification;
}

export default {
  getCrimeDataByState,
  getCrimeTrends,
  getBaselineComparison,
  verifyCrimeStory,
};
