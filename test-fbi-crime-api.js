/**
 * Test script for FBI Crime Data Explorer API integration
 * Run with: node test-fbi-crime-api.js
 */

import dotenv from 'dotenv';
import {
  getCrimeDataByState,
  getCrimeTrends,
  getBaselineComparison,
  verifyCrimeStory,
} from './src/services/fbiCrimeApi.js';

// Load environment variables
dotenv.config();

console.log('🚔 Testing FBI Crime Data Explorer API Integration...\n');
console.log('✅ No API key required - publicly accessible API\n');
console.log('⚠️  Note: Automatic retry with exponential backoff (2s, 4s, 8s)\n');

try {
  // Test 1: Get crime data for a specific state (Texas)
  console.log('📊 Test 1: Crime Data for Texas (2023)\n');
  const texasCrime = await getCrimeDataByState('TX', 2023);

  if (!texasCrime.error) {
    console.log(`State: ${texasCrime.state}`);
    console.log(`Year: ${texasCrime.year}`);
    console.log(`Source: ${texasCrime.source}`);
    console.log(`Data Available: ${texasCrime.data ? 'Yes' : 'No'}`);

    if (texasCrime.data) {
      console.log('\n🔍 Sample Data:');
      console.log(JSON.stringify(texasCrime.data, null, 2).substring(0, 500) + '...');
    }
  } else {
    console.log(`⚠️  ${texasCrime.errorMessage}`);
  }

  // Test 2: Get crime data for California
  console.log('\n\n📊 Test 2: Crime Data for California (2023)\n');
  const californiaCrime = await getCrimeDataByState('CA', 2023);

  if (!californiaCrime.error) {
    console.log(`State: ${californiaCrime.state}`);
    console.log(`Year: ${californiaCrime.year}`);
    console.log(`Source: ${californiaCrime.source}`);
    console.log(`Data Available: ${californiaCrime.data ? 'Yes' : 'No'}`);
  } else {
    console.log(`⚠️  ${californiaCrime.errorMessage}`);
  }

  // Test 3: Get crime trends over multiple years
  console.log('\n\n📊 Test 3: Crime Trends for New York (2020-2023)\n');
  const nyTrends = await getCrimeTrends('NY', 2020, 2023);

  if (!nyTrends.error) {
    console.log(`State: ${nyTrends.state}`);
    console.log(`Period: ${nyTrends.startYear} - ${nyTrends.endYear}`);
    console.log(`Years Available: ${nyTrends.yearsAvailable}`);
    console.log(`Source: ${nyTrends.source}`);

    if (nyTrends.trendData && nyTrends.trendData.length > 0) {
      console.log('\n📈 Trend Data Summary:');
      nyTrends.trendData.forEach((yearData) => {
        console.log(`  - ${yearData.year}: Data ${yearData.data ? 'Available' : 'Unavailable'}`);
      });
    }
  } else {
    console.log(`⚠️  ${nyTrends.errorMessage}`);
  }

  // Test 4: Get baseline comparison (2022 vs 2023)
  console.log('\n\n📊 Test 4: Baseline Comparison for Florida (2022 vs 2023)\n');
  const floridaComparison = await getBaselineComparison('FL', 2022, 2023);

  console.log(`Status: ${floridaComparison.status || 'error'}`);
  console.log(`State: ${floridaComparison.state}`);

  if (floridaComparison.status === 'complete') {
    console.log(`Baseline Year: ${floridaComparison.baselineYear}`);
    console.log(`Current Year: ${floridaComparison.currentYear}`);
    console.log(`Source: ${floridaComparison.source}`);

    if (floridaComparison.changes) {
      console.log('\n📊 Changes:');
      Object.entries(floridaComparison.changes).forEach(([key, value]) => {
        console.log(`  ${key}: ${value.toFixed(2)}%`);
      });
    }
  } else if (floridaComparison.status === 'partial') {
    console.log(`Message: ${floridaComparison.message}`);
  } else {
    console.log(`⚠️  ${floridaComparison.errorMessage || 'Comparison failed'}`);
  }

  // Test 5: Verify a crime-related story
  console.log('\n\n🧪 Test 5: Crime Story Verification\n');

  const crimeStory = {
    id: 'TEST-CRIME-001',
    location: { state: 'TX', city: 'Houston' },
    headline: 'Rising violent crime threatens neighborhood safety',
    story: 'Our neighborhood has experienced a significant increase in violent crime over the past year. Robberies and assaults have become more frequent, and residents feel unsafe walking at night. Local police seem overwhelmed and response times have increased.',
    policyArea: 'public_safety',
  };

  const verification = verifyCrimeStory(crimeStory, texasCrime);

  console.log('Verification Results:');
  console.log(`✓ Verified: ${verification.verified}`);
  console.log(`✓ Confidence Score: ${verification.confidence}%`);
  if (verification.flags.length > 0) {
    console.log(`✓ Flags: ${verification.flags.join(', ')}`);
  }
  console.log('\nInsights:');
  verification.insights.forEach((insight, i) => {
    console.log(`  ${i + 1}. [${insight.type}] ${insight.message}`);
  });

  if (verification.crimeMetrics && Object.keys(verification.crimeMetrics).length > 0) {
    console.log('\nCrime Metrics:');
    Object.entries(verification.crimeMetrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }

  // Test 6: Verify a property crime story
  console.log('\n\n🧪 Test 6: Property Crime Story Verification\n');

  const propertyStory = {
    id: 'TEST-CRIME-002',
    location: { state: 'CA', city: 'Los Angeles' },
    headline: 'Burglaries declining in our community',
    story: 'Thanks to improved neighborhood watch programs and better police patrols, we have seen a significant decrease in property crimes and burglaries in our area over the past two years. Theft rates have fallen and residents feel more secure.',
    policyArea: 'public_safety',
  };

  const propertyVerification = verifyCrimeStory(propertyStory, californiaCrime);

  console.log('Verification Results:');
  console.log(`✓ Verified: ${propertyVerification.verified}`);
  console.log(`✓ Confidence Score: ${propertyVerification.confidence}%`);
  if (propertyVerification.flags.length > 0) {
    console.log(`✓ Flags: ${propertyVerification.flags.join(', ')}`);
  }
  console.log('\nInsights:');
  propertyVerification.insights.forEach((insight, i) => {
    console.log(`  ${i + 1}. [${insight.type}] ${insight.message}`);
  });

  console.log('\n✅ All FBI Crime Data API tests completed!\n');
  console.log('📝 Note: FBI Crime Data Explorer API is completely open - no authentication required.\n');
  console.log('📝 Automatic retry with exponential backoff (2s, 4s, 8s) - max 3 retries.\n');
  console.log('📝 30-second timeout per request.\n');
  console.log('📝 Data source: https://api.usa.gov/crime/fbi/cde\n');
  console.log('📝 Historical data available back to 1995.\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
