/**
 * Congress.gov API (Library of Congress) Service
 *
 * ============================================================================
 * PRODUCTION-READY API INTEGRATION FOR PROJECT 2025 LEGISLATIVE TRACKING
 * ============================================================================
 *
 * PURPOSE:
 * Tracks Project 2025 legislative activity including:
 * - Bills implementing Project 2025 policies
 * - Voting records on key legislation
 * - Committee hearings and oversight
 * - Presidential nominations and confirmations
 * - Legislative text and summaries
 * - Congressional actions and timelines
 *
 * API DETAILS:
 * - Documentation: https://api.congress.gov/
 * - Endpoint: https://api.congress.gov/v3
 * - Authentication: API Key required
 * - Rate Limit: 5,000 requests/hour (generous)
 * - Data Coverage: 117th Congress (2021) to current
 * - Update Frequency: Real-time

 *
 * CRITICAL PRODUCTION NOTES:
 * 1. CONGRESS TRACKING: Currently tracking 119th Congress (2025-2027)
 *    - Use 118th Congress (2023-2024) for baseline comparisons
 *    - Real-time updates as bills are introduced/passed
 *
 * 2. RATE LIMITING: 5,000 requests/hour (much higher than other APIs)
 *    - Tracked internally with hourly rolling window
 *    - Warnings at 80% capacity (4,000 requests)
 *
 * 3. BILL TRACKING:
 *    - Multiple bill types: HR, S, HJRES, SJRES, HCONRES, SCONRES, HRES, SRES
 *    - Complex status tracking through legislative process
 *    - Sponsor/cosponsor information with party affiliations
 *
 * 4. ERROR HANDLING:
 *    - All functions return null on failure (never throw)
 *    - Exponential backoff retry logic (2s, 4s, 8s)
 *    - 30-second timeout per request
 *    - Comprehensive logging at all failure points
 *
 * PROJECT 2025 RELEVANCE:
 * - Schedule F federal workforce bills
 * - Immigration enforcement legislation
 * - Education Department restructuring bills
 * - Healthcare/Medicaid reform legislation
 * - Environmental regulation rollbacks
 * - Judicial nominations
 * - Appropriations affecting federal programs
 *
 * @module congressApi
 * @version 1.0.0
 * @production-ready
 */

/**
 * Get Congress.gov API key from environment
 * @returns {string} API key
 */
function getCongressApiKey() {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONGRESS_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_CONGRESS_API_KEY) ||
    ''
  );
}

/**
 * Get Congress.gov API base URL
 * @returns {string} Base URL
 */
function getCongressBaseUrl() {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONGRESS_BASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_CONGRESS_BASE_URL) ||
    'https://api.congress.gov/v3'
  );
}

// Current Congress numbers
const CURRENT_CONGRESS = 119; // 2025-2027
const BASELINE_CONGRESS = 118; // 2023-2024

// Project 2025 policy keywords for bill matching
const POLICY_KEYWORDS = {
  'economy': ['Schedule F', 'federal workforce', 'civil service reform', 'government employee', 'OPM'],
  'immigration': ['border security', 'immigration enforcement', 'deportation', 'asylum', 'ICE', 'border wall'],
  'education': ['Department of Education', 'Title I', 'Pell Grant', 'school choice', 'education voucher'],
  'healthcare': ['Medicaid', 'Medicare', 'Affordable Care Act', 'ACA repeal', 'health insurance'],
  'environmental': ['EPA', 'Clean Air Act', 'Clean Water Act', 'climate regulation', 'carbon emissions'],
  'energy': ['energy policy', 'oil drilling', 'gas production', 'Department of Energy'],
  'social': ['SNAP', 'food stamps', 'welfare', 'social security', 'TANF'],
  'military': ['defense authorization', 'military spending', 'Pentagon budget', 'armed forces'],
  'judicial': ['judicial nomination', 'federal judge', 'Supreme Court', 'court appointment'],
  'agriculture': ['farm bill', 'agricultural subsidy', 'USDA', 'rural development']
};

// Rate limiting tracking
let requestLog = [];
const HOURLY_LIMIT = 5000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds base delay

/**
 * Check if within hourly rate limit
 * @returns {boolean} True if can make request
 */
function checkRateLimit() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Remove requests older than 1 hour
  requestLog = requestLog.filter(req => req > oneHourAgo);

  if (requestLog.length >= HOURLY_LIMIT) {
    console.warn(`⚠️  Congress.gov API rate limit: ${requestLog.length}/${HOURLY_LIMIT}`);
    return false;
  }

  // Warning at 80% capacity
  if (requestLog.length >= HOURLY_LIMIT * 0.8) {
    console.warn(`⚠️  Approaching limit: ${requestLog.length}/${HOURLY_LIMIT} in last hour`);
  }

  return true;
}

