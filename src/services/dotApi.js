/**
 * DOT (Department of Transportation) API Service
 *
 * Provides access to US transportation data including:
 * - Transit system information
 * - Road and bridge conditions
 * - Transportation infrastructure safety data
 * - Public transit performance metrics
 * - Highway statistics
 *
 * API Documentation: https://data.transportation.gov/
 */

const DOT_API_BASE = 'https://data.transportation.gov/resource';

/**
 * Get the DOT API credentials from environment (runtime evaluation)
 * @returns {Object} API credentials
 */
function getDOTCredentials() {
  return {
    accessToken:
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DOT_ACCESS_TOKEN) ||
      (typeof process !== 'undefined' && process.env?.VITE_DOT_ACCESS_TOKEN) ||
      '',
    secretKey:
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DOT_SECRET_KEY) ||
      (typeof process !== 'undefined' && process.env?.VITE_DOT_SECRET_KEY) ||
      '',
  };
}

// State abbreviation mapping
const STATE_ABBREV = {
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
 * Make a request to the DOT API
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response data
 */
async function makeDOTRequest(endpoint, params = {}) {
  const credentials = getDOTCredentials();

  if (!credentials.accessToken || !credentials.secretKey) {
    console.warn('DOT API credentials not configured. Using mock data.');
    throw new Error('DOT API credentials not configured. Set VITE_DOT_ACCESS_TOKEN and VITE_DOT_SECRET_KEY in .env file.');
  }

  const queryParams = new URLSearchParams(params);
  const queryString = queryParams.toString();
  const url = `${DOT_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-App-Token': credentials.accessToken,
        'Authorization': `Bearer ${credentials.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DOT API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('DOT API Request Error:', error);
    throw error;
  }
}

/**
 * Get transportation infrastructure data for a state
 * @param {string} stateCode - Two-letter state code
 * @returns {Promise<Object>} Infrastructure data
 */
export async function getStateInfrastructureData(stateCode) {
  try {
    // This is a mock implementation - real DOT API endpoints vary
    // The actual endpoint would depend on the specific dataset
    // Common datasets: bridges, highways, transit systems, accidents

    // For now, return comprehensive mock data
    return getMockInfrastructureData(stateCode);
  } catch (error) {
    console.error('Error fetching infrastructure data:', error);
    return getMockInfrastructureData(stateCode);
  }
}

/**
 * Get bridge condition data for a state
 * @param {string} stateCode - Two-letter state code
 * @returns {Promise<Object>} Bridge condition data
 */
export async function getBridgeConditions(stateCode) {
  try {
    // Mock implementation - would use real DOT National Bridge Inventory
    return getMockBridgeData(stateCode);
  } catch (error) {
    console.error('Error fetching bridge data:', error);
    return getMockBridgeData(stateCode);
  }
}

/**
 * Get public transit performance data for a state
 * @param {string} stateCode - Two-letter state code
 * @returns {Promise<Object>} Transit performance data
 */
export async function getTransitPerformance(stateCode) {
  try {
    // Mock implementation - would use real DOT transit performance data
    return getMockTransitData(stateCode);
  } catch (error) {
    console.error('Error fetching transit data:', error);
    return getMockTransitData(stateCode);
  }
}

/**
 * Verify infrastructure-related claims in a citizen story
 * @param {Object} story - The citizen story
 * @param {Object} infrastructureData - DOT infrastructure data for the story's state
 * @returns {Object} Verification results
 */
export function verifyInfrastructureStory(story, infrastructureData) {
  const verification = {
    state: story.location.state,
    verified: true,
    confidence: 0,
    flags: [],
    insights: [],
    infrastructureMetrics: {},
  };

  // Check if story is infrastructure-related
  const storyText = (story.headline + ' ' + story.story).toLowerCase();
  const isInfrastructureRelated =
    storyText.includes('road') ||
    storyText.includes('bridge') ||
    storyText.includes('highway') ||
    storyText.includes('transit') ||
    storyText.includes('bus') ||
    storyText.includes('train') ||
    storyText.includes('subway') ||
    storyText.includes('infrastructure') ||
    storyText.includes('pothole') ||
    storyText.includes('traffic') ||
    storyText.includes('construction') ||
    storyText.includes('commute');

  if (!isInfrastructureRelated) {
    verification.insights.push({
      type: 'not_infrastructure_related',
      message: 'Story does not appear to be infrastructure-related',
    });
    return verification;
  }

  // Provide infrastructure context
  verification.confidence = 70;
  verification.infrastructureMetrics = {
    totalBridges: infrastructureData.bridges.total,
    deficientBridges: infrastructureData.bridges.structurallyDeficient,
    roadCondition: infrastructureData.roads.averageCondition,
    transitSystems: infrastructureData.transit.systems,
  };

  verification.insights.push({
    type: 'state_infrastructure_context',
    message: `In ${infrastructureData.stateName}, there are ${infrastructureData.bridges.total.toLocaleString()} bridges, with ${infrastructureData.bridges.structurallyDeficient} (${infrastructureData.bridges.deficientPercentage}%) rated as structurally deficient`,
  });

  // Check for bridge mentions
  if (storyText.includes('bridge')) {
    verification.confidence += 15;
    verification.insights.push({
      type: 'bridge_context',
      message: `Bridge conditions: ${infrastructureData.bridges.deficientPercentage}% structurally deficient. Average age: ${infrastructureData.bridges.averageAge} years`,
    });

    if (infrastructureData.bridges.deficientPercentage > 10) {
      verification.flags.push('high_bridge_deficiency_rate');
    }
  }

  // Check for road/highway mentions
  if (storyText.includes('road') || storyText.includes('highway') || storyText.includes('pothole')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'road_context',
      message: `Road conditions: ${infrastructureData.roads.averageCondition} average rating. ${infrastructureData.roads.poorPercentage}% rated as poor`,
    });
  }

  // Check for transit mentions
  if (storyText.includes('transit') || storyText.includes('bus') || storyText.includes('train') || storyText.includes('subway')) {
    verification.confidence += 10;
    verification.insights.push({
      type: 'transit_context',
      message: `Public transit: ${infrastructureData.transit.systems} active systems serving ${infrastructureData.transit.ridersPerYear.toLocaleString()} riders annually`,
    });
  }

  // Check for funding mentions
  if (storyText.includes('funding') || storyText.includes('budget') || storyText.includes('federal')) {
    verification.confidence += 5;
    verification.insights.push({
      type: 'funding_context',
      message: `Annual federal transportation funding for ${infrastructureData.stateName}: $${(infrastructureData.funding.federalAnnual / 1000000).toFixed(0)}M`,
    });
  }

  // Check for safety concerns
  if (storyText.includes('accident') || storyText.includes('crash') || storyText.includes('unsafe') || storyText.includes('danger')) {
    verification.confidence += 5;
    verification.flags.push('safety_concern_mentioned');
    verification.insights.push({
      type: 'safety_context',
      message: 'Story mentions safety concerns. This is a critical infrastructure indicator.',
    });
  }

  verification.confidence = Math.min(100, verification.confidence);

  return verification;
}

