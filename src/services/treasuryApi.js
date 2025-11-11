/**
 * Treasury Fiscal Data API Integration
 *
 * U.S. Department of Treasury - Official Federal Financial Data
 * API Documentation: https://fiscaldata.treasury.gov/api-documentation/
 *
 * Used for:
 * - Federal spending, debt, revenue tracking
 * - Budget impact analysis
 * - Project 2025 budget validation
 * - Policy financial impact verification
 *
 * Key Features:
 * - FREE API - No authentication required
 * - Real-time federal financial data
 * - Historical data back to 2005
 * - Daily updates for operating cash balance
 * - Monthly debt and revenue reports
 *
 * Rate Limiting:
 * - No explicit rate limits documented
 * - Reasonable use expected
 *
 * Error Handling:
 * - Exponential backoff retry logic (2s, 4s, 8s)
 * - 30-second timeout per request
 * - Graceful degradation on failures
 * - Never throws exceptions - returns error objects
 */

// Environment-agnostic API base URL configuration
const TREASURY_API_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_TREASURY_API_BASE) ||
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.VITE_TREASURY_API_BASE) ||
  'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';

// API Endpoints
const ENDPOINTS = {
  OPERATING_CASH: '/v1/accounting/dts/operating_cash_balance',
  DEPOSITS_WITHDRAWALS: '/v1/accounting/dts/deposits_withdrawals_operating_cash',
  DEBT_OUTSTANDING: '/v2/accounting/od/debt_outstanding',
  REVENUE_CATEGORIES: '/v1/accounting/mts/mts_table_4',
  INTEREST_RATES: '/v2/accounting/od/avg_interest_rates',
  DEFICIT: '/v1/accounting/mts/mts_table_5',
};

// Error handling configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 30000;

// Helper function: Sleep for retry delays
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Makes an HTTP request to the Treasury API with retry logic
 *
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} - API response data
 */
async function makeRequest(endpoint, params = {}, retryCount = 0) {
  const url = new URL(`${TREASURY_API_BASE}${endpoint}`);

  // Add query parameters
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if we should retry
    if (retryCount < MAX_RETRIES) {
      const isRetryable =
        error.name === 'AbortError' || // Timeout
        error.message.includes('fetch') || // Network error
        error.message.includes('500') || // Server error
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504');

      if (isRetryable) {
        const waitTime = RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.warn(
          `Treasury API request failed (attempt ${retryCount + 1}/${MAX_RETRIES}). Retrying in ${waitTime}ms...`
        );
        await sleep(waitTime);
        return makeRequest(endpoint, params, retryCount + 1);
      }
    }

    // Return error object instead of throwing
    return {
      error: true,
      errorMessage: error.message,
      errorType: error.name,
      endpoint,
      retryCount,
    };
  }
}

/**
 * Get Operating Cash Balance
 * Daily U.S. government operating cash balance
 *
 * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to latest)
 * @param {number} daysBack - Number of days of historical data to retrieve
 * @returns {Promise<Object>} - Operating cash balance data
 */
