/**
 * VA (Department of Veterans Affairs) API Integration Test Suite
 *
 * Tests VA facilities and forms data for Project 2025 tracking
 * API Documentation: https://developer.va.gov/
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Dynamic import to ensure env vars are loaded
const {
  getFacilityById,
  searchFacilities,
  getNearbyFacilities,
  getFacilitiesBaselineComparison,
  getFormByNumber,
  searchForms,
  trackFormChanges,
  verifyVAStory,
} = await import('./src/services/vaApi.js');

console.log('=======================================================');
console.log('VA (Department of Veterans Affairs) API Test Suite');
console.log('Facilities & Forms Data - Project 2025 Tracking');
console.log('=======================================================\n');

console.log('✓ VA Facilities API: https://api.va.gov/services/va_facilities/v1');
console.log('✓ VA Forms API: https://api.va.gov/services/va_forms/v0');
console.log('✓ OPEN DATA - No authentication required\n');

// Test 1: Get Facility by ID
console.log('Test 1: Get VA Facility by ID (Portland VA Medical Center)');
console.log('-----------------------------------------------------------');
try {
  // Portland VA Medical Center
  const facilityId = 'vha_648';

  const facility = await getFacilityById(facilityId);

  if (facility.error) {
    console.log('⚠️  Error:', facility.message);
    console.log('Error Details:', facility.errorDetails);
  } else {
    console.log('✓ Source:', facility.source);
    console.log('Facility ID:', facility.facilityId);

    const attrs = facility.data.attributes || facility.data;
    if (attrs) {
      console.log('\nFacility Details:');
      console.log('  Name:', attrs.name);
      console.log('  Type:', attrs.facilityType);
      console.log('  Classification:', attrs.classification);

      if (attrs.address && attrs.address.physical) {
        const addr = attrs.address.physical;
        console.log('  Address:', `${addr.address1}, ${addr.city}, ${addr.state} ${addr.zip}`);
      }

      if (attrs.phone && attrs.phone.main) {
        console.log('  Phone:', attrs.phone.main);
      }

      if (attrs.operatingStatus) {
        console.log('  Operating Status:', attrs.operatingStatus.code);
      }

      if (attrs.services && attrs.services.length > 0) {
        console.log('  Services:', attrs.services.slice(0, 5).join(', '));
      }
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 2: Search Facilities by State
console.log('Test 2: Search VA Facilities (Texas)');
console.log('-------------------------------------');
try {
  const searchResults = await searchFacilities({
    state: 'TX',
    type: 'health',
    per_page: 10,
  });

  if (searchResults.error) {
    console.log('⚠️  Error:', searchResults.message);
    console.log('Error Details:', searchResults.errorDetails);
  } else {
    console.log('✓ Source:', searchResults.source);
    console.log('State:', searchResults.searchCriteria.state);
    console.log('Facility Type:', searchResults.searchCriteria.type);
    console.log('Total Results:', searchResults.totalResults);
    console.log('Results Retrieved:', searchResults.data.length);

    if (searchResults.data && searchResults.data.length > 0) {
      console.log('\nSample VA Facilities in Texas:');
      searchResults.data.slice(0, 5).forEach((facility, index) => {
        const attrs = facility.attributes;
        console.log(`  ${index + 1}. ${attrs.name}`);
        if (attrs.address && attrs.address.physical) {
          console.log(`     ${attrs.address.physical.city}, TX`);
        }
        console.log(`     Status: ${attrs.operatingStatus?.code || 'Unknown'}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 3: Get Nearby Facilities
console.log('Test 3: Get Nearby VA Facilities (California)');
console.log('-----------------------------------------------');
try {
  const nearbyFacilities = await getNearbyFacilities('CA', null, 'health');

  if (nearbyFacilities.error) {
    console.log('⚠️  Error:', nearbyFacilities.message);
  } else {
    console.log('✓ Source:', nearbyFacilities.source);
    console.log('State:', nearbyFacilities.searchCriteria.state);
    console.log('Radius:', nearbyFacilities.searchCriteria.radius, 'miles');
    console.log('Total Facilities:', nearbyFacilities.totalResults);
    console.log('Facilities Retrieved:', nearbyFacilities.data.length);

    if (nearbyFacilities.data && nearbyFacilities.data.length > 0) {
      console.log('\nSample Nearby Facilities:');
      nearbyFacilities.data.slice(0, 3).forEach((facility, index) => {
        const attrs = facility.attributes;
        console.log(`  ${index + 1}. ${attrs.name}`);
        console.log(`     ${attrs.address.physical.city}, ${attrs.address.physical.state}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 4: Facilities Baseline Comparison
console.log('Test 4: VA Facilities Baseline Comparison (Texas)');
console.log('--------------------------------------------------');
try {
  console.log('Analyzing VA facilities for baseline tracking...\n');

  const baseline = await getFacilitiesBaselineComparison('TX', 'health');

  if (baseline.status === 'partial') {
    console.log('⚠️  Partial data:', baseline.message);
  } else {
    console.log('✓ Status:', baseline.status);
    console.log('State:', baseline.state);
    console.log('Facility Type:', baseline.facilityType);

    if (baseline.currentData) {
      console.log('\nCurrent VA Facilities Data:');
      console.log('  Total Facilities:', baseline.currentData.totalFacilities);
      console.log('  Operating:', baseline.currentData.operating);
      console.log('  Closed:', baseline.currentData.closed);

      if (baseline.currentData.facilities && baseline.currentData.facilities.length > 0) {
        console.log('\n  Sample Facilities:');
        baseline.currentData.facilities.slice(0, 5).forEach((f, index) => {
          console.log(`    ${index + 1}. ${f.name} - ${f.city}`);
          console.log(`       Status: ${f.operatingStatus}`);
          console.log(`       Services: ${f.services.length} available`);
        });
      }
    }

    if (baseline.baselineNote) {
      console.log('\nBaseline Note:');
      console.log(' ', baseline.baselineNote);
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 5: Get VA Form by Number
console.log('Test 5: Get VA Form by Number (10-10EZ - Healthcare Enrollment)');
console.log('-----------------------------------------------------------------');
try {
  const formNumber = '10-10EZ';

  const form = await getFormByNumber(formNumber);

  if (form.error) {
    console.log('⚠️  Error:', form.message);
    console.log('Error Details:', form.errorDetails);
  } else {
    console.log('✓ Source:', form.source);
    console.log('Form Number:', form.formNumber);

    const formData = form.data.attributes || form.data;
    if (formData) {
      console.log('\nForm Details:');
      console.log('  Title:', formData.title);
      console.log('  Last Revision:', formData.lastRevisionOn || formData.last_revision_on || 'N/A');
      console.log('  Pages:', formData.pages || 'N/A');
      console.log('  URL:', formData.url ? 'Available' : 'N/A');

      if (formData.benefitCategories) {
        console.log('  Benefit Categories:', formData.benefitCategories.join(', '));
      }
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 6: Search VA Forms
console.log('Test 6: Search VA Forms (disability)');
console.log('-------------------------------------');
try {
  const formsSearch = await searchForms('disability');

  if (formsSearch.error) {
    console.log('⚠️  Error:', formsSearch.message);
  } else {
    console.log('✓ Source:', formsSearch.source);
    console.log('Query:', formsSearch.query);
    console.log('Total Results:', formsSearch.totalResults);

    if (formsSearch.data && formsSearch.data.length > 0) {
      console.log('\nSample Disability-Related Forms:');
      formsSearch.data.slice(0, 5).forEach((form, index) => {
        const attrs = form.attributes;
        console.log(`  ${index + 1}. ${attrs.formName || form.id}`);
        console.log(`     Title: ${attrs.title}`);
        if (attrs.lastRevisionOn || attrs.last_revision_on) {
          console.log(`     Last Revised: ${attrs.lastRevisionOn || attrs.last_revision_on}`);
        }
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 7: Track Form Changes
console.log('Test 7: Track VA Form Changes (21-526EZ - Disability Compensation)');
console.log('--------------------------------------------------------------------');
try {
  const formNumber = '21-526EZ';

  const tracking = await trackFormChanges(formNumber);

  if (tracking.status === 'unavailable') {
    console.log('⚠️  Form tracking unavailable:', tracking.message);
  } else {
    console.log('✓ Form Number:', tracking.formNumber);
    console.log('Status:', tracking.status);

    if (tracking.currentVersion) {
      console.log('\nCurrent Form Version:');
      console.log('  Title:', tracking.currentVersion.title);
      console.log('  Last Revision:', tracking.currentVersion.lastRevisionDate || 'N/A');
      console.log('  Pages:', tracking.currentVersion.pages || 'N/A');
      console.log('  SHA256:', tracking.currentVersion.sha256 ? 'Available' : 'N/A');
    }

    if (tracking.changeNote) {
      console.log('\nChange Tracking Note:');
      console.log(' ', tracking.changeNote);
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 8: Verify VA Story
console.log('Test 8: Verify VA-Related Story');
console.log('--------------------------------');
try {
  const citizenStory = {
    headline: 'Local VA clinic closed, forcing veterans to travel 100 miles for care',
    story:
      'Our community VA clinic shut down last month with no warning. Veterans who used to get care locally now have to drive to the main VA hospital 100 miles away. Many elderly vets can no longer access the healthcare they earned through service.',
  };

  console.log('Story to verify:');
  console.log('  Headline:', citizenStory.headline);
  console.log('  Story excerpt:', citizenStory.story.substring(0, 100) + '...\n');

  // Get VA data for verification
  const facilitiesData = await getFacilitiesBaselineComparison('TX', 'health');
  const formData = await trackFormChanges('10-10EZ');

  const vaData = {
    facilities: facilitiesData,
    forms: formData,
  };

  console.log('Verifying against VA data...\n');

  const verification = await verifyVAStory(citizenStory, vaData);

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

  if (verification.vaMetrics) {
    console.log('\nVA Metrics Used:');
    Object.entries(verification.vaMetrics).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');
console.log('=======================================================');
console.log('VA API Test Suite Complete');
console.log('=======================================================');
console.log('\nKey Features Tested:');
console.log('✓ VA facility retrieval by ID');
console.log('✓ VA facilities search by state/type');
console.log('✓ Nearby facilities discovery');
console.log('✓ Facilities baseline comparison (current state for future tracking)');
console.log('✓ VA benefits form retrieval');
console.log('✓ VA forms search');
console.log('✓ Form version change tracking');
console.log('✓ VA story verification');
console.log('\nAPI Features:');
console.log('- FREE - No API key required (open data)');
console.log('- 1,200+ VA facilities nationwide');
console.log('- All VA benefits forms');
console.log('- Real-time facility status and hours');
console.log('- Form version tracking for policy changes');
console.log('\nProject 2025 Tracking:');
console.log('- VA facility closures and consolidations');
console.log('- Service reductions at VA medical centers');
console.log('- Benefits form complexity increases');
console.log('- Access barriers for veterans');
console.log('- VA healthcare privatization efforts');
console.log('\nIntegration Notes:');
console.log('- Cross-validates with 15 other federal APIs');
console.log('- Critical for veterans policy impact verification');
console.log('- Baseline data collection for future comparisons');
console.log('\nDocumentation: https://developer.va.gov/');
