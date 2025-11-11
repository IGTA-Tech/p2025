/**
 * USAspending.gov API Service
 *
 * Provides access to US federal spending data including:
 * - Federal contracts and grants
 * - Awards by agency and recipient
 * - Spending by geography (state/county)
 * - Financial assistance programs
 * - Agency budgets and obligations
 *
 * API Documentation: https://api.usaspending.gov/docs/
 * Open API - No authentication required
 */

const USASPENDING_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USASPENDING_API_BASE) ||
  (typeof process !== 'undefined' && process.env?.VITE_USASPENDING_API_BASE) ||
  'https://api.usaspending.gov/api/v2';

// State FIPS code mapping
const STATE_FIPS = {
  'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06',
  'CO': '08', 'CT': '09', 'DE': '10', 'FL': '12', 'GA': '13',
  'HI': '15', 'ID': '16', 'IL': '17', 'IN': '18', 'IA': '19',
  'KS': '20', 'KY': '21', 'LA': '22', 'ME': '23', 'MD': '24',
  'MA': '25', 'MI': '26', 'MN': '27', 'MS': '28', 'MO': '29',
  'MT': '30', 'NE': '31', 'NV': '32', 'NH': '33', 'NJ': '34',
  'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39',
  'OK': '40', 'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45',
  'SD': '46', 'TN': '47', 'TX': '48', 'UT': '49', 'VT': '50',
  'VA': '51', 'WA': '53', 'WV': '54', 'WI': '55', 'WY': '56',
  'DC': '11'
};

const STATE_NAMES = {
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
 * Make a GET request to the USAspending API
 * @param {string} endpoint - API endpoint path
 * @returns {Promise<Object>} API response data
 */
async function makeGETRequest(endpoint) {
  const url = `${USASPENDING_API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`USAspending API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('USAspending API GET Request Error:', error);
    throw error;
  }
}

/**
 * Make a POST request to the USAspending API
 * @param {string} endpoint - API endpoint path
 * @param {Object} payload - Request body
 * @returns {Promise<Object>} API response data
 */
async function makePOSTRequest(endpoint, payload) {
  const url = `${USASPENDING_API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`USAspending API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('USAspending API POST Request Error:', error);
    throw error;
  }
}

/**
 * Get state spending profile
 * @param {string} stateCode - Two-letter state code
 * @returns {Promise<Object>} State spending data
 */