export async function getOperatingCashBalance(date = null, daysBack = 30) {
  try {
    const params = {
      fields: 'record_date,account_type,close_today_bal,open_today_bal',
      sort: '-record_date',
      page: { size: daysBack },
    };

    if (date) {
      params.filter = `record_date:eq:${date}`;
    }

    const response = await makeRequest(ENDPOINTS.OPERATING_CASH, params);

    if (response.error) {
      return {
        error: true,
        message: 'Treasury API unavailable for operating cash balance',
        errorDetails: response.errorMessage,
        source: 'Treasury Fiscal Data API',
        endpoint: 'operating_cash_balance',
      };
    }

    const records = response.data || [];

    // Calculate summary metrics
    const latestRecord = records[0];
    const cashBalances = records
      .filter((r) => r.account_type === 'Federal Reserve Account')
      .map((r) => parseFloat(r.close_today_bal) || 0);

    const avgBalance =
      cashBalances.length > 0
        ? cashBalances.reduce((a, b) => a + b, 0) / cashBalances.length
        : 0;

    const minBalance = cashBalances.length > 0 ? Math.min(...cashBalances) : 0;
    const maxBalance = cashBalances.length > 0 ? Math.max(...cashBalances) : 0;

    return {
      success: true,
      source: 'Treasury Fiscal Data API',
      endpoint: 'operating_cash_balance',
      data: {
        latest: latestRecord
          ? {
              date: latestRecord.record_date,
              accountType: latestRecord.account_type,
              closingBalance: parseFloat(latestRecord.close_today_bal) || 0,
              openingBalance: parseFloat(latestRecord.open_today_bal) || 0,
              formattedBalance: `$${(parseFloat(latestRecord.close_today_bal) / 1000).toFixed(2)}B`,
            }
          : null,
        historicalSummary: {
          daysAnalyzed: cashBalances.length,
          averageBalance: avgBalance,
          minBalance: minBalance,
          maxBalance: maxBalance,
          formattedAvg: `$${(avgBalance / 1000).toFixed(2)}B`,
        },
        historicalData: records.slice(0, 10).map((r) => ({
          date: r.record_date,
          accountType: r.account_type,
          balance: parseFloat(r.close_today_bal) || 0,
        })),
      },
      recordCount: records.length,
    };
  } catch (error) {
    return {
      error: true,
      message: 'Failed to retrieve operating cash balance',
      errorDetails: error.message,
      source: 'Treasury Fiscal Data API',
    };
  }
}

/**
 * Get Deposits and Withdrawals
 * Daily federal deposits and withdrawals affecting operating cash
 *
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Deposits and withdrawals data
 */
export async function getDepositsAndWithdrawals(startDate = null, endDate = null) {
  try {
    // Default to last 30 days if no dates provided
    if (!endDate) {
      endDate = new Date().toISOString().split('T')[0];
    }
    if (!startDate) {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      startDate = start.toISOString().split('T')[0];
    }

    const params = {
      fields: 'record_date,transaction_type,transaction_catg,transaction_today_amt',
      filter: `record_date:gte:${startDate},record_date:lte:${endDate}`,
      sort: '-record_date',
      page: { size: 1000 },
    };

    const response = await makeRequest(ENDPOINTS.DEPOSITS_WITHDRAWALS, params);

    if (response.error) {
      return {
        error: true,
        message: 'Treasury API unavailable for deposits/withdrawals',
        errorDetails: response.errorMessage,
        source: 'Treasury Fiscal Data API',
        endpoint: 'deposits_withdrawals',
      };
    }

    const records = response.data || [];

    // Calculate totals
    const deposits = records
      .filter((r) => r.transaction_type === 'Deposits')
      .reduce((sum, r) => sum + (parseFloat(r.transaction_today_amt) || 0), 0);

    const withdrawals = records
      .filter((r) => r.transaction_type === 'Withdrawals')
      .reduce((sum, r) => sum + (parseFloat(r.transaction_today_amt) || 0), 0);

    const netCashFlow = deposits - withdrawals;

    // Category breakdown
    const categoryTotals = {};
    records.forEach((r) => {
      const category = r.transaction_catg || 'Unknown';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { deposits: 0, withdrawals: 0 };
      }
      const amount = parseFloat(r.transaction_today_amt) || 0;
      if (r.transaction_type === 'Deposits') {
        categoryTotals[category].deposits += amount;
      } else if (r.transaction_type === 'Withdrawals') {
        categoryTotals[category].withdrawals += amount;
      }
    });

    return {
      success: true,
      source: 'Treasury Fiscal Data API',
      endpoint: 'deposits_withdrawals',
      dateRange: {
        startDate,
        endDate,
      },
      data: {
        summary: {
          totalDeposits: deposits,
          totalWithdrawals: withdrawals,
          netCashFlow: netCashFlow,
          formattedDeposits: `$${(deposits / 1000).toFixed(2)}B`,
          formattedWithdrawals: `$${(withdrawals / 1000).toFixed(2)}B`,
          formattedNetCashFlow: `$${(netCashFlow / 1000).toFixed(2)}B`,
        },
        categoryBreakdown: Object.entries(categoryTotals)
          .map(([category, amounts]) => ({
            category,
            deposits: amounts.deposits,
            withdrawals: amounts.withdrawals,
            net: amounts.deposits - amounts.withdrawals,
          }))
          .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
          .slice(0, 10),
        recentTransactions: records.slice(0, 20).map((r) => ({
          date: r.record_date,
          type: r.transaction_type,
          category: r.transaction_catg,
          amount: parseFloat(r.transaction_today_amt) || 0,
        })),
      },
      recordCount: records.length,
    };
  } catch (error) {
    return {
      error: true,
      message: 'Failed to retrieve deposits/withdrawals data',
      errorDetails: error.message,
      source: 'Treasury Fiscal Data API',
    };
  }
}

