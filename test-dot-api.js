/**
 * Test script for DOT API integration
 * Run with: node test-dot-api.js
 */

import dotenv from 'dotenv';
import {
  getStateInfrastructureData,
  getBridgeConditions,
  getTransitPerformance,
  verifyInfrastructureStory,
} from './src/services/dotApi.js';

// Load environment variables
dotenv.config();

// Debug: Check if API credentials are loaded
const accessToken = process.env.VITE_DOT_ACCESS_TOKEN;
const secretKey = process.env.VITE_DOT_SECRET_KEY;
console.log('🔑 Access Token Status:', accessToken ? `Loaded (${accessToken.substring(0, 10)}...)` : 'NOT FOUND');
console.log('🔑 Secret Key Status:', secretKey ? `Loaded (${secretKey.substring(0, 10)}...)` : 'NOT FOUND');
console.log('');

// Test with Michigan
const testState = 'MI';

console.log('🚗 Testing DOT API Integration...\n');
console.log(`Fetching transportation data for: ${testState}\n`);

try {
  // Test 1: Get State Infrastructure Data
  console.log('📊 Test 1: State Infrastructure Data\n');
  const infraData = await getStateInfrastructureData(testState);

  console.log(`State: ${infraData.stateName}`);
  console.log(`Year: ${infraData.year}`);
  console.log('\n🌉 Bridge Conditions:');
  console.log(`  Total Bridges: ${infraData.bridges.total.toLocaleString()}`);
  console.log(`  Structurally Deficient: ${infraData.bridges.structurallyDeficient} (${infraData.bridges.deficientPercentage}%)`);
  console.log(`  Average Age: ${infraData.bridges.averageAge} years`);
  console.log('\n🛣️  Road Conditions:');
  console.log(`  Average Condition: ${infraData.roads.averageCondition}`);
  console.log(`  Poor Condition: ${infraData.roads.poorPercentage}%`);
  console.log(`  Total Miles: ${infraData.roads.totalMiles.toLocaleString()}`);
  console.log('\n🚌 Public Transit:');
  console.log(`  Active Systems: ${infraData.transit.systems}`);
  console.log(`  Annual Riders: ${infraData.transit.ridersPerYear.toLocaleString()}`);
  console.log(`  Daily Riders: ${infraData.transit.ridersPerDay.toLocaleString()}`);
  console.log('\n💰 Federal Funding:');
  console.log(`  Annual Funding: $${(infraData.funding.federalAnnual / 1000000).toFixed(0)}M`);
  console.log(`  Per Capita: $${infraData.funding.perCapita.toLocaleString()}`);

  // Test 2: Get Bridge Conditions
  console.log('\n\n📊 Test 2: Bridge Conditions\n');
  const bridgeData = await getBridgeConditions(testState);

  console.log(`State: ${bridgeData.stateName}`);
  console.log(`Total Bridges: ${bridgeData.totalBridges.toLocaleString()}`);
  console.log(`Structurally Deficient: ${bridgeData.structurallyDeficient.toLocaleString()}`);
  console.log(`Functionally Obsolete: ${bridgeData.functionallyObsolete.toLocaleString()}`);
  console.log(`Good Condition: ${bridgeData.goodCondition.toLocaleString()}`);
  console.log(`Average Age: ${bridgeData.averageAge} years`);

  // Test 3: Get Transit Performance
  console.log('\n\n📊 Test 3: Transit Performance\n');
  const transitData = await getTransitPerformance(testState);

  console.log(`State: ${transitData.stateName}`);
  console.log(`Transit Systems: ${transitData.transitSystems}`);
  console.log(`Annual Riders: ${transitData.annualRiders.toLocaleString()}`);
  console.log(`Daily Riders: ${transitData.dailyRiders.toLocaleString()}`);
  console.log(`On-Time Performance: ${transitData.onTimePerformance}%`);

  // Test 4: Verify an infrastructure story
  console.log('\n\n🧪 Test 4: Infrastructure Story Verification\n');

  const infraStory = {
    id: 'TEST-INFRA-001',
    location: { state: 'MI', city: 'Detroit' },
    headline: 'Crumbling bridge forces 30-minute detour for daily commute',
    story: 'The Main Street bridge has been closed for 6 months due to structural deficiencies. My daily commute to work increased from 15 minutes to 45 minutes. Federal infrastructure funding cuts delayed repairs indefinitely. Three other bridges in our county are also rated as structurally deficient.',
    policyArea: 'infrastructure',
  };

  const verification = verifyInfrastructureStory(infraStory, infraData);

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

  if (verification.infrastructureMetrics && Object.keys(verification.infrastructureMetrics).length > 0) {
    console.log('\nInfrastructure Metrics:');
    console.log(`  Total Bridges: ${verification.infrastructureMetrics.totalBridges.toLocaleString()}`);
    console.log(`  Deficient Bridges: ${verification.infrastructureMetrics.deficientBridges}`);
    console.log(`  Road Condition: ${verification.infrastructureMetrics.roadCondition}`);
    console.log(`  Transit Systems: ${verification.infrastructureMetrics.transitSystems}`);
  }

  console.log('\n✅ All DOT API tests passed!\n');
  console.log('📝 Note: Real API data will be used if VITE_DOT_ACCESS_TOKEN and VITE_DOT_SECRET_KEY are configured.\n');
  console.log('📝 Mock data is used as fallback if API requests fail.\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
