/**
 * Story Verification Service
 *
 * Integrates multiple data sources to verify citizen story claims:
 * - Census API: demographic and economic data
 * - EIA API: energy costs and consumption
 * - NCDC API: climate and weather events
 * - HUD API: housing costs and affordability
 * - DOT API: transportation and infrastructure
 * - FEMA API: disasters and emergency assistance
 */

import { getStateEnergyData, verifyEnergyStory } from './eiaApi.js';
import { getStateClimateData, verifyClimateStory } from './ncdcApi.js';
import { getStateHousingData, verifyHousingStory } from './hudApi.js';
import { getStateInfrastructureData, verifyInfrastructureStory } from './dotApi.js';
import { getStateEmergencyData, verifyEmergencyStory } from './femaApi.js';

/**
 * Verify a story using appropriate data sources based on policy area
 * @param {Object} story - The citizen story to verify
 * @returns {Promise<Object>} Verification results with data context
 */
export async function verifyStory(story) {
  const verification = {
    storyId: story.id,
    policyArea: story.policyArea,
    verified: false,
    confidence: 0,
    dataSource: 'none',
    insights: [],
    contextData: null,
    flags: [],
  };

  try {
    const stateCode = story.location?.state;

    if (!stateCode) {
      verification.insights.push({
        type: 'missing_location',
        message: 'Story location not specified - unable to verify with regional data',
      });
      return verification;
    }

    // Route to appropriate verification based on policy area
    switch (story.policyArea) {
      case 'energy':
      case 'environment': {
        // Use EIA for energy-related stories
        try {
          const energyData = await getStateEnergyData(stateCode);
          const energyVerification = verifyEnergyStory(story, energyData);

          verification.verified = energyVerification.verified;
          verification.confidence = energyVerification.confidence;
          verification.dataSource = 'EIA';
          verification.insights = energyVerification.insights;
          verification.contextData = energyData;
          verification.flags = energyVerification.flags || [];
        } catch (error) {
          console.error('Energy verification failed:', error);
          verification.insights.push({
            type: 'verification_error',
            message: 'Unable to verify energy data - using general analysis',
          });
        }

        // Also check climate data for environment stories
        if (story.policyArea === 'environment') {
          try {
            const climateData = await getStateClimateData(stateCode, new Date().getFullYear());
            const climateVerification = verifyClimateStory(story, climateData);

            // Merge climate insights
            verification.insights.push(...climateVerification.insights);
            verification.confidence = Math.max(verification.confidence, climateVerification.confidence);
            verification.dataSource = verification.dataSource === 'EIA' ? 'EIA + NCDC' : 'NCDC';
          } catch (error) {
            console.error('Climate verification failed:', error);
          }
        }
        break;
      }

      case 'housing': {
        // Use HUD for housing-related stories
        try {
          const zip = story.location?.zip || null;
          const housingData = await getStateHousingData(stateCode, zip);
          const housingVerification = verifyHousingStory(story, housingData);

          verification.verified = housingVerification.verified;
          verification.confidence = housingVerification.confidence;
          verification.dataSource = 'HUD';
          verification.insights = housingVerification.insights;
          verification.contextData = housingData;
          verification.flags = housingVerification.flags || [];
        } catch (error) {
          console.error('Housing verification failed:', error);
          verification.insights.push({
            type: 'verification_error',
            message: 'Unable to verify housing data - using general analysis',
          });
        }
        break;
      }

      case 'infrastructure': {
        // Use DOT for infrastructure stories (bridges, roads, transit)
        try {
          const infrastructureData = await getStateInfrastructureData(stateCode);
          const infraVerification = verifyInfrastructureStory(story, infrastructureData);

          verification.verified = infraVerification.verified;
          verification.confidence = infraVerification.confidence;
          verification.dataSource = 'DOT';
          verification.insights = infraVerification.insights;
          verification.contextData = infrastructureData;
          verification.flags = infraVerification.flags || [];
        } catch (error) {
          console.error('Infrastructure verification failed:', error);
          verification.insights.push({
            type: 'verification_error',
            message: 'Unable to verify infrastructure data - using general analysis',
          });
        }

        // Also use climate data for infrastructure stories (floods, weather damage, etc.)
        try {
          const climateData = await getStateClimateData(stateCode, new Date().getFullYear());
          const climateVerification = verifyClimateStory(story, climateData);

          // Merge climate insights
          verification.insights.push(...climateVerification.insights);
          verification.confidence = Math.max(verification.confidence, climateVerification.confidence);
          verification.dataSource = verification.dataSource === 'DOT' ? 'DOT + NCDC' : 'NCDC';
        } catch (error) {
          console.error('Climate verification failed:', error);
        }
        break;
      }

      case 'education':
      case 'healthcare':
      case 'employment':
      case 'immigration':
      case 'justice':
      default: {
        // For other policy areas, provide general verification
        verification.verified = true;
        verification.confidence = 50;
        verification.dataSource = 'general';
        verification.insights.push({
          type: 'general_verification',
          message: `Story categorized as ${story.policyArea}. Specific data verification not yet available for this policy area.`,
        });
        break;
      }
    }

    // Add FEMA verification for disaster-related stories (cross-cutting)
    const storyText = (story.headline + ' ' + story.story).toLowerCase();
    const isDisasterRelated =
      storyText.includes('disaster') ||
      storyText.includes('emergency') ||
      storyText.includes('fema') ||
      storyText.includes('flood') ||
      storyText.includes('hurricane') ||
      storyText.includes('tornado') ||
      storyText.includes('wildfire') ||
      storyText.includes('earthquake') ||
      storyText.includes('storm') ||
      storyText.includes('evacuat');

    if (isDisasterRelated) {
      try {
        const emergencyData = await getStateEmergencyData(stateCode);
        const emergencyVerification = verifyEmergencyStory(story, emergencyData);

        // Add FEMA insights to existing verification
        verification.insights.push(...emergencyVerification.insights);
        verification.confidence = Math.max(verification.confidence, emergencyVerification.confidence);
        verification.dataSource = verification.dataSource === 'general' ? 'FEMA' : verification.dataSource + ' + FEMA';
        verification.flags = [...(verification.flags || []), ...(emergencyVerification.flags || [])];
      } catch (error) {
        console.error('FEMA verification failed:', error);
      }
    }

    return verification;
  } catch (error) {
    console.error('Story verification error:', error);
    verification.insights.push({
      type: 'system_error',
      message: 'Verification system encountered an error',
    });
    return verification;
  }
}

