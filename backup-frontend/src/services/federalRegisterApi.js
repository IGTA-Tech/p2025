/**
 * Federal Register API Service
 *
 * Provides access to US Federal Register data including:
 * - Final rules and proposed rules
 * - Federal regulations
 * - Executive orders and presidential documents
 * - Agency notices and public inspection documents
 * - Federal regulatory information
 *
 * API Documentation: https://www.federalregister.gov/developers/documentation/api/v1
 * Open API - No authentication required
 */

const FEDERAL_REGISTER_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FEDERAL_REGISTER_API_BASE) ||
  (typeof process !== 'undefined' && process.env?.VITE_FEDERAL_REGISTER_API_BASE) ||
  'https://www.federalregister.gov/api/v1';

// Document types
export const DOCUMENT_TYPES = {
  RULE: 'RULE',              // Final Rules
  PRORULE: 'PRORULE',        // Proposed Rules
  NOTICE: 'NOTICE',          // Notices
  PRESDOCU: 'PRESDOCU',      // Presidential Documents
};

// Presidential document types
export const PRESIDENTIAL_TYPES = {
  EXECUTIVE_ORDER: 'executive_order',
  PROCLAMATION: 'proclamation',
  DETERMINATION: 'determination',
  NOTICE: 'notice',
};

/**
 * Make a GET request to the Federal Register API
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response data
 */