/**
 * Get Debt Outstanding
 * Total public debt outstanding
 *
 * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to latest)
 * @param {number} monthsBack - Number of months of historical data
 * @returns {Promise<Object>} - Debt outstanding data
 */
export async function getDebtOutstanding(date = null, monthsBack = 12) {
  try {
    const params = {
      fields: 'record_date,debt_held_public_amt,intragov_hold_amt,tot_pub_debt_out_amt',
      sort: '-record_date',
      page: { size: monthsBack * 30 }, // Approximate
    };

    if (date) {
      params.filter = `record_date:eq:${date}`;
    }

    const response = await makeRequest(ENDPOINTS.DEBT_OUTSTANDING, params);

    if (response.error) {
      return {
        error: true,
        message: 'Treasury API unavailable for debt outstanding',
        errorDetails: response.errorMessage,
        source: 'Treasury Fiscal Data API',
        endpoint: 'debt_outstanding',
      };
    }

    const records = response.data || [];
    const latestRecord = records[0];

    // Calculate debt growth
    let debtGrowth = null;
    if (records.length >= 2) {
      const latest = parseFloat(latestRecord.tot_pub_debt_out_amt) || 0;
      const earliest = parseFloat(records[records.length - 1].tot_pub_debt_out_amt) || 0;
      if (earliest > 0) {
        debtGrowth = ((latest - earliest) / earliest) * 100;
      }
    }

    return {
      success: true,
      source: 'Treasury Fiscal Data API',
      endpoint: 'debt_outstanding',
      data: {
        latest: latestRecord
          ? {
              date: latestRecord.record_date,
              totalPublicDebt: parseFloat(latestRecord.tot_pub_debt_out_amt) || 0,
              debtHeldByPublic: parseFloat(latestRecord.debt_held_public_amt) || 0,
              intragovernmentalHoldings: parseFloat(latestRecord.intragov_hold_amt) || 0,
              formattedTotal: `$${(parseFloat(latestRecord.tot_pub_debt_out_amt) / 1000000).toFixed(2)}T`,
              formattedPublic: `$${(parseFloat(latestRecord.debt_held_public_amt) / 1000000).toFixed(2)}T`,
            }
          : null,
        historicalTrend: {
          monthsAnalyzed: records.length,
          debtGrowthPercent: debtGrowth,
          debtGrowthFormatted: debtGrowth ? `${debtGrowth > 0 ? '+' : ''}${debtGrowth.toFixed(2)}%` : null,
        },
        historicalData: records.slice(0, 12).map((r) => ({
          date: r.record_date,
          totalDebt: parseFloat(r.tot_pub_debt_out_amt) || 0,
          publicDebt: parseFloat(r.debt_held_public_amt) || 0,
        })),
      },
      recordCount: records.length,
    };
  } catch (error) {
    return {
      error: true,
      message: 'Failed to retrieve debt outstanding data',
      errorDetails: error.message,
      source: 'Treasury Fiscal Data API',
    };
  }
}

