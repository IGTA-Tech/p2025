/**
 * Bureau of Justice Statistics (BJS) - National Crime Victimization Survey (NCVS) API Service
 *
 * Provides access to victim-reported crime data including:
 * - Personal victimization (violent crime)
 * - Household victimization (property crime)
 * - Both reported AND unreported crimes
 * - Victim demographics and characteristics
 * - Offense details and circumstances
 * - Historical data from 1993 to present
 *
 * API Documentation: https://bjs.ojp.gov/national-crime-victimization-survey-ncvs-api
 * Open API - No authentication required
 *
 * Key Advantage: NCVS captures crimes NOT reported to police,
 * showing the "dark figure" of crime that FBI UCR data misses.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - 30-second timeout per request
 * - Maximum 3 retry attempts
 * - Graceful degradation on failure
 */

const BJS_NCVS_API_BASE = 'https://api.ojp.gov/bjsdataset/v1/';

// Dataset identifiers
const DATASETS = {
  PERSONAL_VICTIMIZATION: 'gcuy-rt5g',  // Personal crime victimization
  PERSONAL_POPULATION: 'r4j4-fdwx',      // Personal crime population
  HOUSEHOLD_VICTIMIZATION: 'gkck-euys',  // Household property crime
  HOUSEHOLD_POPULATION: 'ya4e-n9zp'      // Household population
};

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
 * Make a GET request to BJS NCVS API with retry logic
 * @param {string} dataset - Dataset identifier
 * @param {Object} params - Query parameters
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} API response data
 */