/**
 * Get contextual data for a story location (without verification)
 * Useful for displaying regional context in the UI
 * @param {string} stateCode - Two-letter state code
 * @param {string} policyArea - Policy area to get data for
 * @param {string} zip - Optional ZIP code for more specific data
 * @returns {Promise<Object>} Contextual data package
 */
export async function getStoryContext(stateCode, policyArea, zip = null) {
  const context = {
    state: stateCode,
    policyArea,
    data: {},
    available: [],
  };

  try {
    // Fetch relevant data based on policy area
    const dataPromises = [];

    if (policyArea === 'housing') {
      dataPromises.push(
        getStateHousingData(stateCode, zip)
          .then(data => {
            context.data.housing = data;
            context.available.push('housing');
          })
          .catch(err => console.error('Housing data fetch failed:', err))
      );
    }

    if (policyArea === 'energy' || policyArea === 'environment') {
      dataPromises.push(
        getStateEnergyData(stateCode)
          .then(data => {
            context.data.energy = data;
            context.available.push('energy');
          })
          .catch(err => console.error('Energy data fetch failed:', err))
      );
    }

    if (policyArea === 'environment' || policyArea === 'infrastructure') {
      dataPromises.push(
        getStateClimateData(stateCode, new Date().getFullYear())
          .then(data => {
            context.data.climate = data;
            context.available.push('climate');
          })
          .catch(err => console.error('Climate data fetch failed:', err))
      );
    }

    if (policyArea === 'infrastructure') {
      dataPromises.push(
        getStateInfrastructureData(stateCode)
          .then(data => {
            context.data.infrastructure = data;
            context.available.push('infrastructure');
          })
          .catch(err => console.error('Infrastructure data fetch failed:', err))
      );
    }

    await Promise.all(dataPromises);

    return context;
  } catch (error) {
    console.error('Error fetching story context:', error);
    return context;
  }
}

export default {
  verifyStory,
  getStoryContext,
};