/**
 * Get Revenue by Category
 * Monthly federal revenue by category from Monthly Treasury Statement
 *
 * @param {string} fiscalYear - Fiscal year (e.g., '2025')
 * @param {string} fiscalMonth - Fiscal month (1-12)
 * @returns {Promise<Object>} - Revenue categories data
 */
export async function getRevenueCategories(fiscalYear = null, fiscalMonth = null) {
  try {
    // Default to current fiscal year if not provided
    if (!fiscalYear) {
      const now = new Date();
      fiscalYear = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
    }

    const params = {
      fields: 'record_date,classification_desc,current_fytd_net_rcpt_amt,prior_fytd_net_rcpt_amt',
      filter: `record_fiscal_year:eq:${fiscalYear}`,
      sort: '-record_date,-current_fytd_net_rcpt_amt',
      page: { size: 100 },
    };

    if (fiscalMonth) {
      params.filter += `,record_fiscal_month:eq:${fiscalMonth}`;
    }

    const response = await makeRequest(ENDPOINTS.REVENUE_CATEGORIES, params);

    if (response.error) {
      return {
        error: true,
        message: 'Treasury API unavailable for revenue categories',
        errorDetails: response.errorMessage,
        source: 'Treasury Fiscal Data API',
        endpoint: 'revenue_categories',
      };
    }

    const records = response.data || [];

    // Calculate totals
    const currentYearTotal = records.reduce(
      (sum, r) => sum + (parseFloat(r.current_fytd_net_rcpt_amt) || 0),
      0
    );
    const priorYearTotal = records.reduce(
      (sum, r) => sum + (parseFloat(r.prior_fytd_net_rcpt_amt) || 0),
      0
    );

    const yearOverYearChange =
      priorYearTotal > 0 ? ((currentYearTotal - priorYearTotal) / priorYearTotal) * 100 : null;

    // Top revenue categories
    const topCategories = records
      .filter((r) => r.classification_desc && r.current_fytd_net_rcpt_amt)
      .slice(0, 10)
      .map((r) => ({
        category: r.classification_desc,
        currentFYTD: parseFloat(r.current_fytd_net_rcpt_amt) || 0,
        priorFYTD: parseFloat(r.prior_fytd_net_rcpt_amt) || 0,
        change:
          parseFloat(r.prior_fytd_net_rcpt_amt) > 0
            ? (
                ((parseFloat(r.current_fytd_net_rcpt_amt) - parseFloat(r.prior_fytd_net_rcpt_amt)) /
                  parseFloat(r.prior_fytd_net_rcpt_amt)) *
                100
              ).toFixed(2) + '%'
            : 'N/A',
      }));

    return {
      success: true,
      source: 'Treasury Fiscal Data API',
      endpoint: 'revenue_categories',
      fiscalYear,
      fiscalMonth: fiscalMonth || 'All',
      data: {
        summary: {
          currentFYTDTotal: currentYearTotal,
          priorFYTDTotal: priorYearTotal,
          yearOverYearChange: yearOverYearChange,
          formattedCurrent: `$${(currentYearTotal / 1000000).toFixed(2)}T`,
          formattedPrior: `$${(priorYearTotal / 1000000).toFixed(2)}T`,
          formattedChange: yearOverYearChange
            ? `${yearOverYearChange > 0 ? '+' : ''}${yearOverYearChange.toFixed(2)}%`
            : 'N/A',
        },
        topCategories,
      },
      recordCount: records.length,
    };
  } catch (error) {
    return {
      error: true,
      message: 'Failed to retrieve revenue categories',
      errorDetails: error.message,
      source: 'Treasury Fiscal Data API',
    };
  }
}

/**
 * Get Average Interest Rates
 * Average interest rates on U.S. Treasury securities
 *
 * @param {string} securityType - Type of security (e.g., 'Treasury Notes', 'Treasury Bills')
 * @param {number} monthsBack - Number of months of historical data
 * @returns {Promise<Object>} - Interest rates data
 */
