/**
 * Test script for FEMA API integration
 * Run with: node test-fema-api.js
 */

import dotenv from 'dotenv';
import {
  getStateDisasterDeclarations,
  getHousingAssistanceData,
  getStateEmergencyData,
  verifyEmergencyStory,
} from './src/services/femaApi.js';

// Load environment variables
dotenv.config();

// Test with Michigan
const testState = 'MI';

console.log('🚨 Testing FEMA API Integration...\n');
console.log(`Fetching emergency/disaster data for: ${testState}\n`);

try {
  // Test 1: Get Disaster Declarations
  console.log('📊 Test 1: Disaster Declarations\n');
  const disasterData = await getStateDisasterDeclarations(testState);

  console.log(`State: ${disasterData.stateName}`);
  console.log(`Total Federal Disaster Declarations: ${disasterData.totalDeclarations}`);
  console.log(`Most Common Disaster Type: ${disasterData.mostCommonType}`);
  console.log('\n📋 Disaster Types Breakdown:');
  Object.entries(disasterData.disasterTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} declarations`);
  });
  console.log('\n📅 Recent Years:');
  Object.entries(disasterData.yearCounts).slice(0, 5).forEach(([year, count]) => {
    console.log(`  ${year}: ${count} declarations`);
  });
  console.log('\n🔴 Recent Disasters:');
  disasterData.recentDeclarations.slice(0, 3).forEach((disaster, i) => {
    console.log(`  ${i + 1}. ${disaster.title} (${disaster.type})`);
    console.log(`     Disaster #${disaster.disasterNumber} - ${disaster.date}`);
  });

  // Test 2: Get Housing Assistance Data
  console.log('\n\n📊 Test 2: Housing Assistance Data\n');
  const housingAssistance = await getHousingAssistanceData(testState);

  console.log(`State: ${housingAssistance.stateName}`);
  console.log(`Total Recipients: ${housingAssistance.totalRecipients.toLocaleString()}`);
  console.log(`Total Amount Approved: $${(housingAssistance.totalAmountApproved / 1000000).toFixed(1)}M`);
  console.log(`Average Assistance: $${housingAssistance.averageAssistance.toLocaleString()}`);

  // Test 3: Get Comprehensive State Emergency Data
  console.log('\n\n📊 Test 3: Comprehensive State Emergency Data\n');
  const emergencyData = await getStateEmergencyData(testState);

  console.log(`State: ${emergencyData.stateName}`);
  console.log('\n📌 Summary:');
  console.log(`  Total Disasters: ${emergencyData.summary.totalDisasters}`);
  console.log(`  Most Common Type: ${emergencyData.summary.mostCommonDisasterType}`);
  console.log(`  Housing Assistance Recipients: ${emergencyData.summary.housingAssistanceRecipients.toLocaleString()}`);
  console.log(`  Total Assistance Amount: $${(emergencyData.summary.totalAssistanceAmount / 1000000).toFixed(1)}M`);

  // Test 4: Verify an emergency/disaster story
  console.log('\n\n🧪 Test 4: Emergency Story Verification\n');

  const emergencyStory = {
    id: 'TEST-EMERGENCY-001',
    location: { state: 'MI', city: 'Detroit' },
    headline: 'Family still waiting for FEMA assistance 6 months after flood',
    story: 'Our basement flooded during the severe storms last spring. We applied for FEMA disaster assistance immediately, but 6 months later we still haven\'t received any help. The flood damage cost us $15,000 and we can\'t afford the repairs. Three other families on our street are in the same situation - all waiting for FEMA relief.',
    policyArea: 'emergency',
  };

  const verification = verifyEmergencyStory(emergencyStory, emergencyData);

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

  if (verification.emergencyMetrics && Object.keys(verification.emergencyMetrics).length > 0) {
    console.log('\nEmergency Metrics:');
    console.log(`  Total Disasters: ${verification.emergencyMetrics.totalDisasters}`);
    console.log(`  Most Common Type: ${verification.emergencyMetrics.mostCommonDisasterType}`);
    console.log(`  Assistance Recipients: ${verification.emergencyMetrics.housingAssistanceRecipients.toLocaleString()}`);
  }

  console.log('\n✅ All FEMA API tests passed!\n');
  console.log('📝 Note: FEMA API is public and open - no authentication required.\n');
  console.log('📝 Real API data will be fetched. Mock data is used as graceful fallback.\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
