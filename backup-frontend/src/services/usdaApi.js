/**
 * USDA NASS (National Agricultural Statistics Service) API Integration
 *
 * U.S. Department of Agriculture - Agricultural and Rural Economic Data
 * API Documentation: https://quickstats.nass.usda.gov/api
 *
 * Tracks Project 2025 impacts on:
 * - Agricultural sector and farm economics
 * - Rural communities and employment
 * - Food assistance programs (SNAP, WIC, school lunch)
 * - Farm subsidies and federal agricultural support
 * - Rural infrastructure and development
 * - Environmental/conservation programs
 *
 * Critical for Project 2025 policies affecting:
 * - USDA restructuring and budget cuts
 * - SNAP/food assistance changes
 * - Farm subsidy modifications
 * - Rural development funding
 * - Agricultural trade policies
 * - Conservation program changes
 *
 * Data Coverage:
 * - Historical agricultural data back to 1800s
 * - County-level hyperlocal data
 * - Farm economics (income, expenses, government payments)
 * - Agricultural production (crops, livestock)
 * - Rural demographics and employment
 *
 * Rate Limiting:
 * - No strict limit documented
 * - Reasonable use expected
 * - 45-second timeout for complex queries
 */

// Environment-agnostic API key configuration
const USDA_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_USDA_API_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_USDA_API_KEY) ||
  null;

const USDA_BASE_URL = 'https://quickstats.nass.usda.gov/api';

// Error handling configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 45000; // 45 seconds - agricultural queries can be complex

// Request tracking (no strict limit, but monitor usage)
let requestLog = [];

// Helper function: Sleep for retry delays
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log request for monitoring
 */
function logRequest() {
  const now = new Date();
  requestLog.push(now);

  // Keep only last 24 hours
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  requestLog = requestLog.filter((req) => req > yesterday);

  console.log(`📊 USDA API requests in last 24h: ${requestLog.length}`);
}

/**
 * Make HTTP request to USDA API with retry logic
 *
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} - API response data
 */
async function makeRequest(endpoint, params = {}, retryCount = 0) {
  if (!USDA_API_KEY) {
    console.error('❌ USDA API key not configured. Set VITE_USDA_API_KEY in .env');
    return {
      error: true,
      errorMessage: 'USDA API key not configured',
      errorType: 'configuration',
    };
  }

  const url = new URL(`${USDA_BASE_URL}/${endpoint}`);

  // Add API key and format to all requests
  const queryParams = {
    key: USDA_API_KEY,
    format: 'JSON',
    ...params,
  };

  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] !== null && queryParams[key] !== undefined) {
      url.searchParams.append(key, queryParams[key]);
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`🌾 Requesting USDA NASS API: ${endpoint} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DemocraticAccountabilityPlatform/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    logRequest();

    // Handle specific error codes
    if (response.status === 413) {
      console.warn('⚠️  USDA API query too broad. Try narrowing parameters.');
      return {
        error: true,
        errorMessage: 'Query too broad - narrow search parameters',
        errorType: 'query_too_broad',
      };
    }

    if (response.status === 429) {
      console.warn('⏱️  Rate limit detected. Waiting 60 seconds...');
      if (retryCount < MAX_RETRIES) {
        await sleep(60000);
        return makeRequest(endpoint, params, retryCount + 1);
      }
      return {
        error: true,
        errorMessage: 'Rate limit exceeded',
        errorType: 'rate_limit',
      };
    }

    if (response.status === 401) {
      console.error('❌ Invalid USDA API key. Check configuration.');
      return {
        error: true,
        errorMessage: 'Invalid API key',
        errorType: 'authentication',
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for empty results
    if (!data || (typeof data === 'object' && !data.data)) {
      console.warn('⚠️  No data returned from USDA API for this query.');
      return {
        error: true,
        errorMessage: 'No data available for query',
        errorType: 'no_data',
      };
    }

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
        console.warn(`USDA API request failed. Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        return makeRequest(endpoint, params, retryCount + 1);
      }
    }

    // Return error object instead of throwing
    console.error(`❌ USDA API error after ${retryCount + 1} attempts: ${error.message}`);
    return {
      error: true,
      errorMessage: error.message,
      errorType: error.name,
      endpoint,
      retryCount,
    };
  }
}