export async function getAverageInterestRates(securityType = null, monthsBack = 12) {
  try {
    const params = {
      fields: 'record_date,security_type_desc,security_desc,avg_interest_rate_amt',
      sort: '-record_date',
      page: { size: monthsBack * 30 },
    };

    if (securityType) {
      params.filter = `security_type_desc:eq:${securityType}`;
    }

    const response = await makeRequest(ENDPOINTS.INTEREST_RATES, params);

    if (response.error) {
      return {
        error: true,
        message: 'Treasury API unavailable for interest rates',
        errorDetails: response.errorMessage,
        source: 'Treasury Fiscal Data API',
        endpoint: 'interest_rates',
      };
    }

    const records = response.data || [];

    // Group by security type
    const bySecurityType = {};
    records.forEach((r) => {
      const type = r.security_type_desc || 'Unknown';
      if (!bySecurityType[type]) {
        bySecurityType[type] = [];
      }
      bySecurityType[type].push({
        date: r.record_date,
        security: r.security_desc,
        rate: parseFloat(r.avg_interest_rate_amt) || 0,
      });
    });

    // Calculate averages by type
    const averagesByType = Object.entries(bySecurityType).map(([type, data]) => {
      const avgRate = data.reduce((sum, d) => sum + d.rate, 0) / data.length;
      const latestRate = data[0]?.rate || 0;
      return {
        securityType: type,
        latestRate: latestRate.toFixed(3) + '%',
        averageRate: avgRate.toFixed(3) + '%',
        recordCount: data.length,
      };
    });

    return {
      success: true,
      source: 'Treasury Fiscal Data API',
      endpoint: 'interest_rates',
      securityType: securityType || 'All',
      data: {
        averagesByType: averagesByType.slice(0, 10),
        recentRates: records.slice(0, 20).map((r) => ({
          date: r.record_date,
          securityType: r.security_type_desc,
          security: r.security_desc,
          rate: parseFloat(r.avg_interest_rate_amt) || 0,
          formattedRate: (parseFloat(r.avg_interest_rate_amt) || 0).toFixed(3) + '%',
        })),
      },
      recordCount: records.length,
    };
  } catch (error) {
    return {
      error: true,
      message: 'Failed to retrieve interest rates',
      errorDetails: error.message,
      source: 'Treasury Fiscal Data API',
    };
  }
}

/**
 * Calculate Baseline Comparison
 * Compare Treasury metrics before and after a baseline date (default: Jan 1, 2025)
 *
 * @param {string} metric - Metric to compare ('debt', 'revenue', 'cash')
 * @param {string} baselineDate - Baseline date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Baseline comparison data
 */
