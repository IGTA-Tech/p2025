/**
 * Census Bureau API Service
 *
 * Provides access to US Census data including:
 * - American Community Survey (ACS) 5-Year Estimates
 * - Demographics, income, employment, education data by geography
 *
 * API Documentation: https://www.census.gov/data/developers/data-sets.html
 * No API key required for development, but recommended for production
 */

const CENSUS_API_BASE = 'https://api.census.gov/data';
const ACS_YEAR = '2022'; // Most recent complete 5-year estimates

/**
 * Census API Variable Codes
 * Full list: https://api.census.gov/data/2022/acs/acs5/variables.html
 */
const CENSUS_VARIABLES = {
  // Population
  totalPopulation: 'B01001_001E',
  malePopulation: 'B01001_002E',
  femalePopulation: 'B01001_026E',

  // Age
  medianAge: 'B01002_001E',
  under18: 'B09001_001E',
  over65: 'B09020_001E',

  // Income & Poverty
  medianHouseholdIncome: 'B19013_001E',
  perCapitaIncome: 'B19301_001E',
  povertyRate: 'B17001_002E', // Below poverty level
  totalForPoverty: 'B17001_001E', // Total for poverty calculation

  // Employment
  laborForce: 'B23025_002E',
  employed: 'B23025_004E',
  unemployed: 'B23025_005E',
  notInLaborForce: 'B23025_007E',

  // Education (25+ years)
  lessThanHS: 'B15003_002E',
  hsGraduate: 'B15003_017E',
  someCollege: 'B15003_019E',
  bachelors: 'B15003_022E',
  graduate: 'B15003_025E',
  totalEducation: 'B15003_001E',

  // Housing
  medianHomeValue: 'B25077_001E',
  medianRent: 'B25064_001E',
  ownerOccupied: 'B25003_002E',
  renterOccupied: 'B25003_003E',

  // Race & Ethnicity
  white: 'B02001_002E',
  black: 'B02001_003E',
  asian: 'B02001_005E',
  hispanic: 'B03003_003E',
};

/**
 * Fetch demographic data for a specific ZIP code
 * @param {string} zipCode - 5-digit ZIP code
 * @returns {Promise<Object>} Demographic data object
 */
