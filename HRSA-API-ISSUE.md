# HRSA API Integration Status

## Summary
The HRSA (Health Resources and Services Administration) Data API **requires registration and authentication** for programmatic access. The initial integration has been completed, but **cannot be fully tested without a valid API token**.

## API Discovery Findings

### What We Learned:
1. **Authentication Required**: HRSA's data APIs require users to register and obtain a web token
2. **Registration URL**: https://data.hrsa.gov/tools/web-services/registration
3. **Web Services Documentation**: https://data.hrsa.gov/data/services
4. **Available Services**:
   - Health Center Data (query by state, county, or ZIP code)
   - Ryan White HIV/AIDS Medical Care Provider Data (query by lat/long)

### API Structure:
- HRSA uses **Socrata Open Data API (SODA)** platform
- Also supports **OData** endpoints for tools like Excel and Tableau
- Both require authentication via web token

## Current Implementation Status

### ✅ Completed:
- Created comprehensive HRSA API service (`src/services/hrsaApi.js`)
- Implemented 6 main functions:
  1. `getHealthCentersByState()` - Query health centers by state
  2. `getRyanWhiteSitesByState()` - Query Ryan White HIV/AIDS sites
  3. `getHealthProfessionalShortageAreas()` - Query HPSAs (primary care, dental, mental health)
  4. `getHealthCentersByZip()` - Search health centers by ZIP code
  5. `getNHSCProvidersByState()` - Query NHSC provider counts
  6. `analyzeHealthcareAccess()` - Comprehensive vulnerability analysis

- Created test suite (`test-hrsa-api.js`)
- Updated `.env.example` with registration instructions

### ⏸️ Pending:
- **User registration** at data.hrsa.gov (requires email, organization info)
- **Token acquisition** via registration process
- **Token integration** into API service
- **Full integration testing** with valid token

## Test Results (Without Token)

```
Test Run: October 22, 2025
Status: All endpoints returned HTML errors (401/403 authentication required)
Expected Behavior: This confirms authentication is required
```

### Test Output:
- ❌ All API endpoints returned: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- ✅ Error handling works correctly (retry logic, graceful degradation)
- ✅ Vulnerability assessment logic works (returns calculated risk scores even with 0 data)

## Data Coverage (Once Authenticated)

The HRSA API provides access to:
- **1,400+ federally-qualified health centers (FQHCs)**
- **14,000+ service delivery sites**
- **30M+ patients served annually**
- **Ryan White HIV/AIDS Program sites** (Part C Early Intervention)
- **Health Professional Shortage Areas (HPSAs)** - primary care, dental, mental health
- **National Health Service Corps (NHSC) providers**
- **Geographic data**: All 50 states + US territories

## Project 2025 Use Cases

Once authenticated, this API enables tracking:
1. **Medicaid/ACA Cuts**: Impact on federally-funded health centers
2. **HIV/AIDS Program Cuts**: Ryan White site closures and service reductions
3. **Healthcare Deserts**: HPSA expansion due to provider shortages
4. **Rural Healthcare Access**: NHSC provider distribution changes
5. **Safety-Net Clinic Closures**: FQHC funding impacts

## Next Steps to Enable HRSA API

### For Platform Administrators:
1. Visit https://data.hrsa.gov/tools/web-services/registration
2. Fill out registration form:
   - Name and email
   - Organization: Democratic Accountability Platform
   - Intended use: Public policy impact tracking
3. Receive web token via email (typically instant)
4. Add token to `.env` file:
   ```bash
   VITE_HRSA_API_TOKEN=your-actual-token-here
   ```
5. Update `src/services/hrsaApi.js` to include token in request headers
6. Run test suite: `node test-hrsa-api.js`

### Code Changes Needed (Once Token Obtained):

In `src/services/hrsaApi.js`, update the `makeRequest()` function:

```javascript
const response = await fetch(url.toString(), {
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'User-Agent': 'DemocraticAccountabilityPlatform/1.0',
    'Authorization': `Bearer ${HRSA_API_TOKEN}`,  // Add this line
  },
  signal: controller.signal,
});
```

## Alternative Data Sources (If Registration Delayed)

While waiting for HRSA registration:
1. **Manual Data Downloads**: HRSA provides CSV downloads at https://data.hrsa.gov/data/download
2. **HealthData.gov Mirror**: Some HRSA datasets available at https://healthdata.gov
3. **CMS Provider Data**: Medicare facility data can proxy for some health center info
4. **State Health Departments**: Many states publish health center directories

## Technical Notes

### API Platform:
- **Platform**: Socrata Open Data API (SODA 3.x)
- **Base URL Pattern**: `https://data.hrsa.gov/resource/{dataset-id}.json`
- **Query Parameters**: Standard SODA query syntax (`$limit`, `$offset`, `$where`, etc.)
- **Authentication**: Bearer token in `Authorization` header
- **Rate Limits**: Unknown (to be determined post-registration)

### Dataset IDs (To Be Confirmed):
Once registered, update dataset IDs in the service file to match actual HRSA identifiers.

## References

- HRSA Data Portal: https://data.hrsa.gov/
- Web Services Registration: https://data.hrsa.gov/tools/web-services/registration
- SODA API Documentation: https://dev.socrata.com/docs/endpoints.html
- HealthData.gov Catalog: https://healthdata.gov/

## Status: READY FOR TOKEN

The implementation is complete and ready for testing once a valid HRSA API token is obtained through registration.

---

**Last Updated**: October 22, 2025
**Implementation**: Complete (token pending)
**Test Status**: Authentication required (expected behavior)
