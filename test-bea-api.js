/**
 * BEA API Integration Test Suite
 *
 * Tests the Bureau of Economic Analysis (BEA) API integration
 * for GDP, personal income, and regional economic data.
 *
 * API Documentation: https://apps.bea.gov/api/docs/
 * Authentication: UserID (36-character identifier)
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Dynamic import to ensure env vars are loaded before module evaluation
const {
  getDatasetList,
  getRegionalIncome,
  getStateGDP,
  getPerCapitaIncome,
  getEconomicTrends,
  getEconomicBaseline,
  verifyEconomicStory,
} = await import('./src/services/beaApi.js');

console.log('=================================================');
console.log('BEA API Integration Test Suite');
console.log('=================================================\n');

// Test 1: Get Available Datasets
console.log('Test 1: Get Available BEA Datasets');
console.log('-----------------------------------');
try {
  const datasets = await getDatasetList();

  if (datasets.error) {
    console.log('⚠️  Error:', datasets.errorMessage);
    console.log('Error Type:', datasets.errorType);
  } else {
    console.log('✓ Datasets Retrieved:', datasets.count || 'N/A');
    console.log('Source:', datasets.source);
    if (datasets.datasets && datasets.datasets.length > 0) {
      console.log('\nAvailable Datasets:');
      datasets.datasets.slice(0, 5).forEach(dataset => {
        console.log(`  - ${dataset.DatasetName}: ${dataset.DatasetDescription}`);
      });
      if (datasets.datasets.length > 5) {
        console.log(`  ... and ${datasets.datasets.length - 5} more`);
      }
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 2: Get Regional Income for Texas
console.log('Test 2: Get Regional Personal Income (Texas)');
console.log('----------------------------------------------');
try {
  const texasIncome = await getRegionalIncome('TX', '2022');

  if (texasIncome.error) {
    console.log('⚠️  Error:', texasIncome.errorMessage);
    console.log('Error Type:', texasIncome.errorType);
  } else {
    console.log('✓ State:', texasIncome.stateCode);
    console.log('Year:', texasIncome.year);
    console.log('Records Retrieved:', texasIncome.count);
    console.log('Source:', texasIncome.source);
    if (texasIncome.data && texasIncome.data.length > 0) {
      const sample = texasIncome.data[0];
      console.log('\nSample Data:');
      console.log('  GeoName:', sample.GeoName);
      console.log('  DataValue:', sample.DataValue);
      console.log('  CL_UNIT:', sample.CL_UNIT || 'N/A');
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 3: Get State GDP for California
console.log('Test 3: Get State GDP (California)');
console.log('------------------------------------');
try {
  const californiaGDP = await getStateGDP('CA', '2022');

  if (californiaGDP.error) {
    console.log('⚠️  Error:', californiaGDP.errorMessage);
    console.log('Error Type:', californiaGDP.errorType);
  } else {
    console.log('✓ State:', californiaGDP.stateCode);
    console.log('Year:', californiaGDP.year);
    console.log('Records Retrieved:', californiaGDP.count);
    console.log('Source:', californiaGDP.source);
    if (californiaGDP.data && californiaGDP.data.length > 0) {
      const sample = californiaGDP.data[0];
      console.log('\nSample GDP Data:');
      console.log('  GeoName:', sample.GeoName);
      console.log('  DataValue:', sample.DataValue);
      console.log('  CL_UNIT:', sample.CL_UNIT || 'N/A');
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 4: Get Per Capita Income for New York
console.log('Test 4: Get Per Capita Personal Income (New York)');
console.log('--------------------------------------------------');
try {
  const nyPerCapita = await getPerCapitaIncome('NY', '2022');

  if (nyPerCapita.error) {
    console.log('⚠️  Error:', nyPerCapita.errorMessage);
    console.log('Error Type:', nyPerCapita.errorType);
  } else {
    console.log('✓ State:', nyPerCapita.stateCode);
    console.log('Year:', nyPerCapita.year);
    console.log('Records Retrieved:', nyPerCapita.count);
    console.log('Source:', nyPerCapita.source);
    if (nyPerCapita.data && nyPerCapita.data.length > 0) {
      const sample = nyPerCapita.data[0];
      console.log('\nPer Capita Income Data:');
      console.log('  GeoName:', sample.GeoName);
      console.log('  DataValue:', sample.DataValue);
      console.log('  CL_UNIT:', sample.CL_UNIT || 'N/A');
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 5: Get Economic Trends (Multi-Year Data)
console.log('Test 5: Get Economic Trends (Florida 2020-2022)');
console.log('------------------------------------------------');
try {
  const floridaTrends = await getEconomicTrends('FL', '2020', '2022');

  if (floridaTrends.error) {
    console.log('⚠️  Error:', floridaTrends.errorMessage);
    console.log('Error Type:', floridaTrends.errorType);
  } else {
    console.log('✓ State:', floridaTrends.stateCode);
    console.log('Time Period:', `${floridaTrends.startYear} - ${floridaTrends.endYear}`);
    console.log('Records Retrieved:', floridaTrends.count);
    console.log('Source:', floridaTrends.source);
    if (floridaTrends.data && floridaTrends.data.length > 0) {
      console.log('\nTrend Data Summary:');
      floridaTrends.data.slice(0, 3).forEach(record => {
        console.log(`  ${record.TimePeriod}: ${record.DataValue} (${record.GeoName})`);
      });
      if (floridaTrends.data.length > 3) {
        console.log(`  ... and ${floridaTrends.data.length - 3} more records`);
      }
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 6: Get Economic Baseline Comparison
console.log('Test 6: Get Economic Baseline Comparison (Ohio 2019 vs 2022)');
console.log('-------------------------------------------------------------');
try {
  const ohioBaseline = await getEconomicBaseline('OH', '2019', '2022');

  if (ohioBaseline.error) {
    console.log('⚠️  Error:', ohioBaseline.errorMessage);
    console.log('Error Type:', ohioBaseline.errorType);
  } else {
    console.log('✓ State:', ohioBaseline.stateCode);
    console.log('Baseline Year:', ohioBaseline.baselineYear);
    console.log('Current Year:', ohioBaseline.currentYear);
    console.log('Source:', ohioBaseline.source);

    if (ohioBaseline.baseline && ohioBaseline.current) {
      console.log('\nBaseline Comparison:');
      console.log('  Baseline Records:', ohioBaseline.baseline.length);
      console.log('  Current Records:', ohioBaseline.current.length);

      if (ohioBaseline.baseline.length > 0) {
        const baselineSample = ohioBaseline.baseline[0];
        console.log(`  Sample Baseline (${ohioBaseline.baselineYear}):`, baselineSample.DataValue);
      }
      if (ohioBaseline.current.length > 0) {
        const currentSample = ohioBaseline.current[0];
        console.log(`  Sample Current (${ohioBaseline.currentYear}):`, currentSample.DataValue);
      }
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 7: Verify Economic Story
console.log('Test 7: Verify Economic Story (Income Growth)');
console.log('----------------------------------------------');
try {
  const economicStory = {
    headline: 'Rising personal incomes boost local economy',
    story: 'Residents in our state have experienced significant income growth over the past year, with median household incomes increasing by 5%. This economic expansion has led to increased consumer spending and business investment, creating new job opportunities across multiple sectors.',
  };

  // Use the Texas income data from Test 2 for verification
  const texasIncomeData = await getRegionalIncome('TX', '2022');

  console.log('Story to verify:');
  console.log('  Headline:', economicStory.headline);
  console.log('  Story excerpt:', economicStory.story.substring(0, 100) + '...');
  console.log('\nVerifying against BEA data...\n');

  const verification = verifyEconomicStory(economicStory, texasIncomeData);

  console.log('✓ Verified:', verification.verified);
  console.log('Confidence Score:', verification.confidence + '%');

  if (verification.flags && verification.flags.length > 0) {
    console.log('\nFlags:');
    verification.flags.forEach(flag => {
      console.log(`  - [${flag.type}] ${flag.message}`);
    });
  }

  if (verification.insights && verification.insights.length > 0) {
    console.log('\nInsights:');
    verification.insights.forEach(insight => {
      console.log(`  ${insight.type === 'api_unavailable' ? '⚠️' : '✓'} [${insight.type}] ${insight.message}`);
    });
  }

  if (verification.economicMetrics && Object.keys(verification.economicMetrics).length > 0) {
    console.log('\nEconomic Metrics Detected:');
    Object.entries(verification.economicMetrics).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');
console.log('=================================================');
console.log('BEA API Test Suite Complete');
console.log('=================================================');
console.log('\nNotes:');
console.log('- BEA API uses 36-character UserID for authentication');
console.log('- API provides GDP, personal income, and regional economic data');
console.log('- Free registration with instant activation');
console.log('- Graceful error handling ensures platform continues if API unavailable');
console.log('- Story verification continues with 50% confidence on API errors');
console.log('\nDocumentation: https://apps.bea.gov/api/docs/');
console.log('Registration: https://apps.bea.gov/api/signup/');
