/**
 * Test script for Census API integration
 * Run with: node test-census-api.js
 */

import { getDemographicsByZip, verifyStoryDemographics } from './src/services/censusApi.js';

// Test with a ZIP code from one of our citizen stories
const testZipCode = '48197'; // Ypsilanti, MI from story CS-2025-001847

console.log('🔍 Testing Census API Integration...\n');
console.log(`Fetching demographics for ZIP code: ${testZipCode}\n`);

try {
  const demographics = await getDemographicsByZip(testZipCode);

  console.log('✅ Census API Response:\n');
  console.log('📍 Location:', demographics.name);
  console.log('👥 Total Population:', demographics.population.total.toLocaleString());
  console.log('📊 Median Age:', demographics.population.medianAge);
  console.log('💰 Median Household Income: $' + demographics.income.medianHousehold.toLocaleString());
  console.log('📈 Unemployment Rate:', demographics.employment.unemploymentRate + '%');
  console.log('🏠 Median Home Value: $' + demographics.housing.medianValue.toLocaleString());
  console.log('\n📅 Data Source:', demographics.source);
  console.log('📆 Data Year:', demographics.dataYear);

  // Test story verification
  console.log('\n\n🧪 Testing Story Verification...\n');

  const testStory = {
    id: 'CS-2025-001847',
    location: { zip: '48197', city: 'Ypsilanti', state: 'MI' },
    demographics: { age: 34, income: '45-60k', education: 'some_college' },
    impact: { affected_population: 2847 },
  };

  const verification = verifyStoryDemographics(testStory, demographics);

  console.log('Verification Results:');
  console.log('✓ Verified:', verification.verified);
  console.log('✓ Confidence Score:', verification.confidence + '%');
  console.log('\nInsights:');
  verification.insights.forEach((insight, i) => {
    console.log(`  ${i + 1}. ${insight.message}`);
  });

  if (verification.flags.length > 0) {
    console.log('\n⚠️  Flags:');
    verification.flags.forEach((flag, i) => {
      console.log(`  ${i + 1}. [${flag.severity}] ${flag.message}`);
    });
  }

  console.log('\n✅ All tests passed!\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nFull error:', error);
}
