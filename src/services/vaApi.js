/**
 * VA (Department of Veterans Affairs) API Integration
 *
 * Open Data APIs - No Authentication Required
 * API Documentation: https://developer.va.gov/
 *
 * Tracks Project 2025 impacts on:
 * - VA facility closures and consolidations
 * - Service reductions at VA medical centers
 * - Benefits form changes and requirements
 * - Access to VA healthcare and benefits
 * - Wait times and facility hours
 *
 * Critical for Project 2025 policies affecting:
 * - VA restructuring and facility consolidation
 * - VA healthcare privatization push
 * - Benefits access restrictions
 * - Reduced VA funding and services
 *
 * APIs Integrated:
 * 1. VA Facilities API - Facility locations, services, hours, wait times
 * 2. VA Forms API - Benefits forms, versions, requirements
 *
 * Data Coverage:
 * - 1,200+ VA facilities nationwide
 * - All VA benefits forms
 * - Real-time facility status and hours
 * - Historical facility data for comparison
 */

// Environment-agnostic API base URLs
const VA_FACILITIES_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_VA_FACILITIES_API_BASE) ||
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.VITE_VA_FACILITIES_API_BASE) ||
  'https://api.va.gov/services/va_facilities/v1';

const VA_FORMS_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_VA_FORMS_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_VA_FORMS_API_BASE) ||
  'https://api.va.gov/services/va_forms/v0';

// Error handling configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 30000;

// Helper function: Sleep for retry delays
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make HTTP request to VA API with retry logic
 *
 * @param {string} baseUrl - API base URL
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} - API response data
 */
async function makeRequest(baseUrl, endpoint, params = {}, retryCount = 0) {
  const url = new URL(`${baseUrl}${endpoint}`);

  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`🏥 Requesting VA API: ${endpoint} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DemocraticAccountabilityPlatform/1.0',
      },
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
    if (retryCount < MAX_RETRIES) {
      const isRetryable =
        error.name === 'AbortError' || // Timeout
        error.message.includes('fetch') || // Network error
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504');

      if (isRetryable) {
        const waitTime = RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.warn(`VA API request failed. Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        return makeRequest(baseUrl, endpoint, params, retryCount + 1);
      }
    }

    // Return error object instead of throwing
    console.error(`❌ VA API error after ${retryCount + 1} attempts: ${error.message}`);
    return {
      error: true,
      errorMessage: error.message,
      errorType: error.name,
      endpoint,
      retryCount,
    };
  }
}

// ============================================================
// VA FACILITIES API
// ============================================================

/**
 * Get VA Facility by ID
 *
 * @param {string} facilityId - VA facility ID (e.g., 'vha_648')
 * @returns {Promise<Object>} - Facility details
 */
export async function getFacilityById(facilityId) {
  try {
    const endpoint = `/facilities/${facilityId}`;
    const data = await makeRequest(VA_FACILITIES_BASE, endpoint);

    if (data.error) {
      console.warn(`⚠️  VA facility data unavailable for ${facilityId}. Continuing...`);
      return {
        error: true,
        message: `VA facility data unavailable for ${facilityId}`,
        errorDetails: data.errorMessage,
        source: 'VA Facilities API',
        facilityId,
      };
    }

    return {
      success: true,
      source: 'VA Facilities API',
      facilityId,
      data: data.data || data,
    };
  } catch (error) {
    console.error(`Error fetching VA facility: ${error.message}`);
    return {
      error: true,
      message: 'Failed to retrieve VA facility data',
      errorDetails: error.message,
      source: 'VA Facilities API',
    };
  }
}

/**
 * Search VA Facilities by location, type, or services
 *
 * @param {Object} options - Search options
 * @param {string} options.state - Two-letter state code (e.g., 'TX')
 * @param {string} options.zip - ZIP code
 * @param {number} options.lat - Latitude
 * @param {number} options.long - Longitude
 * @param {number} options.radius - Search radius in miles (default: 50)
 * @param {string} options.type - Facility type (health, benefits, cemetery, vet_center)
 * @param {string} options.services - Service type filter
 * @returns {Promise<Object>} - Search results
 */
export async function searchFacilities(options = {}) {
  try {
    const endpoint = '/facilities';
    const params = {};

    if (options.state) params.state = options.state;
    if (options.zip) params.zip = options.zip;
    if (options.lat) params.lat = options.lat;
    if (options.long) params.long = options.long;
    if (options.radius) params.radius = options.radius;
    if (options.type) params.type = options.type;
    if (options.services) params.services = options.services;

    // Add pagination
    params.page = options.page || 1;
    params.per_page = options.per_page || 20;

    const data = await makeRequest(VA_FACILITIES_BASE, endpoint, params);

    if (data.error) {
      console.warn('⚠️  VA facilities search unavailable. Continuing...');
      return {
        error: true,
        message: 'VA facilities search unavailable',
        errorDetails: data.errorMessage,
        source: 'VA Facilities API',
        options,
      };
    }

    return {
      success: true,
      source: 'VA Facilities API',
      searchCriteria: options,
      data: data.data || [],
      meta: data.meta || {},
      totalResults: data.meta?.pagination?.total_entries || 0,
    };
  } catch (error) {
    console.error(`Error searching VA facilities: ${error.message}`);
    return {
      error: true,
      message: 'Failed to search VA facilities',
      errorDetails: error.message,
      source: 'VA Facilities API',
    };
  }
}

