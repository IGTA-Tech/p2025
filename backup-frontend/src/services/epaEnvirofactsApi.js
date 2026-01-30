/**
 * EPA EnviroFacts API Service
 *
 * Provides access to EPA environmental data including:
 * - Toxic Release Inventory (TRI)
 * - Resource Conservation and Recovery Act (RCRA) hazardous waste
 * - Air Quality System (AQS)
 * - Safe Drinking Water Information System (SDWIS)
 * - Greenhouse Gas Reporting Program (GHG)
 * - Facility Registry System (FRS)
 *
 * API Documentation: https://www.epa.gov/enviro/envirofacts-data-service-api
 * Open API - No authentication required
 *
 * ⚠️ IMPORTANT: API has 15-minute timeout limit per request
 * This service uses 5-minute timeout to stay well under the limit
 */

const EPA_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_EPA_ENVIROFACTS_API_BASE) ||
  (typeof process !== 'undefined' && process.env?.VITE_EPA_ENVIROFACTS_API_BASE) ||
  'https://data.epa.gov/efservice';

// Request timeout: 5 minutes (300 seconds) to stay under EPA's 15-minute limit
const REQUEST_TIMEOUT_MS = 300000;

// Default pagination size
const DEFAULT_PAGE_SIZE = 1000;

/**
 * Make a GET request to EPA EnviroFacts API with timeout handling
 * @param {string} table - Table name (e.g., 'tri_facility', 'rcra_haz_waste')
 * @param {Object} filters - Query filters
 * @param {Object} options - Additional options (rows, page_size, output format)
 * @returns {Promise<Object>} API response data
 */
