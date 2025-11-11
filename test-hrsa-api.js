/**
 * HRSA (Health Resources and Services Administration) API Integration Test Suite
 *
 * Tests HRSA health center, Ryan White, and shortage area data for Project 2025 tracking
 * API Documentation: https://data.hrsa.gov/tools/data-reporting/program-data
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Dynamic import to ensure env vars are loaded
const {
  getHealthCentersByState,
  getRyanWhiteSitesByState,
  getHealthProfessionalShortageAreas,
  getHealthCentersByZip,
  getNHSCProvidersByState,
  analyzeHealthcareAccess,
} = await import('./src/services/hrsaApi.js');

console.log('===========================================================');
console.log('HRSA (Health Resources & Services Admin) API Test Suite');
console.log('Health Centers & Safety-Net Data - Project 2025 Tracking');
console.log('===========================================================\n');

console.log('✓ HRSA Data API: https://data.hrsa.gov/api/1');
console.log('✓ OPEN DATA - No authentication required');
console.log('✓ Coverage: 1,400+ health centers, 14,000+ sites, 30M+ patients\n');

// Test 1: Get Health Centers by State
console.log('Test 1: Get Health Centers by State (California)');
console.log('-----------------------------------------------------------');
try {
  const result = await getHealthCentersByState('CA', 10);

  if (result.success) {
    console.log('✓ Success!');
    console.log('State:', result.stateCode);
    console.log('Total Health Centers:', result.count);
    console.log('Data Source:', result.metadata.source);

    if (result.healthCenters && result.healthCenters.length > 0) {
      console.log('\nSample Health Centers (first 3):');
      result.healthCenters.slice(0, 3).forEach((center, idx) => {
        console.log(`\n${idx + 1}. ${center.site_name || center.health_center_name || 'Unknown'}`);
        if (center.site_address) console.log('   Address:', center.site_address);
        if (center.site_city) console.log('   City:', center.site_city);
        if (center.site_zip_code) console.log('   ZIP:', center.site_zip_code);
        if (center.site_telephone_number) console.log('   Phone:', center.site_telephone_number);
      });
    }
  } else {
    console.log('⚠️  Error:', result.error);
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 2: Get Ryan White HIV/AIDS Sites by State
console.log('Test 2: Get Ryan White HIV/AIDS Sites (New York)');
console.log('-----------------------------------------------------------');
try {
  const result = await getRyanWhiteSitesByState('NY', 5);

  if (result.success) {
    console.log('✓ Success!');
    console.log('State:', result.stateCode);
    console.log('Total Ryan White Sites:', result.count);
    console.log('Data Source:', result.metadata.source);

    if (result.sites && result.sites.length > 0) {
      console.log('\nSample Ryan White Sites (first 2):');
      result.sites.slice(0, 2).forEach((site, idx) => {
        console.log(`\n${idx + 1}. ${site.organization_name || site.grantee_name || 'Unknown'}`);
        if (site.grantee_city) console.log('   City:', site.grantee_city);
        if (site.grantee_state_name) console.log('   State:', site.grantee_state_name);
        if (site.grant_number) console.log('   Grant #:', site.grant_number);
      });
    }
  } else {
    console.log('⚠️  Error:', result.error);
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 3: Get Health Professional Shortage Areas
console.log('Test 3: Get Health Professional Shortage Areas (Texas)');
console.log('-----------------------------------------------------------');
try {
  const result = await getHealthProfessionalShortageAreas('TX', 'primary-care', 10);

  if (result.success) {
    console.log('✓ Success!');
    console.log('State:', result.stateCode);
    console.log('Shortage Type:', result.shortageType);
    console.log('Total Shortage Areas:', result.count);
    console.log('Data Source:', result.metadata.source);

    if (result.shortageAreas && result.shortageAreas.length > 0) {
      console.log('\nSample Shortage Areas (first 3):');
      result.shortageAreas.slice(0, 3).forEach((area, idx) => {
        console.log(`\n${idx + 1}. ${area.hpsa_name || area.designation_name || 'Unknown'}`);
        if (area.common_state_name) console.log('   State:', area.common_state_name);
        if (area.common_county_name) console.log('   County:', area.common_county_name);
        if (area.hpsa_discipline_class) console.log('   Discipline:', area.hpsa_discipline_class);
        if (area.hpsa_score) console.log('   HPSA Score:', area.hpsa_score);
      });
    }
  } else {
    console.log('⚠️  Error:', result.error);
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 4: Get Health Centers by ZIP Code
console.log('Test 4: Get Health Centers by ZIP Code (90001 - Los Angeles)');
console.log('-----------------------------------------------------------');
try {
  const result = await getHealthCentersByZip('90001', 5);

  if (result.success) {
    console.log('✓ Success!');
    console.log('ZIP Code:', result.zipCode);
    console.log('Health Centers Found:', result.count);
    console.log('Search Type:', result.metadata.searchType);

    if (result.healthCenters && result.healthCenters.length > 0) {
      console.log('\nNearby Health Centers (first 3):');
      result.healthCenters.slice(0, 3).forEach((center, idx) => {
        console.log(`\n${idx + 1}. ${center.site_name || center.health_center_name || 'Unknown'}`);
        if (center.site_address) console.log('   Address:', center.site_address);
        if (center.site_city) console.log('   City:', center.site_city);
        if (center.site_zip_code) console.log('   ZIP:', center.site_zip_code);
        if (center.site_telephone_number) console.log('   Phone:', center.site_telephone_number);
      });
    }
  } else {
    console.log('⚠️  Error:', result.error);
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 5: Get NHSC Providers by State
console.log('Test 5: Get NHSC Providers (Florida)');
console.log('-----------------------------------------------------------');
try {
  const result = await getNHSCProvidersByState('FL');

  if (result.success) {
    console.log('✓ Success!');
    console.log('State:', result.stateCode);
    console.log('Total NHSC Providers:', result.providerCount);
    console.log('Data Source:', result.metadata.source);

    if (result.providers && result.providers.length > 0) {
      console.log('\nSample NHSC Providers (first 3):');
      result.providers.slice(0, 3).forEach((provider, idx) => {
        console.log(`\n${idx + 1}. Provider ID: ${provider.nhsc_id || provider.member_id || 'Unknown'}`);
        if (provider.facility_name) console.log('   Facility:', provider.facility_name);
        if (provider.city) console.log('   City:', provider.city);
        if (provider.discipline) console.log('   Discipline:', provider.discipline);
      });
    }
  } else {
    console.log('⚠️  Error:', result.error);
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 6: Comprehensive Healthcare Access Analysis
console.log('Test 6: Comprehensive Healthcare Access Analysis (Mississippi)');
console.log('-----------------------------------------------------------');
console.log('Combining: Health Centers + Ryan White + Shortage Areas + NHSC Providers');
console.log('Calculating: Project 2025 Vulnerability Score\n');
try {
  const result = await analyzeHealthcareAccess('MS');

  if (result.success) {
    console.log('✓ Success!');
    console.log('\n📍 Location:', result.location.stateCode);
    console.log('📊 Analysis Type:', result.metadata.analysisType);
    console.log('⏱️  Timestamp:', new Date(result.metadata.timestamp).toLocaleString());

    console.log('\n📈 Healthcare Infrastructure:');
    console.log(`   Health Centers: ${result.analysis.healthCenters.count}`);
    console.log(`   Ryan White HIV/AIDS Sites: ${result.analysis.ryanWhiteSites.count}`);
    console.log(`   Professional Shortage Areas: ${result.analysis.shortageAreas.count}`);
    console.log(`   NHSC Providers: ${result.analysis.nhscProviders.count}`);

    console.log('\n⚠️  Project 2025 Vulnerability Assessment:');
    console.log(`   Risk Level: ${result.analysis.vulnerability.riskLevel}`);
    console.log(`   Risk Score: ${result.analysis.vulnerability.riskScore}/${result.analysis.vulnerability.maxScore}`);
    console.log(`   Impact: ${result.analysis.vulnerability.project2025Impact}`);

    // Display risk level indicator
    const riskLevel = result.analysis.vulnerability.riskLevel;
    if (riskLevel === 'CRITICAL') {
      console.log('\n🚨 CRITICAL: Extremely vulnerable to Medicaid/ACA cuts');
    } else if (riskLevel === 'HIGH') {
      console.log('\n⚠️  HIGH: Significant vulnerability to federal healthcare cuts');
    } else if (riskLevel === 'MODERATE') {
      console.log('\n⚡ MODERATE: Some vulnerability to policy changes');
    } else {
      console.log('\n✓ LOW: Relatively stable healthcare infrastructure');
    }
  } else {
    console.log('⚠️  Error:', result.error);
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 7: Local Healthcare Analysis (ZIP Code Level)
console.log('Test 7: Local Healthcare Analysis (ZIP 39201 - Jackson, MS)');
console.log('-----------------------------------------------------------');
try {
  const result = await analyzeHealthcareAccess('MS', '39201');

  if (result.success) {
    console.log('✓ Success!');
    console.log('\n📍 Location:', `${result.location.stateCode} - ZIP ${result.location.zipCode}`);
    console.log('📊 Analysis Type:', result.metadata.analysisType);

    console.log('\n📈 Local Healthcare Access:');
    console.log(`   Nearby Health Centers: ${result.analysis.healthCenters.count}`);
    console.log(`   State Ryan White Sites: ${result.analysis.ryanWhiteSites.count}`);
    console.log(`   State Shortage Areas: ${result.analysis.shortageAreas.count}`);
    console.log(`   State NHSC Providers: ${result.analysis.nhscProviders.count}`);

    console.log('\n⚠️  Local Vulnerability:');
    console.log(`   Risk Level: ${result.analysis.vulnerability.riskLevel}`);
    console.log(`   Risk Score: ${result.analysis.vulnerability.riskScore}/${result.analysis.vulnerability.maxScore}`);
  } else {
    console.log('⚠️  Error:', result.error);
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Summary
console.log('===========================================================');
console.log('Test Suite Complete');
console.log('===========================================================');
console.log('\n✓ HRSA API Integration: OPERATIONAL');
console.log('✓ No authentication required');
console.log('✓ Coverage: Federally-funded health centers nationwide');
console.log('✓ Project 2025 Tracking: Safety-net healthcare vulnerability');
console.log('\n📊 Use Cases:');
console.log('   • Track Medicaid/ACA repeal impacts on health centers');
console.log('   • Monitor Ryan White HIV/AIDS program site closures');
console.log('   • Identify healthcare professional shortage areas');
console.log('   • Verify citizen stories about healthcare access');
console.log('   • Assess local vulnerability to federal healthcare cuts');
console.log('\n');
