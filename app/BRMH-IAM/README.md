# BRMH IAM - Namespace Roles & Permissions Management

## Overview

A comprehensive Identity and Access Management (IAM) system for managing namespace-specific roles and permissions across the BRMH platform. This UI allows superadmins to assign, update, and remove roles and permissions for users in different namespaces.

## Features

### 🎯 Core Features

1. **User Management**
   - View all users with their namespace roles
   - Search users by name, email, or ID
   - Visual overview of role assignments per user

2. **Namespace Role Assignment**
   - Assign roles to users in specific namespaces
   - Support for multiple namespaces per user
   - Different roles per namespace for the same user

3. **Permission Management**
   - Predefined permission templates
   - Custom permission creation
   - Add/remove permissions dynamically
   - Visual permission selection with checkboxes

4. **CRUD Operations**
   - **Create**: Assign new namespace roles to users
   - **Read**: View all user roles and permissions
   - **Update**: Modify existing roles and permissions
   - **Delete**: Remove roles from namespaces

## Supported Namespaces

- `drive` - File management and collaboration
- `admin` - Administrative operations
- `projectmangement` - Project and task management
- `auth` - Authentication and authorization
- `api` - API access control
- `custom` - Custom namespaces

## Permission Templates

### Drive Namespace

- **Viewer**: `read:files`
- **Editor**: `read:files`, `write:files`, `manage:folders`
- **Manager**: `read:files`, `write:files`, `delete:files`, `manage:folders`, `share:files`
- **Admin**: `read:all`, `write:all`, `delete:all`, `manage:all`

### Admin Namespace

- **Viewer**: `read:products`, `read:orders`, `read:users`
- **Product Lister**: `read:products`, `write:products`, `list:products`
- **User Manager**: `read:users`, `write:users`, `manage:users`
- **Admin**: `read:all`, `write:all`, `delete:all`, `manage:users`, `manage:settings`

### Project Management Namespace

- **Viewer**: `read:projects`, `read:tasks`
- **Team Member**: `read:projects`, `write:tasks`, `comment:tasks`
- **PM**: `read:all`, `write:projects`, `manage:projects`, `manage:team`
- **Admin**: `read:all`, `write:all`, `delete:all`, `manage:all`

## Available Permissions

### File Operations
- `read:files`, `write:files`, `delete:files`
- `manage:folders`, `share:files`
- `export:files`, `import:files`

### Product Operations
- `read:products`, `write:products`, `delete:products`
- `list:products`, `export:products`, `import:products`

### User Operations
- `read:users`, `write:users`, `delete:users`
- `manage:users`, `invite:users`

### Project Operations
- `read:projects`, `write:projects`, `delete:projects`
- `manage:projects`
- `read:tasks`, `write:tasks`, `delete:tasks`

### Admin Operations
- `read:all`, `write:all`, `delete:all`
- `manage:all`, `manage:settings`, `manage:billing`
- `view:analytics`, `export:data`

### Order Operations
- `read:orders`, `write:orders`, `manage:orders`

## How to Use

### 1. Assign a Role

1. Navigate to the **User Management** tab
2. Find the user you want to assign a role to
3. Click **Assign Role** button
4. Select the **namespace** (e.g., drive, admin)
5. Select a **role** (or choose "Custom Role")
6. Select **permissions** from the list or add custom ones
7. Click **Assign Role** to save

### 2. Edit Permissions

1. Locate the user's namespace role card
2. Click the **Edit** (pencil) icon
3. Modify the role or permissions
4. Click **Update Role** to save changes

### 3. Remove a Role

1. Locate the user's namespace role card
2. Click the **Delete** (trash) icon
3. Confirm the deletion

### 4. Add Custom Permissions

1. In the permission selection dialog
2. Scroll to "Add Custom Permission"
3. Enter the permission in format: `action:resource`
   - Example: `custom:action`, `export:reports`, `manage:billing`
4. Click **Add** or press Enter

## API Integration

The UI integrates with the following backend endpoints:

### User Endpoints
- `GET /crud?tableName=brmh-users&pagination=true` - Fetch all users from DynamoDB

### Data Structure
The user data is stored in the `brmh-users` DynamoDB table with the following structure:

```json
{
  "userId": "user-123",
  "username": "John Doe",
  "email": "john@example.com",
  "namespaceRoles": {
    "drive": {
      "role": "manager",
      "permissions": ["read:files", "write:files", "delete:files"],
      "assignedAt": "2025-10-13T12:00:00.000Z",
      "updatedAt": "2025-10-13T12:00:00.000Z",
      "assignedBy": "superadmin"
    },
    "admin": {
      "role": "viewer",
      "permissions": ["read:products", "read:orders"],
      "assignedAt": "2025-10-13T10:00:00.000Z",
      "updatedAt": "2025-10-13T10:00:00.000Z",
      "assignedBy": "admin"
    }
  },
  "metadata": {
    "accessedNamespaces": ["drive", "admin"]
  }
}
```

