/**
 * CDC WONDER API Service
 *
 * Provides access to CDC public health data including:
 * - Mortality data (Detailed Mortality 1999-2023)
 * - Natality data (Births)
 * - Infant deaths
 * - COVID-19 deaths
 * - Cause of death statistics
 *
 * API Documentation: https://wonder.cdc.gov/wonder/help/WONDER-API.html
 * Open API - No authentication required
 *
 * ⚠️ CRITICAL LIMITATION: API ONLY supports NATIONAL-level data
 * - NO state queries via API
 * - NO county queries via API
 * - NO region queries via API
 * - For geographic data, use web interface: https://wonder.cdc.gov/
 */

import xml2js from 'xml2js';

const CDC_WONDER_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CDC_WONDER_API_BASE) ||
  (typeof process !== 'undefined' && process.env?.VITE_CDC_WONDER_API_BASE) ||
  'https://wonder.cdc.gov/controller/datarequest';

// Database codes
export const DATABASES = {
  DETAILED_MORTALITY: 'D76',        // 1999-2020
  DETAILED_MORTALITY_2018: 'D77',   // 2018-2023
  NATALITY: 'D66',                  // Births 2007-2022
  INFANT_DEATHS: 'D140',            // 2007-2022
  MULTIPLE_CAUSE_DEATH: 'D149',
  PROVISIONAL_COVID19: 'D176',
};

// Common ICD-10 cause of death codes
export const ICD10_CODES = {
  ALL_CAUSES: ['*All*'],
  HEART_DISEASE: ['I00-I09', 'I11', 'I13', 'I20-I51'],
  CANCER: ['C00-C97'],
  ACCIDENTS: ['V01-X59', 'Y85-Y86'],
  DIABETES: ['E10-E14'],
  ALZHEIMERS: ['G30'],
  STROKE: ['I60-I69'],
  COVID19: ['U07.1'],
  DRUG_OVERDOSE: ['X40-X44', 'X60-X64', 'X85', 'Y10-Y14'],
};

/**
 * Create XML parameter string from object
 * @param {Object} parameters - Query parameters
 * @returns {string} XML string
 */
function createParameterXML(parameters) {
  let xml = '<parameters>\n';

  for (const [name, value] of Object.entries(parameters)) {
    xml += '  <parameter>\n';
    xml += `    <name>${name}</name>\n`;

    if (Array.isArray(value)) {
      for (const v of value) {
        xml += `    <value>${v}</value>\n`;
      }
    } else {
      xml += `    <value>${value}</value>\n`;
    }

    xml += '  </parameter>\n';
  }

  xml += '</parameters>';
  return xml;
}

/**
 * Make a POST request to CDC WONDER API
 * @param {string} databaseCode - Database code (e.g., 'D76')
 * @param {Object} parameters - Query parameters
 * @returns {Promise<string>} XML response
 */
async function makeRequest(databaseCode, parameters) {
  const url = `${CDC_WONDER_API_BASE}/${databaseCode}`;

  const xmlRequest = createParameterXML(parameters);

  const formData = new URLSearchParams();
  formData.append('request_xml', xmlRequest);
  formData.append('accept_datause_restrictions', 'true');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CDC WONDER API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const xmlText = await response.text();
    return xmlText;
  } catch (error) {
    console.error('CDC WONDER API Request Error:', error);
    throw error;
  }
}

/**
 * Parse XML response to JavaScript object
 * @param {string} xmlResponse - XML string
 * @returns {Promise<Array>} Parsed data rows
 */
async function parseXMLResponse(xmlResponse) {
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
  });

  try {
    const result = await parser.parseStringPromise(xmlResponse);

    // Extract data table rows
    if (result && result['data-table'] && result['data-table'].r) {
      const rows = Array.isArray(result['data-table'].r)
        ? result['data-table'].r
        : [result['data-table'].r];

      // Convert rows to array of objects
      const dataRows = [];
      const headers = [];

      rows.forEach((row, idx) => {
        if (!row.c) return;

        const cols = Array.isArray(row.c) ? row.c : [row.c];

        if (idx === 0) {
          // First row is headers
          cols.forEach((col) => {
            headers.push(col.l || col._ || col);
          });
        } else {
          // Data rows
          const dataObj = {};
          cols.forEach((col, colIdx) => {
            const header = headers[colIdx] || `col_${colIdx}`;
            dataObj[header] = col.v || col.l || col._ || col;
          });
          dataRows.push(dataObj);
        }
      });

      return dataRows;
    }

    return [];
  } catch (error) {
    console.error('XML parsing error:', error);
    return [];
  }
}

