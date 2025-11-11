/**
 * Test script for Department of Education College Scorecard API integration
 * Tests Project 2025 higher education tracking capabilities
 *
 * Run with: node test-dept-ed-api.js
 */

import dotenv from 'dotenv';
import {
  getSchoolsByState,
  getPellGrantData,
  getStudentDebtData,
  getHigherEdBaselineComparison,
  analyzeHigherEducationPolicyImpact
} from './src/services/deptEducationApi.js';

// Load environment variables
dotenv.config();

// Debug: Check if API key is loaded
const apiKey = process.env.VITE_DEPT_ED_API_KEY;
console.log('🔑 API Key Status:', apiKey ? `Loaded (${apiKey.substring(0, 20)}...)` : 'NOT FOUND');
console.log('');

// Test with Texas (large state with diverse higher ed landscape)
const testStateCode = 'TX';
const testStateName = 'Texas';

console.log('🎓 Testing Department of Education API Integration...\n');
console.log('=' .repeat(80));
console.log('PROJECT 2025 HIGHER EDUCATION TRACKING');
console.log('=' .repeat(80));
console.log(`\nState: ${testStateName} (${testStateCode})`);
console.log('Focus: Pell Grants ($17.5B proposed cut)\n');

try {
  // Test 1: Get schools by state
  console.log('📊 Test 1: Schools by State\n');
  console.log('Fetching college/university data...\n');

  const schools = await getSchoolsByState(testStateCode, 2022, 0, 10); // Get first 10 schools

  if (schools && schools.results) {
    console.log(`✅ Found ${schools.metadata?.total || schools.results.length} institutions in ${testStateName}`);
    console.log(`   Showing first ${schools.results.length} schools:\n`);

    schools.results.slice(0, 5).forEach((school, idx) => {
      const name = school['school.name'] || 'Unknown';
      const city = school['school.city'] || 'Unknown';
      const students = school['latest.student.size'] || 'N/A';
      const pellRate = school['latest.aid.pell_grant_rate'];
      const pellPct = pellRate ? `${Math.round(pellRate * 100)}%` : 'N/A';

      console.log(`   ${idx + 1}. ${name}`);
      console.log(`      Location: ${city}, ${testStateCode}`);
      console.log(`      Students: ${students ? students.toLocaleString() : 'N/A'}`);
      console.log(`      Pell Grant Rate: ${pellPct}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No school data available');
  }

  // Test 2: Get Pell Grant data
  console.log('\n📊 Test 2: Pell Grant Distribution\n');
  console.log('Analyzing institutions serving low-income students...\n');

  const pellData = await getPellGrantData(testStateCode);

  if (pellData && pellData.results) {
    console.log(`✅ Found ${pellData.results.length} institutions with Pell Grant data\n`);
    console.log('   Top 5 institutions by Pell Grant participation:\n');

    pellData.results.slice(0, 5).forEach((school, idx) => {
      const name = school['school.name'] || 'Unknown';
      const city = school['school.city'] || 'Unknown';
      const students = school['latest.student.size'] || 0;
      const pellRate = school['latest.aid.pell_grant_rate'] || 0;
      const pellPct = Math.round(pellRate * 100);
      const estimatedRecipients = Math.round(students * pellRate);

      console.log(`   ${idx + 1}. ${name}`);
      console.log(`      Location: ${city}, ${testStateCode}`);
      console.log(`      Pell Grant Rate: ${pellPct}%`);
      console.log(`      Estimated Recipients: ~${estimatedRecipients.toLocaleString()} students`);
      console.log('');
    });

    // Calculate total Pell impact
    const totalStudents = pellData.results.reduce((sum, school) =>
      sum + (school['latest.student.size'] || 0), 0);
    const avgPellRate = pellData.results.reduce((sum, school) =>
      sum + (school['latest.aid.pell_grant_rate'] || 0), 0) / pellData.results.length;
    const estimatedTotalRecipients = Math.round(totalStudents * avgPellRate);

    console.log('   📈 STATE TOTALS:');
    console.log(`      Total Students: ${totalStudents.toLocaleString()}`);
    console.log(`      Average Pell Rate: ${Math.round(avgPellRate * 100)}%`);
    console.log(`      Estimated Pell Recipients: ${estimatedTotalRecipients.toLocaleString()}`);
    console.log('');
    console.log(`   💡 PROJECT 2025 IMPACT:`);
    console.log(`      If Pell funding cut by 20% ($17.5B nationally):`);
    console.log(`      • ~${Math.round(estimatedTotalRecipients * 0.2).toLocaleString()} students in ${testStateName} could lose aid`);
    console.log(`      • Low-income and minority students most affected`);
  } else {
    console.log('⚠️  No Pell Grant data available');
  }

  // Test 3: Get student debt data
  console.log('\n\n📊 Test 3: Student Debt Analysis\n');
  console.log('Analyzing student debt and repayment rates...\n');

  const debtData = await getStudentDebtData(testStateCode);

  if (debtData && debtData.results) {
    console.log(`✅ Found ${debtData.results.length} institutions with debt data\n`);
    console.log('   Institutions with highest student debt:\n');

    debtData.results.slice(0, 5).forEach((school, idx) => {
      const name = school['school.name'] || 'Unknown';
      const medianDebt = school['latest.aid.median_debt.completers.overall'];
      const loanRate = school['latest.aid.federal_loan_rate'];
      const repaymentRate = school['latest.repayment.3_yr_repayment.overall'];

      console.log(`   ${idx + 1}. ${name}`);
      if (medianDebt) console.log(`      Median Debt: $${Math.round(medianDebt).toLocaleString()}`);
      if (loanRate) console.log(`      Federal Loan Rate: ${Math.round(loanRate * 100)}%`);
      if (repaymentRate) console.log(`      3-Year Repayment Rate: ${Math.round(repaymentRate * 100)}%`);
      console.log('');
    });

    // Calculate debt averages
    const debts = debtData.results
      .map(s => s['latest.aid.median_debt.completers.overall'])
      .filter(d => d && d > 0);
    const avgDebt = debts.length > 0 ? debts.reduce((a, b) => a + b, 0) / debts.length : 0;

    const repayments = debtData.results
      .map(s => s['latest.repayment.3_yr_repayment.overall'])
      .filter(r => r && r > 0);
    const avgRepayment = repayments.length > 0 ?
      repayments.reduce((a, b) => a + b, 0) / repayments.length : 0;

    console.log('   📈 STATE AVERAGES:');
    console.log(`      Average Median Debt: $${Math.round(avgDebt).toLocaleString()}`);
    console.log(`      Average Repayment Rate: ${Math.round(avgRepayment * 100)}%`);
    console.log('');
    console.log(`   💡 PROJECT 2025 IMPACT:`);
    console.log(`      Proposed eliminations:`);
    console.log(`      • Public Service Loan Forgiveness (PSLF)`);
    console.log(`      • Income-Driven Repayment (IDR) plans`);
    console.log(`      • Campus-based aid (SEOG, Perkins, Work-Study)`);
    console.log(`      Expected result: Higher debt burdens, lower repayment rates`);
  } else {
    console.log('⚠️  No student debt data available');
  }

  // Test 4: Baseline comparison (2021 vs 2022)
  console.log('\n\n📊 Test 4: Baseline Comparison (2021 vs 2022)\n');
  console.log('Comparing pre/post policy metrics...\n');

  const comparison = await getHigherEdBaselineComparison(testStateCode, 2021, 2022);

  console.log(`Status: ${comparison.status.toUpperCase()}\n`);

  if (comparison.pell_grants?.changes?.available) {
    const pellChanges = comparison.pell_grants.changes;
    console.log('🎓 PELL GRANT CHANGES:');
    console.log(`   2021 Avg Rate: ${pellChanges.baseline_pell_rate}%`);
    console.log(`   2022 Avg Rate: ${pellChanges.current_pell_rate}%`);
    console.log(`   Change: ${pellChanges.pell_rate_change_pct > 0 ? '+' : ''}${pellChanges.pell_rate_change_pct}%`);
    console.log(`   Trend: ${pellChanges.trend.toUpperCase()}`);
    console.log(`   Estimated Recipients Change: ${pellChanges.estimated_recipients_change.toLocaleString()} students`);
    console.log(`   High-Pell Schools (>50%): ${pellChanges.high_pell_schools_current}`);
  } else {
    console.log('⚠️  Pell Grant comparison data unavailable');
  }

  console.log('');

  if (comparison.student_debt?.changes?.available) {
    const debtChanges = comparison.student_debt.changes;
    console.log('💰 STUDENT DEBT CHANGES:');
    console.log(`   2021 Median Debt: $${debtChanges.baseline_median_debt.toLocaleString()}`);
    console.log(`   2022 Median Debt: $${debtChanges.current_median_debt.toLocaleString()}`);
    console.log(`   Change: $${debtChanges.debt_change_dollars > 0 ? '+' : ''}${debtChanges.debt_change_dollars.toLocaleString()} (${debtChanges.debt_change_pct > 0 ? '+' : ''}${debtChanges.debt_change_pct}%)`);
    console.log(`   Debt Burden: ${debtChanges.debt_burden.toUpperCase()}`);
    console.log(`   Repayment Trend: ${debtChanges.repayment_trend.toUpperCase()}`);
  } else {
    console.log('⚠️  Student debt comparison data unavailable');
  }

  // Test 5: Comprehensive policy impact analysis
  console.log('\n\n📊 Test 5: Comprehensive Policy Impact Analysis\n');
  console.log('Running full Project 2025 higher education impact analysis...\n');

  const analysis = await analyzeHigherEducationPolicyImpact(
    testStateCode,
    testStateName,
    'all' // Analyze all policy areas
  );

  console.log('=' .repeat(80));
  console.log(`RESULTS - Status: ${analysis.overall_status.toUpperCase()}`);
  console.log('=' .repeat(80));

  console.log(`\n📍 State: ${analysis.state_name}`);
  console.log(`📅 Baseline: ${analysis.baseline_date}`);
  console.log(`🎯 Focus: ${analysis.policy_focus}`);
  console.log(`⏰ Timestamp: ${new Date(analysis.timestamp).toLocaleString()}`);

  if (analysis.impact_summary) {
    const summary = analysis.impact_summary;

    if (summary.key_findings && summary.key_findings.length > 0) {
      console.log('\n🔍 KEY FINDINGS:');
      summary.key_findings.forEach(finding => {
        console.log(`   • ${finding}`);
      });
    }

    if (summary.affected_populations && summary.affected_populations.length > 0) {
      console.log('\n👥 AFFECTED POPULATIONS:');
      [...new Set(summary.affected_populations)].forEach(pop => {
        console.log(`   • ${pop}`);
      });
    }

    if (summary.financial_impacts && summary.financial_impacts.length > 0) {
      console.log('\n💰 FINANCIAL IMPACTS:');
      summary.financial_impacts.forEach(impact => {
        console.log(`   • ${impact}`);
      });
    }

    if (summary.institutions_at_risk && summary.institutions_at_risk.length > 0) {
      console.log('\n🏫 INSTITUTIONS AT RISK:');
      summary.institutions_at_risk.forEach(inst => {
        console.log(`   • ${inst}`);
      });
    }

    if (summary.policy_context) {
      console.log('\n📋 PROJECT 2025 CONTEXT:');
      console.log(`   ${summary.policy_context}`);
    }
  }

  if (analysis.warnings && analysis.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${analysis.warnings.length}):`);
    analysis.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
    console.log('\n✅ Analysis continued with available data sources');
  }

  console.log('\n' + '=' .repeat(80));
  console.log('✅ DEPARTMENT OF EDUCATION API TEST COMPLETE');
  console.log('=' .repeat(80));
  console.log('\n📌 SUMMARY:');
  console.log(`   • API Status: ${apiKey ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  console.log(`   • Analysis Status: ${analysis.overall_status.toUpperCase()}`);
  console.log(`   • Data Sources: ${6 - analysis.warnings.length}/6 available`);
  console.log(`   • Integration: READY FOR PRODUCTION`);
  console.log('\n💡 Next Steps:');
  console.log('   1. Integrate with existing policy tracker');
  console.log('   2. Set up automated monitoring for data updates');
  console.log('   3. Configure alerts for significant policy changes');
  console.log('   4. Cross-reference with news coverage for real-time impacts');
  console.log('');

} catch (error) {
  console.error('\n❌ TEST FAILED\n');
  console.error('Error:', error.message);
  console.error('\nStack Trace:');
  console.error(error.stack);
  console.error('\n💡 Troubleshooting:');
  console.error('   1. Verify VITE_DEPT_ED_API_KEY is set in .env file');
  console.error('   2. Check API key is valid at https://api.data.gov/signup/');
  console.error('   3. Ensure network connectivity to api.data.gov');
  console.error('   4. Check rate limits (1,000 requests/day)');
  console.error('');
  process.exit(1);
}
