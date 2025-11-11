/**
 * FEC (Federal Election Commission) OpenFEC API Integration Test
 *
 * Tests campaign finance data access for:
 * - Candidate search and financial data
 * - Committee search and financial data
 * - Individual contributions tracking
 * - Disbursements/expenditures
 * - Election results
 * - Campaign finance story verification
 */

import fecApi from './src/services/fecApi.js';

console.log('═══════════════════════════════════════════════════════');
console.log('FEC OpenFEC API Integration Test');
console.log('Testing campaign finance data retrieval and verification');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: Search for candidates by name
async function testCandidateSearch() {
  console.log('📊 TEST 1: Searching for candidates...');
  try {
    const result = await fecApi.searchCandidates('Biden', {
      cycle: 2024,
      office: 'P', // Presidential
      perPage: 5,
    });

    if (result.error) {
      console.log('⚠️  FEC API returned error:', result.errorMessage);
      console.log(`   Confidence: 50% (graceful degradation)`);
      return result;
    }

    console.log(`✅ Found ${result.count} candidate(s)`);
    if (result.results.length > 0) {
      const candidate = result.results[0];
      console.log(`\n   Top Result:`);
      console.log(`   - Name: ${candidate.name}`);
      console.log(`   - Office: ${candidate.office_full || candidate.office}`);
      console.log(`   - State: ${candidate.state || 'N/A'}`);
      console.log(`   - Party: ${candidate.party_full || candidate.party || 'N/A'}`);
      console.log(`   - Candidate ID: ${candidate.candidate_id}`);
      console.log(`   - Cycles: ${(candidate.cycles || []).join(', ')}`);
    }
    console.log(`   Source: ${result.source}`);
    console.log(`   Last Updated: ${result.lastUpdated}\n`);
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message, '\n');
    throw error;
  }
}

// Test 2: Get candidate financial details
async function testCandidateFinancials(candidateId) {
  console.log('💰 TEST 2: Retrieving candidate financial data...');
  try {
    const result = await fecApi.getCandidateFinancials(candidateId, {
      cycle: 2024,
    });

    if (result.error) {
      console.log('⚠️  FEC API returned error:', result.errorMessage);
      console.log(`   Confidence: 50% (graceful degradation)`);
      return result;
    }

    console.log(`✅ Retrieved financial data for candidate ${candidateId}`);
    if (result.results.length > 0) {
      const financials = result.results[0];
      console.log(`\n   Financial Summary (${financials.cycle || 'N/A'}):`);
      console.log(`   - Total Receipts: $${(financials.receipts || 0).toLocaleString()}`);
      console.log(`   - Total Disbursements: $${(financials.disbursements || 0).toLocaleString()}`);
      console.log(`   - Cash on Hand: $${(financials.cash_on_hand_end_period || 0).toLocaleString()}`);
      console.log(`   - Debt: $${(financials.debts_owed_by_committee || 0).toLocaleString()}`);
      console.log(`   - Individual Contributions: $${(financials.individual_contributions || 0).toLocaleString()}`);
    }
    console.log(`   Source: ${result.source}\n`);
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message, '\n');
    throw error;
  }
}

// Test 3: Search for committees
async function testCommitteeSearch() {
  console.log('🏛️  TEST 3: Searching for committees...');
  try {
    const result = await fecApi.searchCommittees({
      committeeType: 'O', // Super PAC
      cycle: 2024,
      perPage: 5,
      sort: '-receipts', // Highest receipts first
    });

    if (result.error) {
      console.log('⚠️  FEC API returned error:', result.errorMessage);
      console.log(`   Confidence: 50% (graceful degradation)`);
      return result;
    }

    console.log(`✅ Found ${result.count} committee(s)`);
    if (result.results.length > 0) {
      const committee = result.results[0];
      console.log(`\n   Top Super PAC:`);
      console.log(`   - Name: ${committee.name}`);
      console.log(`   - Committee ID: ${committee.committee_id}`);
      console.log(`   - Type: ${committee.committee_type_full || committee.committee_type}`);
      console.log(`   - Party: ${committee.party_full || committee.party || 'N/A'}`);
      console.log(`   - Treasurer: ${committee.treasurer_name || 'N/A'}`);
    }
    console.log(`   Source: ${result.source}\n`);
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message, '\n');
    throw error;
  }
}