export async function getDemographicsByZip(zipCode) {
  try {
    // Build the variable list for the API request
    const variables = Object.values(CENSUS_VARIABLES).join(',');

    // ACS 5-year endpoint for ZIP Code Tabulation Areas (ZCTAs)
    const url = `${CENSUS_API_BASE}/${ACS_YEAR}/acs/acs5?get=NAME,${variables}&for=zip%20code%20tabulation%20area:${zipCode}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Census API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length < 2) {
      throw new Error(`No data found for ZIP code: ${zipCode}`);
    }

    // Parse the response (first row is headers, second row is data)
    const headers = data[0];
    const values = data[1];

    // Create a map of variable names to values
    const dataMap = {};
    headers.forEach((header, index) => {
      dataMap[header] = values[index];
    });

    // Calculate derived metrics
    const totalPop = parseInt(dataMap[CENSUS_VARIABLES.totalPopulation]) || 0;
    const unemployed = parseInt(dataMap[CENSUS_VARIABLES.unemployed]) || 0;
    const laborForce = parseInt(dataMap[CENSUS_VARIABLES.laborForce]) || 0;
    const belowPoverty = parseInt(dataMap[CENSUS_VARIABLES.povertyRate]) || 0;
    const totalPoverty = parseInt(dataMap[CENSUS_VARIABLES.totalForPoverty]) || 0;

    return {
      zipCode: zipCode,
      name: dataMap.NAME,
      population: {
        total: totalPop,
        male: parseInt(dataMap[CENSUS_VARIABLES.malePopulation]) || 0,
        female: parseInt(dataMap[CENSUS_VARIABLES.femalePopulation]) || 0,
        medianAge: parseFloat(dataMap[CENSUS_VARIABLES.medianAge]) || 0,
        under18: parseInt(dataMap[CENSUS_VARIABLES.under18]) || 0,
        over65: parseInt(dataMap[CENSUS_VARIABLES.over65]) || 0,
      },
      income: {
        medianHousehold: parseInt(dataMap[CENSUS_VARIABLES.medianHouseholdIncome]) || 0,
        perCapita: parseInt(dataMap[CENSUS_VARIABLES.perCapitaIncome]) || 0,
        povertyRate: totalPoverty > 0 ? ((belowPoverty / totalPoverty) * 100).toFixed(1) : 0,
        belowPovertyCount: belowPoverty,
      },
      employment: {
        laborForce: laborForce,
        employed: parseInt(dataMap[CENSUS_VARIABLES.employed]) || 0,
        unemployed: unemployed,
        unemploymentRate: laborForce > 0 ? ((unemployed / laborForce) * 100).toFixed(1) : 0,
        notInLaborForce: parseInt(dataMap[CENSUS_VARIABLES.notInLaborForce]) || 0,
      },
      education: {
        lessThanHS: parseInt(dataMap[CENSUS_VARIABLES.lessThanHS]) || 0,
        hsGraduate: parseInt(dataMap[CENSUS_VARIABLES.hsGraduate]) || 0,
        someCollege: parseInt(dataMap[CENSUS_VARIABLES.someCollege]) || 0,
        bachelors: parseInt(dataMap[CENSUS_VARIABLES.bachelors]) || 0,
        graduate: parseInt(dataMap[CENSUS_VARIABLES.graduate]) || 0,
      },
      housing: {
        medianValue: parseInt(dataMap[CENSUS_VARIABLES.medianHomeValue]) || 0,
        medianRent: parseInt(dataMap[CENSUS_VARIABLES.medianRent]) || 0,
        ownerOccupied: parseInt(dataMap[CENSUS_VARIABLES.ownerOccupied]) || 0,
        renterOccupied: parseInt(dataMap[CENSUS_VARIABLES.renterOccupied]) || 0,
      },
      race: {
        white: parseInt(dataMap[CENSUS_VARIABLES.white]) || 0,
        black: parseInt(dataMap[CENSUS_VARIABLES.black]) || 0,
        asian: parseInt(dataMap[CENSUS_VARIABLES.asian]) || 0,
        hispanic: parseInt(dataMap[CENSUS_VARIABLES.hispanic]) || 0,
      },
      rawData: dataMap,
      dataYear: ACS_YEAR,
      source: 'US Census Bureau - American Community Survey 5-Year Estimates',
    };
  } catch (error) {
    console.error('Census API Error:', error);
    throw error;
  }
}

/**
 * Verify a citizen story's demographic claims against Census data
 * @param {Object} story - The citizen story object
 * @param {Object} censusData - Census data for the story's ZIP code
 * @returns {Object} Verification results
 */
export function verifyStoryDemographics(story, censusData) {
  const verification = {
    zipCode: story.location.zip,
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
  };

  // Verify income bracket claim
  if (story.demographics?.income) {
    const claimedIncome = story.demographics.income;
    const medianIncome = censusData.income.medianHousehold;

    let incomeMatch = false;
    if (claimedIncome === '45-60k' && medianIncome >= 40000 && medianIncome <= 65000) {
      incomeMatch = true;
    } else if (claimedIncome === '30-45k' && medianIncome >= 25000 && medianIncome <= 50000) {
      incomeMatch = true;
    } else if (claimedIncome === '80-100k' && medianIncome >= 75000 && medianIncome <= 105000) {
      incomeMatch = true;
    }

    if (incomeMatch) {
      verification.confidence += 25;
      verification.insights.push({
        type: 'income_verified',
        message: `Income claim matches Census median of $${medianIncome.toLocaleString()}`,
      });
    } else {
      verification.flags.push({
        type: 'income_mismatch',
        severity: 'low',
        message: `Claimed income "${claimedIncome}" differs from Census median $${medianIncome.toLocaleString()}`,
      });
    }
  }

  // Verify population affected claim
  if (story.impact?.affected_population) {
    const claimed = story.impact.affected_population;
    const totalPop = censusData.population.total;

    if (claimed <= totalPop) {
      verification.confidence += 25;
      verification.insights.push({
        type: 'population_plausible',
        message: `Affected population (${claimed.toLocaleString()}) is within ZIP total (${totalPop.toLocaleString()})`,
      });
    } else {
      verification.flags.push({
        type: 'population_exceeds_total',
        severity: 'high',
        message: `Claimed affected (${claimed.toLocaleString()}) exceeds ZIP population (${totalPop.toLocaleString()})`,
      });
      verification.verified = false;
    }
  }

  // Add demographic context
  verification.insights.push({
    type: 'demographic_context',
    message: `ZIP ${censusData.zipCode}: ${censusData.population.total.toLocaleString()} residents, ${censusData.employment.unemploymentRate}% unemployment, $${censusData.income.medianHousehold.toLocaleString()} median income`,
  });

  // Calculate final confidence score
  verification.confidence = Math.min(100, verification.confidence + 50); // Base 50 + verification points

  return verification;
}

/**
 * Get Census data for multiple ZIP codes in batch
 * @param {Array<string>} zipCodes - Array of ZIP codes
 * @returns {Promise<Object>} Map of ZIP codes to demographic data
 */
export async function getBatchDemographics(zipCodes) {
  const results = {};
  const errors = [];

  for (const zip of zipCodes) {
    try {
      results[zip] = await getDemographicsByZip(zip);
    } catch (error) {
      errors.push({ zip, error: error.message });
    }
  }

  return {
    results,
    errors,
    total: zipCodes.length,
    successful: Object.keys(results).length,
    failed: errors.length,
  };
}

export default {
  getDemographicsByZip,
  verifyStoryDemographics,
  getBatchDemographics,
  CENSUS_VARIABLES,
};
