/**
 * Test script for NCDC/NOAA Climate Data API
 *
 * Run with: node test-ncdc-api.js
 */

import {
  getStateClimateData,
  getExtremeWeatherEvents,
  getClimateComparison,
  verifyClimateStory,
  getLocationClimatePackage,
} from './src/services/ncdcApi.js';

// Sample climate-related story
const sampleStory = {
  headline: "Record Heat Wave Impacting Michigan Residents",
  story: "This summer has been brutal with temperatures consistently over 90°F. Our elderly neighbors are struggling with cooling costs and health issues. The extreme heat is also causing drought conditions affecting local farmers.",
  location: {
    state: 'MI',
    city: 'Ann Arbor',
    zip: '48104',
  },
  author: {
    name: 'Sarah Johnson',
  },
};

async function testNCDCAPI() {
  console.log('='.repeat(80));
  console.log('NCDC/NOAA Climate Data API Test');
  console.log('='.repeat(80));
  console.log();

  try {
    // Test 1: Get State Climate Data
    console.log('Test 1: Get State Climate Data for Michigan (2024)');
    console.log('-'.repeat(80));
    const climateData = await getStateClimateData('MI', 2024);
    console.log('State:', climateData.stateName);
    console.log('Year:', climateData.year);
    console.log('Temperature:');
    console.log(`  Annual Average: ${climateData.temperature.annual}°F`);
    console.log(`  Days Above 90°F: ${climateData.temperature.daysAbove90}`);
    console.log(`  Days Below 32°F: ${climateData.temperature.daysBelow32}`);
    console.log('Precipitation:');
    console.log(`  Annual: ${climateData.precipitation.annual} inches`);
    console.log('Severe Weather:');
    console.log(`  Events per year: ${climateData.severeWeather.events}`);
    console.log(`  Types: ${climateData.severeWeather.types.join(', ')}`);
    console.log('Trends:');
    console.log(`  Temperature: ${climateData.trends.temperatureTrend}`);
    console.log(`  Precipitation: ${climateData.trends.precipitationTrend}`);
    console.log();

    // Test 2: Get Extreme Weather Events
    console.log('Test 2: Get Extreme Weather Events for Michigan (2024)');
    console.log('-'.repeat(80));
    const extremeEvents = await getExtremeWeatherEvents('MI', 2024);
    console.log('State:', extremeEvents.stateName);
    console.log('Year:', extremeEvents.year);
    console.log('Total Events:', extremeEvents.totalEvents);
    console.log('Events:');
    extremeEvents.events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.type} (${event.severity})`);
      console.log(`     Date: ${event.date}`);
      console.log(`     Description: ${event.description}`);
      console.log(`     Affected Areas: ${event.affectedAreas}`);
    });
    console.log();

    // Test 3: Get Climate Comparison (Current vs Historical)
    console.log('Test 3: Get Climate Comparison for Michigan');
    console.log('-'.repeat(80));
    const comparison = await getClimateComparison('MI');
    console.log('Period:', comparison.period);
    console.log('Temperature:');
    console.log(`  Current: ${comparison.temperature.current}°F`);
    console.log(`  Historical: ${comparison.temperature.historical}°F`);
    console.log(`  Change: ${comparison.temperature.change}°F (${comparison.temperature.changeDirection})`);
    console.log('Precipitation:');
    console.log(`  Current: ${comparison.precipitation.current} inches`);
    console.log(`  Historical: ${comparison.precipitation.historical.toFixed(1)} inches`);
    console.log(`  Change: ${comparison.precipitation.change}% (${comparison.precipitation.changeDirection})`);
    console.log('Significance:', comparison.significance);
    console.log();

    // Test 4: Verify Climate Story
    console.log('Test 4: Verify Climate-Related Story');
    console.log('-'.repeat(80));
    console.log('Story:', sampleStory.headline);
    console.log('Location:', `${sampleStory.location.city}, ${sampleStory.location.state}`);
    console.log();
    const verification = verifyClimateStory(sampleStory, climateData);
    console.log('Verification Results:');
    console.log(`  Confidence: ${verification.confidence}%`);
    console.log(`  Climate Metrics:`);
    if (verification.climateMetrics.avgTemp) {
      console.log(`    Average Temperature: ${verification.climateMetrics.avgTemp}°F`);
      console.log(`    Average Precipitation: ${verification.climateMetrics.avgPrecip} inches`);
      console.log(`    Severe Events/Year: ${verification.climateMetrics.severeEvents}`);
    }
    console.log('  Insights:');
    verification.insights.forEach((insight, index) => {
      console.log(`    ${index + 1}. [${insight.type}] ${insight.message}`);
    });
    console.log();

    // Test 5: Get Complete Location Climate Package
    console.log('Test 5: Get Complete Location Climate Package');
    console.log('-'.repeat(80));
    const climatePackage = await getLocationClimatePackage('MI');
    console.log('State:', climatePackage.stateName);
    console.log('Summary:');
    console.log(`  Temperature Anomaly: ${climatePackage.summary.temperatureAnomaly}°F`);
    console.log(`  Precipitation Anomaly: ${climatePackage.summary.precipitationAnomaly}%`);
    console.log(`  Severe Events/Year: ${climatePackage.summary.severeEventsPerYear}`);
    console.log(`  Trend Significance: ${climatePackage.summary.trendSignificance}`);
    console.log();

    console.log('='.repeat(80));
    console.log('All NCDC API tests completed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error during NCDC API test:', error);
    process.exit(1);
  }
}

// Run the tests
testNCDCAPI();
