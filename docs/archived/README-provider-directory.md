# Provider Directory System

## Overview

Searchable directory of 108,593+ provider services across Minnesota. Built for case managers to quickly find and connect with service providers.

## Architecture

### Data Model
- **Single MongoDB collection**: `provider_services` (108K+ documents)
- **No ProviderId or Source fields** (excluded from old dataset)
- **Flat structure**: Each document = Provider + Location + Service offering
- **Text search optimized** with weighted indexes

### Document Schema
```javascript
{
  // Service
  serviceId: String,
  serviceName: String,
  
  // Provider
  providerName: String,
  providerWebsite: String,
  providerType: String,
  
  // Location
  locationId: String,
  locationName: String,
  address: {
    street: String,
    street2: String,
    city: String,
    state: String,
    zipCode: String,
    county: String
  },
  
  // Contact
  contact: {
    email: String,
    phone: String,
    phoneExt: String
  },
  
  // Details
  features: [String],
  shortDescription: String,
  fullDescription: String,
  eligibility: String,
  application: String,
  fee: String,
  areasServed: [String],
  
  // Metadata
  importedAt: Date
}
```

## Import Process

### 1. Install Dependencies
```bash
npm install csv-parse --legacy-peer-deps
```

### 2. Run Import Script
```bash
node scripts/import-provider-directory.js
```

**What it does:**
- Parses CSV with proper handling of multiline fields
- Transforms 108K+ records
- Excludes ProviderId and Source fields
- Creates MongoDB collection with indexes
- Takes ~30-60 seconds

### 3. Verify Import
The script outputs:
- Total documents imported
- Unique providers, services, counties, cities
- Collection size
- Index creation status

## API Usage

### Search Endpoint
```
GET /api/providers/search
```

**Query Parameters:**
- `q` - Text search query (searches across provider name, service, description, features)
- `county` - Filter by county
- `city` - Filter by city  
- `service` - Filter by service name (partial match)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 25)

**Example:**
```javascript
const response = await fetch('/api/providers/search?q=homemaker&county=Hennepin&page=1');
const data = await response.json();
```

**Response:**
```javascript
{
  success: true,
  data: {
    results: [...], // Array of provider services
    pagination: {
      page: 1,
      limit: 25,
      total: 1234,
      totalPages: 50,
      hasMore: true
    },
    filters: {
      counties: [...],  // Available counties in results
      cities: [...],    // Available cities in results
      services: [...]   // Available services in results
    }
  }
}
```

## UI Component

### ProviderDirectoryPanel

```tsx
import { ProviderDirectoryPanel } from '@/components/providers/ProviderDirectoryPanel';

<ProviderDirectoryPanel
  onCreateReferral={(provider) => {
    // Handle referral creation
    console.log('Create referral for:', provider);
  }}
  prefilledCounty="Hennepin"
/>
```

**Features:**
- Real-time search (300ms debounce)
- County, City, Service filters
- Pagination (25 results per page)
- Provider cards with contact info
- "Create Referral" action button
- Responsive design

## Integration with ReferralPanel

### Quick Integration
Use the `ProviderDirectoryIntegration` component for complete functionality:

```tsx
import { ProviderDirectoryIntegration } from '@/components/providers/ProviderDirectoryIntegration';

// In BoardView.tsx or any case manager component
<ProviderDirectoryIntegration 
  selectedClient={selectedClient}
  prefilledCounty={user?.county}
  onReferralCreated={() => refreshClients()}
/>
```

**Features:**
- Validates client selection before creating referral
- Seamless transition: Provider Directory (left drawer) → Referral Panel (right side)
- Provider context passed to referral form
- Toast notifications for user feedback
- Auto-cleanup on success/cancel

### Manual Integration Examples

#### 1. In BoardView Toolbar
```tsx
// Import at top
import { ProviderDirectoryIntegration } from '@/components/providers/ProviderDirectoryIntegration';

// In your toolbar/actions section
<ProviderDirectoryIntegration 
  selectedClient={selectedClient}
  prefilledCounty="Hennepin"
  onReferralCreated={() => {
    // Refresh client list
    fetchClients();
  }}
/>
```

#### 2. Standalone Provider Search
```tsx
<ProfessionalDrawer
  open={showProviderDirectory}
  onClose={() => setShowProviderDirectory(false)}
>
  <ProviderDirectoryPanel
    onCreateReferral={(provider) => {
      // Handle provider selection
      console.log('Selected:', provider);
    }}
    prefilledCounty="Hennepin"
  />
</ProfessionalDrawer>
```

#### 3. Client Detail Page Integration
```tsx
<ProviderDirectoryIntegration 
  selectedClient={client}
  prefilledCounty={client.address?.county}
/>
```

## Performance

- **Search speed**: <50ms (with indexes)
- **Collection size**: ~45MB (108K documents)
- **Index size**: ~15MB
- **Memory**: Minimal (cursor-based pagination)

## Key Stats

- **108,593** total service listings
- **12,945** unique providers
- **211** service types
- **291** counties
- **1,012** cities
- **99.6%** have phone numbers
- **89%** have addresses

## Top Services

1. 24-Hour Emergency Assistance - 20K listings
2. Adult Companion Services - 12K listings
3. Homemaker Services - 7K listings
4. Individual Community Living Supports - 6K listings
5. Employment Services - 5K listings

## Top Counties

1. Hennepin - 29K listings
2. Ramsey - 12K listings
3. Dakota - 7K listings
4. Anoka - 5K listings
5. St. Louis - 4K listings

## Maintenance

### Re-import Data
To update with new CSV:
```bash
# Replace CSV file
# Run import again (drops and recreates collection)
node scripts/import-provider-directory.js
```

### Monitor Performance
```javascript
// In MongoDB shell
db.provider_services.stats()
db.provider_services.getIndexes()
```

## Getting Started

### 1. Import Provider Data
```bash
# Make sure you have the CSV file in project root
node scripts/import-provider-directory.js
```

### 2. Add to BoardView
```tsx
import { ProviderDirectoryIntegration } from '@/components/providers/ProviderDirectoryIntegration';

// In your component
<ProviderDirectoryIntegration 
  selectedClient={selectedClient}
  prefilledCounty="Hennepin"
  onReferralCreated={() => refreshClients()}
/>
```

### 3. Start Using
- Click "Find Providers" button
- Search and filter 108K+ provider services
- Click "Create Referral" on any provider
- Referral form opens with client pre-filled
- Provider info available in form context

## Future Enhancements

- [ ] Geolocation search (nearest providers)
- [ ] Provider ratings/reviews from case managers
- [ ] Save favorite providers per case manager
- [ ] Export search results to CSV
- [ ] Advanced service category filters
- [ ] Provider availability status
- [ ] Integration with referral notes/history