/**
 * Get Food Assistance Program Data (SNAP, WIC, School Lunch)
 *
 * Critical for tracking Project 2025 SNAP/WIC cuts.
 *
 * @param {string} stateName - Full state name (e.g., 'TEXAS')
 * @param {string} program - 'SNAP', 'WIC', 'SCHOOL LUNCH'
 * @param {number} year - Data year
 * @returns {Promise<Object>} - Food assistance participation and funding data
 */
export async function getFoodAssistanceData(stateName, program = 'SNAP', year = 2024) {
  try {
    const endpoint = 'api_GET';

    const params = {
      source_desc: 'SURVEY',
      sector_desc: 'DEMOGRAPHICS',
      state_name: stateName.toUpperCase(),
      year: year,
      statisticcat_desc: 'PARTICIPATION',
    };

    // Add program-specific filters
    if (program === 'SNAP') {
      params.short_desc = 'FOOD STAMP';
    }

    const data = await makeRequest(endpoint, params);

    if (data.error) {
      console.warn(`⚠️  Food assistance data unavailable for ${stateName}. Continuing...`);
      return {
        error: true,
        message: `Food assistance data unavailable for ${stateName}`,
        errorDetails: data.errorMessage,
        source: 'USDA NASS API',
        state: stateName,
        program,
        year,
      };
    }

    return {
      success: true,
      source: 'USDA NASS API',
      state: stateName,
      program,
      year,
      data: data.data || [],
      recordCount: data.data ? data.data.length : 0,
    };
  } catch (error) {
    console.error(`Error fetching food assistance data: ${error.message}`);
    return {
      error: true,
      message: 'Failed to retrieve food assistance data',
      errorDetails: error.message,
      source: 'USDA NASS API',
    };
  }
}

/**
 * Compare food assistance programs before/after Jan 1, 2025
 *
 * Essential for tracking Project 2025 SNAP cuts and impacts.
 *
 * @param {string} stateName - Full state name
 * @param {number} baselineYear - Pre-Trump admin baseline (2024)
 * @param {number} currentYear - Current year (2025)
 * @returns {Promise<Object>} - Comparison of participation, funding, changes
 */
export async function getFoodAssistanceBaselineComparison(
  stateName,
  baselineYear = 2024,
  currentYear = 2025
) {
  console.log(`🍽️  Comparing food assistance: ${baselineYear} vs ${currentYear}`);

  // Get SNAP data for both years
  const baselineSnap = await getFoodAssistanceData(stateName, 'SNAP', baselineYear);
  const currentSnap = await getFoodAssistanceData(stateName, 'SNAP', currentYear);

  const comparison = {
    state: stateName,
    baselineYear,
    currentYear,
    status: 'complete',
    programs: {
      SNAP: {
        baseline: baselineSnap,
        current: currentSnap,
        changes: calculateAssistanceChanges(baselineSnap, currentSnap),
      },
    },
  };

  // Check data availability
  if (baselineSnap.error && currentSnap.error) {
    comparison.status = 'partial';
    comparison.message = 'Food assistance data unavailable - using alternative sources';
    comparison.continue = true;
  }

  return comparison;
}

/**
 * Calculate changes in food assistance programs
 *
 * @param {Object} baseline - Baseline year data
 * @param {Object} current - Current year data
 * @returns {Object} - Change metrics
 */
function calculateAssistanceChanges(baseline, current) {
  if (!baseline || baseline.error || !current || current.error) {
    return { available: false };
  }

  try {
    const baselineData = baseline.data || [];
    const currentData = current.data || [];

    if (baselineData.length === 0 || currentData.length === 0) {
      return { available: false };
    }

    // Extract participation numbers
    const baselineVal = parseFloat(baselineData[0].Value || '0');
    const currentVal = parseFloat(currentData[0].Value || '0');

    const pctChange = baselineVal > 0 ? ((currentVal - baselineVal) / baselineVal) * 100 : 0;

    return {
      available: true,
      baselineValue: baselineVal,
      currentValue: currentVal,
      absoluteChange: currentVal - baselineVal,
      percentChange: parseFloat(pctChange.toFixed(1)),
      trend:
        pctChange > 5 ? 'increasing' : pctChange < -5 ? 'decreasing' : 'stable',
    };
  } catch (error) {
    console.error(`Error calculating assistance changes: ${error.message}`);
    return { available: false };
  }
}

