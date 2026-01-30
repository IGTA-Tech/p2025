// Map utility functions for pain point data aggregation and geocoding

// Sample ZIP code coordinates - in production, use a complete ZIP code database
const ZIP_COORDINATES = {
  '48197': [-83.6130, 42.2411], // Ypsilanti, MI
  '75801': [-95.5506, 30.7235], // Huntsville, TX
  '22031': [-77.3963, 38.8462], // Fairfax, VA
  '10001': [-73.9967, 40.7506], // New York, NY
  '90210': [-118.4065, 34.1030], // Beverly Hills, CA
  '60601': [-87.6298, 41.8781], // Chicago, IL
  '02108': [-71.0589, 42.3601], // Boston, MA
  '33101': [-80.1918, 25.7617], // Miami, FL
  '98101': [-122.3321, 47.6062], // Seattle, WA
  '30301': [-84.3880, 33.7490], // Atlanta, GA
};

/**
 * Aggregate stories by ZIP code
 * @param {Array} stories - Array of story objects from Supabase
 * @returns {Object} Aggregated data by ZIP code
 */
export function aggregateStoriesByZipCode(stories) {
  if (!stories || stories.length === 0) return {};

  const aggregated = {};

  stories.forEach(story => {
    const zipCode = story.location?.zip || story.zip_code;
    if (!zipCode) return;

    if (!aggregated[zipCode]) {
      aggregated[zipCode] = {
        zip_code: zipCode,
        story_count: 0,
        policy_areas: {},
        recent_stories: [],
        coordinates: ZIP_COORDINATES[zipCode] || getZipCoordinates(zipCode),
        city: story.location?.city || 'Unknown',
        state: story.location?.state || 'Unknown'
      };
    }

    aggregated[zipCode].story_count++;

    // Track policy areas
    const policyArea = story.policyArea || story.policy_area;
    if (policyArea) {
      aggregated[zipCode].policy_areas[policyArea] =
        (aggregated[zipCode].policy_areas[policyArea] || 0) + 1;
    }

    // Keep only last 3 stories
    if (aggregated[zipCode].recent_stories.length < 3) {
      aggregated[zipCode].recent_stories.push({
        headline: story.headline,
        story: story.story || story.story_text,
        severity: story.severity,
        date: story.submittedAt || story.created_at
      });
    }
  });

  return aggregated;
}

/**
 * Get coordinates for a ZIP code
 * @param {string} zipCode
 * @returns {Array} [longitude, latitude] or null
 */
export function getZipCoordinates(zipCode) {
  // Return from lookup table or null
  return ZIP_COORDINATES[zipCode] || null;
}

/**
 * Convert aggregated data to GeoJSON format for MapLibre
 * @param {Object} aggregatedData - Aggregated ZIP code data
 * @returns {Object} GeoJSON FeatureCollection
 */
export function convertToGeoJSON(aggregatedData) {
  const features = [];

  Object.entries(aggregatedData).forEach(([zipCode, data]) => {
    if (!data.coordinates) return;

    // Get dominant policy area
    let dominantPolicyArea = 'unknown';
    let maxCount = 0;
    Object.entries(data.policy_areas).forEach(([area, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantPolicyArea = area;
      }
    });

    // Create polygon around point (simplified - real implementation would use ZIP boundary data)
    const [lng, lat] = data.coordinates;
    const offset = 0.05; // Approximately 3 miles

    features.push({
      type: 'Feature',
      properties: {
        zip_code: zipCode,
        story_count: data.story_count,
        dominant_policy_area: dominantPolicyArea,
        city: data.city,
        state: data.state,
        recent_stories: data.recent_stories,
        policy_areas: data.policy_areas
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [lng - offset, lat - offset],
          [lng + offset, lat - offset],
          [lng + offset, lat + offset],
          [lng - offset, lat + offset],
          [lng - offset, lat - offset]
        ]]
      }
    });
  });

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Get color based on story count
 * @param {number} count - Number of stories
 * @returns {string} Hex color code
 */
export function getColorByCount(count) {
  if (count <= 3) return '#10b981'; // Green - minor activity
  if (count <= 7) return '#fbbf24'; // Yellow - moderate activity
  return '#ef4444'; // Red - high activity/critical
}

/**
 * Get extrusion height based on story count
 * @param {number} count - Number of stories
 * @returns {number} Height in meters
 */
export function getExtrusionHeight(count) {
  return count * 500; // Each story = 500m height
}

/**
 * Filter stories by date range
 * @param {Array} stories - Array of stories
 * @param {string} range - 'last7days', 'last30days', 'last90days', or custom
 * @param {Date} startDate - Optional custom start date
 * @param {Date} endDate - Optional custom end date
 * @returns {Array} Filtered stories
 */
export function filterStoriesByDate(stories, range, startDate = null, endDate = null) {
  const now = new Date();
  let filterStartDate;

  switch (range) {
    case 'last7days':
      filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last30days':
      filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last90days':
      filterStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      filterStartDate = startDate;
      break;
    default:
      return stories;
  }

  return stories.filter(story => {
    const storyDate = new Date(story.submittedAt || story.created_at);
    if (range === 'custom' && endDate) {
      return storyDate >= filterStartDate && storyDate <= endDate;
    }
    return storyDate >= filterStartDate;
  });
}

/**
 * Get top policy areas from aggregated data
 * @param {Object} aggregatedData - Aggregated ZIP code data
 * @returns {Array} Array of {area, count} sorted by count
 */
export function getTopPolicyAreas(aggregatedData) {
  const policyTotals = {};

  Object.values(aggregatedData).forEach(data => {
    Object.entries(data.policy_areas).forEach(([area, count]) => {
      policyTotals[area] = (policyTotals[area] || 0) + count;
    });
  });

  return Object.entries(policyTotals)
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get most active regions
 * @param {Object} aggregatedData - Aggregated ZIP code data
 * @param {number} limit - Number of regions to return
 * @returns {Array} Array of top regions
 */
export function getMostActiveRegions(aggregatedData, limit = 5) {
  return Object.values(aggregatedData)
    .sort((a, b) => b.story_count - a.story_count)
    .slice(0, limit)
    .map(data => ({
      zip_code: data.zip_code,
      city: data.city,
      state: data.state,
      story_count: data.story_count
    }));
}
