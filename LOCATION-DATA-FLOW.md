# Location Data Flow - Zip Code to Database

This document explains how location data flows from user input through zip code lookup to the Supabase database.

## Flow Overview

```
User Input → Zip Code Extraction → Zip Lookup API → Story Object → Supabase Database
```

## Step-by-Step Process

### 1. User Provides Story (ConversationalInput.jsx)

The user shares their story through the conversational interface. The bot:
- Asks an initial question
- Follows up with a clarifying question (after 1st message)
- Requests zip code (after 2nd message, if not detected)

### 2. Zip Code Detection/Collection

**Automatic Detection:**
```javascript
const allUserText = updatedMessages
  .filter(m => m.type === 'user')
  .map(m => m.text)
  .join(' ');
const detectedZip = extractZipCode(allUserText);  // Finds 5-digit zip codes
```

**Manual Request:**
If no zip code is found in the conversation, the bot explicitly asks:
> "Thanks for sharing that detail. To verify your story and match it with similar experiences, what's the zip code where this is happening?"

### 3. Zip Code Lookup (zipLookup.js)

When a zip code is provided:
```javascript
const location = await lookupZipCode(zipCode);
// Returns:
{
  zip: "28202",
  city: "Charlotte",
  state: "NC",
  county: null,
  district: null
}
```

**API Used:** Zippopotam.us (free, no key required)
- Validates 5-digit format
- Returns city and state
- County and district are not available from this API (left as null)

### 4. Story Object with Location (ConversationalInput.jsx)

The story object passed to the parent includes location:
```javascript
const story = {
  messages: [...],
  timestamp: new Date(),
  score: {...},
  summary: "...",
  location: {
    zip: "28202",
    city: "Charlotte",
    state: "NC",
    county: null,
    district: null
  }
}
```

### 5. Supabase Submission (App.jsx → supabaseClient.js)

The location data is mapped to Supabase columns:

```javascript
// App.jsx transforms the story
const storyToSubmit = {
  id: storyId,
  submittedAt: conversationalStory.timestamp.toISOString(),
  location: conversationalStory.location || defaultLocation,
  policyArea: policyArea,
  // ... other fields
}

// supabaseClient.js saves to database
await supabase
  .from('citizen_stories')
  .insert([{
    id: story.id,
    submitted_at: story.submittedAt,
    location_zip: story.location.zip,      // "28202"
    location_city: story.location.city,    // "Charlotte"
    location_state: story.location.state,  // "NC"
    location_county: story.location.county, // null
    location_district: story.location.district, // null
    // ... other fields
  }])
```

## Database Schema (Supabase)

**Table:** `citizen_stories`

**Location Columns:**
- `location_zip` (TEXT, NOT NULL) - 5-digit zip code
- `location_city` (TEXT, nullable) - City name
- `location_state` (TEXT, nullable) - State abbreviation (e.g., "NC")
- `location_county` (TEXT, nullable) - County name
- `location_district` (TEXT, nullable) - Congressional district (e.g., "NC-12")

## Example Database Records

### With Zip Code Lookup
```
ID: test_full_1763260764059
Policy Area: healthcare
Location: Charlotte, NC 28202  ✅
Submitted: 11/16/2025, 2:39:24 AM
Verification: verified (Score: 92)
```

### Without Zip Code (Old Stories)
```
ID: story_1763260466664_hdxr7571i
Policy Area: other
Location: null, null 00000  ⚠️
Submitted: 11/16/2025, 2:34:26 AM
```

## Testing

**Tested Successfully:**
✅ Zip code extraction from text: "I live in 90210" → extracts "90210"
✅ Zip code lookup: 28202 → Charlotte, NC
✅ Zip code validation: Invalid formats are rejected
✅ Database insertion: All 5 location fields saved correctly
✅ Error handling: Invalid zip codes prompt user to retry

## Limitations

1. **County Data:** Not available from Zippopotam.us API
   - Could be added using Census Geocoder API or similar

2. **Congressional District:** Not available from Zippopotam.us API
   - Could be added using GeoServices API or Census API

3. **County and District are currently null** for all new submissions

## Future Enhancements

To populate county and district fields, consider:
- Census Geocoder API: https://geocoding.geo.census.gov/geocoder/
- GeoServices API for congressional districts
- Pre-loaded zip-to-district mapping table
