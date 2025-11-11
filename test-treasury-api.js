/**
 * Treasury Fiscal Data API Integration Test Suite
 *
 * Tests federal budget and financial data tracking
 * API Documentation: https://fiscaldata.treasury.gov/api-documentation/
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Dynamic import to ensure env vars are loaded
const {
  getOperatingCashBalance,
  getDepositsAndWithdrawals,
  getDebtOutstanding,
  getRevenueCategories,
  getAverageInterestRates,
  calculateBaselineComparison,
  verifyBudgetStory,
} = await import('./src/services/treasuryApi.js');

console.log('=======================================================');
console.log('Treasury Fiscal Data API Integration Test Suite');
console.log('U.S. Department of Treasury - Official Federal Data');
console.log('=======================================================\n');

console.log('✓ FREE API - No authentication required');
console.log('✓ Real-time federal financial data');
console.log('✓ Critical for Project 2025 budget validation\n');

// Test 1: Operating Cash Balance
console.log('Test 1: Get Operating Cash Balance');
console.log('-----------------------------------');
try {
  const cashBalance = await getOperatingCashBalance(null, 30);

  if (cashBalance.error) {
    console.log('⚠️  Error:', cashBalance.message);
    console.log('Error Details:', cashBalance.errorDetails);
  } else {
    console.log('✓ Source:', cashBalance.source);
    console.log('Records Retrieved:', cashBalance.recordCount);

    if (cashBalance.data?.latest) {
      console.log('\nLatest Operating Cash:');
      console.log('  Date:', cashBalance.data.latest.date);
      console.log('  Account Type:', cashBalance.data.latest.accountType);
      console.log('  Closing Balance:', cashBalance.data.latest.formattedBalance);
      console.log('  Opening Balance:', `$${(cashBalance.data.latest.openingBalance / 1000).toFixed(2)}B`);
    }

    if (cashBalance.data?.historicalSummary) {
      console.log('\nHistorical Summary (30 days):');
      console.log('  Average Balance:', cashBalance.data.historicalSummary.formattedAvg);
      console.log('  Min Balance:', `$${(cashBalance.data.historicalSummary.minBalance / 1000).toFixed(2)}B`);
      console.log('  Max Balance:', `$${(cashBalance.data.historicalSummary.maxBalance / 1000).toFixed(2)}B`);
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 2: Deposits and Withdrawals
console.log('Test 2: Get Deposits and Withdrawals');
console.log('-------------------------------------');
try {
  // Last 30 days
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const transactions = await getDepositsAndWithdrawals(startDate, endDate);

  if (transactions.error) {
    console.log('⚠️  Error:', transactions.message);
    console.log('Error Details:', transactions.errorDetails);
  } else {
    console.log('✓ Source:', transactions.source);
    console.log('Date Range:', `${transactions.dateRange.startDate} to ${transactions.dateRange.endDate}`);
    console.log('Records Retrieved:', transactions.recordCount);

    if (transactions.data?.summary) {
      console.log('\nSummary:');
      console.log('  Total Deposits:', transactions.data.summary.formattedDeposits);
      console.log('  Total Withdrawals:', transactions.data.summary.formattedWithdrawals);
      console.log('  Net Cash Flow:', transactions.data.summary.formattedNetCashFlow);
    }

    if (transactions.data?.categoryBreakdown && transactions.data.categoryBreakdown.length > 0) {
      console.log('\nTop Categories by Net Impact:');
      transactions.data.categoryBreakdown.slice(0, 5).forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.category}`);
        console.log(`     Net: $${(cat.net / 1000).toFixed(2)}B`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 3: Debt Outstanding
console.log('Test 3: Get Federal Debt Outstanding');
console.log('-------------------------------------');
try {
  const debt = await getDebtOutstanding(null, 12);

  if (debt.error) {
    console.log('⚠️  Error:', debt.message);
    console.log('Error Details:', debt.errorDetails);
  } else {
    console.log('✓ Source:', debt.source);
    console.log('Records Retrieved:', debt.recordCount);

    if (debt.data?.latest) {
      console.log('\nLatest Debt Data:');
      console.log('  Date:', debt.data.latest.date);
      console.log('  Total Public Debt:', debt.data.latest.formattedTotal);
      console.log('  Debt Held by Public:', debt.data.latest.formattedPublic);
      console.log('  Intragovernmental:', debt.data.latest.formattedPublic);
    }

    if (debt.data?.historicalTrend) {
      console.log('\nHistorical Trend:');
      console.log('  Months Analyzed:', debt.data.historicalTrend.monthsAnalyzed);
      if (debt.data.historicalTrend.debtGrowthFormatted) {
        console.log('  Debt Growth:', debt.data.historicalTrend.debtGrowthFormatted);
      }
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 4: Revenue Categories
console.log('Test 4: Get Revenue Categories');
console.log('-------------------------------');
try {
  const now = new Date();
  const fiscalYear = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();

  const revenue = await getRevenueCategories(fiscalYear.toString());

  if (revenue.error) {
    console.log('⚠️  Error:', revenue.message);
    console.log('Error Details:', revenue.errorDetails);
  } else {
    console.log('✓ Source:', revenue.source);
    console.log('Fiscal Year:', revenue.fiscalYear);
    console.log('Records Retrieved:', revenue.recordCount);

    if (revenue.data?.summary) {
      console.log('\nRevenue Summary:');
      console.log('  Current FY Total:', revenue.data.summary.formattedCurrent);
      console.log('  Prior FY Total:', revenue.data.summary.formattedPrior);
      console.log('  Year-over-Year Change:', revenue.data.summary.formattedChange);
    }

    if (revenue.data?.topCategories && revenue.data.topCategories.length > 0) {
      console.log('\nTop Revenue Categories:');
      revenue.data.topCategories.slice(0, 5).forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.category}`);
        console.log(`     Current: $${(cat.currentFYTD / 1000000).toFixed(2)}T`);
        console.log(`     Change: ${cat.change}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 5: Average Interest Rates
console.log('Test 5: Get Average Interest Rates');
console.log('-----------------------------------');
try {
  const interestRates = await getAverageInterestRates(null, 6);

  if (interestRates.error) {
    console.log('⚠️  Error:', interestRates.message);
    console.log('Error Details:', interestRates.errorDetails);
  } else {
    console.log('✓ Source:', interestRates.source);
    console.log('Security Type:', interestRates.securityType);
    console.log('Records Retrieved:', interestRates.recordCount);

    if (interestRates.data?.averagesByType && interestRates.data.averagesByType.length > 0) {
      console.log('\nAverage Rates by Security Type:');
      interestRates.data.averagesByType.slice(0, 5).forEach((type) => {
        console.log(`  ${type.securityType}:`);
        console.log(`    Latest: ${type.latestRate}`);
        console.log(`    Average: ${type.averageRate}`);
      });
    }

    if (interestRates.data?.recentRates && interestRates.data.recentRates.length > 0) {
      console.log('\nRecent Interest Rates:');
      interestRates.data.recentRates.slice(0, 3).forEach((rate) => {
        console.log(`  ${rate.date} - ${rate.security}: ${rate.formattedRate}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 6: Baseline Comparison (Jan 1, 2025)
console.log('Test 6: Baseline Comparison (Jan 1, 2025)');
console.log('------------------------------------------');
try {
  console.log('Comparing federal debt before/after Jan 1, 2025...\n');

  const baseline = await calculateBaselineComparison('debt', '2025-01-01');

  if (baseline.error) {
    console.log('⚠️  Error:', baseline.message);
    console.log('Error Details:', baseline.errorDetails);
  } else if (baseline.status === 'partial') {
    console.log('⚠️  Partial data:', baseline.message);
    if (baseline.errors) {
      console.log('Errors:', JSON.stringify(baseline.errors, null, 2));
    }
  } else {
    console.log('✓ Status:', baseline.status);
    console.log('Metric:', baseline.metric);
    console.log('Baseline Date:', baseline.baselineDate);

    if (baseline.data) {
      console.log('\nComparison Results:');
      console.log('  Before Jan 1, 2025:', baseline.data.before.formatted);
      console.log('  After Jan 1, 2025:', baseline.data.after.formatted);
      console.log('  Absolute Change:', baseline.data.change.formattedAbsolute);
      console.log('  Percent Change:', baseline.data.change.formattedPercent);
      console.log('  Trend:', baseline.data.change.trend);
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 7: Verify Budget Impact Story
console.log('Test 7: Verify Budget Impact Story');
console.log('-----------------------------------');
try {
  const citizenStory = {
    headline: 'Federal debt continues to rise under new administration',
    story:
      'Since the new administration took office in January 2025, federal debt has increased significantly. Government spending has accelerated while revenue growth remains flat, contributing to a widening budget deficit.',
  };

  console.log('Story to verify:');
  console.log('  Headline:', citizenStory.headline);
  console.log('  Story excerpt:', citizenStory.story.substring(0, 100) + '...\n');

  console.log('Verifying against Treasury data...\n');

  const verification = await verifyBudgetStory(citizenStory);

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

  if (verification.treasuryMetrics) {
    console.log('\nTreasury Metrics Used:');
    Object.entries(verification.treasuryMetrics).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');
console.log('=======================================================');
console.log('Treasury API Test Suite Complete');
console.log('=======================================================');
console.log('\nKey Features Tested:');
console.log('✓ Operating cash balance tracking');
console.log('✓ Deposits and withdrawals analysis');
console.log('✓ Federal debt outstanding');
console.log('✓ Revenue categories and trends');
console.log('✓ Average interest rates on securities');
console.log('✓ Baseline comparison (pre/post Jan 1, 2025)');
console.log('✓ Budget impact story verification');
console.log('\nAPI Features:');
console.log('- FREE - No API key required');
console.log('- Real-time federal financial data');
console.log('- Historical data back to 2005');
console.log('- Daily updates for operating cash');
console.log('- Monthly debt and revenue reports');
console.log('\nIntegration Notes:');
console.log('- Validates Project 2025 budget impacts');
console.log('- Cross-references with 13 other federal APIs');
console.log('- Critical for financial policy verification');
console.log('\nDocumentation: https://fiscaldata.treasury.gov/api-documentation/');
