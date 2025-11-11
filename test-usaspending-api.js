/**
 * Test script for USAspending.gov API integration
 * Run with: node test-usaspending-api.js
 */

import dotenv from 'dotenv';
import {
  getStateSpendingProfile,
  searchSpendingByAward,
  searchSpendingByGeography,
  getAgencySpending,
  verifySpendingStory,
  getStateComprehensiveSpending,
} from './src/services/usaspendingApi.js';

// Load environment variables
dotenv.config();

// Test with California (large state with significant federal spending)
const testState = 'CA';

console.log('💰 Testing USAspending.gov API Integration...\n');
console.log(`Fetching federal spending data for: ${testState}\n`);

try {
  // Test 1: Get State Spending Profile
  console.log('📊 Test 1: State Spending Profile\n');
  const spendingProfile = await getStateSpendingProfile(testState);

  console.log(`State: ${spendingProfile.stateName}`);
  console.log(`FIPS Code: ${spendingProfile.fipsCode}`);
  console.log(`Fiscal Year: ${spendingProfile.fiscalYear}`);
  console.log(`Total Federal Awards: $${(spendingProfile.totalAwards / 1000000000).toFixed(2)}B`);
  console.log(`  └─ Contracts: $${(spendingProfile.totalContracts / 1000000000).toFixed(2)}B`);
  console.log(`  └─ Grants: $${(spendingProfile.totalGrants / 1000000000).toFixed(2)}B`);
  console.log(`  └─ Loans: $${(spendingProfile.totalLoans / 1000000000).toFixed(2)}B`);

  if (spendingProfile.topRecipients && spendingProfile.topRecipients.length > 0) {
    console.log('\n🏆 Top Recipients:');
    spendingProfile.topRecipients.slice(0, 3).forEach((recipient, i) => {
      const amount = recipient.amount || recipient.total_amount || 0;
      const name = recipient.name || recipient.recipient_name || 'Unknown';
      console.log(`  ${i + 1}. ${name}: $${(amount / 1000000).toFixed(1)}M`);
    });
  }

  if (spendingProfile.topAgencies && spendingProfile.topAgencies.length > 0) {
    console.log('\n🏛️  Top Federal Agencies:');
    spendingProfile.topAgencies.slice(0, 3).forEach((agency, i) => {
      const amount = agency.amount || agency.total_amount || 0;
      const name = agency.name || agency.agency_name || 'Unknown';
      console.log(`  ${i + 1}. ${name}: $${(amount / 1000000).toFixed(1)}M`);
    });
  }

  // Test 2: Search Spending by Award
  console.log('\n\n📊 Test 2: Search Recent Federal Awards\n');
  const currentYear = new Date().getFullYear();
  const awardSearch = await searchSpendingByAward({
    time_period: [
      {
        start_date: `${currentYear - 1}-01-01`,
        end_date: `${currentYear}-12-31`,
      },
    ],
    place_of_performance_locations: [
      {
        country: 'USA',
        state: testState,
      },
    ],
  }, 10);

  console.log(`Total Awards Found: ${awardSearch.totalResults.toLocaleString()}`);
  console.log(`Page: ${awardSearch.page}`);
  console.log(`Has More Results: ${awardSearch.hasNext}`);

  if (awardSearch.awards && awardSearch.awards.length > 0) {
    console.log('\n💵 Sample Awards:');
    awardSearch.awards.slice(0, 5).forEach((award, i) => {
      const awardId = award['Award ID'] || award.award_id || 'N/A';
      const recipient = award['Recipient Name'] || award.recipient_name || 'Unknown';
      const amount = award['Award Amount'] || award.award_amount || 0;
      const agency = award['Awarding Agency'] || award.awarding_agency || 'Unknown Agency';

      console.log(`  ${i + 1}. ${recipient}`);
      console.log(`     Amount: $${amount.toLocaleString()}`);
      console.log(`     Agency: ${agency}`);
      console.log(`     Award ID: ${awardId}`);
    });
  }

  // Test 3: Search Spending by Geography
  console.log('\n\n📊 Test 3: Spending by Geography\n');
  const geographicSpending = await searchSpendingByGeography(testState);

  console.log(`State: ${geographicSpending.stateName}`);
  console.log(`Total Spending: $${(geographicSpending.totalSpending / 1000000000).toFixed(2)}B`);

  if (geographicSpending.results && geographicSpending.results.length > 0) {
    console.log('\n📍 Geographic Distribution:');
    geographicSpending.results.slice(0, 5).forEach((location, i) => {
      const name = location.shape_code || location.county || 'Location';
      const amount = location.aggregated_amount || location.amount || 0;
      console.log(`  ${i + 1}. ${name}: $${(amount / 1000000).toFixed(1)}M`);
    });
  }

  // Test 4: Get Agency Spending
  console.log('\n\n📊 Test 4: Department of Defense Spending\n');
  const dodSpending = await getAgencySpending('Department of Defense', testState);

  console.log(`Agency: Department of Defense`);
  console.log(`State: ${testState}`);
  console.log(`Total Awards Found: ${dodSpending.totalResults.toLocaleString()}`);

  if (dodSpending.awards && dodSpending.awards.length > 0) {
    console.log('\n🎖️  Sample DoD Awards:');
    dodSpending.awards.slice(0, 3).forEach((award, i) => {
      const recipient = award['Recipient Name'] || award.recipient_name || 'Unknown';
      const amount = award['Award Amount'] || award.award_amount || 0;
      console.log(`  ${i + 1}. ${recipient}: $${(amount / 1000000).toFixed(2)}M`);
    });
  }

  // Test 5: Get Comprehensive State Spending
  console.log('\n\n📊 Test 5: Comprehensive State Spending Data\n');
  const comprehensiveData = await getStateComprehensiveSpending(testState);

  console.log(`State: ${comprehensiveData.stateName}`);
  console.log('\n📌 Summary:');
  console.log(`  Total Awards: $${(comprehensiveData.summary.totalAwards / 1000000000).toFixed(2)}B`);
  console.log(`  Contracts: $${(comprehensiveData.summary.totalContracts / 1000000000).toFixed(2)}B`);
  console.log(`  Grants: $${(comprehensiveData.summary.totalGrants / 1000000000).toFixed(2)}B`);
  console.log(`  Loans: $${(comprehensiveData.summary.totalLoans / 1000000000).toFixed(2)}B`);
  console.log(`  Fiscal Year: ${comprehensiveData.summary.fiscalYear}`);

  // Test 6: Verify a spending-related story
  console.log('\n\n🧪 Test 6: Spending Story Verification\n');

  const spendingStory = {
    id: 'TEST-SPENDING-001',
    location: { state: 'CA', city: 'San Diego' },
    headline: 'Local defense contractor wins $50M federal contract',
    story: 'A San Diego-based defense contractor has been awarded a $50 million contract by the Department of Defense for advanced technology development. This is the third major federal contract the company has received this year, bringing total government funding to over $150 million. Local officials say the contracts will create 200 new jobs in the region.',
    policyArea: 'economy',
  };

  const verification = verifySpendingStory(spendingStory, spendingProfile);

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

  if (verification.spendingMetrics && Object.keys(verification.spendingMetrics).length > 0) {
    console.log('\nSpending Metrics:');
    console.log(`  Total Awards: $${(verification.spendingMetrics.totalAwards / 1000000000).toFixed(2)}B`);
    console.log(`  Total Contracts: $${(verification.spendingMetrics.totalContracts / 1000000000).toFixed(2)}B`);
    console.log(`  Total Grants: $${(verification.spendingMetrics.totalGrants / 1000000000).toFixed(2)}B`);
  }

  console.log('\n✅ All USAspending.gov API tests passed!\n');
  console.log('📝 Note: USAspending.gov API is completely open - no authentication or registration required.\n');
  console.log('📝 Real API data will be fetched. Mock data is used as graceful fallback.\n');
  console.log('📝 Data source: https://api.usaspending.gov/api/v2/\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
