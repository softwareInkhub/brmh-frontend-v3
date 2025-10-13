# BRMH IAM - Quick Start Guide 🚀

## What is BRMH IAM?

A powerful namespace-specific roles and permissions management system where superadmins can control user access across different domains (drive, admin, project management, etc.) with granular permissions.

## 🎯 Quick Access

### Option 1: Sidebar
1. Look for **"BRMH IAM"** in the AWS sidebar (indigo UserCog icon)
2. Click it to open the IAM management page

### Option 2: Direct URL
Navigate to: `http://localhost:3000/BRMH-IAM` or `https://yourdomain.com/BRMH-IAM`

## 🎬 5-Minute Tutorial

### Step 1: View Users (10 seconds)
- Open BRMH IAM page
- See all users with their current namespace roles
- Use search to find specific users

### Step 2: Assign a Role (1 minute)

**Example: Make John a Drive Manager**

1. Find John's user card
2. Click **"Assign Role"** button
3. Select **Namespace**: `drive`
4. Select **Role**: `manager`
5. Permissions auto-populate: 
   - ✅ read:files
   - ✅ write:files
   - ✅ delete:files
   - ✅ manage:folders
   - ✅ share:files
6. Click **"Assign Role"**
7. ✅ Done! John is now a Drive Manager

### Step 3: Edit Permissions (30 seconds)

**Example: Add export permission to John**

1. Find John's Drive role card
2. Click the **edit icon** (pencil)
3. Check **"export:files"** permission
4. Click **"Update Role"**
5. ✅ John can now export files

### Step 4: Add Custom Permission (1 minute)

**Example: Give Sarah a custom "approve products" permission**

1. Click "Assign Role" on Sarah's card
2. Select **Namespace**: `admin`
3. Select **Role**: `Custom Role` or any role
4. Scroll to "Add Custom Permission"
5. Type: `approve:products`
6. Click **"Add"**
7. Permission appears in selected list
8. Click **"Assign Role"**
9. ✅ Sarah has custom permission

### Step 5: Remove Role (5 seconds)

1. Find the namespace role card
2. Click **trash icon**
3. ✅ Role removed

## 🎨 Understanding the UI

### Main Dashboard
```
┌─────────────────────────────────────────┐
│  📊 Statistics Cards                    │
│  [Total Users] [Namespaces] [Roles]     │
└─────────────────────────────────────────┘
│                                         │
│  🔍 Search: [_____________]             │
│                                         │
│  👤 User Cards                          │
│  ┌───────────────────────────────┐     │
│  │ John Doe   [Assign Role]      │     │
│  │ john@example.com              │     │
│  │                               │     │
│  │ 📁 drive: manager   [✏️] [🗑️]  │     │
│  │ 🔑 admin: viewer    [✏️] [🗑️]  │     │
│  └───────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### User Card Details
- **Top**: User info (name, email, ID)
- **Middle**: Namespace role cards
- **Each Role Card**:
  - Namespace badge
  - Role name
  - First 3 permissions + count
  - Edit/Delete icons

## 📝 Common Scenarios

### Scenario 1: New Employee Onboarding
```bash
# Give basic access
1. Assign Role → drive → viewer → [read:files]
2. Assign Role → admin → viewer → [read:products, read:orders]
3. Assign Role → projectmangement → team-member → [read:projects, write:tasks]
```

### Scenario 2: Promotion to Manager
```bash
# Upgrade permissions
1. Edit drive role → change to "manager"
2. Edit projectmangement role → change to "pm"
```

### Scenario 3: Department Transfer
```bash
# Remove old, add new
1. Delete old namespace roles
2. Assign new namespace roles
```

### Scenario 4: Custom Role Creation
```bash
# Special permissions for specific user
1. Assign Role → namespace → "Custom Role"
2. Enter role name: "data-analyst"
3. Select: [read:products, read:orders, export:data, view:analytics]
4. Add custom: "generate:reports"
```

## 🔑 Permission Cheat Sheet

### Quick Copy-Paste Permissions

**Basic Read Access**
```
read:files
read:products
read:users
read:projects
```

**Editor Level**
```
read:files, write:files, manage:folders
read:products, write:products
read:projects, write:tasks
```

**Manager Level**
```
read:files, write:files, delete:files, manage:folders, share:files
read:products, write:products, delete:products, manage:users
read:all, write:projects, manage:projects, manage:team
```

**Admin Level**
```
read:all, write:all, delete:all, manage:all
```

## 🎯 Role Templates Quick Reference

### Drive
- `viewer` → Read only
- `editor` → Read + Write + Folders
- `manager` → Editor + Delete + Share
- `admin` → Full control

### Admin
- `viewer` → Read only
- `product-lister` → Products management
- `user-manager` → User management
- `admin` → Full control

### Project Management
- `viewer` → Read only
- `team-member` → Read + Tasks
- `pm` → Project management
- `admin` → Full control

## ⚡ Pro Tips

1. **Use Templates**: Start with a template role, then customize
2. **Search First**: Use search before scrolling through users
3. **Batch Planning**: Plan multiple assignments before starting
4. **Custom Naming**: Use clear names for custom permissions (verb:noun)
5. **Check Before Delete**: Review permissions before removing roles

## 🐛 Quick Troubleshooting

**Users not showing?**
- Check if backend is running
- Verify API_URL environment variable
- Ensure `brmh-users` table exists in DynamoDB
- Check browser console for errors
- Verify API endpoint: `GET /crud?tableName=brmh-users&pagination=true`

**Can't assign role?**
- Ensure all fields are filled (namespace, role, permissions)
- Check if user already has that namespace role
- Try refreshing the page

**Permissions not saving?**
- Ensure at least one permission is selected
- Check network tab for API errors
- Verify backend endpoint is accessible

**Custom permission not adding?**
- Use format: `action:resource`
- No spaces or special characters
- Press Enter or click Add button

## 🔐 Security Best Practices

1. **Principle of Least Privilege**: Give minimum required permissions
2. **Regular Audits**: Review roles quarterly
3. **Document Custom Roles**: Keep track of what custom permissions mean
4. **Revoke Unused**: Remove roles when users change departments
5. **Test First**: Test new role combinations in dev environment

## 📊 Example Role Matrix

| User | Drive | Admin | Projects |
|------|-------|-------|----------|
| CEO | admin | admin | admin |
| Manager | manager | user-manager | pm |
| Developer | editor | viewer | team-member |
| Intern | viewer | - | viewer |

## 🚀 Next Actions

After reading this guide:

1. [ ] Open BRMH IAM page
2. [ ] Explore existing users
3. [ ] Try assigning a test role
4. [ ] Edit permissions
5. [ ] Create a custom permission
6. [ ] Remove a test role
7. [ ] Check permission templates
8. [ ] Read full README for advanced features

## 📚 Additional Resources

- **Full Documentation**: `README.md` in this folder
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Backend API Docs**: `brmh-backend/COMPLETE_API_GUIDE.md`
- **API Cheat Sheet**: `brmh-backend/API_ENDPOINTS_CHEATSHEET.md`

## 💡 Remember

- **Different namespaces = Different roles** for same user
- **One namespace = One role** per user
- **Multiple permissions** per role
- **Custom permissions** are unlimited
- **Templates** save time

---

## 🎉 You're Ready!

You now know how to:
✅ Assign roles to users  
✅ Update permissions  
✅ Create custom roles  
✅ Manage multiple namespaces  
✅ Use permission templates  

**Go manage some roles!** 🚀

---

**Need Help?** Check the full README or contact support.

