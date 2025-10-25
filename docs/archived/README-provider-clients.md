# Provider Clients Functionality

## Overview
The provider clients functionality allows providers to view and manage their assigned clients. This feature replicates the case manager client functionality but is tailored for provider use.

## Features

### Client Listing Page (`/provider/clients`)
- **View assigned clients**: Providers can see all clients assigned to them
- **Import functionality**: Import clients via CSV or manual entry (automatically assigned to provider)
- **Search functionality**: Search clients by name, email, or phone
- **Client status indicators**: Visual indicators for client status (Active, Needs Attention, New)
- **Case manager information**: Shows which case manager assigned each client
- **Quick actions**: View client details and access referrals
- **Client metrics**: Summary of client counts by status

### Client Detail Page (`/provider/clients/[id]`)
- **Comprehensive client information**: Personal details, contact info, address, etc.
- **Editable client data**: Providers can update client information
- **Referral management**: View active and completed referrals for the client
- **Relationship timeline**: Track client relationship events
- **Quick actions**: Access workspace, view referrals, refresh data

## API Changes

### Updated Endpoints
- `GET /api/clients` - Now supports `assignedToProvider=true` parameter for providers
- `GET /api/clients/[id]` - Provider access to individual client data
- `PATCH /api/clients/[id]` - Providers can update client information
- `POST /api/clients/import` - Providers can import clients (automatically assigned to them)

### Provider Filtering
When a provider requests clients with `assignedToProvider=true`, the API filters results to only show clients where `currentProvider` matches the provider's user ID.

## Navigation
The provider sidebar already includes a "Clients" link that navigates to `/provider/clients`.

## Security
- Providers can only access clients assigned to them
- API endpoints validate provider role and client assignment
- Rate limiting is applied to all client operations

## Usage

### For Providers
1. Navigate to "Clients" in the provider sidebar
2. View your assigned clients in the listing
3. Use "Import" to add new clients (automatically assigned to you)
4. Click "View" to see detailed client information
5. Use "Edit" mode to update client data
6. Access client referrals and workspace from the detail page

### For Developers
The provider clients functionality uses the same components and hooks as the case manager version, ensuring consistency across the application.

## Components Used
- `StatusBadge` - For client status display
- `useClientReferrals` - For fetching client referral data
- Standard UI components (Card, Button, Table, etc.)

## Future Enhancements
- Client communication features
- Progress tracking
- Document management
- Appointment scheduling 