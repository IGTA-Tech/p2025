/**
 * HRSA (Health Resources and Services Administration) Data API Integration
 *
 * Open Data API - No Authentication Required
 * API Documentation: https://data.hrsa.gov/tools/data-reporting/program-data
 *
 * Tracks Project 2025 impacts on:
 * - Federally-funded health centers and safety-net clinics
 * - Ryan White HIV/AIDS care sites
 * - National Health Service Corps (NHSC) provider locations
 * - Healthcare Professional Shortage Areas (HPSAs)
 * - Medically Underserved Areas/Populations (MUA/MUPs)
 *
 * Critical for Project 2025 policies affecting:
 * - Medicaid cuts and ACA repeal impacts
 * - Safety-net healthcare facility closures
 * - Rural healthcare access reduction
 * - HIV/AIDS care program defunding
 * - Maternal health desert expansion
 *
 * API Endpoints Integrated:
 * 1. Health Center Service Delivery Sites - All federally-qualified health centers (FQHCs)
 * 2. Ryan White HIV/AIDS Program Sites - HIV care provider locations
 * 3. Health Workforce - NHSC providers and shortage designations
 *
 * Data Coverage:
 * - 1,400+ health centers
 * - 14,000+ service delivery sites
 * - 30M+ patients served annually
 * - All 50 states + territories
 */

// Environment-agnostic API base URL
const HRSA_API_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_HRSA_API_BASE) ||
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.VITE_HRSA_API_BASE) ||
  'https://data.hrsa.gov/api/1';

// Environment-agnostic API token
const HRSA_API_TOKEN =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_HRSA_API_TOKEN) ||
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.VITE_HRSA_API_TOKEN) ||
  null;

// Error handling configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 30000;

// Helper function: Sleep for retry delays
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make HTTP request to HRSA API with retry logic
 *
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} - API response data
 */
