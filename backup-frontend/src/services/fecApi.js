/**
 * Federal Election Commission (FEC) OpenFEC API Service
 *
 * Provides access to campaign finance data including:
 * - Candidate information and financial summaries
 * - Committee information (PACs, Super PACs, party committees)
 * - Campaign contributions and expenditures
 * - Individual contributor data
 * - Financial disclosure filings
 * - Election results
 *
 * API Documentation: https://api.open.fec.gov/developers/
 * Requires API key from api.data.gov
 */

const FEC_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FEC_API_BASE) ||
  (typeof process !== 'undefined' && process.env?.VITE_FEC_API_BASE) ||
  'https://api.open.fec.gov/v1';

const FEC_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FEC_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_FEC_API_KEY) ||
  'DEMO_KEY'; // Limited to 30 requests per hour

// Election years for quick reference
export const ELECTION_CYCLES = {
  CURRENT: new Date().getFullYear(),
  PRESIDENTIAL_2024: 2024,
  PRESIDENTIAL_2020: 2020,
  MIDTERM_2022: 2022,
  MIDTERM_2018: 2018,
};

// Candidate statuses
export const CANDIDATE_STATUS = {
  CANDIDATE: 'C', // Statutory candidate
  FUTURE: 'F', // Future candidate
  NOT_YET: 'N', // Not yet a candidate
  PRIOR: 'P', // Prior candidate
};

// Committee types
export const COMMITTEE_TYPES = {
  PRESIDENTIAL: 'P', // Presidential
  HOUSE: 'H', // House
  SENATE: 'S', // Senate
  COMMUNICATION: 'C', // Communication Cost
  DELEGATE: 'D', // Delegate Committee
  ELECTIONEERING: 'E', // Electioneering Communication
  INDEPENDENT: 'I', // Independent Expenditor (Person or Group)
  NATIONAL_PARTY: 'N', // PAC - Qualified
  PARTY_NONQUALIFIED: 'O', // Super PAC (Independent Expenditure-Only)
  QUALIFIED_PAC: 'Q', // PAC - Qualified
  SUPER_PAC: 'U', // Single Candidate Independent Expenditure
  SEPARATE_FUND: 'V', // PAC with Non-Contribution Account - Nonqualified
  PARTY_QUALIFIED: 'W', // PAC with Non-Contribution Account - Qualified
  UNAUTHORIZED: 'X', // Party - Nonqualified
  LEADERSHIP_PAC: 'Y', // Party - Qualified
  NATIONAL_ORGANIZATION: 'Z', // National Party Nonfederal Account
};

// Office codes
export const OFFICE_CODES = {
  HOUSE: 'H',
  SENATE: 'S',
  PRESIDENT: 'P',
};

/**
 * Make a GET request to the FEC API
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response data
 */
