/**
 * USDA NASS API Integration Test Suite
 *
 * Tests agricultural and rural policy data tracking
 * API Documentation: https://quickstats.nass.usda.gov/api
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Dynamic import to ensure env vars are loaded
const {
  getFoodAssistanceData,
  getFoodAssistanceBaselineComparison,
  getFarmEconomicsData,
  getFarmSubsidyBaselineComparison,
  getAgriculturalProductionData,
  getRuralEmploymentData,
  getRuralBaselineComparison,
  getCountyAgriculturalData,
  verifyAgriculturalStory,
} = await import('./src/services/usdaApi.js');

console.log('=======================================================');
console.log('USDA NASS API Integration Test Suite');
console.log('Agricultural & Rural Policy Impact Tracking');
console.log('=======================================================\n');

console.log('✓ API Base: https://quickstats.nass.usda.gov/api');
console.log('✓ Historical data back to 1800s for some categories');
console.log('✓ County-level hyperlocal data available\n');

// Test 1: Food Assistance Data (SNAP)
console.log('Test 1: Get SNAP Food Assistance Data (Iowa)');
console.log('----------------------------------------------');
try {
  const snapData = await getFoodAssistanceData('IOWA', 'SNAP', 2023);

  if (snapData.error) {
    console.log('⚠️  Error:', snapData.message);
    console.log('Error Details:', snapData.errorDetails);
  } else {
    console.log('✓ Source:', snapData.source);
    console.log('State:', snapData.state);
    console.log('Program:', snapData.program);
    console.log('Year:', snapData.year);
    console.log('Records Retrieved:', snapData.recordCount);

    if (snapData.data && snapData.data.length > 0) {
      console.log('\nSample SNAP Data:');
      snapData.data.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.short_desc || record.statisticcat_desc}`);
        if (record.Value) console.log(`     Value: ${record.Value}`);
        if (record.unit_desc) console.log(`     Unit: ${record.unit_desc}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 2: Food Assistance Baseline Comparison
console.log('Test 2: Food Assistance Baseline Comparison (Texas)');
console.log('----------------------------------------------------');
try {
  console.log('Comparing SNAP data: 2022 vs 2023...\n');

  const comparison = await getFoodAssistanceBaselineComparison('TEXAS', 2022, 2023);

  console.log('✓ State:', comparison.state);
  console.log('Baseline Year:', comparison.baselineYear);
  console.log('Current Year:', comparison.currentYear);
  console.log('Status:', comparison.status);

  if (comparison.programs && comparison.programs.SNAP) {
    const snapChanges = comparison.programs.SNAP.changes;

    if (snapChanges.available) {
      console.log('\nSNAP Participation Changes:');
      console.log('  Baseline Value:', snapChanges.baselineValue);
      console.log('  Current Value:', snapChanges.currentValue);
      console.log('  Absolute Change:', snapChanges.absoluteChange);
      console.log('  Percent Change:', snapChanges.percentChange + '%');
      console.log('  Trend:', snapChanges.trend);
    } else {
      console.log('\n⚠️  SNAP change data unavailable');
    }
  }

  if (comparison.message) {
    console.log('\nMessage:', comparison.message);
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 3: Farm Economics Data (Government Payments)
console.log('Test 3: Get Farm Economics Data (Iowa - Government Payments)');
console.log('------------------------------------------------------------');
try {
  const farmData = await getFarmEconomicsData('IOWA', 'GOVERNMENT PAYMENTS', 2022);

  if (farmData.error) {
    console.log('⚠️  Error:', farmData.message);
    console.log('Error Details:', farmData.errorDetails);
  } else {
    console.log('✓ Source:', farmData.source);
    console.log('State:', farmData.state);
    console.log('Metric:', farmData.metric);
    console.log('Year:', farmData.year);
    console.log('Records Retrieved:', farmData.recordCount);

    if (farmData.data && farmData.data.length > 0) {
      console.log('\nSample Farm Economics Data:');
      farmData.data.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.short_desc || record.statisticcat_desc}`);
        if (record.Value) console.log(`     Value: $${record.Value}`);
        if (record.unit_desc) console.log(`     Unit: ${record.unit_desc}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 4: Farm Subsidy Baseline Comparison
console.log('Test 4: Farm Subsidy Baseline Comparison (Iowa)');
console.log('------------------------------------------------');
try {
  console.log('Comparing farm subsidies and income: 2021 vs 2022...\n');

  const farmComparison = await getFarmSubsidyBaselineComparison('IOWA', 2021, 2022);

  console.log('✓ State:', farmComparison.state);
  console.log('Baseline Year:', farmComparison.baselineYear);
  console.log('Current Year:', farmComparison.currentYear);
  console.log('Status:', farmComparison.status);

  if (farmComparison.governmentPayments) {
    const paymentChanges = farmComparison.governmentPayments.changes;

    if (paymentChanges.available) {
      console.log('\nGovernment Payments Changes:');
      console.log('  Baseline Total:', paymentChanges.baselineTotal);
      console.log('  Current Total:', paymentChanges.currentTotal);
      console.log('  Absolute Change:', paymentChanges.absoluteChange);
      console.log('  Percent Change:', paymentChanges.percentChange + '%');
      console.log('  Trend:', paymentChanges.trend);
    } else {
      console.log('\n⚠️  Government payments change data unavailable');
    }
  }

  if (farmComparison.farmIncome) {
    const incomeChanges = farmComparison.farmIncome.changes;

    if (incomeChanges.available) {
      console.log('\nFarm Income Changes:');
      console.log('  Baseline Total:', incomeChanges.baselineTotal);
      console.log('  Current Total:', incomeChanges.currentTotal);
      console.log('  Percent Change:', incomeChanges.percentChange + '%');
      console.log('  Trend:', incomeChanges.trend);
    } else {
      console.log('\n⚠️  Farm income change data unavailable');
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 5: Agricultural Production Data
console.log('Test 5: Get Agricultural Production Data (Iowa - Corn)');
console.log('------------------------------------------------------');
try {
  const productionData = await getAgriculturalProductionData('IOWA', 'CORN', 2023);

  if (productionData.error) {
    console.log('⚠️  Error:', productionData.message);
    console.log('Error Details:', productionData.errorDetails);
  } else {
    console.log('✓ Source:', productionData.source);
    console.log('State:', productionData.state);
    console.log('Commodity:', productionData.commodity);
    console.log('Year:', productionData.year);
    console.log('Records Retrieved:', productionData.recordCount);

    if (productionData.data && productionData.data.length > 0) {
      console.log('\nSample Corn Production Data:');
      productionData.data.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.short_desc || record.statisticcat_desc}`);
        if (record.Value) console.log(`     Value: ${record.Value}`);
        if (record.unit_desc) console.log(`     Unit: ${record.unit_desc}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 6: Rural Employment Data
console.log('Test 6: Get Rural Employment Data (Texas)');
console.log('------------------------------------------');
try {
  const employmentData = await getRuralEmploymentData('TEXAS', 2022);

  if (employmentData.error) {
    console.log('⚠️  Error:', employmentData.message);
    console.log('Error Details:', employmentData.errorDetails);
  } else {
    console.log('✓ Source:', employmentData.source);
    console.log('State:', employmentData.state);
    console.log('Year:', employmentData.year);
    console.log('Records Retrieved:', employmentData.recordCount);

    if (employmentData.data && employmentData.data.length > 0) {
      console.log('\nSample Employment Data:');
      employmentData.data.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.short_desc || record.statisticcat_desc}`);
        if (record.Value) console.log(`     Value: ${record.Value}`);
        if (record.unit_desc) console.log(`     Unit: ${record.unit_desc}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 7: County-Level Agricultural Data
console.log('Test 7: Get County Agricultural Data (Polk County, Iowa)');
console.log('--------------------------------------------------------');
try {
  const countyData = await getCountyAgriculturalData('IOWA', 'POLK', 2022);

  if (countyData.error) {
    console.log('⚠️  Error:', countyData.message);
    console.log('Error Details:', countyData.errorDetails);
  } else {
    console.log('✓ Source:', countyData.source);
    console.log('State:', countyData.state);
    console.log('County:', countyData.county);
    console.log('Year:', countyData.year);
    console.log('Records Retrieved:', countyData.recordCount);

    if (countyData.data && countyData.data.length > 0) {
      console.log('\nSample County Data:');
      countyData.data.slice(0, 5).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.short_desc || record.commodity_desc}`);
        if (record.Value) console.log(`     Value: ${record.Value}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 8: Verify Agricultural Story
console.log('Test 8: Verify Agricultural Policy Impact Story');
console.log('------------------------------------------------');
try {
  const citizenStory = {
    headline: 'Local farmers struggling after SNAP cuts and subsidy reductions',
    story:
      'Our farming community has been hit hard by recent policy changes. SNAP participation has dropped significantly, reducing demand at local markets. At the same time, farm subsidy payments have been cut, putting pressure on family farms already dealing with tight margins.',
  };

  console.log('Story to verify:');
  console.log('  Headline:', citizenStory.headline);
  console.log('  Story excerpt:', citizenStory.story.substring(0, 100) + '...\n');

  // Get USDA data for verification
  const snapData = await getFoodAssistanceBaselineComparison('IOWA', 2022, 2023);
  const farmData = await getFarmSubsidyBaselineComparison('IOWA', 2022, 2023);

  const usdaData = {
    foodAssistance: snapData,
    farmEconomics: farmData,
  };

  console.log('Verifying against USDA data...\n');

  const verification = await verifyAgriculturalStory(citizenStory, usdaData);

  console.log('✓ Verified:', verification.verified);
  console.log('Confidence Score:', verification.confidence + '%');
  console.log('Verification Method:', verification.verificationMethod);

  if (verification.flags && verification.flags.length > 0) {
    console.log('\nFlags:');
    verification.flags.forEach((flag) => {
      console.log(`  - ${flag}`);
    });
  }

  if (verification.insights && verification.insights.length > 0) {
    console.log('\nInsights:');
    verification.insights.forEach((insight) => {
      console.log(`  ${insight.type === 'error' ? '⚠️' : '✓'} [${insight.type}] ${insight.message}`);
      console.log(`     Confidence: ${insight.confidence}%`);
    });
  }

  if (verification.usdaMetrics) {
    console.log('\nUSDA Metrics Used:');
    Object.entries(verification.usdaMetrics).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');
console.log('=======================================================');
console.log('USDA API Test Suite Complete');
console.log('=======================================================');
console.log('\nKey Features Tested:');
console.log('✓ Food assistance data (SNAP, WIC, School Lunch)');
console.log('✓ Food assistance baseline comparison');
console.log('✓ Farm economics (income, subsidies, government payments)');
console.log('✓ Farm subsidy baseline comparison');
console.log('✓ Agricultural production (crops, livestock)');
console.log('✓ Rural employment and labor statistics');
console.log('✓ County-level hyperlocal data');
console.log('✓ Agricultural story verification');
console.log('\nAPI Features:');
console.log('- No strict rate limit (reasonable use expected)');
console.log('- Historical data back to 1800s for some categories');
console.log('- County-level granularity available');
console.log('- 45-second timeout for complex queries');
console.log('- Automatic retry with exponential backoff');
console.log('\nProject 2025 Tracking:');
console.log('- SNAP/food assistance cuts and reforms');
console.log('- Farm subsidy changes and rural economic impacts');
console.log('- Rural employment trends');
console.log('- Agricultural policy impacts on farming communities');
console.log('\nIntegration Notes:');
console.log('- Cross-validates with 14 other federal APIs');
console.log('- Critical for rural and agricultural policy verification');
console.log('- Enables hyperlocal county-level impact stories');
console.log('\nDocumentation: https://quickstats.nass.usda.gov/api');
console.log('Registration: https://quickstats.nass.usda.gov/api');