async function makeRequest(endpoint, params = {}) {
  const queryParams = new URLSearchParams();

  // Handle array parameters
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => queryParams.append(key, v));
    } else if (value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const url = `${FEDERAL_REGISTER_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Federal Register API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Federal Register API Request Error:', error);
    throw error;
  }
}

/**
 * Get a specific document by document number
 * @param {string} documentNumber - Document number
 * @returns {Promise<Object>} Document data
 */
export async function getDocument(documentNumber) {
  try {
    const data = await makeRequest(`/documents/${documentNumber}.json`);
    return {
      ...data,
      source: 'Federal Register API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Federal Register API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'Federal Register API temporarily unavailable',
      source: 'Federal Register API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Search for documents with filters
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
export async function searchDocuments(options = {}) {
  try {
    const {
      term,
      agencies = [],
      dateFrom,
      dateTo,
      docType = [],
      perPage = 20,
      page = 1,
      order = 'newest',
    } = options;

    const params = {};

    if (term) {
      params['conditions[term]'] = term;
    }

    if (agencies.length > 0) {
      agencies.forEach((agency, index) => {
        params[`conditions[agencies][]`] = agency;
      });
    }

    if (dateFrom) {
      params['conditions[publication_date][gte]'] = dateFrom;
    }

    if (dateTo) {
      params['conditions[publication_date][lte]'] = dateTo;
    }

    if (docType.length > 0) {
      docType.forEach((type, index) => {
        params[`conditions[type][]`] = type;
      });
    }

    params['per_page'] = perPage;
    params['page'] = page;
    params['order'] = order;

    const data = await makeRequest('/documents.json', params);

    return {
      count: data.count || 0,
      totalPages: data.total_pages || 0,
      currentPage: data.current_page || page,
      results: data.results || [],
      source: 'Federal Register API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Federal Register API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'Federal Register API temporarily unavailable',
      count: 0,
      totalPages: 0,
      currentPage: 1,
      results: [],
      source: 'Federal Register API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get Executive Orders
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {number} perPage - Number of results per page
 * @returns {Promise<Object>} Executive orders
 */
export async function getExecutiveOrders(dateFrom = null, perPage = 20) {
  try {
    const params = {
      'conditions[type][]': DOCUMENT_TYPES.PRESDOCU,
      'conditions[presidential_document_type][]': PRESIDENTIAL_TYPES.EXECUTIVE_ORDER,
      'per_page': perPage,
      'order': 'newest',
    };

    if (dateFrom) {
      params['conditions[publication_date][gte]'] = dateFrom;
    }

    const data = await makeRequest('/documents.json', params);

    return {
      count: data.count || 0,
      results: data.results || [],
      source: 'Federal Register API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Federal Register API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'Federal Register API temporarily unavailable',
      count: 0,
      results: [],
      source: 'Federal Register API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get public inspection documents
 * @param {Array} agencies - Agency slugs
 * @returns {Promise<Object>} Public inspection documents
 */
export async function getPublicInspection(agencies = []) {
  try {
    const params = {};

    if (agencies.length > 0) {
      agencies.forEach((agency, index) => {
        params[`conditions[agencies][]`] = agency;
      });
    }

    const data = await makeRequest('/public-inspection-documents.json', params);

    return {
      count: data.count || 0,
      results: data.results || [],
      source: 'Federal Register API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Federal Register API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'Federal Register API temporarily unavailable',
      count: 0,
      results: [],
      source: 'Federal Register API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get list of all agencies
 * @returns {Promise<Array>} List of agencies
 */
export async function getAgencies() {
  try {
    const data = await makeRequest('/agencies');

    return {
      agencies: data || [],
      source: 'Federal Register API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Federal Register API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'Federal Register API temporarily unavailable',
      agencies: [],
      source: 'Federal Register API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get rules and regulations by agency
 * @param {string} agency - Agency slug
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {number} perPage - Number of results
 * @returns {Promise<Object>} Rules and regulations
 */
export async function getAgencyRules(agency, dateFrom = null, perPage = 20) {
  try {
    const params = {
      'conditions[agencies][]': agency,
      'conditions[type][]': DOCUMENT_TYPES.RULE,
      'per_page': perPage,
      'order': 'newest',
    };

    if (dateFrom) {
      params['conditions[publication_date][gte]'] = dateFrom;
    }

    const data = await makeRequest('/documents.json', params);

    return {
      agency: agency,
      count: data.count || 0,
      results: data.results || [],
      source: 'Federal Register API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Federal Register API timeout or error:', error.message);
    return {
      agency: agency,
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'Federal Register API temporarily unavailable',
      count: 0,
      results: [],
      source: 'Federal Register API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Verify regulation-related claims in a citizen story
 * @param {Object} story - The citizen story
 * @param {Object} registerData - Federal Register data
 * @returns {Object} Verification results
 */
export function verifyRegulationStory(story, registerData) {
  const verification = {
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
    regulationMetrics: {},
  };

  // Check if API data is unavailable
  if (registerData.error) {
    verification.insights.push({
      type: 'api_unavailable',
      message: registerData.errorMessage || 'Federal Register API temporarily unavailable',
    });
    verification.confidence = 50;
    return verification;
  }

  // Check if story is regulation/rule-related
  const storyText = (story.headline + ' ' + story.story).toLowerCase();
  const isRegulationRelated =
    storyText.includes('regulation') ||
    storyText.includes('rule') ||
    storyText.includes('executive order') ||
    storyText.includes('federal register') ||
    storyText.includes('compliance') ||
    storyText.includes('regulatory') ||
    storyText.includes('policy change') ||
    storyText.includes('new law') ||
    storyText.includes('requirement') ||
    storyText.includes('mandate');

  if (!isRegulationRelated) {
    verification.insights.push({
      type: 'not_regulation_related',
      message: 'Story does not appear to be regulation-related',
    });
    return verification;
  }

  // Provide regulation context
  verification.confidence = 70;

  if (registerData.count) {
    verification.regulationMetrics = {
      recentDocuments: registerData.count,
    };

    verification.insights.push({
      type: 'regulation_context',
      message: `Found ${registerData.count} recent federal regulatory documents`,
    });
  }

  // Check for executive order mentions
  if (storyText.includes('executive order')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'executive_order_mention',
      message: 'Story mentions executive orders - can be verified through Federal Register',
    });
  }

  // Check for agency mentions
  const agencies = [
    'epa',
    'fda',
    'fcc',
    'sec',
    'department of',
    'agency',
    'administration',
  ];

  agencies.forEach((agencyTerm) => {
    if (storyText.includes(agencyTerm)) {
      verification.confidence += 5;
      verification.insights.push({
        type: 'agency_mention',
        message: 'Story mentions federal agency - regulations can be verified',
      });
    }
  });

  // Flag if mentions regulatory burden or compliance issues
  if (
    storyText.includes('burden') ||
    storyText.includes('compliance cost') ||
    storyText.includes('red tape') ||
    storyText.includes('overregulation')
  ) {
    verification.flags.push('regulatory_burden_mentioned');
    verification.insights.push({
      type: 'regulatory_concern',
      message: 'Story mentions regulatory burden or compliance issues - critical indicator',
    });
  }

  verification.confidence = Math.min(100, verification.confidence);

  return verification;
}

export default {
  getDocument,
  searchDocuments,
  getExecutiveOrders,
  getPublicInspection,
  getAgencies,
  getAgencyRules,
  verifyRegulationStory,
  DOCUMENT_TYPES,
  PRESIDENTIAL_TYPES,
};