export async function getStateSpendingProfile(stateCode) {
  try {
    const fipsCode = STATE_FIPS[stateCode];
    if (!fipsCode) {
      throw new Error(`Invalid state code: ${stateCode}`);
    }

    const data = await makeGETRequest(`/recipient/state/${fipsCode}/`);

    return {
      state: stateCode,
      stateName: STATE_NAMES[stateCode] || stateCode,
      fipsCode: fipsCode,
      totalAwards: data.total_prime_amount || 0,
      totalContracts: data.award_amount_contracts || 0,
      totalGrants: data.award_amount_idvs || 0,
      totalLoans: data.award_amount_loans || 0,
      topRecipients: data.top_recipients || [],
      topAgencies: data.top_agencies || [],
      fiscalYear: data.fiscal_year || new Date().getFullYear(),
      source: 'USAspending.gov API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('USAspending API timeout or error:', error.message);
    return {
      state: stateCode,
      stateName: STATE_NAMES[stateCode] || stateCode,
      error: true,
      errorType: error.message.includes('504') || error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'USAspending.gov API experienced a 504 Gateway Timeout (common occurrence)',
      source: 'USAspending.gov API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Search spending by award
 * @param {Object} filters - Search filters
 * @param {number} limit - Number of results to return (default: 50)
 * @returns {Promise<Object>} Award search results
 */
export async function searchSpendingByAward(filters = {}, limit = 50) {
  try {
    const currentYear = new Date().getFullYear();
    const payload = {
      filters: {
        time_period: filters.time_period || [
          {
            start_date: `${currentYear - 1}-01-01`,
            end_date: `${currentYear}-12-31`,
          },
        ],
        award_type_codes: filters.award_type_codes || ['A', 'B', 'C', 'D'],
        ...filters,
      },
      fields: [
        'Award ID',
        'Recipient Name',
        'Start Date',
        'End Date',
        'Award Amount',
        'Total Outlayed Amount',
        'Awarding Agency',
        'Awarding Sub Agency',
        'Award Type',
        'Description',
      ],
      sort: 'Award Amount',
      order: 'desc',
      limit: limit,
      page: 1,
    };

    const data = await makePOSTRequest('/search/spending_by_award/', payload);

    return {
      totalResults: data.page_metadata?.total || 0,
      page: data.page_metadata?.page || 1,
      hasNext: data.page_metadata?.hasNext || false,
      awards: data.results || [],
      source: 'USAspending.gov API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('USAspending API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('504') || error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'USAspending.gov API experienced a 504 Gateway Timeout (common occurrence)',
      totalResults: 0,
      page: 1,
      hasNext: false,
      awards: [],
      source: 'USAspending.gov API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Search spending by geography
 * @param {string} stateCode - Two-letter state code
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} Geographic spending data
 */
export async function searchSpendingByGeography(stateCode, filters = {}) {
  try {
    const currentYear = new Date().getFullYear();
    const payload = {
      scope: 'place_of_performance',
      geo_layer: 'state',
      filters: {
        time_period: filters.time_period || [
          {
            start_date: `${currentYear - 1}-01-01`,
            end_date: `${currentYear}-12-31`,
          },
        ],
        place_of_performance_locations: [
          {
            country: 'USA',
            state: stateCode,
          },
        ],
        ...filters,
      },
    };

    const data = await makePOSTRequest('/search/spending_by_geography/', payload);

    return {
      state: stateCode,
      stateName: STATE_NAMES[stateCode] || stateCode,
      totalSpending: data.total_spending || 0,
      results: data.results || [],
      source: 'USAspending.gov API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('USAspending API timeout or error:', error.message);
    return {
      state: stateCode,
      stateName: STATE_NAMES[stateCode] || stateCode,
      error: true,
      errorType: error.message.includes('504') || error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'USAspending.gov API experienced a 504 Gateway Timeout (common occurrence)',
      totalSpending: 0,
      results: [],
      source: 'USAspending.gov API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get spending by agency
 * @param {string} agencyName - Name of the agency
 * @param {string} stateCode - Optional state filter
 * @returns {Promise<Object>} Agency spending data
 */
export async function getAgencySpending(agencyName, stateCode = null) {
  try {
    const currentYear = new Date().getFullYear();
    const filters = {
      agencies: [
        {
          type: 'awarding',
          tier: 'toptier',
          name: agencyName,
        },
      ],
      time_period: [
        {
          start_date: `${currentYear - 1}-01-01`,
          end_date: `${currentYear}-12-31`,
        },
      ],
    };

    if (stateCode) {
      filters.place_of_performance_locations = [
        {
          country: 'USA',
          state: stateCode,
        },
      ];
    }

    return await searchSpendingByAward(filters, 100);
  } catch (error) {
    console.error('Error fetching agency spending:', error);
    return getMockAgencySpendingData(agencyName);
  }
}

/**
 * Verify spending-related claims in a citizen story
 * @param {Object} story - The citizen story
 * @param {Object} spendingData - USAspending data for the story's state
 * @returns {Object} Verification results
 */
export function verifySpendingStory(story, spendingData) {
  const verification = {
    state: story.location.state,
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
    spendingMetrics: {},
  };

  // Check if API data is unavailable
  if (spendingData.error) {
    verification.insights.push({
      type: 'api_unavailable',
      message: spendingData.errorMessage || 'USAspending.gov API temporarily unavailable',
    });
    verification.confidence = 50;
    return verification;
  }

  // Check if story is spending/budget/contract-related
  const storyText = (story.headline + ' ' + story.story).toLowerCase();
  const isSpendingRelated =
    storyText.includes('spending') ||
    storyText.includes('contract') ||
    storyText.includes('grant') ||
    storyText.includes('federal fund') ||
    storyText.includes('government fund') ||
    storyText.includes('budget') ||
    storyText.includes('appropriation') ||
    storyText.includes('subsidy') ||
    storyText.includes('award') ||
    storyText.includes('stimulus') ||
    storyText.includes('infrastructure bill') ||
    storyText.includes('federal money') ||
    storyText.includes('taxpayer');

  if (!isSpendingRelated) {
    verification.insights.push({
      type: 'not_spending_related',
      message: 'Story does not appear to be federal spending-related',
    });
    return verification;
  }

  // Provide spending context
  verification.confidence = 70;
  verification.spendingMetrics = {
    totalAwards: spendingData.totalAwards || 0,
    totalContracts: spendingData.totalContracts || 0,
    totalGrants: spendingData.totalGrants || 0,
  };

  if (spendingData.totalAwards && spendingData.fiscalYear) {
    verification.insights.push({
      type: 'state_spending_context',
      message: `${spendingData.stateName} received $${(spendingData.totalAwards / 1000000000).toFixed(2)}B in federal awards (FY${spendingData.fiscalYear})`,
    });
  }

  // Check for specific spending types
  if (storyText.includes('contract') && spendingData.totalContracts) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'contracts_context',
      message: `Federal contracts in ${spendingData.stateName}: $${(spendingData.totalContracts / 1000000).toFixed(0)}M`,
    });
  }

  if (storyText.includes('grant') && spendingData.totalGrants) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'grants_context',
      message: `Federal grants in ${spendingData.stateName}: $${(spendingData.totalGrants / 1000000).toFixed(0)}M`,
    });
  }

  // Check for infrastructure mentions
  if (storyText.includes('infrastructure') || storyText.includes('road') || storyText.includes('bridge')) {
    verification.confidence += 5;
    verification.insights.push({
      type: 'infrastructure_spending',
      message: 'Infrastructure spending can be verified through DOT and USAspending data',
    });
  }

  // Check for agency mentions
  const agencies = [
    'department of defense',
    'dod',
    'hhs',
    'health and human services',
    'department of transportation',
    'dot',
    'education',
    'energy',
    'agriculture',
    'usda',
    'homeland security',
  ];

  agencies.forEach((agency) => {
    if (storyText.includes(agency)) {
      verification.confidence += 5;
      verification.insights.push({
        type: 'agency_mention',
        message: `Story mentions federal agency - spending can be verified`,
      });
    }
  });

  // Flag if mentions waste, fraud, or misuse
  if (
    storyText.includes('waste') ||
    storyText.includes('fraud') ||
    storyText.includes('misuse') ||
    storyText.includes('corruption') ||
    storyText.includes('abuse')
  ) {
    verification.flags.push('spending_abuse_mentioned');
    verification.insights.push({
      type: 'spending_concern',
      message: 'Story mentions potential waste, fraud, or misuse of federal funds - critical indicator',
    });
  }

  verification.confidence = Math.min(100, verification.confidence);

  return verification;
}

/**
 * Get comprehensive spending data for a state
 * @param {string} stateCode - Two-letter state code
 * @returns {Promise<Object>} Complete spending data package
 */
export async function getStateComprehensiveSpending(stateCode) {
  try {
    const [profile, geography] = await Promise.all([
      getStateSpendingProfile(stateCode),
      searchSpendingByGeography(stateCode),
    ]);

    return {
      state: stateCode,
      stateName: STATE_NAMES[stateCode] || stateCode,
      profile,
      geography,
      summary: {
        totalAwards: profile.totalAwards,
        totalContracts: profile.totalContracts,
        totalGrants: profile.totalGrants,
        totalLoans: profile.totalLoans,
        fiscalYear: profile.fiscalYear,
      },
      source: 'USAspending.gov API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching comprehensive spending data:', error);
    throw error;
  }
}

export default {
  getStateSpendingProfile,
  searchSpendingByAward,
  searchSpendingByGeography,
  getAgencySpending,
  verifySpendingStory,
  getStateComprehensiveSpending,
};
