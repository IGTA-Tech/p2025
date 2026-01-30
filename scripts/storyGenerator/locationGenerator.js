/**
 * Location Generator
 *
 * Generates realistic ZIP codes and location data for stories.
 * Uses a curated list weighted toward politically relevant areas.
 */

import { lookupZipCode } from '../../src/services/zipLookup.js';

// Representative ZIP codes by region for realistic distribution
const SAMPLE_ZIPS_BY_REGION = {
  // Swing states (higher weight - included twice in weighted array)
  swing: [
    { zip: '48197', district: 'MI-06' },  // Ypsilanti, MI
    { zip: '53703', district: 'WI-02' },  // Madison, WI
    { zip: '15213', district: 'PA-12' },  // Pittsburgh, PA
    { zip: '85004', district: 'AZ-03' },  // Phoenix, AZ
    { zip: '30303', district: 'GA-05' },  // Atlanta, GA
    { zip: '89101', district: 'NV-01' },  // Las Vegas, NV
    { zip: '28202', district: 'NC-12' },  // Charlotte, NC
  ],
  // Competitive congressional districts
  competitive: [
    { zip: '22031', district: 'VA-11' },  // Fairfax, VA
    { zip: '80202', district: 'CO-01' },  // Denver, CO
    { zip: '03101', district: 'NH-01' },  // Manchester, NH
    { zip: '04101', district: 'ME-01' },  // Portland, ME
    { zip: '55401', district: 'MN-05' },  // Minneapolis, MN
  ],
  // Rural areas (important for healthcare/agriculture/infrastructure stories)
  rural: [
    { zip: '75801', district: 'TX-01' },  // Palestine, TX
    { zip: '58501', district: 'ND-AL' },  // Bismarck, ND
    { zip: '82001', district: 'WY-AL' },  // Cheyenne, WY
    { zip: '59601', district: 'MT-02' },  // Helena, MT
    { zip: '83702', district: 'ID-02' },  // Boise, ID
    { zip: '50309', district: 'IA-03' },  // Des Moines, IA
    { zip: '66101', district: 'KS-03' },  // Kansas City, KS
  ],
  // Urban centers
  urban: [
    { zip: '10001', district: 'NY-10' },  // New York, NY
    { zip: '90012', district: 'CA-34' },  // Los Angeles, CA
    { zip: '60601', district: 'IL-07' },  // Chicago, IL
    { zip: '77001', district: 'TX-18' },  // Houston, TX
    { zip: '33101', district: 'FL-24' },  // Miami, FL
    { zip: '98101', district: 'WA-07' },  // Seattle, WA
    { zip: '02101', district: 'MA-07' },  // Boston, MA
  ]
};

// Flatten with weights for random selection
// Swing states get 2x weight
const WEIGHTED_ZIPS = [
  ...SAMPLE_ZIPS_BY_REGION.swing,
  ...SAMPLE_ZIPS_BY_REGION.swing,  // Double weight for swing states
  ...SAMPLE_ZIPS_BY_REGION.competitive,
  ...SAMPLE_ZIPS_BY_REGION.rural,
  ...SAMPLE_ZIPS_BY_REGION.urban
];

// Fallback location if lookup fails
const FALLBACK_LOCATION = {
  zip: '48197',
  city: 'Ypsilanti',
  state: 'MI',
  county: 'Washtenaw',
  district: 'MI-06'
};

/**
 * Generate a random location from the weighted ZIP list
 * @returns {Promise<object>} Location object with zip, city, state, county, district
 */
export async function generateLocation() {
  // Pick a random entry from weighted list
  const randomEntry = WEIGHTED_ZIPS[Math.floor(Math.random() * WEIGHTED_ZIPS.length)];

  try {
    // Look up the ZIP code to get city, state, county
    const locationData = await lookupZipCode(randomEntry.zip);

    // Add the congressional district from our mapping
    locationData.district = randomEntry.district;

    console.log(`Generated location: ${locationData.city}, ${locationData.state} (${locationData.zip})`);
    return locationData;

  } catch (error) {
    console.error('Location lookup failed, using fallback:', error.message);
    return { ...FALLBACK_LOCATION };
  }
}

/**
 * Get a location for a specific policy area (optional policy-based weighting)
 * @param {string} policyArea - The policy area for context
 * @returns {Promise<object>} Location object
 */
export async function generateLocationForPolicy(policyArea) {
  // For certain policy areas, weight toward specific regions
  let pool = WEIGHTED_ZIPS;

  switch (policyArea) {
    case 'immigration':
      // Weight toward border states
      pool = [
        ...SAMPLE_ZIPS_BY_REGION.swing.filter(z => ['AZ', 'NV'].some(s => z.district.startsWith(s.slice(0, 2)))),
        { zip: '85364', district: 'AZ-03' },  // Yuma, AZ
        { zip: '78501', district: 'TX-15' },  // McAllen, TX
        { zip: '92101', district: 'CA-51' },  // San Diego, CA
        ...WEIGHTED_ZIPS
      ];
      break;

    case 'environment':
    case 'infrastructure':
      // Weight toward rural areas
      pool = [
        ...SAMPLE_ZIPS_BY_REGION.rural,
        ...SAMPLE_ZIPS_BY_REGION.rural,  // Double weight for rural
        ...WEIGHTED_ZIPS
      ];
      break;

    case 'housing':
      // Weight toward urban areas
      pool = [
        ...SAMPLE_ZIPS_BY_REGION.urban,
        ...SAMPLE_ZIPS_BY_REGION.urban,  // Double weight for urban
        ...WEIGHTED_ZIPS
      ];
      break;

    default:
      // Use default weighting
      break;
  }

  const randomEntry = pool[Math.floor(Math.random() * pool.length)];

  try {
    const locationData = await lookupZipCode(randomEntry.zip);
    locationData.district = randomEntry.district;
    console.log(`Generated location for ${policyArea}: ${locationData.city}, ${locationData.state}`);
    return locationData;
  } catch (error) {
    console.error('Location lookup failed, using fallback:', error.message);
    return { ...FALLBACK_LOCATION };
  }
}

/**
 * Get all available ZIP codes (for testing/debugging)
 * @returns {Array} Array of all ZIP entries
 */
export function getAllZipCodes() {
  return WEIGHTED_ZIPS;
}
