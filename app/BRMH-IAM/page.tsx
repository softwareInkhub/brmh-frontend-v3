'use client';

import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Key,
  Lock,
  UserCog,
  Save,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  X,
  Tags,
  Copy,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from '@/app/hooks/use-toast';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Checkbox } from '@/app/components/ui3/checkbox';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const ALL_PERMISSIONS = [
  'read:files', 'write:files', 'delete:files', 'manage:folders', 'share:files', 'export:files', 'import:files',
  'read:products', 'write:products', 'delete:products', 'list:products', 'export:products', 'import:products',
  'read:users', 'write:users', 'delete:users', 'manage:users', 'invite:users',
  'read:projects', 'write:projects', 'delete:projects', 'manage:projects',
  'read:tasks', 'write:tasks', 'delete:tasks',
  'read:all', 'write:all', 'delete:all', 'manage:all', 'manage:settings', 'manage:billing', 'view:analytics',
  'export:data', 'read:orders', 'write:orders', 'manage:orders',
];

interface User {
  userId: string;
  username: string;
  email: string;
  cognitoUsername?: string;
  namespaceRoles?: Record<string, NamespaceRole>;
  metadata?: {
    accessedNamespaces?: string[];
    [key: string]: any;
  };
}

interface NamespaceRole {
  role: string;
  permissions: string[];
  assignedAt: string;
  updatedAt?: string;
  assignedBy?: string;
}

interface RoleTemplate {
  id: string;
  name: string;
  namespace: string; // 'general' for all namespaces
  role: string;
  permissions: string[];
  tags: string[];
  createdAt: string;
  createdBy: string;
}

interface ResourceAccess {
  userId: string;
  resourceId: string;
  resourceType: 'namespace' | 'schema' | 'table' | 'drive-folder' | 'drive-file';
  actualResourceId: string;
  permissions: string[];
  grantedBy: string;
  grantedAt: string;
  updatedAt: string;
  expiresAt?: string;
  metadata?: any;
  isActive: boolean;
}

interface ResourceConfig {
  resourceTypes: Array<{ value: string; label: string; description: string }>;
  permissionTypes: Array<{ value: string; label: string; description: string }>;
}