export async function calculateBaselineComparison(metric = 'debt', baselineDate = '2025-01-01') {
  try {
    let beforeData = null;
    let afterData = null;

    const baseline = new Date(baselineDate);
    const beforeDate = new Date(baseline);
    beforeDate.setDate(beforeDate.getDate() - 30);
    const afterDate = new Date();

    switch (metric) {
      case 'debt':
        beforeData = await getDebtOutstanding(beforeDate.toISOString().split('T')[0], 1);
        afterData = await getDebtOutstanding(afterDate.toISOString().split('T')[0], 1);
        break;

      case 'cash':
        beforeData = await getOperatingCashBalance(beforeDate.toISOString().split('T')[0], 1);
        afterData = await getOperatingCashBalance(afterDate.toISOString().split('T')[0], 1);
        break;

      case 'revenue':
        const beforeYear = beforeDate.getMonth() >= 9 ? beforeDate.getFullYear() + 1 : beforeDate.getFullYear();
        const afterYear = afterDate.getMonth() >= 9 ? afterDate.getFullYear() + 1 : afterDate.getFullYear();
        beforeData = await getRevenueCategories(beforeYear.toString());
        afterData = await getRevenueCategories(afterYear.toString());
        break;

      default:
        return {
          error: true,
          message: `Unknown metric: ${metric}. Supported: debt, cash, revenue`,
        };
    }

    // Check for errors
    if (beforeData?.error || afterData?.error) {
      return {
        status: 'partial',
        message: 'Unable to complete baseline comparison - Treasury API unavailable',
        metric,
        baselineDate,
        errors: {
          before: beforeData?.error ? beforeData.errorMessage : null,
          after: afterData?.error ? afterData.errorMessage : null,
        },
      };
    }

    // Extract values based on metric
    let beforeValue, afterValue, unit;

    if (metric === 'debt') {
      beforeValue = beforeData.data?.latest?.totalPublicDebt || 0;
      afterValue = afterData.data?.latest?.totalPublicDebt || 0;
      unit = 'millions';
    } else if (metric === 'cash') {
      beforeValue = beforeData.data?.latest?.closingBalance || 0;
      afterValue = afterData.data?.latest?.closingBalance || 0;
      unit = 'millions';
    } else if (metric === 'revenue') {
      beforeValue = beforeData.data?.summary?.currentFYTDTotal || 0;
      afterValue = afterData.data?.summary?.currentFYTDTotal || 0;
      unit = 'millions';
    }

    const absoluteChange = afterValue - beforeValue;
    const percentChange = beforeValue > 0 ? (absoluteChange / beforeValue) * 100 : 0;

    return {
      status: 'complete',
      metric,
      baselineDate,
      unit,
      data: {
        before: {
          value: beforeValue,
          formatted:
            unit === 'millions' ? `$${(beforeValue / 1000000).toFixed(2)}T` : beforeValue.toFixed(2),
        },
        after: {
          value: afterValue,
          formatted:
            unit === 'millions' ? `$${(afterValue / 1000000).toFixed(2)}T` : afterValue.toFixed(2),
        },
        change: {
          absolute: absoluteChange,
          percent: percentChange,
          formattedAbsolute:
            unit === 'millions' ? `$${(absoluteChange / 1000000).toFixed(2)}T` : absoluteChange.toFixed(2),
          formattedPercent: `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%`,
          trend: percentChange > 5 ? 'significant_increase' : percentChange < -5 ? 'significant_decrease' : 'stable',
        },
      },
      source: 'Treasury Fiscal Data API',
    };
  } catch (error) {
    return {
      error: true,
      message: 'Failed to calculate baseline comparison',
      errorDetails: error.message,
      metric,
      baselineDate,
    };
  }
}

/**
 * Verify Budget Impact Story
 * Verify citizen story about federal budget impacts using Treasury data
 *
 * @param {Object} story - Citizen story object with headline and text
 * @param {Object} treasuryData - Treasury API data to verify against (optional)
 * @returns {Promise<Object>} - Verification result with confidence score
 */
