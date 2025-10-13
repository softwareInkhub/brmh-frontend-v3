# BRMH IAM - Visual UI Guide

## 🎨 New Compact Design Overview

### Main Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🛡️ BRMH IAM - Namespace Roles & Permissions      [🔄 Refresh]          │
│  Manage namespace-specific roles and permissions                        │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│  │Total Users  │ │Active NS    │ │Assignments  │ │Templates    │     │
│  │    247      │ │     6       │ │    892      │ │    12       │     │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘     │
├─────────────────────────────────────────────────────────────────────────┤
│  [ User Management ] [ Role Templates ]                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 User Management Tab (Compact Table)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  🔍 Search by name, email, ID, or Cognito username...                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  User                │ Cognito Username │ Email           │ Namespace Roles │ Action│
├─────────────────────────────────────────────────────────────────────────────────────┤
│  👤 John Doe         │  john_doe        │ john@ex.com     │ [drive:manager] │[Assign]│
│     user-123         │                  │                 │ [admin:viewer]  │       │
│                      │                  │                 │        [✏️][🗑️]  │       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  👤 Sarah Smith      │  sarah.smith     │ sarah@ex.com    │ [admin:pm]      │[Assign]│
│     user-456         │                  │                 │        [✏️][🗑️]  │       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  👤 Mike Johnson     │  mike_j_8472     │ mike@ex.com     │ No roles        │[Assign]│
│     user-789         │                  │                 │                 │       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Table Features:
- **Row 1**: User info with avatar
- **Row 2**: Cognito username badge (monospace)
- **Row 3**: Email address
- **Row 4**: Namespace role badges (inline, hover for actions)
- **Row 5**: Quick assign button

### Namespace Role Badge
```
┌─────────────────────────────┐
│  [drive:manager] [✏️][🗑️]    │
│   ↑        ↑      ↑   ↑      │
│   NS      Role  Edit Del     │
└─────────────────────────────┘

On Hover: Edit and Delete icons appear
```

---