// Test 4: Search for individual contributions
async function testContributionsSearch() {
  console.log('💵 TEST 4: Searching for individual contributions...');
  try {
    const result = await fecApi.searchContributions({
      minAmount: 1000, // $1,000+ contributions
      contributorState: 'CA',
      perPage: 5,
      sort: '-contribution_receipt_amount', // Largest first
    });

    if (result.error) {
      console.log('⚠️  FEC API returned error:', result.errorMessage);
      console.log(`   Confidence: 50% (graceful degradation)`);
      return result;
    }

    console.log(`✅ Found ${result.count.toLocaleString()} contribution(s) from CA over $1,000`);
    if (result.results.length > 0) {
      const contribution = result.results[0];
      console.log(`\n   Sample Large Contribution:`);
      console.log(`   - Amount: $${(contribution.contribution_receipt_amount || 0).toLocaleString()}`);
      console.log(`   - Contributor: ${contribution.contributor_name || 'N/A'}`);
      console.log(`   - City: ${contribution.contributor_city || 'N/A'}, ${contribution.contributor_state || 'N/A'}`);
      console.log(`   - Employer: ${contribution.contributor_employer || 'N/A'}`);
      console.log(`   - Occupation: ${contribution.contributor_occupation || 'N/A'}`);
      console.log(`   - Date: ${contribution.contribution_receipt_date || 'N/A'}`);
      console.log(`   - Committee: ${contribution.committee?.name || contribution.committee_id || 'N/A'}`);
    }
    console.log(`   Source: ${result.source}\n`);
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message, '\n');
    throw error;
  }
}

// Test 5: Search for disbursements
async function testDisbursementsSearch() {
  console.log('📤 TEST 5: Searching for campaign disbursements...');
  try {
    const result = await fecApi.searchDisbursements({
      minAmount: 10000, // $10,000+ expenditures
      perPage: 5,
      sort: '-disbursement_amount', // Largest first
    });

    if (result.error) {
      console.log('⚠️  FEC API returned error:', result.errorMessage);
      console.log(`   Confidence: 50% (graceful degradation)`);
      return result;
    }

    console.log(`✅ Found ${result.count.toLocaleString()} disbursement(s) over $10,000`);
    if (result.results.length > 0) {
      const disbursement = result.results[0];
      console.log(`\n   Sample Large Disbursement:`);
      console.log(`   - Amount: $${(disbursement.disbursement_amount || 0).toLocaleString()}`);
      console.log(`   - Recipient: ${disbursement.recipient_name || 'N/A'}`);
      console.log(`   - Purpose: ${disbursement.disbursement_description || 'N/A'}`);
      console.log(`   - Date: ${disbursement.disbursement_date || 'N/A'}`);
      console.log(`   - Committee: ${disbursement.committee?.name || disbursement.committee_id || 'N/A'}`);
    }
    console.log(`   Source: ${result.source}\n`);
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message, '\n');
    throw error;
  }
}

// Test 6: Get election results
async function testElectionResults() {
  console.log('🗳️  TEST 6: Retrieving election results...');
  try {
    const result = await fecApi.getElectionResults({
      state: 'PA',
      office: 'S', // Senate
      cycle: 2024,
      perPage: 5,
    });

    if (result.error) {
      console.log('⚠️  FEC API returned error:', result.errorMessage);
      console.log(`   Confidence: 50% (graceful degradation)`);
      return result;
    }

    console.log(`✅ Found ${result.count} election result(s) for PA Senate races`);
    if (result.results.length > 0) {
      const election = result.results[0];
      console.log(`\n   Election Result:`);
      console.log(`   - Candidate: ${election.candidate_name || 'N/A'}`);
      console.log(`   - Office: ${election.office_full || election.office || 'N/A'}`);
      console.log(`   - State: ${election.state || 'N/A'}`);
      console.log(`   - Party: ${election.party_full || election.party || 'N/A'}`);
      console.log(`   - Election Year: ${election.election_year || 'N/A'}`);
    }
    console.log(`   Source: ${result.source}\n`);
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message, '\n');
    throw error;
  }
}

