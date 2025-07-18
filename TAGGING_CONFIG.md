# @ Tagging System Configuration Guide

The @ tagging system allows users to mention team members in gym equipment notes, which will send them notifications. Here's how to configure it:

## Quick Configuration

All tagging settings are in `src/config.js` under the `TAGGING` section:

```javascript
TAGGING: {
  // Enable/disable @ tagging system
  ENABLED: true,
  
  // Available users for tagging
  AVAILABLE_USERS: [
    { id: 'john', name: 'John Smith', email: 'john@exos.com', role: 'Manager' },
    { id: 'sarah', name: 'Sarah Johnson', email: 'sarah@exos.com', role: 'Coach' },
    // Add more users here...
  ],
  
  // Tagging behavior settings
  SETTINGS: {
    SHOW_ROLES: true,
    ALLOW_FIRST_NAME: true,
    ALLOW_LAST_NAME: true,
    ALLOW_EMAIL: false,
    MAX_SUGGESTIONS: 5,
    DISPLAY_FORMAT: '{name} ({role})',
  },
  
  // Tag highlighting in notes
  HIGHLIGHTING: {
    BACKGROUND_COLOR: '#007bff',
    TEXT_COLOR: 'white',
    BORDER_RADIUS: '2px',
    PADDING: '1px 3px',
  }
}
```

## Adding Users

To add new users, simply add them to the `AVAILABLE_USERS` array:

```javascript
AVAILABLE_USERS: [
  { id: 'john', name: 'John Smith', email: 'john@exos.com', role: 'Manager' },
  { id: 'sarah', name: 'Sarah Johnson', email: 'sarah@exos.com', role: 'Coach' },
  { id: 'mike', name: 'Mike Davis', email: 'mike@exos.com', role: 'Trainer' },
  // Add your new user here:
  { id: 'newuser', name: 'New User', email: 'newuser@exos.com', role: 'Coach' },
]
```

### User Object Properties

- `id`: Unique identifier (used for internal tracking)
- `name`: Full name (displayed in suggestions)
- `email`: Email address (for notifications)
- `role`: Role/title (optional, displayed in suggestions)

## Tagging Behavior Settings

### `SHOW_ROLES` (boolean)
- `true`: Shows user roles in tag suggestions
- `false`: Hides roles to save space

### `ALLOW_FIRST_NAME` (boolean)
- `true`: Users can tag by typing `@john` for "John Smith"
- `false`: Must type full name or ID

### `ALLOW_LAST_NAME` (boolean)
- `true`: Users can tag by typing `@smith` for "John Smith"
- `false`: Must type full name or ID

### `ALLOW_EMAIL` (boolean)
- `true`: Users can tag by typing part of email
- `false`: Email tagging disabled

### `MAX_SUGGESTIONS` (number)
- Maximum number of suggestions to show in dropdown
- Recommended: 3-8

### `DISPLAY_FORMAT` (string)
- Format for displaying user suggestions
- Available variables: `{name}`, `{role}`, `{email}`
- Examples:
  - `'{name} ({role})'` → "John Smith (Manager)"
  - `'{name}'` → "John Smith"
  - `'{name} - {email}'` → "John Smith - john@exos.com"

## Tag Highlighting

Configure how tagged users appear in notes:

### `BACKGROUND_COLOR` (string)
- Background color for tag highlights
- Use hex colors: `'#007bff'`

### `TEXT_COLOR` (string)
- Text color for tag highlights
- Use hex colors: `'white'`

### `BORDER_RADIUS` (string)
- Corner rounding: `'2px'`, `'4px'`, etc.

### `PADDING` (string)
- Internal spacing: `'1px 3px'`, `'2px 4px'`, etc.

## How It Works

1. **Typing**: Users type `@` followed by part of a name
2. **Suggestions**: Dropdown shows matching users
3. **Selection**: Click a user to tag them
4. **Highlighting**: Tagged users appear highlighted in notes
5. **Notifications**: Tagged users receive email notifications when notes are saved

## Example Configurations

### Minimal Setup
```javascript
TAGGING: {
  ENABLED: true,
  AVAILABLE_USERS: [
    { id: 'john', name: 'John Smith', email: 'john@exos.com' },
    { id: 'sarah', name: 'Sarah Johnson', email: 'sarah@exos.com' },
  ],
  SETTINGS: {
    SHOW_ROLES: false,
    ALLOW_FIRST_NAME: true,
    ALLOW_LAST_NAME: true,
    ALLOW_EMAIL: false,
    MAX_SUGGESTIONS: 3,
    DISPLAY_FORMAT: '{name}',
  }
}
```

### Full Featured Setup
```javascript
TAGGING: {
  ENABLED: true,
  AVAILABLE_USERS: [
    { id: 'john', name: 'John Smith', email: 'john@exos.com', role: 'Manager' },
    { id: 'sarah', name: 'Sarah Johnson', email: 'sarah@exos.com', role: 'Coach' },
    { id: 'mike', name: 'Mike Davis', email: 'mike@exos.com', role: 'Trainer' },
  ],
  SETTINGS: {
    SHOW_ROLES: true,
    ALLOW_FIRST_NAME: true,
    ALLOW_LAST_NAME: true,
    ALLOW_EMAIL: true,
    MAX_SUGGESTIONS: 5,
    DISPLAY_FORMAT: '{name} ({role})',
  },
  HIGHLIGHTING: {
    BACKGROUND_COLOR: '#28a745',
    TEXT_COLOR: 'white',
    BORDER_RADIUS: '4px',
    PADDING: '2px 6px',
  }
}
```

## Disabling Tagging

To completely disable the tagging system:

```javascript
TAGGING: {
  ENABLED: false,
  // ... rest of config can be empty
}
```

## Troubleshooting

### Tags not working?
1. Check `ENABLED: true`
2. Verify users are in `AVAILABLE_USERS` array
3. Check browser console for errors

### Suggestions not showing?
1. Verify `MAX_SUGGESTIONS` > 0
2. Check that user names match your search
3. Ensure `ALLOW_FIRST_NAME`/`ALLOW_LAST_NAME` settings match your search

### Notifications not sending?
1. Check notification settings in `NOTIFICATIONS` section
2. Verify email addresses are correct
3. Check notification service configuration 