## ✨ Role Templates Tab

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🔍 Search templates by name, role, namespace, or tags...  [+ Create]    │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐              │
│  │ ✨ Drive Power User      │  │ ✨ Admin Product Manager │              │
│  │  [🌐 drive] [power-user] │  │  [📁 admin] [manager]    │              │
│  │  ─────────────────────   │  │  ─────────────────────   │              │
│  │  Permissions (6):        │  │  Permissions (5):        │              │
│  │  [read:files]            │  │  [read:products]         │              │
│  │  [write:files]           │  │  [write:products]        │              │
│  │  [delete:files]          │  │  [delete:products]       │              │
│  │  [manage:folders] +2 more│  │  [list:products] +1 more │              │
│  │  ─────────────────────   │  │  ─────────────────────   │              │
│  │  Tags:                   │  │  Tags:                   │              │
│  │  [🏷️ drive] [🏷️ advanced]│  │  [🏷️ admin] [🏷️ products]│              │
│  │  ─────────────────────   │  │  ─────────────────────   │              │
│  │  Created: Oct 13, 2025   │  │  Created: Oct 13, 2025   │              │
│  │              [📋 Copy][🗑️]│  │              [📋 Copy][🗑️]│              │
│  └─────────────────────────┘  └─────────────────────────┘              │
└──────────────────────────────────────────────────────────────────────────┘
```

### Template Card Components:
1. **Header**: Name with sparkle icon, Copy/Delete buttons
2. **Badges**: Namespace + Role
3. **Permissions**: First 4 + count
4. **Tags**: Visual tag display with icon
5. **Footer**: Creation date

---

## 🎯 Create Template Dialog

```
┌─────────────────────────────────────────────────────────┐
│  ✨ Create Role Template                                │
│  Create a reusable template for quick role assignment   │
├─────────────────────────────────────────────────────────┤
│  Template Name *     │  Namespace *                     │
│  [_____________]     │  [v General/Specific]            │
│                      │  🌐 General (All Namespaces)     │
│  Role Name *         │  📁 drive                        │
│  [_____________]     │  📁 admin                        │
│                      │  📁 projectmangement             │
│  Tags (comma-separated)                                 │
│  [admin, power-user, drive-specific]                    │
│                                                          │
│  Permissions * (28 selected)                            │
│  ┌─────────────────────────────────────────┐            │
│  │ ☑ read:files    ☑ write:files          │            │
│  │ ☑ delete:files  ☑ manage:folders        │            │
│  │ ☐ share:files   ☐ export:files          │            │
│  │ ... (scrollable)                         │            │
│  └─────────────────────────────────────────┘            │
│                                                          │
│  Selected Permissions                                    │
│  [read:files] [write:files] [delete:files] ...          │
│                                                          │
│                              [Cancel] [💾 Create Template│
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Assign Role Dialog (With Templates)

```
┌──────────────────────────────────────────────────────────┐
│  🛡️ Assign Namespace Role                                │
│  Assign role to John Doe - Use a template or configure   │
├──────────────────────────────────────────────────────────┤
│  ✨ Quick Apply Template                                 │
│  [📋 Drive Power User] [📋 Admin Viewer] [📋 PM Role]    │
│                                                           │
│  Namespace *              │  Role *                       │
│  [v Select namespace]     │  [manager_________]           │
│                           │                               │
│  Permissions * (8 selected)                               │
│  ┌──────────────────────────────────────────┐            │
│  │ ☑ read:files    ☑ write:files           │            │
│  │ ☑ delete:files  ☑ manage:folders         │            │
│  │ ... (scrollable)                          │            │
│  └──────────────────────────────────────────┘            │
│                                                           │
│  Custom Permission                                        │
│  [custom:action________] [Add]                           │
│                                                           │
│  Selected Permissions                                     │
│  [read:files ✕] [write:files ✕] [delete:files ✕] ...    │
│                                                           │
│                                [Cancel] [💾 Assign Role]  │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Interactive Elements

### Hover States

**User Row**:
```
Normal:  │ 👤 John   │ john_doe │ john@ex.com │ [drive:manager] │ [Assign] │
Hover:   │ 👤 John   │ john_doe │ john@ex.com │ [drive:manager ✏️🗑️] │ [Assign] │
```

**Namespace Badge**:
```
Normal:  [drive:manager]
Hover:   [drive:manager ✏️🗑️]  ← Edit and Delete icons appear
```

**Template Card**:
```
Normal:  Regular card display
Hover:   Slight shadow lift, copy/delete buttons more visible
```

### Click Actions

**User Row Click**: No action (reserved)
**Namespace Badge Click**: No default action
**Edit Icon Click**: Opens edit dialog with pre-filled data
**Delete Icon Click**: Confirms and removes role
**Assign Button Click**: Opens assignment dialog
**Template Copy Click**: Applies template to current form
**Template Delete Click**: Removes template from localStorage

---

## 🏷️ Tag System Visual

### In Template Card
```
┌─────────────────────────────┐
│  Tags:                      │
│  [🏷️ admin]                 │
│  [🏷️ power-user]            │
│  [🏷️ drive-specific]        │
└─────────────────────────────┘
```

### In Search
```
Search: "admin"
         ↓
Shows all templates with:
- Name containing "admin"
- Role containing "admin"
- Namespace = "admin"
- Tags containing "admin"  ← NEW!
```

---

## 📱 Responsive Behavior

### Desktop (>1024px)
```
┌──────────────┬──────────────┬──────────────┐
│  Template 1  │  Template 2  │  Template 3  │
├──────────────┼──────────────┼──────────────┤
│  Template 4  │  Template 5  │  Template 6  │
└──────────────┴──────────────┴──────────────┘
3 columns
```

### Tablet (768px-1024px)
```
┌──────────────┬──────────────┐
│  Template 1  │  Template 2  │
├──────────────┼──────────────┤
│  Template 3  │  Template 4  │
└──────────────┴──────────────┘
2 columns
```

### Mobile (<768px)
```
┌──────────────┐
│  Template 1  │
├──────────────┤
│  Template 2  │
├──────────────┤
│  Template 3  │
└──────────────┘
1 column (stacked)
```

---

## 🎯 Real-World Usage Examples

### Example 1: Create "Drive Manager" Template

1. Click "Role Templates" tab
2. Click "+ Create Template"
3. Fill in:
   ```
   Template Name: Drive Manager - Full Access
   Namespace: drive
   Role: manager
   Tags: drive, manager, full-access
   Permissions: ☑ read:files, write:files, delete:files, 
                manage:folders, share:files, export:files
   ```
4. Click "Create Template"
5. ✅ Template appears in grid

### Example 2: Quick Assign Using Template

1. Go to "User Management"
2. Find "Jane Smith" in table
3. Click "Assign" button
4. In dialog, click "Drive Manager - Full Access" button
5. (All fields auto-filled)
6. Click "Assign Role"
7. ✅ Jane now has Drive Manager role instantly!

### Example 3: Search Templates by Tag

1. Go to "Role Templates"
2. Type "admin" in search box
3. See all templates tagged with "admin"
4. Click copy on desired template
5. Go to User Management
6. Click Assign on user
7. Template already applied!

---

## 🎨 Color Coding Guide

### Namespace Colors
- **drive**: Blue theme
- **admin**: Purple theme
- **projectmangement**: Green theme
- **auth**: Orange theme
- **general**: Indigo theme (globe emoji)

### UI Elements
- **Primary Actions**: Indigo-Purple gradient
- **Success**: Green badges/borders
- **Warning**: Yellow badges
- **Danger**: Red hover states
- **Info**: Blue badges
- **Muted**: Gray backgrounds

---

## 🔍 Search Functionality

### User Search
```
Input: "john"

Matches:
✓ Username: "John Doe"
✓ Email: "john@example.com"
✓ User ID: "john-123"
✓ Cognito Username: "john_doe_8472"
```

### Template Search
```
Input: "admin"

Matches:
✓ Template Name: "Admin Product Manager"
✓ Role: "admin"
✓ Namespace: "admin"
✓ Tags: ["admin", "power-user"]
         ↑ Tag match!
```

---

## 💡 UI Best Practices

### Cognito Username Display
- Always shown in **monospace font** (better readability)
- Displayed as **outline badge** (visual distinction)
- Shows "N/A" if not available
- Searchable (included in search filter)

### Table vs Cards Trade-offs

**Table (NEW - Current Design)**:
✅ Shows 10+ users per screen
✅ All info at a glance
✅ Easy scanning
✅ Professional look
✅ Better for large datasets

**Cards (OLD - Previous Design)**:
✅ More visual/colorful
✅ Expandable details
❌ Takes too much space (1-2 users per screen)
❌ Requires more scrolling

### Template Cards (Kept Cards)
Templates use cards because:
- Visual appeal important for templates
- Limited number of templates
- Need to show full details
- Quick reference needed

---

## 🎯 Keyboard Shortcuts (Future Enhancement)

Potential shortcuts:
- `Ctrl/Cmd + K` - Focus search
- `Ctrl/Cmd + N` - New template
- `Ctrl/Cmd + R` - Refresh users
- `Esc` - Close dialog
- `Enter` - Submit form (when applicable)

---

## 📊 Data Display Philosophy

### Information Hierarchy

**Level 1 (Always Visible)**:
- User name
- Cognito username
- Email
- Namespace:Role badges

**Level 2 (On Hover)**:
- Edit button
- Delete button

**Level 3 (On Click/Dialog)**:
- Full permission list
- Assignment dates
- Detailed metadata

This keeps the UI clean while maintaining full functionality!

---

## 🎨 Visual Indicators

### Status Indicators
- **Active Role**: Badge with namespace:role
- **No Roles**: Gray text "No roles assigned"
- **Loading**: Spinning refresh icon
- **Error**: Red toast notification
- **Success**: Green toast notification

### Interactive Feedback
- **Hover**: Slight shadow, color change
- **Click**: Button press effect
- **Loading**: Disabled state with spinner
- **Success**: Toast + UI update
- **Error**: Toast + no state change

---

## 🎉 Summary of Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Layout** | Large cards | Compact table |
| **Users per view** | 1-2 | 10-15 |
| **Cognito Username** | Hidden | Prominent column |
| **Templates** | Hardcoded | CRUD system |
| **Tags** | None | Searchable tags |
| **Quick Apply** | Manual entry | One-click |
| **Space usage** | Inefficient | Optimized |
| **Professional look** | Casual | Enterprise |

---

## 🚀 Getting Started

1. Navigate to `/BRMH-IAM` or click sidebar
2. See all users in compact table
3. Search for specific user (by any field)
4. Click "Assign" to add roles
5. Use templates for quick assignment
6. Edit/delete roles inline
7. Create your own templates in Templates tab
8. Tag templates for easy finding

**That's it! Professional IAM management in a clean, compact UI.** ✨

---

*Last Updated: October 13, 2025*  
*Version: 2.0.0 - Compact Table Design*