export async function verifyBudgetStory(story, treasuryData = null) {
  try {
    const headline = story.headline || '';
    const storyText = story.story || '';
    const combinedText = `${headline} ${storyText}`.toLowerCase();

    // If no Treasury data provided, fetch latest data
    if (!treasuryData) {
      treasuryData = {
        debt: await getDebtOutstanding(),
        cash: await getOperatingCashBalance(),
        revenue: await getRevenueCategories(),
      };
    }

    const insights = [];
    const flags = [];
    let confidence = 50; // Base confidence

    // Check for debt-related claims
    if (combinedText.includes('debt') || combinedText.includes('deficit')) {
      if (!treasuryData.debt?.error) {
        insights.push({
          type: 'debt_data_available',
          message: `Current public debt: ${treasuryData.debt.data?.latest?.formattedTotal || 'N/A'}`,
          confidence: 90,
        });
        confidence += 15;

        if (treasuryData.debt.data?.historicalTrend?.debtGrowthPercent) {
          const growth = treasuryData.debt.data.historicalTrend.debtGrowthPercent;
          insights.push({
            type: 'debt_trend',
            message: `Debt growth: ${treasuryData.debt.data.historicalTrend.debtGrowthFormatted}`,
            confidence: 85,
          });

          if ((combinedText.includes('increas') && growth > 0) || (combinedText.includes('decreas') && growth < 0)) {
            confidence += 10;
            insights.push({
              type: 'trend_matches_claim',
              message: 'Debt trend aligns with citizen claim',
              confidence: 95,
            });
          }
        }
      } else {
        flags.push('Treasury debt data unavailable - limited verification');
        confidence -= 10;
      }
    }

    // Check for revenue/spending claims
    if (combinedText.includes('revenue') || combinedText.includes('spending') || combinedText.includes('budget')) {
      if (!treasuryData.revenue?.error) {
        insights.push({
          type: 'revenue_data_available',
          message: `Current fiscal year revenue: ${treasuryData.revenue.data?.summary?.formattedCurrent || 'N/A'}`,
          confidence: 90,
        });
        confidence += 15;

        if (treasuryData.revenue.data?.summary?.yearOverYearChange) {
          const change = treasuryData.revenue.data.summary.yearOverYearChange;
          insights.push({
            type: 'revenue_trend',
            message: `Year-over-year change: ${treasuryData.revenue.data.summary.formattedChange}`,
            confidence: 85,
          });
        }
      } else {
        flags.push('Treasury revenue data unavailable - limited verification');
        confidence -= 10;
      }
    }

    // Check for cash flow/liquidity claims
    if (combinedText.includes('cash') || combinedText.includes('liquidity') || combinedText.includes('balance')) {
      if (!treasuryData.cash?.error) {
        insights.push({
          type: 'cash_data_available',
          message: `Operating cash balance: ${treasuryData.cash.data?.latest?.formattedBalance || 'N/A'}`,
          confidence: 90,
        });
        confidence += 10;
      } else {
        flags.push('Treasury cash data unavailable - limited verification');
        confidence -= 10;
      }
    }

    // Baseline comparison if story mentions policy changes or Jan 2025
    if (combinedText.includes('2025') || combinedText.includes('policy') || combinedText.includes('administration')) {
      const baseline = await calculateBaselineComparison('debt', '2025-01-01');
      if (baseline.status === 'complete') {
        insights.push({
          type: 'baseline_comparison',
          message: `Debt change since Jan 1, 2025: ${baseline.data.change.formattedPercent}`,
          confidence: 95,
        });
        confidence += 15;

        if (
          (combinedText.includes('increas') && baseline.data.change.trend === 'significant_increase') ||
          (combinedText.includes('decreas') && baseline.data.change.trend === 'significant_decrease')
        ) {
          insights.push({
            type: 'baseline_confirms_claim',
            message: 'Treasury baseline data confirms claimed trend',
            confidence: 100,
          });
          confidence += 10;
        }
      }
    }

    // Cap confidence at 100
    confidence = Math.min(confidence, 100);

    // Determine verification status
    const verified = confidence >= 70;

    if (insights.length === 0) {
      flags.push('No specific Treasury metrics found in story - general budget claim');
      insights.push({
        type: 'api_unavailable',
        message: 'Story does not contain specific Treasury-verifiable claims',
        confidence: 50,
      });
    }

    return {
      verified,
      confidence,
      flags,
      insights,
      treasuryMetrics: {
        debtAvailable: !treasuryData.debt?.error,
        revenueAvailable: !treasuryData.revenue?.error,
        cashAvailable: !treasuryData.cash?.error,
        insightsGenerated: insights.length,
      },
      source: 'Treasury Fiscal Data API',
      verificationMethod: 'multi_metric_treasury_validation',
    };
  } catch (error) {
    return {
      verified: false,
      confidence: 50,
      flags: ['Verification error - using fallback confidence'],
      insights: [
        {
          type: 'error',
          message: `Treasury verification error: ${error.message}`,
          confidence: 50,
        },
      ],
      error: error.message,
    };
  }
}

// Export all functions
export default {
  getOperatingCashBalance,
  getDepositsAndWithdrawals,
  getDebtOutstanding,
  getRevenueCategories,
  getAverageInterestRates,
  calculateBaselineComparison,
  verifyBudgetStory,
};