### Namespace Role Endpoints
- `POST /namespace-roles/assign` - Assign role to user
- `PUT /namespace-roles/:userId/:namespace` - Update role
- `DELETE /namespace-roles/:userId/:namespace` - Remove role
- `GET /namespace-roles/:userId` - Get all user's namespace roles
- `GET /namespace-roles/:userId/:namespace` - Get specific namespace role
- `POST /namespace-roles/:userId/:namespace/check-permissions` - Check permissions
- `POST /namespace-roles/:userId/:namespace/add-permissions` - Add permissions
- `POST /namespace-roles/:userId/:namespace/remove-permissions` - Remove permissions

## Request/Response Examples

### Assign Role Request
```json
{
  "userId": "user-123",
  "namespace": "drive",
  "role": "manager",
  "permissions": ["read:files", "write:files", "delete:files", "manage:folders"],
  "assignedBy": "superadmin"
}
```

### Assign Role Response
```json
{
  "success": true,
  "message": "Role assigned successfully",
  "namespaceRole": {
    "role": "manager",
    "permissions": ["read:files", "write:files", "delete:files", "manage:folders"],
    "assignedAt": "2025-10-13T12:00:00.000Z",
    "updatedAt": "2025-10-13T12:00:00.000Z",
    "assignedBy": "superadmin"
  }
}
```

### Update Role Request
```json
{
  "role": "senior-manager",
  "permissions": ["read:all", "write:all", "delete:all", "manage:all"],
  "assignedBy": "superadmin"
}
```

## UI Components

### Dashboard Cards
- **Total Users**: Shows total number of users
- **Active Namespaces**: Count of namespaces with role assignments
- **Total Role Assignments**: Total number of roles assigned across all users
- **Available Permissions**: Total predefined permissions

### User Cards
Each user card displays:
- User avatar and name
- User ID and email
- Namespace role summary
- Quick actions (Assign Role)
- Expandable role details with edit/delete options

### Role Cards (per namespace)
- Namespace badge
- Role name
- Permissions list (first 3 + count)
- Assignment date
- Edit and Delete actions

### Dialogs

#### Assign Role Dialog
- User information
- Namespace selector
- Role selector (with templates)
- Permission checkboxes
- Custom permission input
- Selected permissions summary

#### Edit Permissions Dialog
- Current namespace and role
- Role modification
- Permission updates
- Save changes

## Styling

The UI uses:
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Lucide React** icons
- **Gradient backgrounds** (indigo to purple theme)
- **Responsive design** for mobile and desktop

## Color Scheme

- **Primary**: Indigo-600 to Purple-600
- **Secondary**: Various color-coded namespaces
- **Success**: Green-500
- **Warning**: Yellow-500
- **Danger**: Red-500
- **Info**: Blue-500

## Accessing the UI

1. Navigate to: `http://localhost:3000/BRMH-IAM`
2. Or click **BRMH IAM** in the AWS sidebar
3. The sidebar icon is a **UserCog** in indigo color

## Security Notes

⚠️ **Important Security Considerations**:

1. This UI should only be accessible to **superadmins**
2. Implement proper authentication checks before allowing access
3. Validate all permission changes on the backend
4. Log all role assignment and modification activities
5. Implement role hierarchy to prevent privilege escalation

## Future Enhancements

- [ ] Role templates management
- [ ] Bulk user role assignment
- [ ] Permission groups/presets
- [ ] Audit log for role changes
- [ ] Role inheritance
- [ ] Time-based role assignments
- [ ] Approval workflow for sensitive permissions
- [ ] Export/import role configurations
- [ ] Real-time permission checking
- [ ] Integration with SSO providers

## Troubleshooting

### Users not loading
- Check API endpoint: `${API_BASE_URL}/crud?tableName=users`
- Verify CORS settings
- Check network tab for errors

### Role assignment fails
- Verify user ID is correct
- Check namespace name (case-sensitive)
- Ensure permissions array is not empty
- Check backend API is running

### Permissions not updating
- Clear browser cache
- Refresh user list
- Check backend response

## Development

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://brmh.in
```

### Running Locally
```bash
cd brmh-frontend-v3
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

## Support

For issues or feature requests:
- Create an issue in the repository
- Contact the development team
- Check the API documentation in `brmh-backend/COMPLETE_API_GUIDE.md`

---

**Last Updated**: October 13, 2025  
**Version**: 1.0.0  
**Maintained by**: BRMH Development Team

