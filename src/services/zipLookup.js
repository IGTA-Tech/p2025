/**
 * Zip Code Lookup Service
 * Uses the free Zippopotam.us API to get location details from zip code
 */

/**
 * Look up location details from a zip code
 * @param {string} zipCode - 5-digit US zip code
 * @returns {Promise<Object>} Location object with city, state, county
 */
export async function lookupZipCode(zipCode) {
  // Validate zip code format
  const cleanZip = String(zipCode).trim();
  if (!/^\d{5}$/.test(cleanZip)) {
    throw new Error('Invalid zip code format. Please provide a 5-digit zip code.');
  }

  try {
    // Use Zippopotam.us API (free, no key required)
    const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Zip code not found. Please check and try again.');
      }
      throw new Error('Unable to look up zip code at this time.');
    }

    const data = await response.json();

    // Extract location data
    const place = data.places[0];
    const state = place['state abbreviation'];
    const city = place['place name'];
    const county = place['county'] || null;

    // Note: Congressional district would require additional API
    // For now, we'll leave it null and could add later
    const district = null;

    return {
      zip: cleanZip,
      city: city,
      state: state,
      county: county,
      district: district,
    };

  } catch (error) {
    if (error.message.includes('zip code')) {
      throw error;
    }
    console.error('Zip lookup error:', error);
    throw new Error('Unable to verify zip code. Please try again.');
  }
}

/**
 * Extract zip code from text if present
 * @param {string} text - Text to search for zip code
 * @returns {string|null} - Found zip code or null
 */
export function extractZipCode(text) {
  // Match 5-digit zip codes (with word boundaries to avoid matching other numbers)
  const zipMatch = text.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : null;
}

export default {
  lookupZipCode,
  extractZipCode,
};