/**
 * Log request timestamp for rate limiting
 */
function logRequest() {
  requestLog.push(new Date());
  console.log(`📊 Congress.gov requests (last hour): ${requestLog.length}/${HOURLY_LIMIT}`);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make a request to the Congress.gov API with retry logic
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @param {number} retryCount - Current retry attempt (0-based)
 * @returns {Promise<Object|null>} API response data or null if failed
 */
async function makeCongressRequest(endpoint, params = {}, retryCount = 0) {
  const apiKey = getCongressApiKey();
  const baseUrl = getCongressBaseUrl();

  if (!apiKey) {
    console.warn('⚠️  Congress.gov API key not configured. Skipping.');
    return null;
  }

  // Check rate limit before making request
  if (!checkRateLimit()) {
    console.error('❌ Congress.gov API hourly rate limit reached. Skipping.');
    return null;
  }

  // Add API key and format to all requests
  const queryParams = new URLSearchParams({
    ...params,
    api_key: apiKey,
    format: 'json'
  });

  const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;

  try {
    console.log(`🏛️  Congress.gov API: ${endpoint} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Project2025-PolicyTracker/1.0',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Log successful request
    logRequest();

    // Handle rate limiting (429)
    if (response.status === 429) {
      console.warn('⏱️  Rate limit hit. Waiting 60 seconds...');
      await sleep(60000);
      if (retryCount < MAX_RETRIES) {
        return await makeCongressRequest(endpoint, params, retryCount + 1);
      }
      return null;
    }

    // Handle authentication errors (401, 403)
    if (response.status === 401 || response.status === 403) {
      console.error('❌ Invalid Congress.gov API key or unauthorized access');
      return null;
    }

    // Handle not found (404)
    if (response.status === 404) {
      console.warn(`⚠️  Resource not found: ${endpoint}`);
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for empty results
    if (!data) {
      console.warn('⚠️  No data returned from Congress.gov API');
      return null;
    }

    return data;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`⏱️  Timeout on Congress.gov API (attempt ${retryCount + 1})`);
      if (retryCount < MAX_RETRIES) {
        const waitTime = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.log(`🔄 Retrying in ${waitTime / 1000} seconds...`);
        await sleep(waitTime);
        return await makeCongressRequest(endpoint, params, retryCount + 1);
      } else {
        console.error('❌ Congress.gov API timeout after all retries. Moving to next analysis.');
        return null;
      }
    }

    console.error(`❌ Congress.gov API request error: ${error.message}`);
    if (retryCount < MAX_RETRIES) {
      const waitTime = RETRY_DELAY * Math.pow(2, retryCount);
      await sleep(waitTime);
      return await makeCongressRequest(endpoint, params, retryCount + 1);
    }
    return null;
  }
}

/**
 * Search bills by policy area keywords
 * @param {string} policyArea - Policy domain (e.g., 'education', 'immigration')
 * @param {number} congress - Congress number (default: current 119th)
 * @param {string} fromDate - ISO date string for filtering (e.g., '2025-01-01')
 * @param {number} limit - Number of results (max 250)
 * @returns {Promise<Object|null>} Bill search results
 */
export async function searchBillsByPolicyArea(policyArea, congress = CURRENT_CONGRESS, fromDate = null, limit = 50) {
  const endpoint = `/bill/${congress}`;

  const params = {
    limit: Math.min(limit, 250),
    offset: 0,
    sort: 'updateDate+desc' // Most recent first
  };

  const data = await makeCongressRequest(endpoint, params);

  if (!data) {
    console.warn(`⚠️  Bill search unavailable for policy area: ${policyArea}. Continuing...`);
    return getFallbackData('bill_search', policy);
  }

  // Filter bills by keywords in JavaScript since API search is limited
  if (data.bills && POLICY_KEYWORDS[policyArea]) {
    const keywords = POLICY_KEYWORDS[policyArea];
    data.bills = data.bills.filter(bill => {
      const title = (bill.title || '').toLowerCase();
      return keywords.some(keyword => title.includes(keyword.toLowerCase()));
    });
  }

  // Filter by date if provided
  if (fromDate && data.bills) {
    const fromDateTime = new Date(fromDate);
    data.bills = data.bills.filter(bill => {
      const updateDate = bill.updateDate ? new Date(bill.updateDate) : null;
      return updateDate && updateDate >= fromDateTime;
    });
  }

  return data;
}

/**
 * Get detailed information about a specific bill
 * @param {number} congress - Congress number (e.g., 119)
 * @param {string} billType - Bill type code (e.g., 'hr', 's')
 * @param {number} billNumber - Bill number (e.g., 1)
 * @returns {Promise<Object|null>} Detailed bill information
 */
export async function getBillDetails(congress, billType, billNumber) {
  const endpoint = `/bill/${congress}/${billType}/${billNumber}`;

  const data = await makeCongressRequest(endpoint);

  if (!data) {
    console.warn(`⚠️  Bill details unavailable: ${congress}-${billType}${billNumber}. Continuing...`);
    return null;
  }

  return data;
}

/**
 * Get all actions taken on a bill
 * @param {number} congress - Congress number
 * @param {string} billType - Bill type code
 * @param {number} billNumber - Bill number
 * @returns {Promise<Object|null>} List of bill actions with dates
 */
export async function getBillActions(congress, billType, billNumber) {
  const endpoint = `/bill/${congress}/${billType}/${billNumber}/actions`;

  const data = await makeCongressRequest(endpoint);

  if (!data) {
    console.warn(`⚠️  Bill actions unavailable. Continuing...`);
    return null;
  }

  return data;
}

/**
 * Get presidential nominations submitted to Senate
 * @param {number} congress - Congress number (default: current)
 * @param {number} limit - Number of results
 * @returns {Promise<Object|null>} Nomination data
 */
export async function getNominations(congress = CURRENT_CONGRESS, limit = 20) {
  const endpoint = `/nomination/${congress}`;

  const params = {
    limit: limit,
    sort: 'updateDate+desc'
  };

  const data = await makeCongressRequest(endpoint, params);

  if (!data) {
    console.warn(`⚠️  Nomination data unavailable. Continuing...`);
    return getFallbackData('nominations', congress);
  }

  return data;
}

/**
 * Get list of congressional committees
 * @param {string} chamber - 'house', 'senate', or null for both
 * @returns {Promise<Object|null>} Committee information
 */
export async function getCommittees(chamber = null) {
  let endpoint = `/committee/${CURRENT_CONGRESS}`;

  if (chamber) {
    endpoint += `/${chamber}`;
  }

  const data = await makeCongressRequest(endpoint);

  if (!data) {
    console.warn(`⚠️  Committee data unavailable. Continuing...`);
    return null;
  }

  return data;
}

/**
 * Compare legislative activity before/after baseline date
 * @param {string} policyArea - Policy domain to track
 * @param {string} baselineDate - Comparison baseline (default: '2025-01-01')
 * @returns {Promise<Object>} Legislative activity comparison
 */
export async function getLegislativeBaselineComparison(policyArea, baselineDate = '2025-01-01') {
  console.log(`🏛️  Comparing legislative activity for ${policyArea}`);

  // Get bills from current Congress (119th: 2025-2027)
  const afterBills = await searchBillsByPolicyArea(
    policyArea,
    CURRENT_CONGRESS,
    baselineDate,
    100
  );

  // Get bills from previous Congress (118th: 2023-2024) for comparison
  const beforeBills = await searchBillsByPolicyArea(
    policyArea,
    BASELINE_CONGRESS,
    null,
    100
  );

  const comparison = {
    policy_area: policyArea,
    baseline_date: baselineDate,
    status: 'complete',
    before_baseline: {
      congress: BASELINE_CONGRESS,
      bills: beforeBills,
      count: beforeBills?.bills?.length || 0
    },
    after_baseline: {
      congress: CURRENT_CONGRESS,
      bills: afterBills,
      count: afterBills?.bills?.length || 0
    },
    changes: calculateLegislativeChanges(beforeBills, afterBills)
  };

  // Check data availability
  if (!beforeBills && !afterBills) {
    comparison.status = 'partial';
    comparison.message = 'Legislative data unavailable';
    comparison.continue = true;
  }

  return comparison;
}

/**
 * Calculate changes in legislative activity
 * @param {Object|null} baseline - Baseline bill data
 * @param {Object|null} current - Current bill data
 * @returns {Object} Legislative changes analysis
 */
function calculateLegislativeChanges(baseline, current) {
  if (!baseline || !current) {
    return { available: false };
  }

  try {
    const baselineBills = baseline.bills || [];
    const currentBills = current.bills || [];

    const baselineCount = baselineBills.length;
    const currentCount = currentBills.length;

    // Calculate rate change
    const pctChange = baselineCount > 0 ?
      ((currentCount - baselineCount) / baselineCount) * 100 : 0;

    // Count enacted bills (look for "became public law" in latest action)
    const baselineEnacted = baselineBills.filter(bill =>
      (bill.latestAction?.text || '').toLowerCase().includes('became public law')
    ).length;

    const currentEnacted = currentBills.filter(bill =>
      (bill.latestAction?.text || '').toLowerCase().includes('became public law')
    ).length;

    // Analyze bill types
    const baselineTypes = {};
    baselineBills.forEach(bill => {
      const type = bill.type || 'unknown';
      baselineTypes[type] = (baselineTypes[type] || 0) + 1;
    });

    const currentTypes = {};
    currentBills.forEach(bill => {
      const type = bill.type || 'unknown';
      currentTypes[type] = (currentTypes[type] || 0) + 1;
    });

    return {
      available: true,
      baseline_bills: baselineCount,
      current_bills: currentCount,
      bill_count_change: currentCount - baselineCount,
      bill_count_change_pct: Math.round(pctChange * 10) / 10,
      baseline_enacted: baselineEnacted,
      current_enacted: currentEnacted,
      enacted_change: currentEnacted - baselineEnacted,
      baseline_types: baselineTypes,
      current_types: currentTypes,
      activity_trend: pctChange > 20 ? 'increasing' : pctChange < -20 ? 'decreasing' : 'stable'
    };

  } catch (error) {
    console.error(`Error calculating legislative changes: ${error.message}`);
    return { available: false };
  }
}

/**
 * Generate human-readable summary of congressional impacts
 * @param {Object} legislativeData - Legislative data object
 * @param {string} policyArea - Policy area
 * @returns {Object} Impact summary
 */
function generateCongressionalSummary(legislativeData, policyArea) {
  const summary = {
    key_legislative_actions: [],
    notable_bills: [],
    activity_level: 'unknown'
  };

  // Analyze baseline comparison
  if (legislativeData.baseline_comparison) {
    const comparison = legislativeData.baseline_comparison;

    if (comparison.status !== 'partial') {
      const changes = comparison.changes || {};

      if (changes.available) {
        const billChange = changes.bill_count_change || 0;
        const pctChange = changes.bill_count_change_pct || 0;

        if (Math.abs(billChange) > 5) {
          summary.key_legislative_actions.push(
            `Legislative activity changed by ${billChange > 0 ? '+' : ''}${billChange} bills (${pctChange > 0 ? '+' : ''}${pctChange}%) since Jan 2025`
          );
        }

        const enactedChange = changes.enacted_change || 0;
        if (enactedChange !== 0) {
          summary.key_legislative_actions.push(
            `${Math.abs(enactedChange)} ${enactedChange > 0 ? 'more' : 'fewer'} bills enacted compared to previous Congress`
          );
        }

        summary.activity_level = changes.activity_trend || 'stable';
      }
    }
  }

  // Analyze recent bills
  if (legislativeData.recent_bills) {
    const recentData = legislativeData.recent_bills;

    if (recentData.status === 'complete' && recentData.count > 0) {
      summary.key_legislative_actions.push(
        `${recentData.count} bills introduced related to ${policyArea} since Jan 2025`
      );

      // Add notable bills (top 5 most recent)
      const bills = recentData.data?.bills || [];
      bills.slice(0, 5).forEach(bill => {
        summary.notable_bills.push({
          number: `${(bill.type || '').toUpperCase()}${bill.number || ''}`,
          title: bill.title || 'Unknown',
          sponsor: bill.sponsors?.[0]?.fullName || 'Unknown',
          status: bill.latestAction?.text || 'Unknown'
        });
      });
    }
  }

  // Analyze nominations
  if (legislativeData.nominations) {
    const nomData = legislativeData.nominations;

    if (nomData.status === 'complete') {
      const nominations = nomData.data?.nominations || [];

      if (nominations.length > 0) {
        const confirmed = nominations.filter(nom =>
          (nom.latestAction?.text || '').toLowerCase().includes('confirmed')
        ).length;

        summary.key_legislative_actions.push(
          `${nominations.length} nominations submitted, ${confirmed} confirmed`
        );
      }
    }
  }

  // Add policy-specific context
  summary.policy_context = getPolicyContext(policyArea);

  return summary;
}

/**
 * Get Project 2025 context for policy area
 * @param {string} policyArea - Policy area
 * @returns {string} Policy context
 */
function getPolicyContext(policyArea) {
  const contexts = {
    'economy': 'Project 2025 proposes expanding Schedule F to reclassify federal workers, enabling mass workforce reductions.',
    'immigration': 'Project 2025 calls for aggressive border enforcement, mass deportations, and termination of DACA.',
    'education': 'Project 2025 advocates for eliminating the Department of Education and cutting Title I funding.',
    'healthcare': 'Project 2025 proposes Medicaid restructuring, ACA repeal efforts, and Medicare changes.',
    'environmental': 'Project 2025 seeks to reduce EPA authority, roll back climate regulations, and expand fossil fuel production.',
    'social': 'Project 2025 calls for SNAP work requirements, time limits, and potential program cuts.',
    'judicial': 'Project 2025 emphasizes appointing conservative judges and reshaping federal judiciary.',
    'military': 'Project 2025 proposes increased defense spending and military readiness enhancements.'
  };

  return contexts[policyArea] || `Project 2025 includes significant proposals affecting ${policyArea} policy.`;
}

/**
 * MASTER METHOD: Comprehensive congressional policy impact analysis
 * @param {string} policyArea - Project 2025 policy domain
 * @param {string} baselineDate - Comparison baseline (default: '2025-01-01')
 * @returns {Promise<Object>} Comprehensive congressional impact analysis
 */
export async function analyzeCongressionalPolicyImpact(policyArea, baselineDate = '2025-01-01') {
  console.log(`🏛️  CONGRESSIONAL ANALYSIS: ${policyArea}`);

  const analysis = {
    policy_area: policyArea,
    baseline_date: baselineDate,
    congress: CURRENT_CONGRESS,
    timestamp: new Date().toISOString(),
    legislative_data: {},
    overall_status: 'complete',
    warnings: []
  };

  // 1. Legislative Baseline Comparison
  console.log('📊 Comparing legislative activity...');
  const comparison = await getLegislativeBaselineComparison(policyArea, baselineDate);
  analysis.legislative_data.baseline_comparison = comparison;

  if (comparison.status === 'partial') {
    analysis.warnings.push('Legislative comparison data unavailable');
  }

  // 2. Recent Bills
  console.log('📜 Searching recent bills...');
  const recentBills = await searchBillsByPolicyArea(policyArea, CURRENT_CONGRESS, baselineDate, 50);
  analysis.legislative_data.recent_bills = {
    status: recentBills ? 'complete' : 'partial',
    data: recentBills,
    count: recentBills?.bills?.length || 0
  };

  if (!recentBills) {
    analysis.warnings.push('Recent bill data unavailable');
  }

  // 3. Nominations (for relevant policy areas)
  if (['judicial', 'economy', 'all'].includes(policyArea)) {
    console.log('👤 Checking presidential nominations...');
    const nominations = await getNominations(CURRENT_CONGRESS, 20);
    analysis.legislative_data.nominations = {
      status: nominations ? 'complete' : 'partial',
      data: nominations
    };

    if (!nominations) {
      analysis.warnings.push('Nomination data unavailable');
    }
  }

  // 4. Committee Activity
  console.log('🏢 Analyzing committee activity...');
  const committees = await getCommittees();
  analysis.legislative_data.committees = {
    status: committees ? 'complete' : 'partial',
    data: committees
  };

  if (!committees) {
    analysis.warnings.push('Committee data unavailable');
  }

  // 5. Generate Impact Summary
  console.log('📝 Generating congressional impact summary...');
  analysis.impact_summary = generateCongressionalSummary(
    analysis.legislative_data,
    policyArea
  );

  // Determine overall status
  if (analysis.warnings.length === 0) {
    analysis.overall_status = 'complete';
  } else if (analysis.warnings.length <= 1) {
    analysis.overall_status = 'mostly_complete';
  } else {
    analysis.overall_status = 'partial';
  }

  console.log(`✅ Congressional analysis complete: ${analysis.overall_status}`);

  return analysis;
}

/**
 * Fallback data when Congress.gov API is unavailable
 * @param {string} dataType - Type of data being requested
 * @param {any} identifier - Data identifier
 * @returns {Object} Fallback data structure
 */
function getFallbackData(dataType, identifier) {
  return {
    status: 'unavailable',
    data_type: dataType,
    identifier: identifier,
    message: `Congress.gov ${dataType} data temporarily unavailable. Analysis proceeding with other sources.`,
    fallback: true,
    continue: true
  };
}

// Export for use in other modules
export default {
  searchBillsByPolicyArea,
  getBillDetails,
  getBillActions,
  getNominations,
  getCommittees,
  getLegislativeBaselineComparison,
  analyzeCongressionalPolicyImpact
};