async function makeRequest(dataset, params = {}, retryCount = 0) {
  // Build query string
  const queryParams = new URLSearchParams();

  // Add filters
  if (params.where) {
    queryParams.append('$where', params.where);
  }
  if (params.year) {
    queryParams.append('year', params.year);
  }
  if (params.limit) {
    queryParams.append('$limit', params.limit);
  } else {
    queryParams.append('$limit', '10000');  // Default limit
  }

  const queryString = queryParams.toString();
  const url = `${BJS_NCVS_API_BASE}${dataset}.json${queryString ? '?' + queryString : ''}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    console.log(`BJS NCVS API request: ${dataset} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

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
      throw new Error(`BJS NCVS API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`BJS NCVS API timeout on attempt ${retryCount + 1}`);

      if (retryCount < MAX_RETRIES) {
        const waitTime = RETRY_DELAY_MS * Math.pow(2, retryCount);  // Exponential backoff
        console.log(`Retrying in ${waitTime / 1000} seconds...`);
        await sleep(waitTime);
        return makeRequest(dataset, params, retryCount + 1);
      }

      throw new Error('timeout');
    }

    // Check if retryable error
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
    if (retryCount < MAX_RETRIES && retryableErrors.some(e => error.message.includes(e))) {
      const waitTime = RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.log(`Retrying in ${waitTime / 1000} seconds...`);
      await sleep(waitTime);
      return makeRequest(dataset, params, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Get crime victimization statistics by year
 * @param {string} year - Year (e.g., "2023")
 * @param {string} crimeType - 'personal' or 'household'
 * @returns {Promise<Object>} Victimization data
 */
export async function getVictimizationByYear(year, crimeType = 'personal') {
  try {
    const dataset = crimeType === 'personal'
      ? DATASETS.PERSONAL_VICTIMIZATION
      : DATASETS.HOUSEHOLD_VICTIMIZATION;

    const data = await makeRequest(dataset, {
      year: year,
      limit: 50000
    });

    // Calculate statistics from raw data
    const stats = calculateVictimizationStats(data);

    return {
      success: true,
      year: year,
      crimeType: crimeType,
      recordCount: data.length,
      statistics: stats,
      data: data,
      source: 'BJS National Crime Victimization Survey',
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('BJS NCVS API error:', error.message);

    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'BJS NCVS API temporarily unavailable',
      year: year,
      crimeType: crimeType,
      source: 'BJS National Crime Victimization Survey (unavailable)',
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Get victimization trends over multiple years
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @param {string} crimeType - 'personal' or 'household'
 * @returns {Promise<Object>} Trend data
 */
export async function getVictimizationTrends(startYear, endYear, crimeType = 'personal') {
  try {
    const dataset = crimeType === 'personal'
      ? DATASETS.PERSONAL_VICTIMIZATION
      : DATASETS.HOUSEHOLD_VICTIMIZATION;

    // Build year range filter
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(`"${year}"`);
    }
    const whereClause = `year in (${years.join(', ')})`;

    const data = await makeRequest(dataset, {
      where: whereClause,
      limit: 200000
    });

    // Calculate yearly statistics
    const yearlyStats = {};
    for (let year = startYear; year <= endYear; year++) {
      const yearData = data.filter(record => record.year === String(year));
      yearlyStats[year] = calculateVictimizationStats(yearData);
    }

    return {
      success: true,
      startYear: startYear,
      endYear: endYear,
      crimeType: crimeType,
      recordCount: data.length,
      yearlyStatistics: yearlyStats,
      source: 'BJS National Crime Victimization Survey',
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('BJS NCVS API trends error:', error.message);

    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'BJS NCVS API temporarily unavailable',
      startYear: startYear,
      endYear: endYear,
      crimeType: crimeType,
      source: 'BJS NCVS API (unavailable)',
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Get baseline comparison between two years
 * @param {number} baselineYear - Baseline year (e.g., 2023)
 * @param {number} currentYear - Current year (e.g., 2025)
 * @param {string} crimeType - 'personal' or 'household'
 * @returns {Promise<Object>} Comparison data
 */
export async function getBaselineComparison(baselineYear, currentYear, crimeType = 'personal') {
  try {
    const baselineData = await getVictimizationByYear(String(baselineYear), crimeType);
    const currentData = await getVictimizationByYear(String(currentYear), crimeType);

    if (baselineData.error || currentData.error) {
      console.warn('Incomplete NCVS data for baseline comparison. Using partial analysis.');
      return {
        status: 'partial',
        message: 'BJS NCVS data partially unavailable. Analysis continuing with other data sources.',
        baselineYear: baselineYear,
        currentYear: currentYear,
        crimeType: crimeType,
        baseline: baselineData,
        current: currentData,
        source: 'BJS NCVS (partial)',
        lastUpdated: new Date().toISOString()
      };
    }

    // Calculate changes
    const changes = calculateVictimizationChanges(
      baselineData.statistics,
      currentData.statistics
    );

    return {
      status: 'complete',
      baselineYear: baselineYear,
      currentYear: currentYear,
      crimeType: crimeType,
      baseline: baselineData,
      current: currentData,
      changes: changes,
      source: 'BJS National Crime Victimization Survey',
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('BJS NCVS baseline comparison error:', error.message);
    return {
      error: true,
      errorType: 'comparison_failed',
      errorMessage: 'BJS NCVS baseline comparison failed',
      baselineYear: baselineYear,
      currentYear: currentYear,
      crimeType: crimeType,
      source: 'BJS NCVS (unavailable)',
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Calculate victimization statistics from raw NCVS data
 * @param {Array} data - Raw NCVS records
 * @returns {Object} Calculated statistics
 */
function calculateVictimizationStats(data) {
  if (!data || data.length === 0) {
    return {
      totalVictimizations: 0,
      reportedToPolice: 0,
      unreportedToPolice: 0,
      reportingRate: 0,
      violentCrime: 0,
      propertyCrime: 0,
      seriousViolentCrime: 0,
      withInjury: 0,
      withWeapon: 0
    };
  }

  const stats = {
    totalVictimizations: data.length,
    reportedToPolice: 0,
    unreportedToPolice: 0,
    reportingRate: 0,
    violentCrime: 0,
    propertyCrime: 0,
    seriousViolentCrime: 0,
    withInjury: 0,
    withWeapon: 0
  };

  data.forEach(record => {
    // Count reported vs unreported (notify: 1 = reported)
    if (record.notify === '1') {
      stats.reportedToPolice++;
    } else if (record.notify === '2') {
      stats.unreportedToPolice++;
    }

    // Violent crime indicators
    if (record.newcrime === '1' || record.newcrime === '2') {
      stats.violentCrime++;
    }

    // Serious violent crime (seriousviolent: 1 = serious)
    if (record.seriousviolent === '1') {
      stats.seriousViolentCrime++;
    }

    // Injury (injury: 1 or higher = injury occurred)
    if (record.injury && parseInt(record.injury) > 0) {
      stats.withInjury++;
    }

    // Weapon involved (weapon: 1 = firearm, 2 = knife, 3 = other weapon)
    if (record.weapon && ['1', '2', '3'].includes(record.weapon)) {
      stats.withWeapon++;
    }
  });

  // Calculate reporting rate
  const reported = stats.reportedToPolice + stats.unreportedToPolice;
  if (reported > 0) {
    stats.reportingRate = (stats.reportedToPolice / reported) * 100;
  }

  return stats;
}

/**
 * Calculate percentage changes between baseline and current victimization data
 * @param {Object} baseline - Baseline statistics
 * @param {Object} current - Current statistics
 * @returns {Object} Calculated changes
 */
function calculateVictimizationChanges(baseline, current) {
  const changes = {};

  const metrics = [
    'totalVictimizations',
    'reportedToPolice',
    'unreportedToPolice',
    'violentCrime',
    'seriousViolentCrime',
    'withInjury',
    'withWeapon'
  ];

  metrics.forEach(metric => {
    const baseVal = baseline[metric] || 0;
    const currVal = current[metric] || 0;

    if (baseVal > 0) {
      changes[`${metric}Change`] = ((currVal - baseVal) / baseVal) * 100;
      changes[`${metric}ChangeAbsolute`] = currVal - baseVal;
    } else {
      changes[`${metric}Change`] = currVal > 0 ? 100 : 0;
      changes[`${metric}ChangeAbsolute`] = currVal;
    }
  });

  // Reporting rate change (in percentage points)
  changes.reportingRateChange = (current.reportingRate || 0) - (baseline.reportingRate || 0);

  return changes;
}

/**
 * Verify crime-related claims in a citizen story using NCVS data
 * @param {Object} story - The citizen story
 * @param {Object} ncvsData - NCVS victimization data
 * @returns {Object} Verification results
 */
export function verifyCrimeStory(story, ncvsData) {
  const verification = {
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
    crimeMetrics: {}
  };

  // Check if API data is unavailable
  if (ncvsData.error) {
    verification.insights.push({
      type: 'api_unavailable',
      message: ncvsData.errorMessage || 'BJS NCVS data temporarily unavailable'
    });
    verification.confidence = 50;
    return verification;
  }

  // Check if story is crime-related
  const storyText = (story.headline + ' ' + story.story).toLowerCase();
  const crimeKeywords = [
    'crime', 'violence', 'violent', 'murder', 'killed', 'homicide',
    'robbery', 'robbed', 'assault', 'assaulted', 'attacked', 'beaten',
    'burglary', 'burglarized', 'break-in', 'broken into',
    'theft', 'stolen', 'stole', 'larceny',
    'rape', 'sexual assault', 'sexual violence',
    'mugged', 'mugging', 'carjacking', 'vandalism',
    'police', 'victim', 'victimized', 'safety', 'dangerous', 'unsafe'
  ];

  const isCrimeRelated = crimeKeywords.some(keyword => storyText.includes(keyword));

  if (!isCrimeRelated) {
    verification.insights.push({
      type: 'not_crime_related',
      message: 'Story does not appear to be crime-related'
    });
    return verification;
  }

  // Determine crime type from story
  const isViolent = [
    'violence', 'violent', 'murder', 'assault', 'attacked', 'beaten',
    'rape', 'sexual', 'mugged', 'killed'
  ].some(keyword => storyText.includes(keyword));

  const isProperty = [
    'burglary', 'break-in', 'stolen', 'theft', 'larceny', 'vandalism', 'carjacking'
  ].some(keyword => storyText.includes(keyword));

  const mentionsUnreported = [
    'didn\'t report', 'not report', 'unreported', 'never reported',
    'police don\'t care', 'police didn\'t', 'didn\'t call police'
  ].some(phrase => storyText.includes(phrase));

  // Base confidence from having NCVS data
  verification.confidence = 65;

  // Add victimization statistics to metrics
  if (ncvsData.statistics) {
    verification.crimeMetrics = {
      year: ncvsData.year,
      totalVictimizations: ncvsData.statistics.totalVictimizations,
      reportingRate: Math.round(ncvsData.statistics.reportingRate),
      unreportedRate: Math.round(100 - ncvsData.statistics.reportingRate),
      dataAvailable: true
    };

    // Add insight about crime data
    verification.insights.push({
      type: 'ncvs_data_available',
      message: `NCVS victimization data available (${ncvsData.year}): ${ncvsData.statistics.totalVictimizations.toLocaleString()} victimizations in dataset`
    });

    // Check reporting rate context
    if (mentionsUnreported && ncvsData.statistics.reportingRate < 50) {
      verification.insights.push({
        type: 'unreported_crime_context',
        message: `Only ${Math.round(ncvsData.statistics.reportingRate)}% of similar crimes are reported to police. Story claim about unreported crime is statistically plausible.`
      });
      verification.confidence += 15;
    }

    // Violent crime context
    if (isViolent && ncvsData.statistics.violentCrime > 0) {
      verification.insights.push({
        type: 'violent_crime_context',
        message: `NCVS data shows ${ncvsData.statistics.violentCrime.toLocaleString()} violent crime victimizations in this period.`
      });
      verification.confidence += 10;
    }

    // Serious violent crime
    if (ncvsData.statistics.seriousViolentCrime > 0 &&
        ['murder', 'killed', 'rape', 'serious'].some(w => storyText.includes(w))) {
      verification.insights.push({
        type: 'serious_violent_context',
        message: `${ncvsData.statistics.seriousViolentCrime.toLocaleString()} serious violent crimes in NCVS data.`
      });
      verification.confidence += 5;
    }

    // Cap confidence at 95%
    verification.confidence = Math.min(verification.confidence, 95);
  }

  return verification;
}

export default {
  getVictimizationByYear,
  getVictimizationTrends,
  getBaselineComparison,
  verifyCrimeStory
};