async function makeRequest(table, filters = {}, options = {}) {
  const { rows, page_size, output = 'JSON' } = options;

  // Build URL path with filters
  let path = `/${table}`;

  // Add filters to path
  Object.entries(filters).forEach(([key, value]) => {
    path += `/${key}/${value}`;
  });

  // Add pagination if specified
  if (rows !== undefined) {
    path += `/rows/${rows}`;
  }
  if (page_size !== undefined) {
    path += `/page_size/${page_size}`;
  }

  const url = `${EPA_API_BASE}${path}/${output}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EPA API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('EPA API timeout (exceeded 5 minutes):', url);
      throw new Error('timeout');
    }
    console.error('EPA API Request Error:', error);
    throw error;
  }
}

/**
 * Query a table with basic filters
 * @param {string} table - EPA table name
 * @param {Object} filters - Query filters
 * @param {number} maxRows - Maximum rows to return
 * @returns {Promise<Object>} Query results
 */
export async function queryTable(table, filters = {}, maxRows = 1000) {
  try {
    const data = await makeRequest(table, filters, { rows: `0:${maxRows}` });

    return {
      table: table,
      count: Array.isArray(data) ? data.length : 0,
      results: Array.isArray(data) ? data : [],
      source: 'EPA EnviroFacts API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('EPA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: error.message.includes('timeout')
        ? 'EPA EnviroFacts API experienced timeout (15-minute limit exceeded)'
        : 'EPA EnviroFacts API temporarily unavailable',
      table: table,
      count: 0,
      results: [],
      source: 'EPA EnviroFacts API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Query with pagination for large datasets
 * @param {string} table - EPA table name
 * @param {Object} filters - Query filters
 * @param {number} pageSize - Results per page
 * @param {number} maxPages - Maximum pages to fetch
 * @returns {Promise<Object>} Paginated results
 */
export async function queryWithPagination(table, filters = {}, pageSize = DEFAULT_PAGE_SIZE, maxPages = 5) {
  try {
    const allResults = [];
    let currentPage = 0;

    while (currentPage < maxPages) {
      const startRow = currentPage * pageSize;
      const endRow = startRow + pageSize - 1;

      const data = await makeRequest(table, filters, {
        rows: `${startRow}:${endRow}`,
      });

      if (!Array.isArray(data) || data.length === 0) {
        break; // No more results
      }

      allResults.push(...data);

      if (data.length < pageSize) {
        break; // Last page (partial results)
      }

      currentPage++;
    }

    return {
      table: table,
      count: allResults.length,
      pages: currentPage + 1,
      results: allResults,
      source: 'EPA EnviroFacts API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('EPA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: error.message.includes('timeout')
        ? 'EPA EnviroFacts API experienced timeout (15-minute limit exceeded)'
        : 'EPA EnviroFacts API temporarily unavailable',
      table: table,
      count: 0,
      pages: 0,
      results: [],
      source: 'EPA EnviroFacts API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get TRI (Toxic Release Inventory) facilities by ZIP code
 * @param {string} zipCode - 5-digit ZIP code
 * @param {number} year - Reporting year (e.g., 2022)
 * @returns {Promise<Object>} TRI facilities data
 */
export async function getTRIFacilitiesByZip(zipCode, year = 2022) {
  try {
    const data = await makeRequest('tri_facility', {
      zip: zipCode,
      year: year,
    }, { rows: '0:100' });

    return {
      zipCode: zipCode,
      year: year,
      count: Array.isArray(data) ? data.length : 0,
      facilities: Array.isArray(data) ? data : [],
      source: 'EPA EnviroFacts API (TRI)',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('EPA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: error.message.includes('timeout')
        ? 'EPA EnviroFacts API experienced timeout (15-minute limit exceeded)'
        : 'EPA EnviroFacts API temporarily unavailable',
      zipCode: zipCode,
      year: year,
      count: 0,
      facilities: [],
      source: 'EPA EnviroFacts API (TRI - unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get RCRA (hazardous waste) facilities by state
 * @param {string} state - 2-letter state code
 * @returns {Promise<Object>} RCRA facilities data
 */
export async function getRCRAFacilitiesByState(state) {
  try {
    const data = await makeRequest('rcra_facility', {
      state_code: state,
    }, { rows: '0:500' });

    return {
      state: state,
      count: Array.isArray(data) ? data.length : 0,
      facilities: Array.isArray(data) ? data : [],
      source: 'EPA EnviroFacts API (RCRA)',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('EPA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: error.message.includes('timeout')
        ? 'EPA EnviroFacts API experienced timeout (15-minute limit exceeded)'
        : 'EPA EnviroFacts API temporarily unavailable',
      state: state,
      count: 0,
      facilities: [],
      source: 'EPA EnviroFacts API (RCRA - unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get air quality data by state and county
 * @param {string} stateCode - 2-digit state FIPS code
 * @param {string} countyCode - 3-digit county FIPS code
 * @param {number} year - Year
 * @returns {Promise<Object>} Air quality data
 */
export async function getAirQualityData(stateCode, countyCode, year = 2022) {
  try {
    const data = await makeRequest('aqs_annual_summary', {
      state_code: stateCode,
      county_code: countyCode,
      year: year,
    }, { rows: '0:200' });

    return {
      state: stateCode,
      county: countyCode,
      year: year,
      count: Array.isArray(data) ? data.length : 0,
      measurements: Array.isArray(data) ? data : [],
      source: 'EPA EnviroFacts API (AQS)',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('EPA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: error.message.includes('timeout')
        ? 'EPA EnviroFacts API experienced timeout (15-minute limit exceeded)'
        : 'EPA EnviroFacts API temporarily unavailable',
      state: stateCode,
      county: countyCode,
      year: year,
      count: 0,
      measurements: [],
      source: 'EPA EnviroFacts API (AQS - unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get drinking water systems by ZIP code
 * @param {string} zipCode - 5-digit ZIP code
 * @returns {Promise<Object>} Water systems data
 */
export async function getWaterSystemsByZip(zipCode) {
  try {
    const data = await makeRequest('sdw_geographic_area', {
      zip_code: zipCode,
    }, { rows: '0:50' });

    return {
      zipCode: zipCode,
      count: Array.isArray(data) ? data.length : 0,
      systems: Array.isArray(data) ? data : [],
      source: 'EPA EnviroFacts API (SDWIS)',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('EPA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: error.message.includes('timeout')
        ? 'EPA EnviroFacts API experienced timeout (15-minute limit exceeded)'
        : 'EPA EnviroFacts API temporarily unavailable',
      zipCode: zipCode,
      count: 0,
      systems: [],
      source: 'EPA EnviroFacts API (SDWIS - unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get greenhouse gas emissions by facility
 * @param {string} state - 2-letter state code
 * @param {number} year - Reporting year
 * @returns {Promise<Object>} GHG emissions data
 */
export async function getGHGEmissionsByState(state, year = 2022) {
  try {
    const data = await makeRequest('ghg_emission', {
      state: state,
      year: year,
    }, { rows: '0:100' });

    return {
      state: state,
      year: year,
      count: Array.isArray(data) ? data.length : 0,
      emissions: Array.isArray(data) ? data : [],
      source: 'EPA EnviroFacts API (GHG)',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('EPA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: error.message.includes('timeout')
        ? 'EPA EnviroFacts API experienced timeout (15-minute limit exceeded)'
        : 'EPA EnviroFacts API temporarily unavailable',
      state: state,
      year: year,
      count: 0,
      emissions: [],
      source: 'EPA EnviroFacts API (GHG - unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Search facilities by name
 * @param {string} facilityName - Partial facility name to search
 * @returns {Promise<Object>} Facility search results
 */
export async function searchFacilityByName(facilityName) {
  try {
    const data = await makeRequest('frs_facility', {
      primary_name: facilityName,
    }, { rows: '0:50' });

    return {
      searchTerm: facilityName,
      count: Array.isArray(data) ? data.length : 0,
      facilities: Array.isArray(data) ? data : [],
      source: 'EPA EnviroFacts API (FRS)',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('EPA API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: error.message.includes('timeout')
        ? 'EPA EnviroFacts API experienced timeout (15-minute limit exceeded)'
        : 'EPA EnviroFacts API temporarily unavailable',
      searchTerm: facilityName,
      count: 0,
      facilities: [],
      source: 'EPA EnviroFacts API (FRS - unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Verify environmental-related claims in a citizen story
 * @param {Object} story - The citizen story
 * @param {Object} epaData - EPA data for verification
 * @returns {Object} Verification results
 */
export function verifyEnvironmentalStory(story, epaData) {
  const verification = {
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
    environmentalMetrics: {},
  };

  // Check if API data is unavailable
  if (epaData.error) {
    verification.insights.push({
      type: 'api_unavailable',
      message: epaData.errorMessage || 'EPA EnviroFacts API temporarily unavailable',
    });
    verification.confidence = 50;
    return verification;
  }

  // Check if story is environment-related
  const storyText = (story.headline + ' ' + story.story).toLowerCase();
  const isEnvironmentRelated =
    storyText.includes('pollution') ||
    storyText.includes('toxic') ||
    storyText.includes('chemical') ||
    storyText.includes('hazardous') ||
    storyText.includes('waste') ||
    storyText.includes('air quality') ||
    storyText.includes('water quality') ||
    storyText.includes('emissions') ||
    storyText.includes('contamination') ||
    storyText.includes('environmental') ||
    storyText.includes('epa');

  if (!isEnvironmentRelated) {
    verification.insights.push({
      type: 'not_environment_related',
      message: 'Story does not appear to be environment-related',
    });
    return verification;
  }

  // Provide environmental context
  verification.confidence = 60;

  if (epaData.count > 0) {
    verification.environmentalMetrics = {
      facilitiesFound: epaData.count,
    };

    verification.insights.push({
      type: 'facilities_found',
      message: `Found ${epaData.count} EPA-tracked facilities in the area`,
    });
    verification.confidence += 15;
  }

  // Check for specific environmental concerns
  if (storyText.includes('toxic') || storyText.includes('hazardous')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'toxic_mention',
      message: 'Story mentions toxic/hazardous substances - can be verified through TRI data',
    });
  }

  if (storyText.includes('air quality') || storyText.includes('emissions')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'air_quality_mention',
      message: 'Story mentions air quality/emissions - can be verified through AQS data',
    });
  }

  if (storyText.includes('water') || storyText.includes('drinking water')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'water_quality_mention',
      message: 'Story mentions water quality - can be verified through SDWIS data',
    });
  }

  // Flag if mentions health impacts
  if (
    storyText.includes('cancer') ||
    storyText.includes('illness') ||
    storyText.includes('health') ||
    storyText.includes('sick')
  ) {
    verification.flags.push('health_impact_mentioned');
    verification.insights.push({
      type: 'health_concern',
      message: 'Story mentions health impacts - critical indicator requiring verification',
    });
  }

  verification.confidence = Math.min(100, verification.confidence);

  return verification;
}

export default {
  queryTable,
  queryWithPagination,
  getTRIFacilitiesByZip,
  getRCRAFacilitiesByState,
  getAirQualityData,
  getWaterSystemsByZip,
  getGHGEmissionsByState,
  searchFacilityByName,
  verifyEnvironmentalStory,
};
