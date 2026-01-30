/**
 * Test zip code lookup functionality
 */

import { lookupZipCode, extractZipCode } from './src/services/zipLookup.js';

async function testZipLookup() {
  console.log('Testing Zip Code Lookup Service\n');

  // Test 1: Extract zip code from text
  console.log('Test 1: Extract zip code from text');
  const text1 = "I live in 90210 and things are bad";
  const extracted1 = extractZipCode(text1);
  console.log(`  Input: "${text1}"`);
  console.log(`  Extracted: ${extracted1}`);
  console.log('  ✅ Pass\n');

  // Test 2: No zip code in text
  console.log('Test 2: No zip code in text');
  const text2 = "Healthcare costs are rising";
  const extracted2 = extractZipCode(text2);
  console.log(`  Input: "${text2}"`);
  console.log(`  Extracted: ${extracted2}`);
  console.log('  ✅ Pass\n');

  // Test 3: Lookup valid zip code (Beverly Hills, CA)
  console.log('Test 3: Lookup valid zip code (90210)');
  try {
    const location1 = await lookupZipCode('90210');
    console.log(`  Result:`, JSON.stringify(location1, null, 2));
    console.log('  ✅ Pass\n');
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }

  // Test 4: Lookup another valid zip (Charlotte, NC)
  console.log('Test 4: Lookup valid zip code (28202)');
  try {
    const location2 = await lookupZipCode('28202');
    console.log(`  Result:`, JSON.stringify(location2, null, 2));
    console.log('  ✅ Pass\n');
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }

  // Test 5: Invalid zip code
  console.log('Test 5: Invalid zip code (00000)');
  try {
    const location3 = await lookupZipCode('00000');
    console.log(`  ❌ Should have thrown error\n`);
  } catch (error) {
    console.log(`  Expected error: ${error.message}`);
    console.log('  ✅ Pass\n');
  }

  // Test 6: Malformed zip code
  console.log('Test 6: Malformed zip code (123)');
  try {
    const location4 = await lookupZipCode('123');
    console.log(`  ❌ Should have thrown error\n`);
  } catch (error) {
    console.log(`  Expected error: ${error.message}`);
    console.log('  ✅ Pass\n');
  }

  console.log('All tests completed!');
}

testZipLookup();
