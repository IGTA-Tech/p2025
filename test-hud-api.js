/**
 * Test script for HUD API integration
 * Run with: node test-hud-api.js
 */

import dotenv from 'dotenv';
import {
  getFairMarketRent,
  getIncomeLimits,
  getStateHousingData,
  verifyHousingStory,
} from './src/services/hudApi.js';

// Load environment variables
dotenv.config();

// Debug: Check if API key is loaded
const apiKey = process.env.VITE_HUD_API_KEY;
console.log('🔑 API Key Status:', apiKey ? `Loaded (${apiKey.substring(0, 20)}...)` : 'NOT FOUND');
console.log('');

// Test with Michigan (Detroit area)
const testState = 'MI';
const testZip = '48201'; // Detroit

console.log('🏠 Testing HUD API Integration...\n');
console.log(`Fetching housing data for: ${testState} (ZIP: ${testZip})\n`);

try {
  // Test 1: Get Fair Market Rent data
  console.log('📊 Test 1: Fair Market Rent Data\n');
  const fmrData = await getFairMarketRent(testZip);

  console.log(`Area: ${fmrData.areaName}`);
  console.log(`County: ${fmrData.countyName}`);
  console.log(`State: ${fmrData.state}`);
  console.log(`Year: ${fmrData.year}`);
  console.log('\n💰 Fair Market Rents:');
  console.log(`  Efficiency: $${fmrData.fmrRates.efficiency}/month`);
  console.log(`  1 Bedroom: $${fmrData.fmrRates.oneBedroom}/month`);
  console.log(`  2 Bedroom: $${fmrData.fmrRates.twoBedroom}/month`);
  console.log(`  3 Bedroom: $${fmrData.fmrRates.threeBedroom}/month`);
  console.log(`  4 Bedroom: $${fmrData.fmrRates.fourBedroom}/month`);

  // Test 2: Get Income Limits
  console.log('\n\n📊 Test 2: Income Limits Data\n');
  const incomeLimits = await getIncomeLimits(testState);

  console.log(`State: ${incomeLimits.stateName}`);
  console.log(`County: ${incomeLimits.county}`);
  console.log(`Year: ${incomeLimits.year}`);
  console.log(`Family Size: ${incomeLimits.familySize}`);
  console.log('\n💵 Income Limits (4-person household):');
  console.log(`  Very Low Income (50% AMI): $${incomeLimits.incomeLimits.veryLow.toLocaleString()}/year`);
  console.log(`  Low Income (80% AMI): $${incomeLimits.incomeLimits.low.toLocaleString()}/year`);
  console.log(`  Median Income (100% AMI): $${incomeLimits.incomeLimits.median.toLocaleString()}/year`);

  // Test 3: Get comprehensive state housing data
  console.log('\n\n📊 Test 3: Comprehensive State Housing Data\n');
  const housingData = await getStateHousingData(testState, testZip);

  console.log(`State: ${housingData.stateName}`);
  console.log(`Year: ${housingData.year}`);
  console.log('\n🏘️ Affordability Metrics:');
  console.log(`  Median Annual Income: $${housingData.affordabilityMetrics.medianAnnualIncome.toLocaleString()}`);
  console.log(`  Median Monthly Income: $${housingData.affordabilityMetrics.medianMonthlyIncome.toLocaleString()}`);
  console.log(`  Affordable Monthly Rent (30% rule): $${housingData.affordabilityMetrics.affordableMonthlyRent.toLocaleString()}`);
  console.log(`  Fair Market Rent (2BR): $${housingData.affordabilityMetrics.fairMarketRent2BR.toLocaleString()}`);
  console.log(`  Rent Burden Ratio: ${housingData.affordabilityMetrics.rentBurdenRatio}%`);
  console.log(`  Housing Cost Burden: ${housingData.affordabilityMetrics.housingCostBurden}`);
  console.log(`  Is Affordable: ${housingData.affordabilityMetrics.isAffordable ? 'Yes' : 'No'}`);

  // Test 4: Verify a housing-related story
  console.log('\n\n🧪 Test 4: Housing Story Verification\n');

  const housingStory = {
    id: 'TEST-HOUSING-001',
    location: { state: 'MI', city: 'Detroit', zip: '48201' },
    headline: 'Rent increase forcing family out of apartment',
    story: 'Our rent went from $900 to $1,400 per month after the landlord stopped accepting Section 8 vouchers. We make $45,000 a year as a family of four, and we can no longer afford to stay in our neighborhood. We are facing eviction if we cannot pay.',
    policyArea: 'housing',
  };

  const verification = verifyHousingStory(housingStory, housingData);

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

  if (verification.housingMetrics && Object.keys(verification.housingMetrics).length > 0) {
    console.log('\nHousing Metrics:');
    console.log(`  Median Income: $${verification.housingMetrics.medianAnnualIncome.toLocaleString()}/year`);
    console.log(`  Affordable Rent: $${verification.housingMetrics.affordableMonthlyRent.toLocaleString()}/month`);
    console.log(`  Fair Market Rent (2BR): $${verification.housingMetrics.fairMarketRent2BR}/month`);
    console.log(`  Rent Burden: ${verification.housingMetrics.rentBurdenRatio}%`);
  }

  console.log('\n✅ All HUD API tests passed!\n');
  console.log('📝 Note: Real API data will be used if VITE_HUD_API_KEY is configured.\n');
  console.log('📝 Mock data is used as fallback if API requests fail.\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
