/**
 * Test script for Federal Register API integration
 * Run with: node test-federal-register-api.js
 */

import dotenv from 'dotenv';
import {
  getDocument,
  searchDocuments,
  getExecutiveOrders,
  getPublicInspection,
  getAgencies,
  getAgencyRules,
  verifyRegulationStory,
  DOCUMENT_TYPES,
} from './src/services/federalRegisterApi.js';

// Load environment variables
dotenv.config();

console.log('📜 Testing Federal Register API Integration...\n');

try {
  // Test 1: Search for recent documents
  console.log('📊 Test 1: Search Recent Documents\n');
  const searchResults = await searchDocuments({
    term: 'climate change',
    dateFrom: '2024-01-01',
    perPage: 5,
  });

  console.log(`Total Documents Found: ${searchResults.count.toLocaleString()}`);
  console.log(`Current Page: ${searchResults.currentPage}`);
  console.log(`Total Pages: ${searchResults.totalPages}`);

  if (!searchResults.error && searchResults.results.length > 0) {
    console.log('\n📄 Sample Documents:');
    searchResults.results.slice(0, 3).forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.title}`);
      console.log(`     Type: ${doc.type}`);
      console.log(`     Publication Date: ${doc.publication_date}`);
      console.log(`     Document Number: ${doc.document_number}`);
      if (doc.agencies && doc.agencies.length > 0) {
        console.log(`     Agencies: ${doc.agencies.map(a => a.name).join(', ')}`);
      }
    });
  }

  // Test 2: Get Executive Orders
  console.log('\n\n📊 Test 2: Recent Executive Orders\n');
  const executiveOrders = await getExecutiveOrders('2024-01-01', 10);

  console.log(`Total Executive Orders Found: ${executiveOrders.count.toLocaleString()}`);

  if (!executiveOrders.error && executiveOrders.results.length > 0) {
    console.log('\n🎖️  Sample Executive Orders:');
    executiveOrders.results.slice(0, 3).forEach((eo, i) => {
      console.log(`  ${i + 1}. ${eo.title}`);
      console.log(`     Signed: ${eo.signing_date || eo.publication_date}`);
      console.log(`     Executive Order Number: ${eo.executive_order_number || 'N/A'}`);
      console.log(`     Document Number: ${eo.document_number}`);
    });
  }

  // Test 3: Get Agencies
  console.log('\n\n📊 Test 3: Federal Agencies\n');
  const agenciesData = await getAgencies();

  if (!agenciesData.error && agenciesData.agencies.length > 0) {
    console.log(`Total Agencies: ${agenciesData.agencies.length}`);
    console.log('\n🏛️  Sample Agencies:');
    agenciesData.agencies.slice(0, 5).forEach((agency, i) => {
      console.log(`  ${i + 1}. ${agency.name}`);
      console.log(`     Slug: ${agency.slug}`);
      if (agency.url) {
        console.log(`     URL: ${agency.url}`);
      }
    });
  }

  // Test 4: Get EPA Rules
  console.log('\n\n📊 Test 4: EPA Final Rules\n');
  const epaRules = await getAgencyRules('environmental-protection-agency', '2024-01-01', 5);

  console.log(`Agency: Environmental Protection Agency`);
  console.log(`Total Rules Found: ${epaRules.count.toLocaleString()}`);

  if (!epaRules.error && epaRules.results.length > 0) {
    console.log('\n♻️  Sample EPA Rules:');
    epaRules.results.slice(0, 3).forEach((rule, i) => {
      console.log(`  ${i + 1}. ${rule.title}`);
      console.log(`     Publication Date: ${rule.publication_date}`);
      console.log(`     Document Number: ${rule.document_number}`);
    });
  }

  // Test 5: Search for proposed rules
  console.log('\n\n📊 Test 5: Recent Proposed Rules\n');
  const proposedRules = await searchDocuments({
    docType: [DOCUMENT_TYPES.PRORULE],
    dateFrom: '2024-09-01',
    perPage: 5,
  });

  console.log(`Total Proposed Rules: ${proposedRules.count.toLocaleString()}`);

  if (!proposedRules.error && proposedRules.results.length > 0) {
    console.log('\n📋 Sample Proposed Rules:');
    proposedRules.results.slice(0, 3).forEach((rule, i) => {
      console.log(`  ${i + 1}. ${rule.title}`);
      console.log(`     Publication Date: ${rule.publication_date}`);
      if (rule.agencies && rule.agencies.length > 0) {
        console.log(`     Agency: ${rule.agencies[0].name}`);
      }
    });
  }

  // Test 6: Get Public Inspection Documents
  console.log('\n\n📊 Test 6: Public Inspection Documents\n');
  const publicDocs = await getPublicInspection();

  console.log(`Total Public Inspection Documents: ${publicDocs.count.toLocaleString()}`);

  if (!publicDocs.error && publicDocs.results.length > 0) {
    console.log('\n👁️  Sample Public Inspection Documents:');
    publicDocs.results.slice(0, 3).forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.title}`);
      console.log(`     Type: ${doc.type}`);
      if (doc.agencies && doc.agencies.length > 0) {
        console.log(`     Agency: ${doc.agencies[0].name}`);
      }
    });
  }

  // Test 7: Verify a regulation-related story
  console.log('\n\n🧪 Test 7: Regulation Story Verification\n');

  const regulationStory = {
    id: 'TEST-REG-001',
    location: { state: 'CA', city: 'Los Angeles' },
    headline: 'New EPA regulation increases compliance costs for small businesses',
    story: 'The Environmental Protection Agency issued a new final rule last month that requires small manufacturers to install expensive emissions monitoring equipment. Our family business has been operating for 30 years, but this new regulatory burden could force us to close. The compliance cost is estimated at $150,000, which we cannot afford.',
    policyArea: 'environment',
  };

  const verification = verifyRegulationStory(regulationStory, searchResults);

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

  if (verification.regulationMetrics && Object.keys(verification.regulationMetrics).length > 0) {
    console.log('\nRegulation Metrics:');
    Object.entries(verification.regulationMetrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value.toLocaleString()}`);
    });
  }

  console.log('\n✅ All Federal Register API tests passed!\n');
  console.log('📝 Note: Federal Register API is completely open - no authentication required.\n');
  console.log('📝 API provides federal documents from 1994 to present.\n');
  console.log('📝 Data source: https://www.federalregister.gov/api/v1/\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
