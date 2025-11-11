/**
 * Test script for CDC WONDER API integration
 * Run with: node test-cdc-wonder-api.js
 */

import dotenv from 'dotenv';
import {
  getMortalityData,
  getBirthData,
  getMortalityByCause,
  getCOVID19Deaths,
  verifyHealthStory,
  DATABASES,
  ICD10_CODES,
} from './src/services/cdcWonderApi.js';

// Load environment variables
dotenv.config();

console.log('🏥 Testing CDC WONDER API Integration...\n');
console.log('⚠️  IMPORTANT: CDC WONDER API ONLY provides NATIONAL-level data.\n');
console.log('⚠️  For state/county data, use web interface: https://wonder.cdc.gov/\n');

try {
  // Test 1: Get overall mortality data
  console.log('📊 Test 1: Overall Mortality Data (2019-2020)\n');
  const mortalityData = await getMortalityData('2019', '2020');

  if (!mortalityData.error) {
    console.log(`Years: ${mortalityData.yearStart} - ${mortalityData.yearEnd}`);
    console.log(`Data Level: ${mortalityData.dataLevel}`);
    console.log(`Total Data Points: ${mortalityData.count}`);
    console.log(`Source: ${mortalityData.source}`);

    if (mortalityData.results.length > 0) {
      console.log('\n💀 Sample Mortality Data:');
      mortalityData.results.slice(0, 5).forEach((record, i) => {
        console.log(`  ${i + 1}. ${JSON.stringify(record, null, 2).substring(0, 200)}...`);
      });
    }
  } else {
    console.log(`⚠️  ${mortalityData.errorMessage}`);
  }

  // Test 2: Get birth data
  console.log('\n\n📊 Test 2: Natality (Birth) Data (2019-2020)\n');
  const birthData = await getBirthData('2019', '2020');

  if (!birthData.error) {
    console.log(`Years: ${birthData.yearStart} - ${birthData.yearEnd}`);
    console.log(`Data Level: ${birthData.dataLevel}`);
    console.log(`Total Data Points: ${birthData.count}`);
    console.log(`Source: ${birthData.source}`);

    if (birthData.results.length > 0) {
      console.log('\n👶 Sample Birth Data:');
      birthData.results.slice(0, 5).forEach((record, i) => {
        console.log(`  ${i + 1}. ${JSON.stringify(record, null, 2).substring(0, 200)}...`);
      });
    }
  } else {
    console.log(`⚠️  ${birthData.errorMessage}`);
  }

  // Test 3: Get heart disease mortality
  console.log('\n\n📊 Test 3: Heart Disease Mortality (2019-2020)\n');
  const heartDiseaseData = await getMortalityByCause('2019', '2020', 'HEART_DISEASE');

  if (!heartDiseaseData.error) {
    console.log(`Years: ${heartDiseaseData.yearStart} - ${heartDiseaseData.yearEnd}`);
    console.log(`Cause: Heart Disease`);
    console.log(`ICD-10 Codes: ${ICD10_CODES.HEART_DISEASE.join(', ')}`);
    console.log(`Data Level: ${heartDiseaseData.dataLevel}`);
    console.log(`Total Data Points: ${heartDiseaseData.count}`);
    console.log(`Source: ${heartDiseaseData.source}`);

    if (heartDiseaseData.results.length > 0) {
      console.log('\n❤️  Sample Heart Disease Data:');
      heartDiseaseData.results.slice(0, 3).forEach((record, i) => {
        console.log(`  ${i + 1}. ${JSON.stringify(record, null, 2).substring(0, 200)}...`);
      });
    }
  } else {
    console.log(`⚠️  ${heartDiseaseData.errorMessage}`);
  }

  // Test 4: Get cancer mortality
  console.log('\n\n📊 Test 4: Cancer Mortality (2019-2020)\n');
  const cancerData = await getMortalityByCause('2019', '2020', 'CANCER');

  if (!cancerData.error) {
    console.log(`Years: ${cancerData.yearStart} - ${cancerData.yearEnd}`);
    console.log(`Cause: Cancer`);
    console.log(`ICD-10 Codes: ${ICD10_CODES.CANCER.join(', ')}`);
    console.log(`Data Level: ${cancerData.dataLevel}`);
    console.log(`Total Data Points: ${cancerData.count}`);
    console.log(`Source: ${cancerData.source}`);
  } else {
    console.log(`⚠️  ${cancerData.errorMessage}`);
  }

  // Test 5: Get COVID-19 deaths
  console.log('\n\n📊 Test 5: COVID-19 Deaths (2020)\n');
  const covidData = await getCOVID19Deaths('2020', '2020');

  if (!covidData.error) {
    console.log(`Year: 2020`);
    console.log(`Cause: COVID-19`);
    console.log(`ICD-10 Code: ${ICD10_CODES.COVID19.join(', ')}`);
    console.log(`Data Level: ${covidData.dataLevel}`);
    console.log(`Total Data Points: ${covidData.count}`);
    console.log(`Source: ${covidData.source}`);

    if (covidData.results.length > 0) {
      console.log('\n🦠 Sample COVID-19 Data:');
      covidData.results.slice(0, 3).forEach((record, i) => {
        console.log(`  ${i + 1}. ${JSON.stringify(record, null, 2).substring(0, 200)}...`);
      });
    }
  } else {
    console.log(`⚠️  ${covidData.errorMessage}`);
  }

  // Test 6: Verify a health-related story (NATIONAL context)
  console.log('\n\n🧪 Test 6: Health Story Verification (National Context)\n');

  const healthStory = {
    id: 'TEST-HEALTH-001',
    location: { state: 'CA', city: 'Los Angeles' },  // Location-specific but API only provides national context
    headline: 'Rising cancer deaths affecting our community',
    story: 'Our community has seen an increase in cancer-related deaths over the past two years. Multiple families have been affected by various types of cancer. We need better access to screening and treatment programs.',
    policyArea: 'healthcare',
  };

  const verification = verifyHealthStory(healthStory, mortalityData);

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

  if (verification.healthMetrics && Object.keys(verification.healthMetrics).length > 0) {
    console.log('\nHealth Metrics:');
    Object.entries(verification.healthMetrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }

  // Test 7: Verify COVID story
  console.log('\n\n🧪 Test 7: COVID-19 Story Verification\n');

  const covidStory = {
    id: 'TEST-COVID-001',
    location: { state: 'NY', city: 'New York City' },
    headline: 'COVID-19 pandemic overwhelmed local hospitals',
    story: 'During the COVID-19 pandemic in 2020, our local hospital was overwhelmed with patients. Many people died from COVID complications. The death rate was higher than anyone expected.',
    policyArea: 'healthcare',
  };

  const covidVerification = verifyHealthStory(covidStory, covidData);

  console.log('Verification Results:');
  console.log(`✓ Verified: ${covidVerification.verified}`);
  console.log(`✓ Confidence Score: ${covidVerification.confidence}%`);
  if (covidVerification.flags.length > 0) {
    console.log(`✓ Flags: ${covidVerification.flags.join(', ')}`);
  }
  console.log('\nInsights:');
  covidVerification.insights.forEach((insight, i) => {
    console.log(`  ${i + 1}. [${insight.type}] ${insight.message}`);
  });

  console.log('\n✅ All CDC WONDER API tests completed!\n');
  console.log('📝 Note: CDC WONDER API is completely open - no authentication required.\n');
  console.log('📝 API uses XML-based POST requests and responses.\n');
  console.log('📝 Data source: https://wonder.cdc.gov/controller/datarequest\n');
  console.log('⚠️  CRITICAL LIMITATION: API ONLY provides NATIONAL-level data\n');
  console.log('⚠️  For state/county data, use: https://wonder.cdc.gov/\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
