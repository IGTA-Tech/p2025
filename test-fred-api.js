/**
 * FRED API Integration Test Suite
 *
 * Tests the Federal Reserve Economic Data (FRED) API integration
 * Federal Reserve Bank of St. Louis
 *
 * API Documentation: https://fred.stlouisfed.org/docs/api/
 * API Key Registration: https://fred.stlouisfed.org/docs/api/api_key.html
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Dynamic import to ensure env vars are loaded before module evaluation
const {
  FRED_SERIES,
  getSeriesObservations,
  getUnemploymentRate,
  getInflationRate,
  getFederalFundsRate,
  getGDP,
  getMortgageRates,
  searchSeries,
  getSeriesInfo,
  getMultipleIndicators,
  getEconomicBaseline,
  verifyEconomicStory,
} = await import('./src/services/fredApi.js');

console.log('=======================================================');
console.log('FRED API Integration Test Suite');
console.log('Federal Reserve Bank of St. Louis Economic Data');
console.log('=======================================================\n');

// Test 1: Get Unemployment Rate
console.log('Test 1: Get Current Unemployment Rate');
console.log('--------------------------------------');
try {
  const unemployment = await getUnemploymentRate({ limit: 12 });

  if (unemployment.error) {
    console.log('⚠️  Error:', unemployment.errorMessage);
    console.log('Error Type:', unemployment.errorType);
  } else {
    console.log('✓ Series ID:', unemployment.seriesId);
    console.log('Records Retrieved:', unemployment.count);
    console.log('Source:', unemployment.source);
    if (unemployment.observations && unemployment.observations.length > 0) {
      const latest = unemployment.observations[0];
      console.log('\nLatest Unemployment Rate:');
      console.log('  Date:', latest.date);
      console.log('  Rate:', latest.value + '%');
      console.log('\nRecent Trend (last 3 months):');
      unemployment.observations.slice(0, 3).forEach((obs) => {
        console.log(`  ${obs.date}: ${obs.value}%`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 2: Get Inflation Rate (CPI)
console.log('Test 2: Get Consumer Price Index (Inflation)');
console.log('----------------------------------------------');
try {
  const inflation = await getInflationRate({ limit: 12 });

  if (inflation.error) {
    console.log('⚠️  Error:', inflation.errorMessage);
    console.log('Error Type:', inflation.errorType);
  } else {
    console.log('✓ Series ID:', inflation.seriesId);
    console.log('Records Retrieved:', inflation.count);
    console.log('Source:', inflation.source);
    if (inflation.observations && inflation.observations.length > 0) {
      const latest = inflation.observations[0];
      console.log('\nLatest CPI:');
      console.log('  Date:', latest.date);
      console.log('  Index:', latest.value);

      // Calculate year-over-year inflation if we have 12 months
      if (inflation.observations.length >= 12) {
        const currentCPI = parseFloat(inflation.observations[0].value);
        const yearAgoCPI = parseFloat(inflation.observations[11].value);
        const yoyInflation = ((currentCPI - yearAgoCPI) / yearAgoCPI) * 100;
        console.log(`  Year-over-Year Inflation: ${yoyInflation.toFixed(2)}%`);
      }
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 3: Get Federal Funds Rate
console.log('Test 3: Get Federal Funds Interest Rate');
console.log('----------------------------------------');
try {
  const fedRate = await getFederalFundsRate({ limit: 12 });

  if (fedRate.error) {
    console.log('⚠️  Error:', fedRate.errorMessage);
    console.log('Error Type:', fedRate.errorType);
  } else {
    console.log('✓ Series ID:', fedRate.seriesId);
    console.log('Records Retrieved:', fedRate.count);
    console.log('Source:', fedRate.source);
    if (fedRate.observations && fedRate.observations.length > 0) {
      const latest = fedRate.observations[0];
      console.log('\nCurrent Federal Funds Rate:');
      console.log('  Date:', latest.date);
      console.log('  Rate:', latest.value + '%');
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 4: Get GDP
console.log('Test 4: Get Gross Domestic Product (GDP)');
console.log('-----------------------------------------');
try {
  const gdp = await getGDP({ limit: 8 });

  if (gdp.error) {
    console.log('⚠️  Error:', gdp.errorMessage);
    console.log('Error Type:', gdp.errorType);
  } else {
    console.log('✓ Series ID:', gdp.seriesId);
    console.log('Records Retrieved:', gdp.count);
    console.log('Source:', gdp.source);
    if (gdp.observations && gdp.observations.length > 0) {
      const latest = gdp.observations[0];
      console.log('\nLatest GDP:');
      console.log('  Date:', latest.date);
      console.log('  Value:', latest.value + ' (Billions of Dollars)');

      console.log('\nRecent GDP (last 4 quarters):');
      gdp.observations.slice(0, 4).forEach((obs) => {
        console.log(`  ${obs.date}: $${obs.value}B`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 5: Get Mortgage Rates
console.log('Test 5: Get 30-Year Mortgage Rates');
console.log('-----------------------------------');
try {
  const mortgage = await getMortgageRates({ limit: 12 });

  if (mortgage.error) {
    console.log('⚠️  Error:', mortgage.errorMessage);
    console.log('Error Type:', mortgage.errorType);
  } else {
    console.log('✓ Series ID:', mortgage.seriesId);
    console.log('Records Retrieved:', mortgage.count);
    console.log('Source:', mortgage.source);
    if (mortgage.observations && mortgage.observations.length > 0) {
      const latest = mortgage.observations[0];
      console.log('\nCurrent 30-Year Fixed Mortgage Rate:');
      console.log('  Date:', latest.date);
      console.log('  Rate:', latest.value + '%');
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 6: Search for Series
console.log('Test 6: Search for Employment-Related Series');
console.log('---------------------------------------------');
try {
  const searchResults = await searchSeries('unemployment rate', { limit: 5 });

  if (searchResults.error) {
    console.log('⚠️  Error:', searchResults.errorMessage);
    console.log('Error Type:', searchResults.errorType);
  } else {
    console.log('✓ Query:', searchResults.query);
    console.log('Results Found:', searchResults.count);
    console.log('Source:', searchResults.source);
    if (searchResults.series && searchResults.series.length > 0) {
      console.log('\nTop Search Results:');
      searchResults.series.slice(0, 5).forEach((series, index) => {
        console.log(`  ${index + 1}. ${series.id}: ${series.title}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 7: Get Series Info
console.log('Test 7: Get Detailed Series Information');
console.log('----------------------------------------');
try {
  const seriesInfo = await getSeriesInfo(FRED_SERIES.UNEMPLOYMENT_RATE);

  if (seriesInfo.error) {
    console.log('⚠️  Error:', seriesInfo.errorMessage);
    console.log('Error Type:', seriesInfo.errorType);
  } else {
    console.log('✓ Series ID:', seriesInfo.seriesId);
    console.log('Source:', seriesInfo.source);
    if (seriesInfo.info) {
      console.log('\nSeries Details:');
      console.log('  Title:', seriesInfo.info.title);
      console.log('  Units:', seriesInfo.info.units);
      console.log('  Frequency:', seriesInfo.info.frequency);
      console.log('  Seasonal Adjustment:', seriesInfo.info.seasonal_adjustment);
      console.log('  Last Updated:', seriesInfo.info.last_updated);
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 8: Get Multiple Indicators at Once
console.log('Test 8: Get Multiple Economic Indicators');
console.log('-----------------------------------------');
try {
  const indicators = await getMultipleIndicators(
    [FRED_SERIES.UNEMPLOYMENT_RATE, FRED_SERIES.CPI_INFLATION, FRED_SERIES.FEDERAL_FUNDS_RATE],
    { limit: 3 }
  );

  console.log('✓ Indicators Retrieved:', indicators.count);
  console.log('Source:', indicators.source);
  console.log('\nLatest Values:');

  Object.entries(indicators.indicators).forEach(([seriesId, data]) => {
    if (!data.error && data.observations && data.observations.length > 0) {
      const latest = data.observations[0];
      console.log(`  ${seriesId}: ${latest.value} (${latest.date})`);
    } else {
      console.log(`  ${seriesId}: unavailable`);
    }
  });
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 9: Get Economic Baseline Comparison
console.log('Test 9: Economic Baseline Comparison (Unemployment)');
console.log('----------------------------------------------------');
try {
  // Compare unemployment from 1 year ago to now
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const baselineDate = oneYearAgo.toISOString().split('T')[0];

  const baseline = await getEconomicBaseline(FRED_SERIES.UNEMPLOYMENT_RATE, baselineDate);

  if (baseline.error) {
    console.log('⚠️  Error:', baseline.errorMessage);
    console.log('Error Type:', baseline.errorType);
  } else {
    console.log('✓ Series ID:', baseline.seriesId);
    console.log('Source:', baseline.source);
    console.log('\nBaseline Comparison:');
    console.log(`  Baseline (${baseline.baselineDate}): ${baseline.baselineValue}%`);
    console.log(`  Current (${baseline.currentDate}): ${baseline.currentValue}%`);
    console.log(`  Change: ${baseline.absoluteChange >= 0 ? '+' : ''}${baseline.absoluteChange.toFixed(2)}%`);
    console.log(`  Percent Change: ${baseline.percentChange >= 0 ? '+' : ''}${baseline.percentChange.toFixed(2)}%`);
    console.log(`  Trend: ${baseline.trend}`);
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 10: Verify Economic Story
console.log('Test 10: Verify Economic Story (Inflation/Jobs)');
console.log('------------------------------------------------');
try {
  const economicStory = {
    headline: 'Rising inflation and job losses strain family budgets',
    story:
      'Our family is struggling with rising prices at the grocery store and gas pump. My spouse lost their job last month due to layoffs, and we cannot afford basic necessities anymore. The cost of living has increased dramatically while our income has decreased.',
  };

  // Get current unemployment data for verification
  const unemploymentData = await getUnemploymentRate({ limit: 12 });

  console.log('Story to verify:');
  console.log('  Headline:', economicStory.headline);
  console.log('  Story excerpt:', economicStory.story.substring(0, 100) + '...');
  console.log('\nVerifying against FRED economic data...\n');

  const verification = verifyEconomicStory(economicStory, unemploymentData);

  console.log('✓ Verified:', verification.verified);
  console.log('Confidence Score:', verification.confidence + '%');

  if (verification.flags && verification.flags.length > 0) {
    console.log('\nFlags:');
    verification.flags.forEach((flag) => {
      console.log(`  - ${flag}`);
    });
  }

  if (verification.insights && verification.insights.length > 0) {
    console.log('\nInsights:');
    verification.insights.forEach((insight) => {
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
console.log('=======================================================');
console.log('FRED API Test Suite Complete');
console.log('=======================================================');
console.log('\nNotes:');
console.log('- FRED API provides 800,000+ economic time series');
console.log('- Rate limit: 120 requests per minute');
console.log('- Free API with instant activation');
console.log('- Graceful error handling ensures platform continues if API unavailable');
console.log('- Story verification continues with 50% confidence on API errors');
console.log('\nDocumentation: https://fred.stlouisfed.org/docs/api/');
console.log('Registration: https://fred.stlouisfed.org/docs/api/api_key.html');