async function makeRequest(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    api_key: FEC_API_KEY,
    ...params,
  });

  const url = `${FEC_API_BASE}${endpoint}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FEC API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('FEC API Request Error:', error);
    throw error;
  }
}

/**
 * Search for candidates by name
 * @param {string} name - Candidate name to search
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Candidate search results
 */
export async function searchCandidates(name, options = {}) {
  try {
    const params = {
      name,
      per_page: options.perPage || 20,
      page: options.page || 1,
      sort: options.sort || '-receipts',
      sort_hide_null: options.sortHideNull || false,
    };

    if (options.office) params.office = options.office;
    if (options.state) params.state = options.state;
    if (options.district) params.district = options.district;
    if (options.cycle) params.cycle = options.cycle;
    if (options.party) params.party = options.party;

    const data = await makeRequest('/candidates/search/', params);

    return {
      results: data.results || [],
      count: data.pagination?.count || 0,
      totalPages: data.pagination?.pages || 0,
      currentPage: data.pagination?.page || 1,
      perPage: data.pagination?.per_page || 20,
      source: 'FEC OpenFEC API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FEC API error:', error.message);
    return {
      error: true,
      errorMessage: 'FEC API temporarily unavailable',
      results: [],
      count: 0,
      source: 'FEC OpenFEC API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get candidate details by candidate ID
 * @param {string} candidateId - FEC candidate ID (e.g., 'P80001571' for Obama)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Candidate details
 */
export async function getCandidate(candidateId, options = {}) {
  try {
    const params = {};
    if (options.cycle) params.cycle = options.cycle;

    const data = await makeRequest(`/candidate/${candidateId}/`, params);

    return {
      ...data.results?.[0],
      source: 'FEC OpenFEC API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FEC API error:', error.message);
    return {
      error: true,
      errorMessage: 'FEC API temporarily unavailable',
      source: 'FEC OpenFEC API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get candidate financial totals
 * @param {string} candidateId - FEC candidate ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Financial totals
 */
export async function getCandidateFinancials(candidateId, options = {}) {
  try {
    const params = {
      per_page: options.perPage || 20,
      page: options.page || 1,
    };

    if (options.cycle) params.cycle = options.cycle;

    const data = await makeRequest(`/candidate/${candidateId}/totals/`, params);

    return {
      results: data.results || [],
      count: data.pagination?.count || 0,
      source: 'FEC OpenFEC API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FEC API error:', error.message);
    return {
      error: true,
      errorMessage: 'FEC API temporarily unavailable',
      results: [],
      source: 'FEC OpenFEC API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Search for committees
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Committee search results
 */
export async function searchCommittees(options = {}) {
  try {
    const params = {
      per_page: options.perPage || 20,
      page: options.page || 1,
      sort: options.sort || '-receipts',
    };

    if (options.name) params.name = options.name;
    if (options.state) params.state = options.state;
    if (options.committeeType) params.committee_type = options.committeeType;
    if (options.cycle) params.cycle = options.cycle;
    if (options.party) params.party = options.party;

    const data = await makeRequest('/committees/', params);

    return {
      results: data.results || [],
      count: data.pagination?.count || 0,
      totalPages: data.pagination?.pages || 0,
      currentPage: data.pagination?.page || 1,
      source: 'FEC OpenFEC API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FEC API error:', error.message);
    return {
      error: true,
      errorMessage: 'FEC API temporarily unavailable',
      results: [],
      count: 0,
      source: 'FEC OpenFEC API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get committee details
 * @param {string} committeeId - FEC committee ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Committee details
 */
export async function getCommittee(committeeId, options = {}) {
  try {
    const params = {};
    if (options.cycle) params.cycle = options.cycle;

    const data = await makeRequest(`/committee/${committeeId}/`, params);

    return {
      ...data.results?.[0],
      source: 'FEC OpenFEC API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FEC API error:', error.message);
    return {
      error: true,
      errorMessage: 'FEC API temporarily unavailable',
      source: 'FEC OpenFEC API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get committee financial totals
 * @param {string} committeeId - FEC committee ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Financial totals
 */
export async function getCommitteeFinancials(committeeId, options = {}) {
  try {
    const params = {
      per_page: options.perPage || 20,
      page: options.page || 1,
    };

    if (options.cycle) params.cycle = options.cycle;

    const data = await makeRequest(`/committee/${committeeId}/totals/`, params);

    return {
      results: data.results || [],
      count: data.pagination?.count || 0,
      source: 'FEC OpenFEC API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FEC API error:', error.message);
    return {
      error: true,
      errorMessage: 'FEC API temporarily unavailable',
      results: [],
      source: 'FEC OpenFEC API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Search for individual contributions
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Contribution search results
 */
export async function searchContributions(options = {}) {
  try {
    const params = {
      per_page: options.perPage || 20,
      page: options.page || 1,
      sort: options.sort || '-contribution_receipt_date',
    };

    if (options.contributorName) params.contributor_name = options.contributorName;
    if (options.contributorState) params.contributor_state = options.contributorState;
    if (options.contributorCity) params.contributor_city = options.contributorCity;
    if (options.contributorEmployer) params.contributor_employer = options.contributorEmployer;
    if (options.contributorOccupation) params.contributor_occupation = options.contributorOccupation;
    if (options.committeeId) params.committee_id = options.committeeId;
    if (options.minDate) params.min_date = options.minDate;
    if (options.maxDate) params.max_date = options.maxDate;
    if (options.minAmount) params.min_amount = options.minAmount;
    if (options.maxAmount) params.max_amount = options.maxAmount;

    const data = await makeRequest('/schedules/schedule_a/', params);

    return {
      results: data.results || [],
      count: data.pagination?.count || 0,
      totalPages: data.pagination?.pages || 0,
      currentPage: data.pagination?.page || 1,
      source: 'FEC OpenFEC API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FEC API error:', error.message);
    return {
      error: true,
      errorMessage: 'FEC API temporarily unavailable',
      results: [],
      count: 0,
      source: 'FEC OpenFEC API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Search for disbursements/expenditures
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Disbursement search results
 */
export async function searchDisbursements(options = {}) {
  try {
    const params = {
      per_page: options.perPage || 20,
      page: options.page || 1,
      sort: options.sort || '-disbursement_date',
    };

    if (options.committeeId) params.committee_id = options.committeeId;
    if (options.recipientName) params.recipient_name = options.recipientName;
    if (options.recipientState) params.recipient_state = options.recipientState;
    if (options.recipientCity) params.recipient_city = options.recipientCity;
    if (options.minDate) params.min_date = options.minDate;
    if (options.maxDate) params.max_date = options.maxDate;
    if (options.minAmount) params.min_amount = options.minAmount;
    if (options.maxAmount) params.max_amount = options.maxAmount;

    const data = await makeRequest('/schedules/schedule_b/', params);

    return {
      results: data.results || [],
      count: data.pagination?.count || 0,
      totalPages: data.pagination?.pages || 0,
      currentPage: data.pagination?.page || 1,
      source: 'FEC OpenFEC API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FEC API error:', error.message);
    return {
      error: true,
      errorMessage: 'FEC API temporarily unavailable',
      results: [],
      count: 0,
      source: 'FEC OpenFEC API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get election results
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Election results
 */
export async function getElectionResults(options = {}) {
  try {
    const params = {
      per_page: options.perPage || 20,
      page: options.page || 1,
      sort: options.sort || '-election_year',
    };

    if (options.state) params.state = options.state;
    if (options.district) params.district = options.district;
    if (options.office) params.office = options.office;
    if (options.cycle) params.cycle = options.cycle;

    const data = await makeRequest('/election-search/', params);

    return {
      results: data.results || [],
      count: data.pagination?.count || 0,
      source: 'FEC OpenFEC API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FEC API error:', error.message);
    return {
      error: true,
      errorMessage: 'FEC API temporarily unavailable',
      results: [],
      count: 0,
      source: 'FEC OpenFEC API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Verify a political story using FEC campaign finance data
 * @param {Object} story - Story to verify
 * @param {Object} fecData - FEC API data (candidates, committees, contributions, etc.)
 * @returns {Object} Verification result
 */
export function verifyCampaignFinanceStory(story, fecData) {
  const insights = [];
  const flags = [];
  let confidenceScore = 50; // Start with neutral confidence

  // Extract candidate/committee names from story
  const storyText = `${story.headline || ''} ${story.story || ''}`.toLowerCase();

  // Check for candidate mentions
  if (fecData.candidates && fecData.candidates.results.length > 0) {
    const mentionedCandidates = fecData.candidates.results.filter(candidate => {
      const candidateName = candidate.name.toLowerCase();
      return storyText.includes(candidateName);
    });

    if (mentionedCandidates.length > 0) {
      confidenceScore += 15;
      insights.push({
        type: 'candidate_match',
        message: `Found ${mentionedCandidates.length} candidate(s) mentioned in story with FEC records`,
        data: mentionedCandidates.map(c => ({ name: c.name, office: c.office, state: c.state })),
      });
    }
  }

  // Check for committee mentions
  if (fecData.committees && fecData.committees.results.length > 0) {
    const mentionedCommittees = fecData.committees.results.filter(committee => {
      const committeeName = committee.name.toLowerCase();
      return storyText.includes(committeeName);
    });

    if (mentionedCommittees.length > 0) {
      confidenceScore += 15;
      insights.push({
        type: 'committee_match',
        message: `Found ${mentionedCommittees.length} committee(s) mentioned in story with FEC records`,
        data: mentionedCommittees.map(c => ({ name: c.name, type: c.committee_type })),
      });
    }
  }

  // Analyze financial data patterns
  if (fecData.contributions && fecData.contributions.results.length > 0) {
    const totalContributions = fecData.contributions.results.reduce(
      (sum, contrib) => sum + (contrib.contribution_receipt_amount || 0),
      0
    );

    insights.push({
      type: 'contributions',
      message: `Found ${fecData.contributions.count.toLocaleString()} relevant contributions totaling $${totalContributions.toLocaleString()}`,
      data: {
        count: fecData.contributions.count,
        totalAmount: totalContributions,
      },
    });

    confidenceScore += 10;
  }

  // Check for geographic matches
  if (story.location && fecData.candidates) {
    const stateMatches = fecData.candidates.results.filter(
      candidate => candidate.state === story.location.state
    );

    if (stateMatches.length > 0) {
      confidenceScore += 10;
      insights.push({
        type: 'geographic_match',
        message: `Story location (${story.location.state}) matches ${stateMatches.length} candidate(s) state`,
      });
    }
  }

  // Check for campaign finance amount discrepancies
  const amounts = story.story?.match(/\$[\d,]+/g);
  if (amounts && fecData.contributions) {
    insights.push({
      type: 'financial_amounts',
      message: `Story mentions specific dollar amounts: ${amounts.join(', ')}`,
    });
  }

  // Verify timing if story mentions specific dates
  const datePattern = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi;
  const mentionedDates = story.story?.match(datePattern);

  if (mentionedDates) {
    insights.push({
      type: 'temporal_context',
      message: `Story mentions specific dates: ${mentionedDates.join(', ')}`,
    });
  }

  // Flag potential issues
  if (insights.length === 0) {
    flags.push({
      severity: 'medium',
      message: 'No direct matches found in FEC data - story may need additional verification',
    });
    confidenceScore -= 20;
  }

  if (story.policyArea === 'campaign_finance' && !fecData.contributions?.results?.length) {
    flags.push({
      severity: 'high',
      message: 'Story is about campaign finance but no FEC contribution data found',
    });
    confidenceScore -= 15;
  }

  // Ensure confidence score stays within bounds
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  return {
    verified: confidenceScore >= 60,
    confidence: confidenceScore,
    insights,
    flags,
    campaignFinanceMetrics: {
      candidatesFound: fecData.candidates?.count || 0,
      committeesFound: fecData.committees?.count || 0,
      contributionsFound: fecData.contributions?.count || 0,
      disbursementsFound: fecData.disbursements?.count || 0,
    },
    source: 'FEC OpenFEC API',
    verifiedAt: new Date().toISOString(),
  };
}

export default {
  searchCandidates,
  getCandidate,
  getCandidateFinancials,
  searchCommittees,
  getCommittee,
  getCommitteeFinancials,
  searchContributions,
  searchDisbursements,
  getElectionResults,
  verifyCampaignFinanceStory,
  ELECTION_CYCLES,
  CANDIDATE_STATUS,
  COMMITTEE_TYPES,
  OFFICE_CODES,
};