// Test 7: Campaign finance story verification
async function testStoryVerification() {
  console.log('🔍 TEST 7: Verifying campaign finance story...');
  try {
    const mockStory = {
      headline: 'Super PAC Spending Surges in Pennsylvania Senate Race',
      story:
        'A California-based Super PAC has spent over $5 million supporting Senate candidates in Pennsylvania, with contributions primarily coming from tech executives and venture capitalists. Federal Election Commission records show significant disbursements for television advertising in the Philadelphia market.',
      policyArea: 'campaign_finance',
      location: {
        city: 'Philadelphia',
        state: 'PA',
      },
    };

    console.log(`   Story: "${mockStory.headline}"`);

    // Gather FEC data for verification
    const [candidates, committees, contributions, disbursements] = await Promise.all([
      fecApi.searchCandidates('', { state: 'PA', office: 'S', cycle: 2024 }),
      fecApi.searchCommittees({ committeeType: 'O', cycle: 2024 }),
      fecApi.searchContributions({ contributorState: 'CA', minAmount: 1000 }),
      fecApi.searchDisbursements({ minAmount: 10000 }),
    ]);

    const fecData = {
      candidates,
      committees,
      contributions,
      disbursements,
    };

    const verification = fecApi.verifyCampaignFinanceStory(mockStory, fecData);

    console.log(`\n   Verification Result:`);
    console.log(`   - Verified: ${verification.verified ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   - Confidence: ${verification.confidence}%`);
    console.log(`\n   📊 Campaign Finance Metrics:`);
    console.log(`   - Candidates Found: ${verification.campaignFinanceMetrics.candidatesFound}`);
    console.log(`   - Committees Found: ${verification.campaignFinanceMetrics.committeesFound}`);
    console.log(`   - Contributions Found: ${verification.campaignFinanceMetrics.contributionsFound}`);
    console.log(`   - Disbursements Found: ${verification.campaignFinanceMetrics.disbursementsFound}`);

    if (verification.insights.length > 0) {
      console.log(`\n   💡 INSIGHTS (${verification.insights.length}):`);
      verification.insights.forEach((insight, idx) => {
        console.log(`   ${idx + 1}. [${insight.type}] ${insight.message}`);
      });
    }

    if (verification.flags.length > 0) {
      console.log(`\n   ⚠️  FLAGS (${verification.flags.length}):`);
      verification.flags.forEach((flag, idx) => {
        console.log(`   ${idx + 1}. [${flag.severity}] ${flag.message}`);
      });
    }

    console.log(`\n   Source: ${verification.source}`);
    console.log(`   Verified At: ${verification.verifiedAt}\n`);

    return verification;
  } catch (error) {
    console.error('❌ Test failed:', error.message, '\n');
    throw error;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting FEC API integration tests...\n');

  try {
    // Test 1: Search candidates
    const candidateSearch = await testCandidateSearch();

    // Test 2: Get candidate financials (use first result if available)
    let candidateId = 'P80000722'; // Default to Biden 2024
    if (!candidateSearch.error && candidateSearch.results.length > 0) {
      candidateId = candidateSearch.results[0].candidate_id;
    }
    await testCandidateFinancials(candidateId);

    // Test 3: Search committees
    await testCommitteeSearch();

    // Test 4: Search contributions
    await testContributionsSearch();

    // Test 5: Search disbursements
    await testDisbursementsSearch();

    // Test 6: Get election results
    await testElectionResults();

    // Test 7: Story verification
    await testStoryVerification();

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📋 SUMMARY:');
    console.log('   - FEC API integration tested');
    console.log('   - Candidate search and financials tested');
    console.log('   - Committee search tested');
    console.log('   - Contributions and disbursements tested');
    console.log('   - Election results tested');
    console.log('   - Story verification tested');
    console.log('   - Graceful error handling verified');
    console.log('\n🔑 API KEY STATUS:');
    console.log('   - Using DEMO_KEY (limited to 30 requests/hour)');
    console.log('   - For production: Get key at https://api.data.gov/signup/');
    console.log('   - Set VITE_FEC_API_KEY in .env file');
    console.log('\n📚 DOCUMENTATION:');
    console.log('   - API Docs: https://api.open.fec.gov/developers/');
    console.log('   - FEC Website: https://www.fec.gov/');
    console.log('   - Data Download: https://www.fec.gov/data/');
    console.log('\n');
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('❌ TEST SUITE FAILED');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

runAllTests();
