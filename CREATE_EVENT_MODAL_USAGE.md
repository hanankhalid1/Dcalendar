# CreateEventModal Usage Guide

## Overview

The `CreateEventModal` component has been updated to be fully functional with API integration. It now captures all form data and sends it to your `/updateevents` API endpoint.

## Key Features

- ✅ Form validation
- ✅ API integration with `/updateevents` endpoint
- ✅ User authentication context (uid and active from current user)
- ✅ Date/time formatting for API
- ✅ Loading states and error handling
- ✅ Form reset after successful submission

## API Integration

### Endpoint

```
POST /updateevents
Authorization: Bearer {token}
```

### Request Format

```json
{
  "events": [
    {
      "uid": "auto-generated-unique-id",
      "fromTime": "20250812T090000",
      "toTime": "20250812T100000",
      "repeatEvent": "",
      "customRepeatEvent": ""
    }
  ],
  "active": "user@example.com",
  "type": "update"
}
```

### Response Format

```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {...}
}
```

## Usage Example

```tsx
import React, { useState } from 'react';
import CreateEventModal from '../components/CreateEventModal';

const YourComponent = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSave = () => {
    // This will be called after successful event creation
    console.log('Event saved successfully');
    // You can refresh your calendar data here
  };

  return (
    <>
      {/* Your other components */}

      <CreateEventModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSave}
      />
    </>
  );
};
```

## Form Fields Captured

The modal captures the following data:

1. **Title** - Required field
2. **Date & Time** - Required fields (start and end time)
3. **Event Type** - Dropdown selection (Event, Task, Out of office, etc.)
4. **Location** - Optional text input
5. **Description** - Optional multiline text
6. **Guests** - Multi-select from available users
7. **Notification Settings** - Minutes before event
8. **Guest Permissions** - Modify event, invite others, see guest list

## User Authentication

The component automatically:

- Gets the active user account from `useActiveAccount` store
- Extracts the `uid` and `active` fields for the API
- Uses the Bearer token from `useToken` store

## Error Handling

The component includes comprehensive error handling:

- Form validation before submission
- API error handling with user-friendly messages
- Loading states to prevent double submissions
- Success confirmation with form reset

## Services Used

- `EventsService` - Handles all API calls
- `useActiveAccount` - Gets current user data
- `useToken` - Gets authentication token

## File Structure

```
src/
├── services/
│   └── EventsService.ts          # API service for events
├── components/
│   └── CreateEventModal.tsx      # Updated modal component
└── stores/
    ├── useActiveAccount.ts       # User account store
    └── useTokenStore.ts          # Authentication token store
```

## Next Steps

To extend functionality, you can:

1. Add more event types to the dropdown
2. Implement recurring event options
3. Add file attachment support
4. Integrate with calendar synchronization
5. Add event editing capabilities