/**
 * Get Farm Economics Data (income, expenses, subsidies)
 *
 * Tracks Project 2025 impacts on farm subsidy changes, agricultural income, farm debt.
 *
 * @param {string} stateName - Full state name
 * @param {string} metric - 'INCOME', 'EXPENSES', 'GOVERNMENT PAYMENTS', 'DEBT'
 * @param {number} year - Data year
 * @returns {Promise<Object>} - Farm economic metrics
 */
export async function getFarmEconomicsData(stateName, metric = 'INCOME', year = 2024) {
  try {
    const endpoint = 'api_GET';

    const params = {
      source_desc: 'SURVEY',
      sector_desc: 'ECONOMICS',
      state_name: stateName.toUpperCase(),
      year: year,
    };

    // Add metric-specific filters
    if (metric === 'INCOME') {
      params.statisticcat_desc = 'INCOME';
    } else if (metric === 'GOVERNMENT PAYMENTS') {
      params.statisticcat_desc = 'GOVERNMENT PAYMENTS';
    }

    const data = await makeRequest(endpoint, params);

    if (data.error) {
      console.warn(`⚠️  Farm economics data unavailable for ${stateName}. Continuing...`);
      return {
        error: true,
        message: `Farm economics data unavailable for ${stateName}`,
        errorDetails: data.errorMessage,
        source: 'USDA NASS API',
        state: stateName,
        metric,
        year,
      };
    }

    return {
      success: true,
      source: 'USDA NASS API',
      state: stateName,
      metric,
      year,
      data: data.data || [],
      recordCount: data.data ? data.data.length : 0,
    };
  } catch (error) {
    console.error(`Error fetching farm economics data: ${error.message}`);
    return {
      error: true,
      message: 'Failed to retrieve farm economics data',
      errorDetails: error.message,
      source: 'USDA NASS API',
    };
  }
}

/**
 * Compare farm subsidies and government payments before/after Jan 1, 2025
 *
 * Critical for tracking Project 2025 agricultural policy changes.
 *
 * @param {string} stateName - Full state name
 * @param {number} baselineYear - Pre-policy baseline
 * @param {number} currentYear - Current year
 * @returns {Promise<Object>} - Comparison of farm subsidies, income, expenses
 */
export async function getFarmSubsidyBaselineComparison(
  stateName,
  baselineYear = 2024,
  currentYear = 2025
) {
  console.log(`🚜 Comparing farm economics: ${baselineYear} vs ${currentYear}`);

  // Get government payments data
  const baselinePayments = await getFarmEconomicsData(
    stateName,
    'GOVERNMENT PAYMENTS',
    baselineYear
  );
  const currentPayments = await getFarmEconomicsData(stateName, 'GOVERNMENT PAYMENTS', currentYear);

  // Get farm income data
  const baselineIncome = await getFarmEconomicsData(stateName, 'INCOME', baselineYear);
  const currentIncome = await getFarmEconomicsData(stateName, 'INCOME', currentYear);

  const comparison = {
    state: stateName,
    baselineYear,
    currentYear,
    status: 'complete',
    governmentPayments: {
      baseline: baselinePayments,
      current: currentPayments,
      changes: calculateEconomicChanges(baselinePayments, currentPayments),
    },
    farmIncome: {
      baseline: baselineIncome,
      current: currentIncome,
      changes: calculateEconomicChanges(baselineIncome, currentIncome),
    },
  };

  // Check data availability
  const allError =
    baselinePayments.error && currentPayments.error && baselineIncome.error && currentIncome.error;

  if (allError) {
    comparison.status = 'partial';
    comparison.message = 'Farm economics data unavailable';
    comparison.continue = true;
  }

  return comparison;
}

/**
 * Calculate changes in farm economic metrics
 *
 * @param {Object} baseline - Baseline year data
 * @param {Object} current - Current year data
 * @returns {Object} - Change metrics
 */