async function makeRequest(endpoint, params = {}, retryCount = 0) {
  const url = new URL(`${HRSA_API_BASE}${endpoint}`);

  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`🏥 Requesting HRSA API: ${endpoint} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

    // Build headers object
    const headers = {
      Accept: 'application/json',
      'User-Agent': 'DemocraticAccountabilityPlatform/1.0',
    };

    // Add authentication token if available
    if (HRSA_API_TOKEN) {
      headers['X-App-Token'] = HRSA_API_TOKEN;
      console.log('🔑 Using HRSA API token for authentication');
    } else {
      console.warn('⚠️ No HRSA API token found - requests may be rate-limited');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if we should retry
    if (retryCount < MAX_RETRIES && !error.message.includes('404')) {
      console.warn(`⚠️ HRSA API request failed, retrying in ${RETRY_DELAY_MS}ms...`, error.message);
      await sleep(RETRY_DELAY_MS);
      return makeRequest(endpoint, params, retryCount + 1);
    }

    // Final error after all retries
    console.error(`❌ HRSA API request failed after ${retryCount + 1} attempts:`, error);
    throw error;
  }
}

/**
 * Get health centers in a specific state
 *
 * @param {string} stateCode - 2-letter state code (e.g., "CA", "TX")
 * @param {number} limit - Number of results to return (default: 100)
 * @returns {Promise<Object>} - Health center data
 */
export async function getHealthCentersByState(stateCode, limit = 100) {
  try {
    console.log(`🔍 Fetching HRSA health centers for state: ${stateCode}`);

    const response = await makeRequest('/datadownload/dataset/health-center-service-delivery-and-look-alike-sites', {
      state_abbreviation: stateCode.toUpperCase(),
      $limit: limit,
    });

    return {
      success: true,
      stateCode,
      count: response.length || 0,
      healthCenters: response || [],
      metadata: {
        source: 'HRSA Health Center Program',
        timestamp: new Date().toISOString(),
        coverage: 'Federally-qualified health centers (FQHCs)',
      },
    };
  } catch (error) {
    console.error(`Error fetching HRSA health centers for ${stateCode}:`, error);
    return {
      success: false,
      error: error.message,
      stateCode,
      healthCenters: [],
    };
  }
}

/**
 * Get Ryan White HIV/AIDS care sites in a specific state
 *
 * @param {string} stateCode - 2-letter state code (e.g., "CA", "NY")
 * @param {number} limit - Number of results to return (default: 100)
 * @returns {Promise<Object>} - Ryan White site data
 */
export async function getRyanWhiteSitesByState(stateCode, limit = 100) {
  try {
    console.log(`🔍 Fetching Ryan White HIV/AIDS sites for state: ${stateCode}`);

    const response = await makeRequest('/datadownload/dataset/ryan-white-hiv-aids-program-part-c-grantees', {
      state: stateCode.toUpperCase(),
      $limit: limit,
    });

    return {
      success: true,
      stateCode,
      count: response.length || 0,
      sites: response || [],
      metadata: {
        source: 'HRSA Ryan White HIV/AIDS Program',
        timestamp: new Date().toISOString(),
        coverage: 'Ryan White Part C Early Intervention Services',
      },
    };
  } catch (error) {
    console.error(`Error fetching Ryan White sites for ${stateCode}:`, error);
    return {
      success: false,
      error: error.message,
      stateCode,
      sites: [],
    };
  }
}

/**
 * Get Health Professional Shortage Areas (HPSAs) by state
 *
 * @param {string} stateCode - 2-letter state code
 * @param {string} shortageType - Type: "primary-care", "dental", "mental-health" (optional)
 * @param {number} limit - Number of results to return (default: 100)
 * @returns {Promise<Object>} - HPSA designation data
 */
export async function getHealthProfessionalShortageAreas(stateCode, shortageType = null, limit = 100) {
  try {
    console.log(`🔍 Fetching HPSA shortage areas for state: ${stateCode}`);

    const params = {
      common_state_abbreviation: stateCode.toUpperCase(),
      $limit: limit,
    };

    // Filter by shortage type if specified
    if (shortageType) {
      const typeMap = {
        'primary-care': 'Primary Care',
        dental: 'Dental',
        'mental-health': 'Mental Health',
      };
      params.hpsa_discipline_class = typeMap[shortageType] || shortageType;
    }

    const response = await makeRequest('/datadownload/dataset/bcd-hpsa-schdct', params);

    return {
      success: true,
      stateCode,
      shortageType: shortageType || 'all',
      count: response.length || 0,
      shortageAreas: response || [],
      metadata: {
        source: 'HRSA Health Professional Shortage Areas',
        timestamp: new Date().toISOString(),
        coverage: 'Federal HPSA designations',
      },
    };
  } catch (error) {
    console.error(`Error fetching HPSA data for ${stateCode}:`, error);
    return {
      success: false,
      error: error.message,
      stateCode,
      shortageAreas: [],
    };
  }
}

/**
 * Search for health centers by ZIP code
 *
 * @param {string} zipCode - 5-digit ZIP code
 * @param {number} limit - Number of results to return (default: 50)
 * @returns {Promise<Object>} - Health centers near ZIP code
 */
export async function getHealthCentersByZip(zipCode, limit = 50) {
  try {
    console.log(`🔍 Fetching HRSA health centers for ZIP: ${zipCode}`);

    const response = await makeRequest('/datadownload/dataset/health-center-service-delivery-and-look-alike-sites', {
      zip_code: zipCode,
      $limit: limit,
    });

    return {
      success: true,
      zipCode,
      count: response.length || 0,
      healthCenters: response || [],
      metadata: {
        source: 'HRSA Health Center Program',
        timestamp: new Date().toISOString(),
        searchType: 'ZIP code proximity',
      },
    };
  } catch (error) {
    console.error(`Error fetching health centers for ZIP ${zipCode}:`, error);
    return {
      success: false,
      error: error.message,
      zipCode,
      healthCenters: [],
    };
  }
}

/**
 * Get NHSC (National Health Service Corps) provider counts by state
 *
 * @param {string} stateCode - 2-letter state code
 * @returns {Promise<Object>} - NHSC provider data
 */
export async function getNHSCProvidersByState(stateCode) {
  try {
    console.log(`🔍 Fetching NHSC providers for state: ${stateCode}`);

    const response = await makeRequest('/datadownload/dataset/nhsc-members', {
      state: stateCode.toUpperCase(),
      $limit: 1000,
    });

    return {
      success: true,
      stateCode,
      providerCount: response.length || 0,
      providers: response || [],
      metadata: {
        source: 'HRSA National Health Service Corps',
        timestamp: new Date().toISOString(),
        coverage: 'Active NHSC members',
      },
    };
  } catch (error) {
    console.error(`Error fetching NHSC providers for ${stateCode}:`, error);
    return {
      success: false,
      error: error.message,
      stateCode,
      providers: [],
    };
  }
}

/**
 * Analyze healthcare access impact for a specific location
 *
 * Combines health center availability, shortage area status, and provider data
 * to assess local healthcare access and Project 2025 vulnerability
 *
 * @param {string} stateCode - 2-letter state code
 * @param {string} zipCode - Optional 5-digit ZIP code for localized analysis
 * @returns {Promise<Object>} - Healthcare access analysis
 */
export async function analyzeHealthcareAccess(stateCode, zipCode = null) {
  try {
    console.log(`📊 Analyzing healthcare access for ${stateCode}${zipCode ? ` (ZIP: ${zipCode})` : ''}`);

    // Fetch all relevant data in parallel
    const [healthCenters, ryanWhiteSites, shortageAreas, nhscProviders] = await Promise.all([
      zipCode ? getHealthCentersByZip(zipCode) : getHealthCentersByState(stateCode),
      getRyanWhiteSitesByState(stateCode),
      getHealthProfessionalShortageAreas(stateCode),
      getNHSCProvidersByState(stateCode),
    ]);

    // Calculate vulnerability scores
    const healthCenterCount = healthCenters.count || 0;
    const ryanWhiteCount = ryanWhiteSites.count || 0;
    const shortageAreaCount = shortageAreas.count || 0;
    const providerCount = nhscProviders.providerCount || 0;

    // Determine access risk level
    let riskLevel = 'LOW';
    let riskScore = 0;

    if (shortageAreaCount > 10) riskScore += 3;
    else if (shortageAreaCount > 5) riskScore += 2;
    else if (shortageAreaCount > 0) riskScore += 1;

    if (healthCenterCount < 5) riskScore += 3;
    else if (healthCenterCount < 10) riskScore += 2;
    else if (healthCenterCount < 20) riskScore += 1;

    if (providerCount < 50) riskScore += 2;
    else if (providerCount < 100) riskScore += 1;

    if (riskScore >= 6) riskLevel = 'CRITICAL';
    else if (riskScore >= 4) riskLevel = 'HIGH';
    else if (riskScore >= 2) riskLevel = 'MODERATE';

    return {
      success: true,
      location: {
        stateCode,
        zipCode: zipCode || 'statewide',
      },
      analysis: {
        healthCenters: {
          count: healthCenterCount,
          sites: healthCenters.healthCenters || [],
        },
        ryanWhiteSites: {
          count: ryanWhiteCount,
          sites: ryanWhiteSites.sites || [],
        },
        shortageAreas: {
          count: shortageAreaCount,
          areas: shortageAreas.shortageAreas || [],
        },
        nhscProviders: {
          count: providerCount,
          providers: nhscProviders.providers || [],
        },
        vulnerability: {
          riskLevel,
          riskScore,
          maxScore: 8,
          project2025Impact: riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
            ? 'HIGH - Area heavily dependent on federal safety-net programs'
            : riskLevel === 'MODERATE'
            ? 'MODERATE - Some reliance on federal healthcare programs'
            : 'LOW - Adequate healthcare access infrastructure',
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        dataSource: 'HRSA Open Data APIs',
        analysisType: zipCode ? 'local' : 'statewide',
      },
    };
  } catch (error) {
    console.error(`Error analyzing healthcare access for ${stateCode}:`, error);
    return {
      success: false,
      error: error.message,
      location: { stateCode, zipCode },
    };
  }
}

export default {
  getHealthCentersByState,
  getRyanWhiteSitesByState,
  getHealthProfessionalShortageAreas,
  getHealthCentersByZip,
  getNHSCProvidersByState,
  analyzeHealthcareAccess,
};
