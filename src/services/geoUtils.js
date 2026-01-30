/**
 * Geographic Utilities for Distance Calculations
 * Provides functions for calculating distances between zip codes
 */

// Zip code coordinates cache (populated from Zippopotam.us API)
const zipCoordinatesCache = new Map();

/**
 * Haversine formula to calculate distance between two points on Earth
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in miles
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get coordinates for a zip code using Zippopotam.us API
 * @param {string} zipCode - 5-digit US zip code
 * @returns {Promise<{lat: number, lon: number}>} Coordinates
 */
export async function getZipCoordinates(zipCode) {
  const cleanZip = String(zipCode).trim();

  // Check cache first
  if (zipCoordinatesCache.has(cleanZip)) {
    return zipCoordinatesCache.get(cleanZip);
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);

    if (!response.ok) {
      throw new Error('Zip code not found');
    }

    const data = await response.json();
    const place = data.places[0];

    const coords = {
      lat: parseFloat(place.latitude),
      lon: parseFloat(place.longitude)
    };

    // Cache the result
    zipCoordinatesCache.set(cleanZip, coords);

    return coords;
  } catch (error) {
    console.error(`Failed to get coordinates for zip ${cleanZip}:`, error);
    throw error;
  }
}

/**
 * Calculate distance between two zip codes
 * @param {string} zip1 - First zip code
 * @param {string} zip2 - Second zip code
 * @returns {Promise<number>} Distance in miles
 */
export async function getDistanceBetweenZips(zip1, zip2) {
  const [coords1, coords2] = await Promise.all([
    getZipCoordinates(zip1),
    getZipCoordinates(zip2)
  ]);

  return calculateDistance(coords1.lat, coords1.lon, coords2.lat, coords2.lon);
}

/**
 * Filter stories to only those within a certain radius of a zip code
 * @param {Array} stories - Array of story objects with location.zip
 * @param {string} centerZip - Center zip code to measure from
 * @param {number} radiusMiles - Maximum distance in miles (default 50)
 * @returns {Promise<Array>} Stories within radius, sorted by distance
 */
export async function filterStoriesByDistance(stories, centerZip, radiusMiles = 50) {
  try {
    const centerCoords = await getZipCoordinates(centerZip);

    // Get unique zip codes from stories
    const uniqueZips = [...new Set(stories.map(s => s.location?.zip).filter(Boolean))];

    // Batch fetch coordinates for all unique zips
    const zipCoordsMap = new Map();
    await Promise.all(
      uniqueZips.map(async (zip) => {
        try {
          const coords = await getZipCoordinates(zip);
          zipCoordsMap.set(zip, coords);
        } catch (error) {
          // Skip zips that fail to resolve
          console.warn(`Could not get coordinates for zip ${zip}`);
        }
      })
    );

    // Filter and calculate distances
    const storiesWithDistance = stories
      .filter(story => {
        const storyZip = story.location?.zip;
        return storyZip && zipCoordsMap.has(storyZip);
      })
      .map(story => {
        const storyCoords = zipCoordsMap.get(story.location.zip);
        const distance = calculateDistance(
          centerCoords.lat, centerCoords.lon,
          storyCoords.lat, storyCoords.lon
        );
        return { ...story, distance };
      })
      .filter(story => story.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);

    return storiesWithDistance;
  } catch (error) {
    console.error('Error filtering stories by distance:', error);
    return [];
  }
}

export default {
  calculateDistance,
  getZipCoordinates,
  getDistanceBetweenZips,
  filterStoriesByDistance
};
