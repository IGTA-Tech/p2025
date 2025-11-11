/**
 * Test script for EPA EnviroFacts API integration
 * Run with: node test-epa-api.js
 */

import dotenv from 'dotenv';
import {
  queryTable,
  queryWithPagination,
  getTRIFacilitiesByZip,
  getRCRAFacilitiesByState,
  getAirQualityData,
  getWaterSystemsByZip,
  getGHGEmissionsByState,
  searchFacilityByName,
  verifyEnvironmentalStory,
} from './src/services/epaEnvirofactsApi.js';

// Load environment variables
dotenv.config();

console.log('🌍 Testing EPA EnviroFacts API Integration...\n');
console.log('⚠️  Note: EPA API has 15-minute timeout limit. Using 5-minute timeout per request.\n');

try {
  // Test 1: Get TRI facilities by ZIP code (Los Angeles)
  console.log('📊 Test 1: TRI Facilities by ZIP Code (90001 - Los Angeles)\n');
  const triFacilities = await getTRIFacilitiesByZip('90001', 2022);

  if (!triFacilities.error) {
    console.log(`ZIP Code: ${triFacilities.zipCode}`);
    console.log(`Year: ${triFacilities.year}`);
    console.log(`Total TRI Facilities: ${triFacilities.count}`);
    console.log(`Source: ${triFacilities.source}`);

    if (triFacilities.facilities.length > 0) {
      console.log('\n🏭 Sample TRI Facilities:');
      triFacilities.facilities.slice(0, 3).forEach((facility, i) => {
        console.log(`  ${i + 1}. ${facility.FACILITY_NAME || 'N/A'}`);
        console.log(`     Address: ${facility.LOCATION_ADDRESS || 'N/A'}`);
        console.log(`     City: ${facility.CITY_NAME || 'N/A'}`);
      });
    }
  } else {
    console.log(`⚠️  ${triFacilities.errorMessage}`);
  }

  // Test 2: Get RCRA facilities by state (California)
  console.log('\n\n📊 Test 2: RCRA Hazardous Waste Facilities (CA)\n');
  const rcraFacilities = await getRCRAFacilitiesByState('CA');

  if (!rcraFacilities.error) {
    console.log(`State: ${rcraFacilities.state}`);
    console.log(`Total RCRA Facilities: ${rcraFacilities.count}`);
    console.log(`Source: ${rcraFacilities.source}`);

    if (rcraFacilities.facilities.length > 0) {
      console.log('\n♻️  Sample RCRA Facilities:');
      rcraFacilities.facilities.slice(0, 3).forEach((facility, i) => {
        console.log(`  ${i + 1}. ${facility.HANDLER_NAME || 'N/A'}`);
        console.log(`     EPA ID: ${facility.HANDLER_ID || 'N/A'}`);
        console.log(`     City: ${facility.LOCATION_CITY_NAME || 'N/A'}`);
      });
    }
  } else {
    console.log(`⚠️  ${rcraFacilities.errorMessage}`);
  }

  // Test 3: Get air quality data (Los Angeles County)
  console.log('\n\n📊 Test 3: Air Quality Data (Los Angeles County - FIPS 06/037)\n');
  const airQuality = await getAirQualityData('06', '037', 2022);

  if (!airQuality.error) {
    console.log(`State Code: ${airQuality.state}`);
    console.log(`County Code: ${airQuality.county}`);
    console.log(`Year: ${airQuality.year}`);
    console.log(`Total Measurements: ${airQuality.count}`);
    console.log(`Source: ${airQuality.source}`);

    if (airQuality.measurements.length > 0) {
      console.log('\n🌫️  Sample Air Quality Measurements:');
      airQuality.measurements.slice(0, 3).forEach((measurement, i) => {
        console.log(`  ${i + 1}. Parameter: ${measurement.PARAMETER_NAME || 'N/A'}`);
        console.log(`     Annual Mean: ${measurement.ARITHMETIC_MEAN || 'N/A'}`);
        console.log(`     Units: ${measurement.UNITS_OF_MEASURE || 'N/A'}`);
      });
    }
  } else {
    console.log(`⚠️  ${airQuality.errorMessage}`);
  }

  // Test 4: Get drinking water systems by ZIP
  console.log('\n\n📊 Test 4: Drinking Water Systems (ZIP 90001)\n');
  const waterSystems = await getWaterSystemsByZip('90001');

  if (!waterSystems.error) {
    console.log(`ZIP Code: ${waterSystems.zipCode}`);
    console.log(`Total Water Systems: ${waterSystems.count}`);
    console.log(`Source: ${waterSystems.source}`);

    if (waterSystems.systems.length > 0) {
      console.log('\n💧 Sample Water Systems:');
      waterSystems.systems.slice(0, 3).forEach((system, i) => {
        console.log(`  ${i + 1}. PWS ID: ${system.PWS_ID || 'N/A'}`);
        console.log(`     ZIP Code: ${system.ZIP_CODE || 'N/A'}`);
      });
    }
  } else {
    console.log(`⚠️  ${waterSystems.errorMessage}`);
  }

  // Test 5: Get greenhouse gas emissions by state
  console.log('\n\n📊 Test 5: Greenhouse Gas Emissions (CA, 2022)\n');
  const ghgEmissions = await getGHGEmissionsByState('CA', 2022);

  if (!ghgEmissions.error) {
    console.log(`State: ${ghgEmissions.state}`);
    console.log(`Year: ${ghgEmissions.year}`);
    console.log(`Total Emission Records: ${ghgEmissions.count}`);
    console.log(`Source: ${ghgEmissions.source}`);

    if (ghgEmissions.emissions.length > 0) {
      console.log('\n🏭 Sample GHG Emission Records:');
      ghgEmissions.emissions.slice(0, 3).forEach((emission, i) => {
        console.log(`  ${i + 1}. Facility: ${emission.FACILITY_NAME || 'N/A'}`);
        console.log(`     Total Emissions: ${emission.TOTAL_REPORTED_EMISSIONS || 'N/A'}`);
      });
    }
  } else {
    console.log(`⚠️  ${ghgEmissions.errorMessage}`);
  }

  // Test 6: Search facility by name
  console.log('\n\n📊 Test 6: Search Facility by Name (Chevron)\n');
  const facilitySearch = await searchFacilityByName('CHEVRON');

  if (!facilitySearch.error) {
    console.log(`Search Term: ${facilitySearch.searchTerm}`);
    console.log(`Total Facilities Found: ${facilitySearch.count}`);
    console.log(`Source: ${facilitySearch.source}`);

    if (facilitySearch.facilities.length > 0) {
      console.log('\n🔍 Sample Facilities:');
      facilitySearch.facilities.slice(0, 3).forEach((facility, i) => {
        console.log(`  ${i + 1}. ${facility.PRIMARY_NAME || 'N/A'}`);
        console.log(`     City: ${facility.CITY_NAME || 'N/A'}`);
        console.log(`     State: ${facility.STATE_CODE || 'N/A'}`);
        console.log(`     Registry ID: ${facility.REGISTRY_ID || 'N/A'}`);
      });
    }
  } else {
    console.log(`⚠️  ${facilitySearch.errorMessage}`);
  }

  // Test 7: Query table with basic filters
  console.log('\n\n📊 Test 7: Basic Table Query (tri_facility, CA, 2022)\n');
  const basicQuery = await queryTable('tri_facility', { state_abbr: 'CA', year: 2022 }, 50);

  if (!basicQuery.error) {
    console.log(`Table: ${basicQuery.table}`);
    console.log(`Total Results: ${basicQuery.count}`);
    console.log(`Source: ${basicQuery.source}`);
  } else {
    console.log(`⚠️  ${basicQuery.errorMessage}`);
  }

  // Test 8: Verify an environmental story
  console.log('\n\n🧪 Test 8: Environmental Story Verification\n');

  const environmentalStory = {
    id: 'TEST-ENV-001',
    location: { state: 'CA', city: 'Los Angeles', zip: '90001' },
    headline: 'Factory pollution causing health problems in our neighborhood',
    story: 'There is a chemical plant near my home that releases toxic fumes. Multiple families on my street have reported respiratory illness and cancer cases have increased. The air quality is terrible and we can smell chemicals every day. Our children cannot play outside safely.',
    policyArea: 'environment',
  };

  const verification = verifyEnvironmentalStory(environmentalStory, triFacilities);

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

  if (verification.environmentalMetrics && Object.keys(verification.environmentalMetrics).length > 0) {
    console.log('\nEnvironmental Metrics:');
    Object.entries(verification.environmentalMetrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }

  console.log('\n✅ All EPA EnviroFacts API tests completed!\n');
  console.log('📝 Note: EPA EnviroFacts API is completely open - no authentication required.\n');
  console.log('📝 API has 15-minute timeout limit - service uses 5-minute timeout to stay under limit.\n');
  console.log('📝 Data source: https://data.epa.gov/efservice\n');
  console.log('📝 Available programs: TRI, RCRA, AQS, SDWIS, GHG, FRS\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