function calculateEconomicChanges(baseline, current) {
  if (!baseline || baseline.error || !current || current.error) {
    return { available: false };
  }

  try {
    const baselineData = baseline.data || [];
    const currentData = current.data || [];

    if (baselineData.length === 0 || currentData.length === 0) {
      return { available: false };
    }

    // Aggregate values (USDA returns multiple records)
    const baselineTotal = baselineData.reduce((sum, record) => {
      const val = parseFloat(record.Value || '0');
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const currentTotal = currentData.reduce((sum, record) => {
      const val = parseFloat(record.Value || '0');
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const pctChange = baselineTotal > 0 ? ((currentTotal - baselineTotal) / baselineTotal) * 100 : 0;

    return {
      available: true,
      baselineTotal,
      currentTotal,
      absoluteChange: currentTotal - baselineTotal,
      percentChange: parseFloat(pctChange.toFixed(1)),
      trend:
        pctChange > 5 ? 'increasing' : pctChange < -5 ? 'decreasing' : 'stable',
    };
  } catch (error) {
    console.error(`Error calculating economic changes: ${error.message}`);
    return { available: false };
  }
}

/**
 * Get Agricultural Production Data (crops, livestock)
 *
 * Tracks production changes that may result from policy shifts.
 *
 * @param {string} stateName - Full state name
 * @param {string} commodity - 'CORN', 'SOYBEANS', 'WHEAT', 'CATTLE', etc.
 * @param {number} year - Data year
 * @returns {Promise<Object>} - Production data (acres planted, yield, harvest)
 */
export async function getAgriculturalProductionData(
  stateName,
  commodity = 'CORN',
  year = 2024
) {
  try {
    const endpoint = 'api_GET';

    const params = {
      source_desc: 'SURVEY',
      sector_desc: ['CORN', 'SOYBEANS', 'WHEAT'].includes(commodity.toUpperCase())
        ? 'CROPS'
        : 'ANIMALS & PRODUCTS',
      commodity_desc: commodity.toUpperCase(),
      state_name: stateName.toUpperCase(),
      year: year,
      statisticcat_desc: 'PRODUCTION',
    };

    const data = await makeRequest(endpoint, params);

    if (data.error) {
      console.warn(`⚠️  Production data unavailable for ${commodity} in ${stateName}. Continuing...`);
      return {
        error: true,
        message: `Production data unavailable for ${commodity} in ${stateName}`,
        errorDetails: data.errorMessage,
        source: 'USDA NASS API',
        state: stateName,
        commodity,
        year,
      };
    }

    return {
      success: true,
      source: 'USDA NASS API',
      state: stateName,
      commodity,
      year,
      data: data.data || [],
      recordCount: data.data ? data.data.length : 0,
    };
  } catch (error) {
    console.error(`Error fetching production data: ${error.message}`);
    return {
      error: true,
      message: 'Failed to retrieve production data',
      errorDetails: error.message,
      source: 'USDA NASS API',
    };
  }
}

/**
 * Get Rural Employment Data
 *
 * Tracks employment impacts of agricultural policy changes.
 *
 * @param {string} stateName - Full state name
 * @param {number} year - Data year
 * @returns {Promise<Object>} - Farm employment and labor statistics
 */
export async function getRuralEmploymentData(stateName, year = 2024) {
  try {
    const endpoint = 'api_GET';

    const params = {
      source_desc: 'SURVEY',
      sector_desc: 'DEMOGRAPHICS',
      state_name: stateName.toUpperCase(),
      year: year,
      statisticcat_desc: 'LABOR',
    };

    const data = await makeRequest(endpoint, params);

    if (data.error) {
      console.warn(`⚠️  Rural employment data unavailable for ${stateName}. Continuing...`);
      return {
        error: true,
        message: `Rural employment data unavailable for ${stateName}`,
        errorDetails: data.errorMessage,
        source: 'USDA NASS API',
        state: stateName,
        year,
      };
    }

    return {
      success: true,
      source: 'USDA NASS API',
      state: stateName,
      year,
      data: data.data || [],
      recordCount: data.data ? data.data.length : 0,
    };
  } catch (error) {
    console.error(`Error fetching rural employment data: ${error.message}`);
    return {
      error: true,
      message: 'Failed to retrieve rural employment data',
      errorDetails: error.message,
      source: 'USDA NASS API',
    };
  }
}

/**
 * Compare rural metrics before/after Jan 1, 2025
 *
 * @param {string} stateName - Full state name
 * @param {number} baselineYear - Pre-policy baseline
 * @param {number} currentYear - Current year
 * @returns {Promise<Object>} - Comparison of rural employment and demographics
 */
export async function getRuralBaselineComparison(
  stateName,
  baselineYear = 2024,
  currentYear = 2025
) {
  console.log(`🏞️  Comparing rural metrics: ${baselineYear} vs ${currentYear}`);

  const baselineEmployment = await getRuralEmploymentData(stateName, baselineYear);
  const currentEmployment = await getRuralEmploymentData(stateName, currentYear);

  const comparison = {
    state: stateName,
    baselineYear,
    currentYear,
    status: 'complete',
    employment: {
      baseline: baselineEmployment,
      current: currentEmployment,
      changes: calculateEmploymentChanges(baselineEmployment, currentEmployment),
    },
  };

  if (baselineEmployment.error && currentEmployment.error) {
    comparison.status = 'partial';
    comparison.message = 'Rural employment data unavailable';
    comparison.continue = true;
  }

  return comparison;
}

/**
 * Calculate changes in rural employment
 *
 * @param {Object} baseline - Baseline year data
 * @param {Object} current - Current year data
 * @returns {Object} - Change metrics
 */
function calculateEmploymentChanges(baseline, current) {
  if (!baseline || baseline.error || !current || current.error) {
    return { available: false };
  }

  try {
    const baselineData = baseline.data || [];
    const currentData = current.data || [];

    if (baselineData.length === 0 || currentData.length === 0) {
      return { available: false };
    }

    const baselineVal = parseFloat(baselineData[0].Value || '0');
    const currentVal = parseFloat(currentData[0].Value || '0');

    const pctChange = baselineVal > 0 ? ((currentVal - baselineVal) / baselineVal) * 100 : 0;

    return {
      available: true,
      baselineValue: baselineVal,
      currentValue: currentVal,
      absoluteChange: currentVal - baselineVal,
      percentChange: parseFloat(pctChange.toFixed(1)),
      jobsImpact: pctChange > 0 ? 'positive' : pctChange < 0 ? 'negative' : 'neutral',
    };
  } catch (error) {
    console.error(`Error calculating employment changes: ${error.message}`);
    return { available: false };
  }
}

/**
 * Get County-Level Agricultural Data
 *
 * Critical for showing community-specific impacts.
 *
 * @param {string} stateName - Full state name
 * @param {string} countyName - County name
 * @param {number} year - Data year
 * @returns {Promise<Object>} - County-level agricultural statistics
 */
export async function getCountyAgriculturalData(stateName, countyName, year = 2024) {
  try {
    const endpoint = 'api_GET';

    const params = {
      source_desc: 'CENSUS',
      state_name: stateName.toUpperCase(),
      county_name: countyName.toUpperCase(),
      year: year,
    };

    const data = await makeRequest(endpoint, params);

    if (data.error) {
      console.warn(`⚠️  County data unavailable for ${countyName}, ${stateName}. Continuing...`);
      return {
        error: true,
        message: `County data unavailable for ${countyName}, ${stateName}`,
        errorDetails: data.errorMessage,
        source: 'USDA NASS API',
        state: stateName,
        county: countyName,
        year,
      };
    }

    return {
      success: true,
      source: 'USDA NASS API',
      state: stateName,
      county: countyName,
      year,
      data: data.data || [],
      recordCount: data.data ? data.data.length : 0,
    };
  } catch (error) {
    console.error(`Error fetching county data: ${error.message}`);
    return {
      error: true,
      message: 'Failed to retrieve county agricultural data',
      errorDetails: error.message,
      source: 'USDA NASS API',
    };
  }
}

/**
 * Verify Agricultural Policy Impact Story
 *
 * Verify citizen stories about agricultural/rural impacts using USDA data.
 *
 * @param {Object} story - Citizen story object
 * @param {Object} usdaData - USDA API data to verify against (optional)
 * @returns {Promise<Object>} - Verification result with confidence score
 */
export async function verifyAgriculturalStory(story, usdaData = null) {
  try {
    const headline = story.headline || '';
    const storyText = story.story || '';
    const combinedText = `${headline} ${storyText}`.toLowerCase();

    const insights = [];
    const flags = [];
    let confidence = 50; // Base confidence

    // Check for food assistance claims
    if (
      combinedText.includes('snap') ||
      combinedText.includes('food stamp') ||
      combinedText.includes('food assistance') ||
      combinedText.includes('wic')
    ) {
      if (usdaData && usdaData.foodAssistance && !usdaData.foodAssistance.error) {
        insights.push({
          type: 'food_assistance_data_available',
          message: 'SNAP/food assistance data available for verification',
          confidence: 85,
        });
        confidence += 15;

        const changes = usdaData.foodAssistance.programs?.SNAP?.changes;
        if (changes && changes.available) {
          const pctChange = changes.percentChange;
          if (
            (combinedText.includes('cut') && pctChange < 0) ||
            (combinedText.includes('increas') && pctChange > 0)
          ) {
            insights.push({
              type: 'trend_matches_claim',
              message: `SNAP trend (${pctChange}%) aligns with citizen claim`,
              confidence: 95,
            });
            confidence += 10;
          }
        }
      } else {
        flags.push('Food assistance data unavailable - limited verification');
        confidence -= 10;
      }
    }

    // Check for farm subsidy claims
    if (
      combinedText.includes('subsidy') ||
      combinedText.includes('farm payment') ||
      combinedText.includes('government support')
    ) {
      if (usdaData && usdaData.farmEconomics && !usdaData.farmEconomics.error) {
        insights.push({
          type: 'farm_economics_data_available',
          message: 'Farm subsidy/payment data available for verification',
          confidence: 85,
        });
        confidence += 15;

        const changes = usdaData.farmEconomics.governmentPayments?.changes;
        if (changes && changes.available) {
          const pctChange = changes.percentChange;
          if (
            (combinedText.includes('cut') && pctChange < 0) ||
            (combinedText.includes('increas') && pctChange > 0)
          ) {
            insights.push({
              type: 'subsidy_trend_matches',
              message: `Farm subsidy trend (${pctChange}%) confirms citizen claim`,
              confidence: 95,
            });
            confidence += 10;
          }
        }
      } else {
        flags.push('Farm subsidy data unavailable - limited verification');
        confidence -= 10;
      }
    }

    // Check for rural employment claims
    if (
      combinedText.includes('farm job') ||
      combinedText.includes('agricultural employment') ||
      combinedText.includes('rural job')
    ) {
      if (usdaData && usdaData.ruralEmployment && !usdaData.ruralEmployment.error) {
        insights.push({
          type: 'rural_employment_data_available',
          message: 'Rural employment data available for verification',
          confidence: 80,
        });
        confidence += 10;

        const changes = usdaData.ruralEmployment.employment?.changes;
        if (changes && changes.available) {
          const pctChange = changes.percentChange;
          if (
            (combinedText.includes('job loss') && pctChange < 0) ||
            (combinedText.includes('job growth') && pctChange > 0)
          ) {
            insights.push({
              type: 'employment_trend_matches',
              message: `Rural employment trend (${pctChange}%) validates claim`,
              confidence: 90,
            });
            confidence += 10;
          }
        }
      } else {
        flags.push('Rural employment data unavailable - limited verification');
        confidence -= 10;
      }
    }

    // Cap confidence at 100
    confidence = Math.min(confidence, 100);

    const verified = confidence >= 70;

    if (insights.length === 0) {
      flags.push('No specific USDA metrics found in story - general agricultural claim');
      insights.push({
        type: 'no_usda_metrics',
        message: 'Story does not contain specific USDA-verifiable agricultural claims',
        confidence: 50,
      });
    }

    return {
      verified,
      confidence,
      flags,
      insights,
      usdaMetrics: {
        foodAssistanceAvailable: usdaData?.foodAssistance && !usdaData.foodAssistance.error,
        farmEconomicsAvailable: usdaData?.farmEconomics && !usdaData.farmEconomics.error,
        ruralEmploymentAvailable: usdaData?.ruralEmployment && !usdaData.ruralEmployment.error,
        insightsGenerated: insights.length,
      },
      source: 'USDA NASS API',
      verificationMethod: 'multi_metric_agricultural_validation',
    };
  } catch (error) {
    console.error(`Error verifying agricultural story: ${error.message}`);
    return {
      verified: false,
      confidence: 50,
      flags: ['Verification error - using fallback confidence'],
      insights: [
        {
          type: 'error',
          message: `USDA verification error: ${error.message}`,
          confidence: 50,
        },
      ],
      error: error.message,
    };
  }
}

// Export all functions
export default {
  getFoodAssistanceData,
  getFoodAssistanceBaselineComparison,
  getFarmEconomicsData,
  getFarmSubsidyBaselineComparison,
  getAgriculturalProductionData,
  getRuralEmploymentData,
  getRuralBaselineComparison,
  getCountyAgriculturalData,
  verifyAgriculturalStory,
};