export default function BRMHIAMPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false);
  const [isEditPermissionsDialogOpen, setIsEditPermissionsDialogOpen] = useState(false);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [customPermission, setCustomPermission] = useState('');
  const [editingNamespace, setEditingNamespace] = useState<string | null>(null);
  const [availableNamespaces, setAvailableNamespaces] = useState<string[]>([]);
  
  // Template Management
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null);
  
  // Resource Access Management
  const [resourceAccesses, setResourceAccesses] = useState<ResourceAccess[]>([]);
  const [resourceConfig, setResourceConfig] = useState<ResourceConfig | null>(null);
  const [isGrantResourceDialogOpen, setIsGrantResourceDialogOpen] = useState(false);
  const [selectedResourceUser, setSelectedResourceUser] = useState<User | null>(null);
  const [resourceType, setResourceType] = useState<string>('');
  const [resourceId, setResourceId] = useState<string>('');
  const [resourcePermissions, setResourcePermissions] = useState<string[]>([]);
  const [resourceSearch, setResourceSearch] = useState('');
  const [filterResourceType, setFilterResourceType] = useState<string>('all');
  const [newTemplate, setNewTemplate] = useState<Partial<RoleTemplate>>({
    name: '',
    namespace: 'general',
    role: '',
    permissions: [],
    tags: [],
  });
  const [templateTags, setTemplateTags] = useState<string>('');
  const [templateCustomPermission, setTemplateCustomPermission] = useState<string>('');

  useEffect(() => {
    fetchUsers();
    fetchNamespaces();
    fetchRoleTemplates();
    fetchResourceConfig();
  }, []);

  const fetchNamespaces = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/crud?tableName=brmh-namespace&pagination=true&itemPerPage=100`);
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];

      // Resolve namespace name from the Dynamo-style AttributeValue map stored under `data`
      const namesUnfiltered = (items as any[]).map((item: any): string | undefined => {
        const d = item?.data || item?.Item || item;
        // Prefer explicit namespace-name
        const nameFromAttr = d?.["namespace-name"]?.S || d?.namespaceName?.S || d?.namespace?.S;
        if (typeof nameFromAttr === 'string' && nameFromAttr.trim()) return nameFromAttr.trim();

        // Some backends may materialize plain strings instead of AttributeValues
        const namePlain = d?.["namespace-name"] || d?.namespaceName || d?.name;
        if (typeof namePlain === 'string' && namePlain.trim()) return namePlain.trim();

        // Fallback to namespace-id if name missing
        const idAttr = d?.["namespace-id"]?.S || d?.id?.S;
        if (typeof idAttr === 'string' && idAttr.trim()) return idAttr.trim();

        const idPlain = d?.["namespace-id"] || d?.id || d?.slug;
        if (typeof idPlain === 'string' && idPlain.trim()) return idPlain.trim();

        return undefined;
      });
      const names: string[] = namesUnfiltered
        .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
        .map((v: string) => v);

      const unique: string[] = Array.from(new Set<string>(names)).sort();
      if (unique.length > 0) {
        setAvailableNamespaces(unique);
      }
    } catch (err) {
      // Silently ignore and fallback to user-derived namespaces
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/crud?tableName=brmh-users&pagination=true&itemPerPage=100`);
      const data = await response.json();
      const fetchedUsers = data.items || [];
      setUsers(fetchedUsers);
      
      // Extract all unique namespaces from users
      const namespacesSet = new Set<string>();
      fetchedUsers.forEach((user: User) => {
        // From namespaceRoles
        if (user.namespaceRoles) {
          Object.keys(user.namespaceRoles).forEach(ns => namespacesSet.add(ns));
        }
        // From metadata.accessedNamespaces
        if (user.metadata?.accessedNamespaces) {
          user.metadata.accessedNamespaces.forEach(ns => namespacesSet.add(ns));
        }
      });
      
      const namespaces = Array.from(namespacesSet).sort();
      // Do not override namespaces fetched from brmh-namespaces if present
      setAvailableNamespaces((prev) => prev.length > 0 ? prev : (namespaces.length > 0 ? namespaces : ['drive', 'admin', 'projectmangement', 'auth', 'api']));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplatesFromLocalStorage = () => {
    const stored = localStorage.getItem('brmh-role-templates');
    if (stored) {
      setRoleTemplates(JSON.parse(stored));
    }
  };

  const parseAttribute = (val: any): any => {
    if (!val) return undefined;
    if (typeof val !== 'object') return val;
    if ('S' in val) return val.S;
    if ('N' in val) return Number(val.N);
    if ('BOOL' in val) return !!val.BOOL;
    if ('L' in val && Array.isArray(val.L)) return val.L.map((v: any) => parseAttribute(v)).filter((x: any) => x !== undefined);
    if ('M' in val && typeof val.M === 'object') {
      const obj: Record<string, any> = {};
      Object.entries(val.M).forEach(([k, v]) => {
        obj[k] = parseAttribute(v);
      });
      return obj;
    }
    return undefined;
  };

  const parseTemplateItem = (item: any): RoleTemplate | null => {
    const d = item?.data || item?.Item || item;
    if (!d) return null;
    const get = (k: string) => parseAttribute(d[k]) ?? d[k];
    const id = get('id') || get('templateId') || d?.id;
    const name = get('name');
    const namespace = get('namespace') || 'general';
    const role = get('role');
    const permissions = (get('permissions') || []) as string[];
    const tags = (get('tags') || []) as string[];
    const createdAt = get('createdAt') || new Date().toISOString();
    const createdBy = get('createdBy') || 'superadmin';
    if (!id || !name || !role) return null;
    return { id, name, namespace, role, permissions, tags, createdAt, createdBy };
  };

  const fetchRoleTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/crud?tableName=brmh-role-templates&pagination=true&itemPerPage=200`);
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      const parsed: RoleTemplate[] = items.map(parseTemplateItem).filter(Boolean) as RoleTemplate[];
      if (parsed.length > 0) {
        setRoleTemplates(parsed);
        // keep a cache for offline fallback
        saveTemplatesToLocalStorage(parsed);
      } else {
        loadTemplatesFromLocalStorage();
      }
    } catch (err) {
      // Fallback to local storage if API not yet available/table not created
      loadTemplatesFromLocalStorage();
    }
  };

  const saveTemplatesToLocalStorage = (templates: RoleTemplate[]) => {
    localStorage.setItem('brmh-role-templates', JSON.stringify(templates));
  };

  const createTemplate = async () => {
    if (!newTemplate.name || !newTemplate.role || !newTemplate.permissions || newTemplate.permissions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const template: RoleTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplate.name,
      namespace: newTemplate.namespace || 'general',
      role: newTemplate.role,
      permissions: newTemplate.permissions,
      tags: templateTags.split(',').map(t => t.trim()).filter(t => t),
      createdAt: new Date().toISOString(),
      createdBy: 'superadmin',
    };
    try {
      // Attempt to persist in DynamoDB via CRUD API
      await fetch(`${API_BASE_URL}/crud?tableName=brmh-role-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: template }),
      });
    } catch (e) {
      // Ignore errors; we'll still cache locally
    }

    // Optimistically update UI and cache
    const updated = [...roleTemplates, template];
    setRoleTemplates(updated);
    saveTemplatesToLocalStorage(updated);

    toast({
      title: 'Success',
      description: `Template "${template.name}" created successfully`,
    });

    setIsCreateTemplateDialogOpen(false);
    setNewTemplate({ name: '', namespace: 'general', role: '', permissions: [], tags: [] });
    setTemplateTags('');
  };

  const deleteTemplate = async (id: string) => {
    const updated = roleTemplates.filter(t => t.id !== id);
    setRoleTemplates(updated);
    saveTemplatesToLocalStorage(updated);
    try {
      await fetch(`${API_BASE_URL}/crud?tableName=brmh-role-templates`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Key: { id } }),
      });
    } catch (e) {
      // best-effort delete
    }
    toast({
      title: 'Success',
      description: 'Template deleted successfully',
    });
  };

  const applyTemplate = (template: RoleTemplate) => {
    if (template.namespace !== 'general') {
      setSelectedNamespace(template.namespace);
    }
    setSelectedRole(template.role);
    setSelectedPermissions(template.permissions);
    toast({
      title: 'Template Applied',
      description: `"${template.name}" template applied`,
    });
  };

  // Resource Access Management Functions
  const fetchResourceConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user-resources/config`);
      const data = await res.json();
      if (data.success) {
        setResourceConfig(data.config);
      }
    } catch (err) {
      console.error('Error fetching resource config:', err);
    }
  };

  const fetchUserResources = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/user-resources/${userId}`);
      const data = await res.json();
      if (data.success) {
        setResourceAccesses(data.allResources || []);
      }
    } catch (err) {
      console.error('Error fetching user resources:', err);
    }
  };

  const grantResourceAccess = async () => {
    if (!selectedResourceUser || !resourceType || !resourceId || resourcePermissions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user-resources/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedResourceUser.userId,
          resourceType,
          resourceId,
          permissions: resourcePermissions,
          grantedBy: 'superadmin',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Resource access granted successfully',
        });
        setIsGrantResourceDialogOpen(false);
        setResourceType('');
        setResourceId('');
        setResourcePermissions([]);
        fetchUserResources(selectedResourceUser.userId);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to grant resource access',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error granting resource access:', err);
      toast({
        title: 'Error',
        description: 'Failed to grant resource access',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeResourceAccess = async (userId: string, resourceType: string, resourceId: string) => {
    if (!confirm('Are you sure you want to revoke this resource access?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user-resources/revoke`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, resourceType, resourceId }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Resource access revoked successfully',
        });
        fetchUserResources(userId);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to revoke resource access',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error revoking resource access:', err);
      toast({
        title: 'Error',
        description: 'Failed to revoke resource access',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const assignNamespaceRole = async () => {
    if (!selectedUser || !selectedNamespace || !selectedRole || selectedPermissions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/namespace-roles/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.userId,
          namespace: selectedNamespace,
          role: selectedRole,
          permissions: selectedPermissions,
          assignedBy: 'superadmin',
        }),
      });

      if (!response.ok) throw new Error('Failed to assign role');

      toast({
        title: 'Success',
        description: `Role "${selectedRole}" assigned to ${selectedUser.username} in ${selectedNamespace} namespace`,
      });

      setIsAssignRoleDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
      });
    }
  };

  const updateNamespaceRole = async () => {
    if (!selectedUser || !editingNamespace) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/namespace-roles/${selectedUser.userId}/${editingNamespace}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: selectedRole,
            permissions: selectedPermissions,
            assignedBy: 'superadmin',
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update role');

      toast({
        title: 'Success',
        description: `Role updated for ${selectedUser.username} in ${editingNamespace} namespace`,
      });

      setIsEditPermissionsDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const removeNamespaceRole = async (userId: string, namespace: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/namespace-roles/${userId}/${namespace}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove role');

      toast({
        title: 'Success',
        description: `Role removed from ${namespace} namespace`,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove role',
        variant: 'destructive',
      });
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const addCustomPermission = () => {
    if (customPermission && !selectedPermissions.includes(customPermission)) {
      setSelectedPermissions([...selectedPermissions, customPermission]);
      setCustomPermission('');
    }
  };

  const addCustomPermissionToTemplate = () => {
    if (templateCustomPermission && !(newTemplate.permissions || []).includes(templateCustomPermission)) {
      setNewTemplate({
        ...newTemplate,
        permissions: [...(newTemplate.permissions || []), templateCustomPermission],
      });
      setTemplateCustomPermission('');
    }
  };

  const resetForm = () => {
    setSelectedNamespace('');
    setSelectedRole('');
    setSelectedPermissions([]);
    setCustomPermission('');
    setEditingNamespace(null);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.cognitoUsername?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = roleTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      template.role.toLowerCase().includes(templateSearch.toLowerCase()) ||
      template.namespace.toLowerCase().includes(templateSearch.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(templateSearch.toLowerCase()))
  );

  const openEditDialog = (user: User, namespace: string) => {
    setSelectedUser(user);
    setEditingNamespace(namespace);
    const namespaceRole = user.namespaceRoles?.[namespace];
    if (namespaceRole) {
      setSelectedNamespace(namespace);
      setSelectedRole(namespaceRole.role);
      setSelectedPermissions(namespaceRole.permissions);
    }
    setIsEditPermissionsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            BRMH IAM - Namespace Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Manage namespace-specific roles and permissions for users across different domains
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Compact Professional Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400 shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground dark:text-gray-400 uppercase tracking-wide">Total Users</p>
                <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 dark:text-blue-400 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 dark:border-l-green-400 shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground dark:text-gray-400 uppercase tracking-wide">Namespaces</p>
                <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{availableNamespaces.length}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500 dark:text-green-400 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 dark:border-l-purple-400 shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground dark:text-gray-400 uppercase tracking-wide">Assignments</p>
                <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">
                  {users.reduce((acc, u) => acc + Object.keys(u.namespaceRoles || {}).length, 0)}
                </p>
              </div>
              <Key className="w-8 h-8 text-purple-500 dark:text-purple-400 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 dark:border-l-orange-400 shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground dark:text-gray-400 uppercase tracking-wide">Templates</p>
                <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{roleTemplates.length}</p>
              </div>
              <Sparkles className="w-8 h-8 text-orange-500 dark:text-orange-400 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
            <Users className="w-4 h-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
            <Sparkles className="w-4 h-4" />
            Role Templates
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
            <Lock className="w-4 h-4" />
            Resource Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
              <Input
                placeholder="Search by name, email, ID, or Cognito username..."
                className="pl-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Compact Users Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Users className="w-12 h-12 text-muted-foreground dark:text-gray-400 mb-4" />
                <p className="text-muted-foreground dark:text-gray-400">No users found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <Table className="bg-white dark:bg-gray-900">
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <TableHead className="w-[250px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">User</TableHead>
                    <TableHead className="w-[200px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">Cognito Username</TableHead>
                    <TableHead className="w-[200px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">Email</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">Namespace Roles</TableHead>
                    <TableHead className="w-[100px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white dark:bg-gray-900">
                  {filteredUsers.map((user) => (
                    <TableRow key={user.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                            <UserCog className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="font-medium">{user.username || user.email}</div>
                            <div className="text-xs text-muted-foreground dark:text-gray-400 font-mono">{user.userId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        <Badge variant="outline" className="font-mono text-xs border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          {user.cognitoUsername || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-gray-100">{user.email}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(user.namespaceRoles || {}).length > 0 ? (
                            Object.entries(user.namespaceRoles || {}).map(([namespace, roleData]) => (
                              <div key={namespace} className="group relative">
                                <Badge
                                  variant="secondary"
                                  className="capitalize cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                >
                                  {namespace}: {roleData.role}
                                  <div className="ml-1 inline-flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:bg-gray-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditDialog(user, namespace);
                                      }}
                                    >
                                      <Edit2 className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 dark:hover:text-red-400 dark:hover:bg-gray-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeNamespaceRole(user.userId, namespace);
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground dark:text-gray-400">No roles assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsAssignRoleDialogOpen(true);
                          }}
                          className="gap-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Plus className="w-3 h-3" />
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {/* Template Search and Create */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
              <Input
                placeholder="Search templates by name, role, namespace, or tags..."
                className="pl-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateTemplateDialogOpen(true)} className="gap-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        {template.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">
                          {template.namespace === 'general' ? '🌐 General' : `📁 ${template.namespace}`}
                        </Badge>
                        <Badge variant="secondary">{template.role}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => applyTemplate(template)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-red-600"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Permissions ({template.permissions.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {template.permissions.slice(0, 4).map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                      {template.permissions.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.permissions.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  {template.tags.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs gap-1">
                            <Tags className="w-3 h-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No templates found</p>
                <Button
                  variant="link"
                  onClick={() => setIsCreateTemplateDialogOpen(true)}
                  className="mt-2"
                >
                  Create your first template
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          {/* Resource Management Header */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterResourceType} onValueChange={setFilterResourceType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {resourceConfig?.resourceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Selection for Resource Access */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Lock className="w-5 h-5 text-gray-900 dark:text-white" />
                Resource Access Management
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Control user access to namespaces, schemas, tables, and drive resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Select User</Label>
                  <Select
                    value={selectedResourceUser?.userId || ''}
                    onValueChange={(userId) => {
                      const user = users.find((u) => u.userId === userId);
                      setSelectedResourceUser(user || null);
                      if (user) {
                        fetchUserResources(userId);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(
                          (u) =>
                            !resourceSearch ||
                            u.username.toLowerCase().includes(resourceSearch.toLowerCase()) ||
                            u.email.toLowerCase().includes(resourceSearch.toLowerCase())
                        )
                        .map((user) => (
                          <SelectItem key={user.userId} value={user.userId}>
                            {user.username} ({user.email})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedResourceUser && (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">
                          Resource Access for {selectedResourceUser.username}
                        </h4>
                        <p className="text-sm text-muted-foreground">{selectedResourceUser.email}</p>
                      </div>
                      <Button
                        onClick={() => setIsGrantResourceDialogOpen(true)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Grant Access
                      </Button>
                    </div>

                    {/* Resource Access Table */}
                    {loading ? (
                      <div className="flex justify-center p-8">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      </div>
                    ) : resourceAccesses.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                          <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Resource Access</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            This user has no resource access assigned yet
                          </p>
                          <Button onClick={() => setIsGrantResourceDialogOpen(true)} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Grant First Access
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Resource Type</TableHead>
                                <TableHead>Resource ID</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>Granted By</TableHead>
                                <TableHead>Granted At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resourceAccesses
                                .filter(
                                  (ra) =>
                                    filterResourceType === 'all' || ra.resourceType === filterResourceType
                                )
                                .map((resource) => (
                                  <TableRow key={resource.resourceId}>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {resourceConfig?.resourceTypes.find((t) => t.value === resource.resourceType)?.label || resource.resourceType}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {resource.actualResourceId}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {resource.permissions.map((perm) => (
                                          <Badge key={perm} variant="secondary" className="text-xs">
                                            {perm}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{resource.grantedBy}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {new Date(resource.grantedAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                          revokeResourceAccess(
                                            resource.userId,
                                            resource.resourceType,
                                            resource.actualResourceId
                                          )
                                        }
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resource Type Overview */}
          {resourceConfig && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resourceConfig.resourceTypes.map((type) => (
                <Card key={type.value}>
                  <CardHeader>
                    <CardTitle className="text-sm">{type.label}</CardTitle>
                    <CardDescription className="text-xs">{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {
                        resourceAccesses.filter((ra) => ra.resourceType === type.value)
                          .length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">Active assignments</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Grant Resource Access Dialog */}
      <Dialog open={isGrantResourceDialogOpen} onOpenChange={setIsGrantResourceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Grant Resource Access
            </DialogTitle>
            <DialogDescription>
              Assign access to specific resources for{' '}
              {selectedResourceUser?.username}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Resource Type</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  {resourceConfig?.resourceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Resource ID</Label>
              <Input
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                placeholder="Enter resource ID (e.g., namespace-id, schema-id, folder-id)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The unique identifier of the resource you want to grant access to
              </p>
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                {resourceConfig?.permissionTypes.map((perm) => (
                  <div key={perm.value} className="flex items-start gap-2">
                    <Checkbox
                      id={`resource-perm-${perm.value}`}
                      checked={resourcePermissions.includes(perm.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setResourcePermissions([...resourcePermissions, perm.value]);
                        } else {
                          setResourcePermissions(
                            resourcePermissions.filter((p) => p !== perm.value)
                          );
                        }
                      }}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`resource-perm-${perm.value}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {perm.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {resourcePermissions.length} permission(s)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsGrantResourceDialogOpen(false);
                setResourceType('');
                setResourceId('');
                setResourcePermissions([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={grantResourceAccess} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Granting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Grant Access
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={isCreateTemplateDialogOpen} onOpenChange={setIsCreateTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Create Role Template
            </DialogTitle>
            <DialogDescription>
              Create a reusable template for quick role assignment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  placeholder="e.g., Drive Power User"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Namespace *</Label>
                <Select
                  value={newTemplate.namespace}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, namespace: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" onCloseAutoFocus={(e) => e.preventDefault()} className="max-h-64 overflow-y-auto">
                    <SelectItem value="general">🌐 General (All Namespaces)</SelectItem>
                    {availableNamespaces.map((ns) => (
                      <SelectItem key={ns} value={ns}>
                        📁 {ns}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role Name *</Label>
              <Input
                placeholder="e.g., manager, editor, viewer"
                value={newTemplate.role}
                onChange={(e) => setNewTemplate({ ...newTemplate, role: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="e.g., admin, power-user, read-only"
                value={templateTags}
                onChange={(e) => setTemplateTags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions *</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {ALL_PERMISSIONS.map((permission) => (
                  <div key={permission} className="flex items-center gap-2">
                    <Checkbox
                      id={`template-${permission}`}
                      checked={newTemplate.permissions?.includes(permission)}
                      onCheckedChange={() => {
                        const current = newTemplate.permissions || [];
                        setNewTemplate({
                          ...newTemplate,
                          permissions: current.includes(permission)
                            ? current.filter((p) => p !== permission)
                            : [...current, permission],
                        });
                      }}
                    />
                    <Label htmlFor={`template-${permission}`} className="text-sm font-normal cursor-pointer">
                      {permission}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Add Custom Permission</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., custom:action, approve:products"
                  value={templateCustomPermission}
                  onChange={(e) => setTemplateCustomPermission(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomPermissionToTemplate()}
                />
                <Button type="button" onClick={addCustomPermissionToTemplate} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {newTemplate.permissions && newTemplate.permissions.length > 0 && (
              <div className="space-y-2">
                <Label>Selected ({newTemplate.permissions.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {newTemplate.permissions.map((perm) => (
                    <Badge key={perm} variant="secondary" className="gap-1 pr-1">
                      {perm}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-transparent"
                        onClick={() => {
                          setNewTemplate({
                            ...newTemplate,
                            permissions: (newTemplate.permissions || []).filter((p) => p !== perm),
                          });
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateTemplateDialogOpen(false);
                setNewTemplate({ name: '', namespace: 'general', role: '', permissions: [], tags: [] });
                setTemplateTags('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createTemplate}
              disabled={
                !newTemplate.name ||
                !newTemplate.role ||
                !newTemplate.permissions ||
                newTemplate.permissions.length === 0
              }
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog with Template Selection */}
      <Dialog open={isAssignRoleDialogOpen} onOpenChange={setIsAssignRoleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Assign Namespace Role
            </DialogTitle>
            <DialogDescription>
              Assign role to {selectedUser?.username} - Use a template or configure manually
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template Quick Select */}
            {filteredTemplates.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Quick Apply Template
                </Label>
                <div className="flex flex-wrap gap-2">
                  {filteredTemplates.slice(0, 6).map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                      className="gap-2"
                    >
                      <Copy className="w-3 h-3" />
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Namespace *</Label>
                <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select namespace" />
                  </SelectTrigger>
                  <SelectContent position="popper" onCloseAutoFocus={(e) => e.preventDefault()} className="max-h-64 overflow-y-auto">
                    {availableNamespaces.map((ns) => (
                      <SelectItem key={ns} value={ns}>
                        {ns}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Role *</Label>
                <Input
                  placeholder="Enter role name"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permissions * ({selectedPermissions.length} selected)</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {ALL_PERMISSIONS.map((permission) => (
                  <div key={permission} className="flex items-center gap-2">
                    <Checkbox
                      id={`assign-${permission}`}
                      checked={selectedPermissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                    />
                    <Label htmlFor={`assign-${permission}`} className="text-sm font-normal cursor-pointer">
                      {permission}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Permission</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., custom:action"
                  value={customPermission}
                  onChange={(e) => setCustomPermission(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomPermission()}
                />
                <Button type="button" onClick={addCustomPermission} size="sm">
                  Add
                </Button>
              </div>
            </div>

            {selectedPermissions.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Permissions</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedPermissions.map((perm) => (
                    <Badge key={perm} variant="secondary" className="gap-1 pr-1">
                      {perm}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-transparent"
                        onClick={() => togglePermission(perm)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignRoleDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={assignNamespaceRole}
              disabled={
                !selectedNamespace ||
                !selectedRole ||
                selectedPermissions.length === 0
              }
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditPermissionsDialogOpen} onOpenChange={setIsEditPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-indigo-600" />
              Edit Namespace Role
            </DialogTitle>
            <DialogDescription>
              Update role for {selectedUser?.username} in {editingNamespace} namespace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role *</Label>
              <Input
                placeholder="Enter role name"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions * ({selectedPermissions.length} selected)</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {ALL_PERMISSIONS.map((permission) => (
                  <div key={permission} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-${permission}`}
                      checked={selectedPermissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                    />
                    <Label htmlFor={`edit-${permission}`} className="text-sm font-normal cursor-pointer">
                      {permission}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {selectedPermissions.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Permissions</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedPermissions.map((perm) => (
                    <Badge key={perm} variant="secondary" className="gap-1 pr-1">
                      {perm}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-transparent"
                        onClick={() => togglePermission(perm)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditPermissionsDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={updateNamespaceRole}
              disabled={!selectedRole || selectedPermissions.length === 0}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