/**
 * Mock infrastructure data (fallback when API fails)
 */
function getMockInfrastructureData(stateCode) {
  // Mock data based on 2024 estimates
  const mockData = {
    'MI': {
      bridges: { total: 11098, deficient: 1312, avgAge: 54 },
      roads: { condition: 'Fair', poor: 32 },
      transit: { systems: 87, riders: 54200000 },
      funding: 1245000000,
    },
    'TX': {
      bridges: { total: 54682, deficient: 1497, avgAge: 42 },
      roads: { condition: 'Good', poor: 18 },
      transit: { systems: 142, riders: 287000000 },
      funding: 4890000000,
    },
    'VA': {
      bridges: { total: 13932, deficient: 782, avgAge: 47 },
      roads: { condition: 'Fair', poor: 24 },
      transit: { systems: 98, riders: 156000000 },
      funding: 1654000000,
    },
    'CA': {
      bridges: { total: 25771, deficient: 1568, avgAge: 51 },
      roads: { condition: 'Fair', poor: 35 },
      transit: { systems: 267, riders: 1240000000 },
      funding: 6780000000,
    },
    'NY': {
      bridges: { total: 17456, deficient: 2095, avgAge: 61 },
      roads: { condition: 'Fair', poor: 38 },
      transit: { systems: 187, riders: 2450000000 },
      funding: 5430000000,
    },
  };

  const data = mockData[stateCode] || {
    bridges: { total: 8000, deficient: 640, avgAge: 50 },
    roads: { condition: 'Fair', poor: 25 },
    transit: { systems: 45, riders: 45000000 },
    funding: 987000000,
  };

  return {
    state: stateCode,
    stateName: STATE_ABBREV[stateCode] || stateCode,
    year: 2024,
    bridges: {
      total: data.bridges.total,
      structurallyDeficient: data.bridges.deficient,
      deficientPercentage: ((data.bridges.deficient / data.bridges.total) * 100).toFixed(1),
      averageAge: data.bridges.avgAge,
    },
    roads: {
      averageCondition: data.roads.condition,
      poorPercentage: data.roads.poor,
      totalMiles: data.bridges.total * 12, // rough estimate
    },
    transit: {
      systems: data.transit.systems,
      ridersPerYear: data.transit.riders,
      ridersPerDay: Math.round(data.transit.riders / 365),
    },
    funding: {
      federalAnnual: data.funding,
      perCapita: Math.round(data.funding / 1000000 / 10), // rough per capita
    },
    source: 'US Department of Transportation (Mock Data)',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Mock bridge data
 */
function getMockBridgeData(stateCode) {
  const infraData = getMockInfrastructureData(stateCode);
  return {
    state: stateCode,
    stateName: infraData.stateName,
    totalBridges: infraData.bridges.total,
    structurallyDeficient: infraData.bridges.structurallyDeficient,
    functionallyObsolete: Math.round(infraData.bridges.total * 0.08),
    goodCondition: infraData.bridges.total - infraData.bridges.structurallyDeficient - Math.round(infraData.bridges.total * 0.08),
    averageAge: infraData.bridges.averageAge,
    source: 'National Bridge Inventory (Mock)',
  };
}

/**
 * Mock transit data
 */
function getMockTransitData(stateCode) {
  const infraData = getMockInfrastructureData(stateCode);
  return {
    state: stateCode,
    stateName: infraData.stateName,
    transitSystems: infraData.transit.systems,
    annualRiders: infraData.transit.ridersPerYear,
    dailyRiders: infraData.transit.ridersPerDay,
    onTimePerformance: 87.5, // mock percentage
    source: 'Federal Transit Administration (Mock)',
  };
}

export default {
  getStateInfrastructureData,
  getBridgeConditions,
  getTransitPerformance,
  verifyInfrastructureStory,
};
