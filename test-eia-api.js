/**
 * Test script for EIA API integration
 * Run with: node test-eia-api.js
 */

import {
  getStateEnergyData,
  verifyEnergyStory,
  getEnergyPriceTrends,
} from './src/services/eiaApi.js';

// Test with Michigan (from our education story)
const testState = 'MI';

console.log('🔋 Testing EIA API Integration...\n');
console.log(`Fetching energy data for: ${testState}\n`);

try {
  // Test 1: Get comprehensive state energy data
  console.log('📊 Test 1: State Energy Data\n');
  const energyData = await getStateEnergyData(testState);

  console.log(`State: ${energyData.stateName} (${energyData.state})`);
  console.log('\n💡 Electricity Prices:');
  console.log(`  Residential: ${energyData.electricity.prices.residential}¢/kWh`);
  console.log(`  Commercial: ${energyData.electricity.prices.commercial}¢/kWh`);
  console.log(`  Industrial: ${energyData.electricity.prices.industrial}¢/kWh`);

  console.log('\n🔥 Natural Gas Prices:');
  console.log(`  Residential: $${energyData.naturalGas.prices.residential}/Mcf`);
  console.log(`  Commercial: $${energyData.naturalGas.prices.commercial}/Mcf`);

  console.log('\n⛽ Gasoline:');
  console.log(`  Regular: $${energyData.gasoline.price}/gallon`);

  console.log('\n💰 Typical Household Costs:');
  console.log(`  Monthly Electricity: $${energyData.typicalHouseholdCosts.monthlyElectricity}`);
  console.log(`  Monthly Natural Gas: $${energyData.typicalHouseholdCosts.monthlyNaturalGas}`);
  console.log(`  Monthly Gasoline: $${energyData.typicalHouseholdCosts.monthlyGasoline}`);
  console.log(`  Total Monthly Energy: $${energyData.typicalHouseholdCosts.totalMonthlyEnergy}`);
  console.log(`  Annual Energy Costs: $${energyData.typicalHouseholdCosts.annualEnergy}`);

  // Test 2: Verify an energy-related story
  console.log('\n\n🧪 Test 2: Energy Story Verification\n');

  const energyStory = {
    id: 'TEST-ENERGY-001',
    location: { state: 'MI', city: 'Detroit' },
    headline: 'Utility bills increased by $150 after federal energy subsidies were cut',
    story: 'My monthly electric bill went from $120 to $270 after the federal Low Income Home Energy Assistance Program (LIHEAP) was cut. I can barely afford to keep my heat on in winter.',
    policyArea: 'energy',
  };

  const verification = verifyEnergyStory(energyStory, energyData);

  console.log('Verification Results:');
  console.log(`✓ Verified: ${verification.verified}`);
  console.log(`✓ Confidence Score: ${verification.confidence}%`);
  console.log('\nInsights:');
  verification.insights.forEach((insight, i) => {
    console.log(`  ${i + 1}. ${insight.message}`);
  });

  if (verification.energyMetrics && Object.keys(verification.energyMetrics).length > 0) {
    console.log('\nEnergy Metrics:');
    console.log(`  Monthly Energy Cost: $${verification.energyMetrics.totalMonthlyEnergy}`);
  }

  // Test 3: Get price trends
  console.log('\n\n📈 Test 3: Energy Price Trends\n');

  const trends = await getEnergyPriceTrends(testState, 'electricity');
  console.log(`${trends.stateName} Electricity Price Trend (2024):`);
  console.log(`Year-over-year change: ${trends.yearOverYearChange}%`);
  console.log('\nMonthly Prices:');
  trends.trend.slice(0, 6).forEach((month) => {
    console.log(`  ${month.month}: ${month.price}${trends.unit}`);
  });
  console.log(`  ... (${trends.trend.length} months total)`);

  console.log('\n✅ All EIA API tests passed!\n');
  console.log('📝 Note: Currently using mock data. Add VITE_EIA_API_KEY to .env for real data.\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nFull error:', error);
}