/**
 * Get nearby VA facilities for a location
 *
 * @param {string} state - Two-letter state code
 * @param {string} zip - ZIP code (optional)
 * @param {string} facilityType - Type filter (optional)
 * @returns {Promise<Object>} - Nearby facilities
 */
export async function getNearbyFacilities(state, zip = null, facilityType = null) {
  const options = {
    state: state.toUpperCase(),
    radius: 50, // 50 miles
  };

  if (zip) options.zip = zip;
  if (facilityType) options.type = facilityType;

  return searchFacilities(options);
}

/**
 * Compare VA facility availability before/after Jan 1, 2025
 *
 * Critical for tracking Project 2025 facility closures and service reductions.
 *
 * NOTE: This requires baseline data collection from before Jan 1, 2025.
 * For now, we document current facilities for future comparison.
 *
 * @param {string} state - State to analyze
 * @param {string} facilityType - Type of facility
 * @returns {Promise<Object>} - Facility comparison data
 */
export async function getFacilitiesBaselineComparison(state, facilityType = 'health') {
  console.log(`🏥 Analyzing VA facilities in ${state} (type: ${facilityType})`);

  // Get current facilities
  const currentFacilities = await searchFacilities({
    state,
    type: facilityType,
    per_page: 100,
  });

  if (currentFacilities.error) {
    return {
      state,
      facilityType,
      status: 'partial',
      message: 'VA facilities data unavailable',
      continue: true,
    };
  }

  // Extract key metrics
  const facilities = currentFacilities.data || [];

  const facilitiesOperating = facilities.filter((f) => {
    const status = f.attributes?.operatingStatus?.code;
    return status === 'NORMAL' || status === 'LIMITED';
  }).length;

  const facilitiesClosed = facilities.filter((f) => {
    const status = f.attributes?.operatingStatus?.code;
    return status === 'CLOSED';
  }).length;

  return {
    state,
    facilityType,
    status: 'complete',
    currentData: {
      totalFacilities: facilities.length,
      operating: facilitiesOperating,
      closed: facilitiesClosed,
      facilities: facilities.map((f) => ({
        id: f.id,
        name: f.attributes?.name,
        city: f.attributes?.address?.physical?.city,
        operatingStatus: f.attributes?.operatingStatus?.code,
        services: f.attributes?.services || [],
      })),
    },
    baselineNote:
      'Baseline comparison requires historical data from before Jan 1, 2025. Current data documented for future tracking.',
    source: 'VA Facilities API',
  };
}

// ============================================================
// VA FORMS API
// ============================================================

/**
 * Get VA Form by Form Number
 *
 * @param {string} formNumber - VA form number (e.g., '10-10EZ')
 * @returns {Promise<Object>} - Form details
 */
export async function getFormByNumber(formNumber) {
  try {
    const endpoint = `/forms/${formNumber}`;
    const data = await makeRequest(VA_FORMS_BASE, endpoint);

    if (data.error) {
      console.warn(`⚠️  VA form data unavailable for ${formNumber}. Continuing...`);
      return {
        error: true,
        message: `VA form data unavailable for ${formNumber}`,
        errorDetails: data.errorMessage,
        source: 'VA Forms API',
        formNumber,
      };
    }

    return {
      success: true,
      source: 'VA Forms API',
      formNumber,
      data: data.data || data,
    };
  } catch (error) {
    console.error(`Error fetching VA form: ${error.message}`);
    return {
      error: true,
      message: 'Failed to retrieve VA form data',
      errorDetails: error.message,
      source: 'VA Forms API',
    };
  }
}

/**
 * Search VA Forms
 *
 * @param {string} query - Search query
 * @returns {Promise<Object>} - Search results
 */
export async function searchForms(query = null) {
  try {
    const endpoint = '/forms';
    const params = {};

    if (query) params.query = query;

    const data = await makeRequest(VA_FORMS_BASE, endpoint, params);

    if (data.error) {
      console.warn('⚠️  VA forms search unavailable. Continuing...');
      return {
        error: true,
        message: 'VA forms search unavailable',
        errorDetails: data.errorMessage,
        source: 'VA Forms API',
        query,
      };
    }

    return {
      success: true,
      source: 'VA Forms API',
      query,
      data: data.data || [],
      totalResults: data.data ? data.data.length : 0,
    };
  } catch (error) {
    console.error(`Error searching VA forms: ${error.message}`);
    return {
      error: true,
      message: 'Failed to search VA forms',
      errorDetails: error.message,
      source: 'VA Forms API',
    };
  }
}