/**
 * Get mortality data from Detailed Mortality database
 * @param {string} yearStart - Start year (e.g., '2018')
 * @param {string} yearEnd - End year (e.g., '2020')
 * @param {Array} causeOfDeath - ICD-10 codes (optional)
 * @returns {Promise<Object>} Mortality data
 */
export async function getMortalityData(yearStart, yearEnd, causeOfDeath = ICD10_CODES.ALL_CAUSES) {
  try {
    const parameters = {
      'B_1': 'D76.V1',  // Group by Year
      'B_2': 'D76.V2',  // Group by Month
      'M_1': 'D76.M1',  // Deaths
      'M_2': 'D76.M2',  // Population
      'M_3': 'D76.M3',  // Crude Rate
      'F_D76.V1': [yearStart, yearEnd],  // Year range
      'F_D76.V2': ['*All*'],  // All months
      'F_D76.V5': causeOfDeath,
      'F_D76.V9': ['*All*'],  // All states (NATIONAL data only)
      'I_D76.V9': ['*All*'],
      'O_V10_fmode': 'freg',
      'O_aar': 'aar_none',
      'O_javascript': 'on',
      'O_location': 'D76.V9',
      'O_precision': '1',
      'O_rate_per': '100000',
      'O_show_suppressed': 'true',
      'O_show_totals': 'false',
      'O_show_zeros': 'true',
      'O_timeout': '300',
    };

    const xmlResponse = await makeRequest(DATABASES.DETAILED_MORTALITY, parameters);
    const data = await parseXMLResponse(xmlResponse);

    return {
      yearStart: yearStart,
      yearEnd: yearEnd,
      count: data.length,
      results: data,
      dataLevel: 'NATIONAL_ONLY',
      source: 'CDC WONDER API (Detailed Mortality)',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('CDC WONDER API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'CDC WONDER API temporarily unavailable',
      yearStart: yearStart,
      yearEnd: yearEnd,
      count: 0,
      results: [],
      dataLevel: 'NATIONAL_ONLY',
      source: 'CDC WONDER API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get natality (birth) data
 * @param {string} yearStart - Start year
 * @param {string} yearEnd - End year
 * @returns {Promise<Object>} Birth data
 */
export async function getBirthData(yearStart, yearEnd) {
  try {
    const parameters = {
      'B_1': 'D66.V2',  // Group by Year
      'M_1': 'D66.M2',  // Births
      'M_2': 'D66.M3',  // Birth Rate
      'F_D66.V2': [yearStart, yearEnd],
      'F_D66.V9': ['*All*'],  // All states (NATIONAL data only)
      'I_D66.V9': ['*All*'],
      'O_V9_fmode': 'freg',
      'O_javascript': 'on',
      'O_location': 'D66.V9',
      'O_precision': '1',
      'O_show_totals': 'false',
      'O_show_zeros': 'true',
      'O_timeout': '300',
    };

    const xmlResponse = await makeRequest(DATABASES.NATALITY, parameters);
    const data = await parseXMLResponse(xmlResponse);

    return {
      yearStart: yearStart,
      yearEnd: yearEnd,
      count: data.length,
      results: data,
      dataLevel: 'NATIONAL_ONLY',
      source: 'CDC WONDER API (Natality)',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('CDC WONDER API timeout or error:', error.message);
    return {
      error: true,
      errorType: error.message.includes('timeout') ? 'timeout' : 'error',
      errorMessage: 'CDC WONDER API temporarily unavailable',
      yearStart: yearStart,
      yearEnd: yearEnd,
      count: 0,
      results: [],
      dataLevel: 'NATIONAL_ONLY',
      source: 'CDC WONDER API (unavailable)',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get mortality data for specific cause
 * @param {string} yearStart - Start year
 * @param {string} yearEnd - End year
 * @param {string} causeKey - Key from ICD10_CODES
 * @returns {Promise<Object>} Cause-specific mortality data
 */
export async function getMortalityByCause(yearStart, yearEnd, causeKey) {
  const causeCodes = ICD10_CODES[causeKey.toUpperCase()] || ICD10_CODES.ALL_CAUSES;
  return await getMortalityData(yearStart, yearEnd, causeCodes);
}

/**
 * Get COVID-19 mortality data
 * @param {string} yearStart - Start year
 * @param {string} yearEnd - End year
 * @returns {Promise<Object>} COVID-19 mortality data
 */
export async function getCOVID19Deaths(yearStart, yearEnd) {
  return await getMortalityData(yearStart, yearEnd, ICD10_CODES.COVID19);
}

/**
 * Verify health-related claims in a citizen story
 * @param {Object} story - The citizen story
 * @param {Object} cdcData - CDC WONDER data
 * @returns {Object} Verification results
 */
export function verifyHealthStory(story, cdcData) {
  const verification = {
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
    healthMetrics: {},
  };

  // Check if API data is unavailable
  if (cdcData.error) {
    verification.insights.push({
      type: 'api_unavailable',
      message: cdcData.errorMessage || 'CDC WONDER API temporarily unavailable',
    });
    verification.confidence = 50;
    return verification;
  }

  // Check if story is health/mortality-related
  const storyText = (story.headline + ' ' + story.story).toLowerCase();
  const isHealthRelated =
    storyText.includes('death') ||
    storyText.includes('mortality') ||
    storyText.includes('disease') ||
    storyText.includes('illness') ||
    storyText.includes('health') ||
    storyText.includes('cancer') ||
    storyText.includes('heart') ||
    storyText.includes('diabetes') ||
    storyText.includes('covid') ||
    storyText.includes('birth') ||
    storyText.includes('infant') ||
    storyText.includes('medical');

  if (!isHealthRelated) {
    verification.insights.push({
      type: 'not_health_related',
      message: 'Story does not appear to be health-related',
    });
    return verification;
  }

  // Note: CDC WONDER API only provides NATIONAL data
  verification.insights.push({
    type: 'national_data_only',
    message: 'CDC WONDER API provides national-level data only (no state/county data via API)',
  });

  verification.confidence = 60;

  // Provide context from CDC data
  if (cdcData.count > 0) {
    verification.healthMetrics = {
      nationalDataPoints: cdcData.count,
      dataLevel: 'NATIONAL',
    };

    verification.insights.push({
      type: 'national_context',
      message: `Found ${cdcData.count} national-level data points for context`,
    });
    verification.confidence += 15;
  }

  // Check for specific health topics
  if (storyText.includes('death') || storyText.includes('mortality')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'mortality_mention',
      message: 'Story mentions mortality - can be contextualized with national CDC data',
    });
  }

  if (storyText.includes('birth') || storyText.includes('infant')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'natality_mention',
      message: 'Story mentions births/infants - can be verified through CDC natality data',
    });
  }

  if (storyText.includes('covid') || storyText.includes('pandemic')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'covid_mention',
      message: 'Story mentions COVID-19 - can be verified through CDC provisional data',
    });
  }

  // Flag if mentions specific causes of death
  const causes = ['cancer', 'heart disease', 'diabetes', 'stroke', 'alzheimer', 'overdose'];
  causes.forEach((cause) => {
    if (storyText.includes(cause)) {
      verification.flags.push(`${cause}_mentioned`);
      verification.insights.push({
        type: 'cause_specific',
        message: `Story mentions ${cause} - can be verified through CDC cause-of-death data`,
      });
    }
  });

  // Important limitation note
  if (story.location && (story.location.state || story.location.county)) {
    verification.flags.push('location_specific_claim');
    verification.insights.push({
      type: 'location_limitation',
      message: 'Story has location-specific claims. CDC WONDER API only provides national data. Use web interface (https://wonder.cdc.gov/) for state/county verification',
    });
  }

  verification.confidence = Math.min(100, verification.confidence);

  return verification;
}

export default {
  getMortalityData,
  getBirthData,
  getMortalityByCause,
  getCOVID19Deaths,
  verifyHealthStory,
  DATABASES,
  ICD10_CODES,
};