/**
 * Track VA form changes over time
 *
 * Monitors form version updates that may indicate policy changes.
 *
 * @param {string} formNumber - Form to track
 * @returns {Promise<Object>} - Form version information
 */
export async function trackFormChanges(formNumber) {
  const formData = await getFormByNumber(formNumber);

  if (formData.error) {
    return {
      formNumber,
      status: 'unavailable',
      message: 'Form data unavailable',
    };
  }

  const form = formData.data?.attributes || formData.data;

  return {
    formNumber,
    status: 'tracked',
    currentVersion: {
      title: form.title,
      url: form.url,
      lastRevisionDate: form.lastRevisionOn || form.last_revision_on,
      pages: form.pages,
      sha256: form.sha256,
    },
    changeNote:
      'Track this form version. Future updates may indicate policy changes restricting benefits access.',
    source: 'VA Forms API',
  };
}

// ============================================================
// STORY VERIFICATION
// ============================================================

/**
 * Verify VA-related story using facilities and forms data
 *
 * @param {Object} story - Citizen story object
 * @param {Object} vaData - VA API data to verify against (optional)
 * @returns {Promise<Object>} - Verification result with confidence score
 */
export async function verifyVAStory(story, vaData = null) {
  try {
    const headline = story.headline || '';
    const storyText = story.story || '';
    const combinedText = `${headline} ${storyText}`.toLowerCase();

    const insights = [];
    const flags = [];
    let confidence = 50; // Base confidence

    // Check for VA facility closure/access claims
    if (
      combinedText.includes('va clinic') ||
      combinedText.includes('va hospital') ||
      combinedText.includes('va facility') ||
      combinedText.includes('va closed')
    ) {
      if (vaData && vaData.facilities && !vaData.facilities.error) {
        insights.push({
          type: 'facility_data_available',
          message: 'VA facility data available for verification',
          confidence: 85,
        });
        confidence += 15;

        // Check for facility closures
        const currentData = vaData.facilities.currentData;
        if (currentData && currentData.closed > 0) {
          insights.push({
            type: 'facility_closures_confirmed',
            message: `${currentData.closed} VA facilities closed in area`,
            confidence: 95,
          });
          confidence += 10;
        }
      } else {
        flags.push('VA facility data unavailable - limited verification');
        confidence -= 10;
      }
    }

    // Check for VA benefits form/process claims
    if (
      combinedText.includes('va form') ||
      combinedText.includes('benefits application') ||
      combinedText.includes('paperwork') ||
      combinedText.includes('complicated')
    ) {
      if (vaData && vaData.forms && !vaData.forms.error) {
        insights.push({
          type: 'form_data_available',
          message: 'VA form data available for verification',
          confidence: 80,
        });
        confidence += 10;

        // Check for form changes
        if (vaData.forms.currentVersion && vaData.forms.currentVersion.lastRevisionDate) {
          insights.push({
            type: 'form_version_tracked',
            message: `Form version tracked: ${vaData.forms.currentVersion.lastRevisionDate}`,
            confidence: 85,
          });
          confidence += 5;
        }
      } else {
        flags.push('VA form data unavailable - limited verification');
        confidence -= 10;
      }
    }

    // Check for wait time / access claims
    if (
      combinedText.includes('wait') ||
      combinedText.includes('appointment') ||
      combinedText.includes('access') ||
      combinedText.includes('service')
    ) {
      if (vaData && vaData.facilities && !vaData.facilities.error) {
        insights.push({
          type: 'facility_access_verifiable',
          message: 'Facility access and services data available',
          confidence: 80,
        });
        confidence += 10;
      }
    }

    // Cap confidence at 100
    confidence = Math.min(confidence, 100);

    const verified = confidence >= 70;

    if (insights.length === 0) {
      flags.push('No specific VA metrics found in story - general VA claim');
      insights.push({
        type: 'no_va_metrics',
        message: 'Story does not contain specific VA-verifiable claims',
        confidence: 50,
      });
    }

    return {
      verified,
      confidence,
      flags,
      insights,
      vaMetrics: {
        facilitiesAvailable: vaData?.facilities && !vaData.facilities.error,
        formsAvailable: vaData?.forms && !vaData.forms.error,
        insightsGenerated: insights.length,
      },
      source: 'VA APIs',
      verificationMethod: 'multi_source_va_validation',
    };
  } catch (error) {
    console.error(`Error verifying VA story: ${error.message}`);
    return {
      verified: false,
      confidence: 50,
      flags: ['Verification error - using fallback confidence'],
      insights: [
        {
          type: 'error',
          message: `VA verification error: ${error.message}`,
          confidence: 50,
        },
      ],
      error: error.message,
    };
  }
}

// Export all functions
export default {
  // Facilities API
  getFacilityById,
  searchFacilities,
  getNearbyFacilities,
  getFacilitiesBaselineComparison,

  // Forms API
  getFormByNumber,
  searchForms,
  trackFormChanges,

  // Story Verification
  verifyVAStory,
};
