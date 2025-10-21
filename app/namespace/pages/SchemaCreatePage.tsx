import React, { useState, useEffect } from 'react';
import { NestedFieldsEditor, schemaToFields } from '../components/SchemaService';
import RecursiveDataForm from '../../components/common/RecursiveDataForm';
import MockDataPanel from '../components/MockDataPanel';
import Ajv from 'ajv';
import { v4 as uuidv4 } from 'uuid';
import { Edit, PlusCircle, RefreshCw, Eye, Trash2, Code2, FileText, Zap, Palette, Sparkles, Layers, Database, Settings, Save, X, CheckCircle, AlertTriangle } from "lucide-react";

function fieldsToSchema(fields: any[]): Record<string, any> {
  const properties: Record<string, any> = {};
  const required: string[] = [];
  for (const field of fields) {
    let type: any = field.type;
    if (field.allowNull) {
      type = [field.type, 'null'];
    }
    let property: any = { type };
    if (field.type === 'enum') {
      property = {
        type: field.allowNull ? ['string', 'null'] : 'string',
        enum: field.enumValues || []
      };
    } else if (field.type === 'object') {
      const nested = fieldsToSchema(field.fields || []);
      property = { ...property, ...nested };
    } else if (field.type === 'array') {
      if (field.itemType === 'object') {
        property.items = fieldsToSchema(field.itemFields || []);
      } else if (field.itemType === 'schema') {
        property.items = { 
          $ref: `#/components/schemas/${field.schemaId}`,
          type: field.allowNull ? ['object', 'null'] : 'object'
        };
      } else {
        property.items = { type: field.allowNull ? [field.itemType, 'null'] : field.itemType };
      }
    } else if (field.type === 'schema') {
      property = {
        $ref: `#/components/schemas/${field.schemaId}`,
        type: field.allowNull ? ['object', 'null'] : 'object'
      };
    }
    properties[field.name] = property;
    if (field.required) {
      required.push(field.name);
    }
  }
  const schema: any = {
    type: 'object',
    properties
  };
  if (required.length > 0) {
    schema.required = required;
  }
  return schema;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

interface SchemaCreatePageProps {
  onSchemaNameChange?: (name: string) => void;
  namespace?: any;
  initialSchema?: any;
  initialSchemaName?: string;
  onSuccess?: () => void;
  mode?: 'create' | 'edit' | 'preview';
  methodId?: string;
}

// JSON Syntax Highlighter
const highlightJSON = (json: string): string => {
  if (!json) return '';
  
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'text-slate-300'; // default
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-blue-400'; // keys
        } else {
          cls = 'text-green-400'; // strings
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-400'; // booleans
      } else if (/null/.test(match)) {
        cls = 'text-orange-400'; // null
      } else if (/^\d/.test(match)) {
        cls = 'text-cyan-400'; // numbers
      }
      return `<span class="${cls}">${match}</span>`;
    })
    .replace(/([{}[\]])/g, '<span class="text-slate-200">$1</span>') // brackets
    .replace(/([,:])/g, '<span class="text-slate-300">$1</span>'); // punctuation
};

export default function SchemaCreatePage({ onSchemaNameChange, namespace, initialSchema, initialSchemaName, onSuccess, mode, methodId }: SchemaCreatePageProps) {
  // Debug logging for props
  console.log('🔍 SchemaCreatePage Props:', {
    mode,
    initialSchema,
    initialSchemaName,
    hasInitialSchemaId: initialSchema?.id || initialSchema?.schemaId,
    namespace: namespace?.['namespace-id']
  });

  const [schemaName, setSchemaName] = useState(initialSchemaName || initialSchema?.schemaName || '');
  const [fields, setFields] = useState<any[]>(initialSchema ? schemaToFields(initialSchema.schema || initialSchema) : []);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [rawFields, setRawFields] = useState('');
  const [rawFieldsError, setRawFieldsError] = useState<string | null>(null);
  const [jsonSchema, setJsonSchema] = useState(initialSchema ? JSON.stringify(initialSchema.schema || initialSchema, null, 2) : `{
  "type": "object",
  "properties": {},
  "required": []
}`);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  // Resolved schema state
  const [resolvedView, setResolvedView] = useState(false);
  const [resolvedSchema, setResolvedSchema] = useState<any | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'createData' | 'updateData' | 'readData' | 'deleteData'>('edit');
  const [createDataResult, setCreateDataResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [tableName, setTableName] = useState<string | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState(schemaName || '');
  const [tableCreateError, setTableCreateError] = useState<string | null>(null);
  const [creatingTable, setCreatingTable] = useState(false);
  const [schemaObj, setSchemaObj] = useState<any>(
    (initialSchema && (initialSchema.id || initialSchema.schemaId)) ? initialSchema : null
  );
  const [showRawFields, setShowRawFields] = useState(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [isInEditMode, setIsInEditMode] = useState(mode === 'create');
  const [showOperations, setShowOperations] = useState(false);
  const isEditing = schemaObj && (schemaObj.id || schemaObj.schemaId); // True if we have an existing schema
  const isCreating = mode === 'create';
  const isReadOnly = mode === 'preview' && !isInEditMode;
  
  // Debug the final editing state
  console.log('🎯 Schema Mode State:', {
    mode,
    isInEditMode,
    isEditing,
    isCreating,
    isReadOnly,
    schemaObjHasId: !!(schemaObj?.id || schemaObj?.schemaId)
  });

  // 1. Add state for accounts and selected account
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedAccountForData, setSelectedAccountForData] = useState<string>('');
  const [methodName, setMethodName] = useState<string>('');
  const [resolvedNamespaceName, setResolvedNamespaceName] = useState('');

  // Add state for update, read, delete forms
  const [updateKey, setUpdateKey] = useState('');
  const [updateFields, setUpdateFields] = useState('');
  const [updateResult, setUpdateResult] = useState<string | null>(null);
  const [readKey, setReadKey] = useState('');
  const [readResult, setReadResult] = useState<string | null>(null);
  const [readAllResult, setReadAllResult] = useState<string | null>(null);

  // Mock data panel state
  const [showMockDataPanel, setShowMockDataPanel] = useState(false);
  const [deleteKey, setDeleteKey] = useState('');
  const [deleteResult, setDeleteResult] = useState<string | null>(null);
  
  // Auto-fill mock data state
  const [isGeneratingMockData, setIsGeneratingMockData] = useState(false);
  const [mockDataContext, setMockDataContext] = useState('');
  const [autoFillEnabled, setAutoFillEnabled] = useState(false);

  // If query param create=1 is present, ensure we're in create mode (no-op if editing)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('create') === '1') {
        // No explicit UI needed; page defaults to editor ready for creation
      }
    }
  }, []);

  // 2. Fetch accounts for the namespace on mount or when schemaObj changes
  useEffect(() => {
    const nsId = namespace?.['namespace-id'] || schemaObj?.namespaceId;
    if (!nsId) return;
    fetch(`${API_BASE_URL}/unified/namespaces/${nsId}/accounts`)
      .then(res => res.json())
      .then(setAccounts)
      .catch(() => setAccounts([]));
  }, [namespace, schemaObj]);



  // 3. Fetch method name if methodId is present, but prefer schemaObj.methodName
  useEffect(() => {
    if (schemaObj && schemaObj.methodName) {
      setMethodName(schemaObj.methodName);
    } else if (methodId) {
      fetch(`${API_BASE_URL}/unified/methods/${methodId}`)
        .then(res => res.json())
        .then(methodData => {
          const name = methodData.data
            ? methodData.data['namespace-method-name'] || methodData.data['methodName']
            : methodData['namespace-method-name'] || methodData['methodName'];
          setMethodName(name || '');
        })
        .catch(() => setMethodName(''));
    } else {
      setMethodName('');
    }
  }, [schemaObj, methodId]);

  // Update fields and JSON schema when initialSchema changes
  useEffect(() => {
    if (initialSchema) {
      console.log('📝 Processing initialSchema:', {
        hasSchemaProperty: !!initialSchema.schema,
        hasId: !!(initialSchema.id || initialSchema.schemaId),
        schemaName: initialSchema.schemaName
      });
      // If initialSchema has a .schema property, it's the full schema object
      const schemaDefinition = initialSchema.schema || initialSchema;
      setFields(schemaToFields(schemaDefinition));
      setJsonSchema(JSON.stringify(schemaDefinition, null, 2));
      // Always set the schema name from initialSchema if available
      if (initialSchema.schemaName) {
        console.log('📝 Setting schema name from initialSchema:', initialSchema.schemaName);
        setSchemaName(initialSchema.schemaName);
      }
    }
  }, [initialSchema]);

  // Set schemaObj from initialSchema if it has an ID (for editing)
  React.useEffect(() => {
    if (initialSchema && (initialSchema.id || initialSchema.schemaId)) {
      console.log('✅ Setting schemaObj from initialSchema:', {
        id: initialSchema.id || initialSchema.schemaId,
        schemaName: initialSchema.schemaName,
        hasSchemaProperty: !!initialSchema.schema
      });
      setSchemaObj(initialSchema);
      setTableName(initialSchema.tableName || null);
      setResolvedSchema(null);
      setResolveError(null);
      return;
    }
  }, [initialSchema]);

  // Fetch schemaObj by schemaName only if we don't have it from initialSchema
  React.useEffect(() => {
    if (!schemaName || (initialSchema && (initialSchema.id || initialSchema.schemaId))) return;
    const fetchSchemaObj = async () => {
      try {
        const resSchemas = await fetch(`${API_BASE_URL}/unified/schema`);
        if (resSchemas.ok) {
          const schemas = await resSchemas.json();
          const found = schemas.find((s: any) => s.schemaName === schemaName);
          if (found) {
            setSchemaObj(found);
            setTableName(found.tableName || null);
            // Invalidate previously resolved schema when switching
            setResolvedSchema(null);
            setResolveError(null);
          } else {
            setSchemaObj(null);
            setTableName(null);
            setResolvedSchema(null);
            setResolveError(null);
          }
        }
      } catch {
        setSchemaObj(null);
        setTableName(null);
        setResolvedSchema(null);
        setResolveError('');
      }
    };
    fetchSchemaObj();
  }, [schemaName, initialSchema]);

  // Bidirectional sync: update JSON from fields
  React.useEffect(() => {
    setJsonSchema(JSON.stringify(fieldsToSchema(fields), null, 2));
    // eslint-disable-next-line
  }, [fields]);

  // When JSON changes, update fields (if valid)
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonSchema(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      setJsonError(null);
      setFields(schemaToFields(parsed));
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  // When raw fields are converted, update both fields and JSON
  const handleConvertRawFields = () => {
    try {
      const lines = rawFields.split('\n').map(l => l.trim()).filter(Boolean);
      const parsedFields = lines.map(line => {
        // Remove comments
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1) line = line.slice(0, commentIndex).trim();
        // Match: name: type;
        const match = line.match(/^([a-zA-Z0-9_]+):\s*(.+?);?$/);
        if (!match) throw new Error(`Invalid field: ${line}`);
        const name = match[1];
        let typeStr = match[2].replace(/;$/, '').trim(); // Remove trailing semicolon
        let type: string = typeStr;
        let allowNull = false;
        let enumValues: string[] | undefined = undefined;
        // Handle nullable types
        if (typeStr.includes('null')) {
          allowNull = true;
          typeStr = typeStr.replace(/\|?\s*null\s*\|?/g, '').trim();
        }
        // Handle enums (values in quotes separated by |)
        const enumMatch = typeStr.split('|').map(v => v.trim()).filter(Boolean);
        if (enumMatch.length > 1 && enumMatch.every(v => /^".*"$/.test(v))) {
          enumValues = enumMatch.map(v => v.replace(/"/g, ''));
          type = 'enum';
        } else {
          // Map JS/TS types to JSON Schema types
          if (typeStr === 'Date') type = 'string';
          else if (typeStr === 'number' || typeStr === 'int' || typeStr === 'float') type = 'number';
          else if (typeStr === 'boolean') type = 'boolean';
          else if (typeStr === 'string') type = 'string';
          else type = typeStr;
        }
        return { name, type, allowNull, enumValues };
      });
      setFields(parsedFields);
      console.log('Parsed fields:', parsedFields);
    setRawFieldsError(null);
    } catch (err: any) {
      setRawFieldsError(err.message || 'Failed to parse fields.');
    }
  };

  const handleValidate = async () => {
    setValidationResult(null);
    try {
      const parsed = JSON.parse(jsonSchema);
      setJsonError(null);
      const response = await fetch(`${API_BASE_URL}/unified/schema/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema: parsed })
      });
      if (!response.ok) throw new Error('Validation failed');
      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      setJsonError('Invalid JSON or validation failed');
      setValidationResult({ valid: false, message: 'Validation failed. Please check your schema.' });
    }
  };

  // Load resolved schema from backend using schema id
  const loadResolvedSchema = async () => {
    if (!schemaObj || !(schemaObj.id || schemaObj.schemaId)) {
      setResolveError('Save the schema first to view resolved references.');
      return;
    }
    setIsResolving(true);
    setResolveError(null);
    try {
      const id = schemaObj.id || schemaObj.schemaId;
      const res = await fetch(`${API_BASE_URL}/unified/schema/${id}/resolved?resolveReferences=true`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to resolve schema');
      }
      const data = await res.json();
      // Prefer data.schema if present, else the whole response
      const resolved = data.schema ? data.schema : data;
      setResolvedSchema(resolved);
    } catch (err: any) {
      setResolveError(err.message || 'Failed to resolve schema');
    } finally {
      setIsResolving(false);
    }
  };

  const handleSave = async () => {
    if (!schemaName.trim()) {
      setSaveMessage('Schema name is required.');
      return;
    }
    let parsedSchema;
    try {
      parsedSchema = JSON.parse(jsonSchema);
      setJsonError(null);
      if (!parsedSchema || typeof parsedSchema !== 'object' || !parsedSchema.type) {
        parsedSchema = { type: 'object', properties: {}, required: [] };
      }
    } catch {
      setJsonError('Invalid JSON');
      return;
    }
    setIsSaving(true);
    setSaveMessage('');
    try {
      let methodNameToSave = null;
      if (methodId) {
        try {
          const methodRes = await fetch(`${API_BASE_URL}/unified/methods/${methodId}`);
          if (methodRes.ok) {
            const methodData = await methodRes.json();
            methodNameToSave = methodData.data
              ? methodData.data['namespace-method-name'] || methodData.data['methodName']
              : methodData['namespace-method-name'] || methodData['methodName'];
          }
        } catch (err) {
          // fallback: leave as null
        }
      }

      const payload = {
        methodId: methodId || null,
        schemaName: schemaName.trim(),
        methodName: methodNameToSave,
        namespaceId: namespace?.['namespace-id'] || null,
        schemaType: null,
        schema: parsedSchema
      };

      let schemaId;
      // If we're editing and have a schema object with an ID, update it
      if (isEditing && schemaObj && (schemaObj.id || schemaObj.schemaId)) {
        const existingSchemaId = schemaObj.id || schemaObj.schemaId;
        console.log('🔄 EDITING SCHEMA:', {
          isEditing,
          schemaObj,
          existingSchemaId,
          schemaName: schemaName.trim()
        });
        const response = await fetch(`${API_BASE_URL}/unified/schema/${existingSchemaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to update schema');
        }
        const updatedSchema = await response.json();
        schemaId = updatedSchema.id || updatedSchema.schemaId;
        setSaveMessage('Schema updated successfully!');
      } else {
        // Create new schema
        console.log('🆕 CREATING NEW SCHEMA:', {
          isEditing,
          schemaObj,
          schemaName: schemaName.trim()
        });
        const response = await fetch(`${API_BASE_URL}/unified/schema`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to save schema');
        }
        const newSchema = await response.json();
        schemaId = newSchema.id || newSchema.schemaId;
        setSaveMessage('Schema created successfully!');
      }

      // Update method with schema ID if methodId exists
      if (methodId && schemaId) {
        try {
          const methodRes = await fetch(`${API_BASE_URL}/unified/methods/${methodId}`);
          const methodData = await methodRes.json();
          const methodDataToUpdate = methodData.data ? methodData.data : methodData;
          
          const requestBody = {
            "namespace-method-name": methodDataToUpdate["namespace-method-name"],
            "namespace-method-type": methodDataToUpdate["namespace-method-type"],
            "namespace-method-url-override": methodDataToUpdate["namespace-method-url-override"] || '',
            "namespace-method-queryParams": methodDataToUpdate["namespace-method-queryParams"] || [],
            "namespace-method-header": methodDataToUpdate["namespace-method-header"] || [],
            "save-data": !!methodDataToUpdate["save-data"],
            "isInitialized": !!methodDataToUpdate["isInitialized"],
            "tags": methodDataToUpdate["tags"] || [],
            "namespace-method-tableName": methodDataToUpdate["namespace-method-tableName"] || '',
            "tableName": methodDataToUpdate["tableName"] || '',
            "schemaId": schemaId,
            "namespace-id": methodDataToUpdate["namespace-id"]
          };

          const updateResponse = await fetch(`${API_BASE_URL}/unified/methods/${methodId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (!updateResponse.ok) {
            console.error('Failed to update method with schema ID');
          }
        } catch (err) {
          console.error('Error updating method with schema ID:', err);
        }
      }

      if (!isEditing) {
        setSchemaName('');
        setJsonSchema(`{
  "type": "object",
  "properties": {},
  "required": []
}`);
        setFields([]);
        setRawFields('');
        setCollapsedNodes(new Set());
      }
      // Refresh resolved schema view after successful save if in edit mode
      if (isEditing) {
        try {
          await loadResolvedSchema();
        } catch {}
      }
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setSaveMessage(error.message || 'Failed to save schema.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTable = async () => {
    console.log('=== STARTING TABLE CREATION ===');
    setCreatingTable(true);
    setTableCreateError(null);
    try {
      console.log('1. Fetching schemas...');
      // 1. Fetch schemaId by schemaName
      const resSchemas = await fetch(`${API_BASE_URL}/unified/schema`);
      if (!resSchemas.ok) throw new Error('Failed to fetch schemas');
      const schemas = await resSchemas.json();
      console.log('Schemas fetched:', schemas);
      
      const found = schemas.find((s: any) => s.schemaName === schemaName);
      if (!found) throw new Error('Schema not found');
      const schemaId = found.id || found.schemaId;
      if (!schemaId) throw new Error('Schema ID not found');
      console.log('Found schema:', found);

      // Get methodId from schema data if not provided in props
      const methodIdToUse = methodId || found.methodId;
      console.log('Using methodId:', methodIdToUse);

      console.log('2. Creating table...');
      // 2. Create table
      const res = await fetch(`${API_BASE_URL}/unified/schema/table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaId,
          tableName: newTableName.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create table');
      }
      console.log('Table created successfully');

      // 3. Update method with table name if methodId exists
      if (methodIdToUse) {
        console.log('3. Updating method with table name. MethodId:', methodIdToUse);
        try {
          const methodRes = await fetch(`${API_BASE_URL}/unified/methods/${methodIdToUse}`);
          console.log('Method fetch response status:', methodRes.status);
          const methodData = await methodRes.json();
          console.log('Current method data:', methodData);
          
          const methodDataToUpdate = methodData.data ? methodData.data : methodData;
          console.log('Method data to update:', methodDataToUpdate);
          
          // Save updated method
          console.log('Sending PUT request to update method...');
          const requestBody = {
            "namespace-method-name": methodDataToUpdate["namespace-method-name"],
            "namespace-method-type": methodDataToUpdate["namespace-method-type"],
            "namespace-method-url-override": methodDataToUpdate["namespace-method-url-override"] || '',
            "namespace-method-queryParams": methodDataToUpdate["namespace-method-queryParams"] || [],
            "namespace-method-header": methodDataToUpdate["namespace-method-header"] || [],
            "save-data": !!methodDataToUpdate["save-data"],
            "isInitialized": !!methodDataToUpdate["isInitialized"],
            "tags": methodDataToUpdate["tags"] || [],
            "namespace-method-tableName": newTableName.trim(),
            "tableName": newTableName.trim(),
            "schemaId": methodDataToUpdate["schemaId"],
            "namespace-id": methodDataToUpdate["namespace-id"]
          };
          console.log('Request body:', JSON.stringify(requestBody, null, 2));
          
          const updateResponse = await fetch(`${API_BASE_URL}/unified/methods/${methodIdToUse}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });
          console.log('Method update response status:', updateResponse.status);
          
          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to update method:', errorText);
            throw new Error(errorText || 'Failed to update method');
          }
          
          const updatedMethodData = await updateResponse.json();
          console.log('Successfully updated method data:', updatedMethodData);
        } catch (err) {
          console.error('Failed to update method with table name:', err);
          // Don't throw error here, as table was created successfully
        }
      } else {
        console.log('No methodId available, skipping method update');
      }

      setShowTableModal(false);
      console.log('4. Refetching schema to get updated tableName...');
      // Refetch the schema to get the updated tableName
      try {
        const resSchemas = await fetch(`${API_BASE_URL}/unified/schema`);
        if (resSchemas.ok) {
          const schemas = await resSchemas.json();
          const found = schemas.find((s: any) => s.schemaName === schemaName);
          if (found && found.tableName) {
            console.log('Found updated schema with table name:', found);
            setSchemaObj(found);
            setTableName(found.tableName);
          }
        }
      } catch (err) {
        console.error('Failed to refetch schema:', err);
      }
      console.log('=== TABLE CREATION COMPLETED ===');
    } catch (err: any) {
      console.error('=== TABLE CREATION FAILED ===', err);
      setTableCreateError(err.message);
    } finally {
      setCreatingTable(false);
    }
  };

  // When the modal opens, resolve the namespace name if needed
  useEffect(() => {
    if (!showTableModal) return;
    let nsName = namespace?.['namespace-name'] || schemaObj?.namespaceName;
    const nsId = namespace?.['namespace-id'] || schemaObj?.namespaceId;
    if (!nsName && nsId) {
      fetch(`${API_BASE_URL}/unified/namespaces/${nsId}`)
        .then(res => res.json())
        .then(ns => setResolvedNamespaceName(ns['namespace-name'] || ''))
        .catch(() => setResolvedNamespaceName(''));
    } else {
      setResolvedNamespaceName(nsName || '');
    }
  }, [showTableModal, namespace, schemaObj]);

  // Auto-generate table name when modal opens or dependencies change, using resolvedNamespaceName
  useEffect(() => {
    if (!showTableModal) return;
    const nsName = (resolvedNamespaceName || '').toLowerCase().replace(/\s+/g, '-');
    const acc = accounts.find(a => a['namespace-account-id'] === selectedAccountId);
    const accName = (acc?.['namespace-account-name'] || '').toLowerCase().replace(/\s+/g, '-');
    const mName = (methodName || '').toLowerCase().replace(/\s+/g, '-');
    if (nsName && accName && mName) {
      setNewTableName(`${nsName}-${accName}-${mName}`);
    }
  }, [showTableModal, resolvedNamespaceName, accounts, selectedAccountId, methodName]);

  const getStringId = (id: any) => (typeof id === 'object' && id !== null && 'S' in id ? id.S : id);

  // Handle mock data insertion
  const handleInsertMockData = async (data: any[]) => {
    try {
      const acc = accounts.find(a => a['namespace-account-id'] === selectedAccountForData);
      const tableNameMap = acc?.tableName || {};
      const tableNameForMethod = tableNameMap[methodName];
      
      if (!tableNameForMethod) {
        throw new Error('No table exists for this account and method. Please create a table first.');
      }

      for (const item of data) {
        const res = await fetch(`${API_BASE_URL}/crud?tableName=${tableNameForMethod}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to insert data');
        }
      }
      
      setCreateDataResult(`Successfully inserted ${data.length} record(s)`);
      setFormData({});
    } catch (err) {
      setCreateDataResult('Error: ' + (err instanceof Error ? err.message : String(err)));
      throw err;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
      {/* Header Section - Modern Design */}
      <div className="px-6 py-2 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Zap size={16} className="text-purple-600" />
              </div>
              <span className="font-medium">Method:</span> 
              <span className="text-slate-900">{methodName || <span className="italic text-slate-400">None</span>}</span>
            </div>
            {namespace && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Database size={16} className="text-blue-600" />
                </div>
                <span className="font-medium">Namespace:</span> 
                <span className="text-slate-900 font-medium">{namespace['namespace-name']}</span>
              </div>
            )}
            {isReadOnly && !isInEditMode && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-lg">
                <Eye size={14} className="text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">Preview Mode</span>
              </div>
            )}
            {isInEditMode && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-lg">
                <Edit size={14} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700">Edit Mode</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText size={16} className="text-slate-600" />
                Schema Name
                <span className="text-red-500">*</span>
              </div>
              <input
                id="schema-name"
                className={`border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 w-56 ${isReadOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500' : 'bg-white shadow-sm hover:shadow-md'}`}
                placeholder="Enter schema name..."
                value={schemaName}
                onChange={e => {
                  if (!isReadOnly) {
                    setSchemaName(e.target.value);
                    if (onSchemaNameChange) onSchemaNameChange(e.target.value);
                  }
                }}
                required
                readOnly={isReadOnly}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Database Operations Section - Right below header */}
      {isEditing && (
        <div className="px-6 py-4 bg-gradient-to-br from-slate-50/50 to-white border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            {/* Operations Buttons - Left aligned */}
            <div className="flex items-center gap-2">
              {/* Create Data Button */}
              <button
                onClick={() => setActiveTab('createData')}
                className="group relative flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="p-1 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors duration-200">
                  <PlusCircle size={12} className="text-blue-600" />
                </div>
                <span>Create</span>
              </button>

              {/* Update Data Button */}
              <button
                onClick={() => setActiveTab('updateData')}
                className="group relative flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700 hover:text-orange-700 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="p-1 bg-orange-100 rounded-md group-hover:bg-orange-200 transition-colors duration-200">
                  <RefreshCw size={12} className="text-orange-600" />
                </div>
                <span>Update</span>
              </button>

              {/* Read Data Button */}
              <button
                onClick={() => setActiveTab('readData')}
                className="group relative flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="p-1 bg-purple-100 rounded-md group-hover:bg-purple-200 transition-colors duration-200">
                  <Eye size={12} className="text-purple-600" />
                </div>
                <span>Read</span>
              </button>

              {/* Delete Data Button */}
              <button
                onClick={() => setActiveTab('deleteData')}
                className="group relative flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-700 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="p-1 bg-red-100 rounded-md group-hover:bg-red-200 transition-colors duration-200">
                  <Trash2 size={12} className="text-red-600" />
                </div>
                <span>Delete</span>
              </button>
            </div>
            
            {/* Right side buttons - Schema actions */}
            <div className="flex items-center gap-2">
              {/* Action buttons container with slide-in animation */}
              {isInEditMode && (
                <div 
                  className="flex items-center gap-2"
                  style={{ animation: 'slideInFromLeft 0.4s ease-out' }}
                >
                  {/* Validate Button */}
                  <button
                    className="group relative flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-700 hover:text-amber-700 rounded-md text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={handleValidate}
                  >
                    <div className="p-0.5 bg-amber-100 rounded-sm group-hover:bg-amber-200 transition-colors duration-200">
                      <CheckCircle size={10} className="text-amber-600" />
                    </div>
                    <span>Validate</span>
                  </button>
                  
                  {/* Update Schema Button */}
                  <button
                    className="group relative flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-md text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSaving}
                    onClick={handleSave}
                  >
                    <div className="p-0.5 bg-green-100 rounded-sm group-hover:bg-green-200 transition-colors duration-200">
                      <Save size={10} className="text-green-600" />
                    </div>
                    <span>{isEditing ? (isSaving ? 'Updating...' : 'Update Schema') : (isSaving ? 'Creating...' : 'Create Schema')}</span>
                  </button>
                  
                  {/* Delete Schema Button - Only show when editing existing schema */}
                  {isEditing && schemaObj && (schemaObj.id || schemaObj.schemaId) && (
                    <button
                      className="group relative flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-700 rounded-md text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to delete this schema?')) return;
                        const schemaId = schemaObj.id || schemaObj.schemaId;
                        try {
                          const res = await fetch(`${API_BASE_URL}/unified/schema/${schemaId}`, {
                            method: 'DELETE',
                          });
                          if (!res.ok) throw new Error('Failed to delete schema');
                          setSaveMessage('Schema deleted successfully!');
                          if (onSuccess) onSuccess();
                        } catch (err: any) {
                          setSaveMessage('Failed to delete schema.');
                        }
                      }}
                      type="button"
                    >
                      <div className="p-0.5 bg-red-100 rounded-sm group-hover:bg-red-200 transition-colors duration-200">
                        <Trash2 size={10} className="text-red-600" />
                      </div>
                      <span>Delete Schema</span>
                    </button>
                  )}
                  
                  {/* Cancel Button */}
                  <button
                    className="group relative flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-800 rounded-md text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => {
                      setIsInEditMode(false);
                      if (initialSchema) {
                        const schemaDefinition = initialSchema.schema || initialSchema;
                        setFields(schemaToFields(schemaDefinition));
                        setJsonSchema(JSON.stringify(schemaDefinition, null, 2));
                        if (initialSchema.schemaName) {
                          setSchemaName(initialSchema.schemaName);
                        }
                      }
                      setSaveMessage('');
                    }}
                  >
                    <div className="p-0.5 bg-gray-100 rounded-sm group-hover:bg-gray-200 transition-colors duration-200">
                      <X size={10} className="text-gray-600" />
                    </div>
                    <span>Cancel</span>
                  </button>
                </div>
              )}
              {/* Edit Schema Button */}
              {isReadOnly && (
                <button
                  onClick={() => setIsInEditMode(true)}
                  className="group relative flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="p-1 bg-green-100 rounded-md group-hover:bg-green-200 transition-colors duration-200">
                    <Edit size={12} className="text-green-600" />
                  </div>
                  <span>Edit Schema</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Schema Editor Section */}
      {activeTab === 'edit' || !activeTab ? (
         <div className="flex-1 grid grid-cols-2 gap-6 min-h-0 w-full px-6 py-4 schema-scrollbar">
        {/* Modern Form Editor */}
        <div className={`flex flex-col min-h-0 max-h-[65vh] bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${isReadOnly ? 'opacity-75' : ''}`}>
          <div className="flex items-center justify-between p-2 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
                <Layers size={18} className="text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-800">{isReadOnly ? 'Schema Structure' : 'Visual Editor'}</div>
                <div className="text-xs text-slate-500">Drag & drop interface</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 rounded-lg">
              <Sparkles size={14} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">{fields.length} fields</span>
            </div>
          </div>
           <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-slate-50/50 to-white schema-scrollbar">
            <NestedFieldsEditor 
              fields={fields} 
              onChange={isReadOnly ? () => {} : setFields} 
              collapsedNodes={collapsedNodes} 
              setCollapsedNodes={setCollapsedNodes} 
              nodePath="root" 
            />
          </div>
        </div>

        {/* Modern JSON Schema Editor */}
        <div className="flex flex-col min-h-0 max-h-[65vh] bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between p-2 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
                <Code2 size={18} className="text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-800">JSON Schema Editor</div>
                <div className="text-xs text-slate-500">Code & configuration</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-slate-100 to-gray-100 hover:from-slate-200 hover:to-gray-200 text-slate-700 rounded-lg text-xs border border-slate-200/50 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => {
                  try {
                    setJsonSchema(JSON.stringify(JSON.parse(jsonSchema), null, 2));
                  } catch {}
                }}
                title="Format JSON"
              >
                <Palette size={14} />
                Format
              </button>
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border font-medium transition-all duration-200 ${
                  resolvedView 
                    ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200/50 shadow-md' 
                    : 'bg-gradient-to-r from-slate-100 to-gray-100 hover:from-slate-200 hover:to-gray-200 text-slate-700 border-slate-200/50 shadow-sm hover:shadow-md'
                }`}
                onClick={async () => {
                  const next = !resolvedView;
                  setResolvedView(next);
                  if (next && !resolvedSchema) {
                    await loadResolvedSchema();
                  }
                }}
                title="Toggle resolved view"
              >
                <Sparkles size={14} />
                {isResolving ? 'Resolving...' : (resolvedView ? 'Resolved ✓' : 'Resolve')}
              </button>
            </div>
          </div>
          
          {/* Modern Raw Fields Section */}
          <div className="border-b border-slate-200/60">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50/50 transition-all duration-200"
              onClick={() => setShowRawFields(v => !v)}
            >
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">TypeScript/Raw Fields</span>
              </div>
              <div className={`p-1 rounded-md transition-all duration-200 ${showRawFields ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                {showRawFields ? '▲' : '▼'}
              </div>
            </div>
            {showRawFields && (
              <div className="p-4 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-white">
                <textarea
                  className="w-full border border-slate-200 rounded-lg p-3 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  placeholder={`Paste fields like:\nid: string;\nemail: string;\nrole: "ADMIN" | "USER";\ndepartmentId: string | null;`}
                  value={rawFields}
                  onChange={e => setRawFields(e.target.value)}
                  rows={3}
                  style={{ minHeight: 80 }}
                />
                <div className="flex items-center justify-between mt-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    onClick={handleConvertRawFields}
                    type="button"
                  >
                    <Zap size={14} />
                    Convert to JSON Schema
                  </button>
                  {rawFieldsError && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertTriangle size={14} />
                      {rawFieldsError}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modern JSON Schema Content */}
          <div className="flex-1 flex flex-col min-h-0">
              {resolvedView ? (
                <div className="flex-1 relative">
                  <textarea
                    className="absolute inset-0 w-full h-full border-0 p-4 font-mono text-sm bg-transparent text-transparent focus:outline-none focus:ring-0 resize-none overflow-y-auto leading-relaxed schema-scrollbar selection:bg-blue-600/30 caret-slate-100 z-10"
                    value={resolvedSchema ? JSON.stringify(resolvedSchema, null, 2) : (resolveError ? `// ${resolveError}` : (isResolving ? '// Resolving...' : '// No resolved schema yet'))}
                    readOnly
                    onScroll={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      const pre = target.nextElementSibling as HTMLElement;
                      if (pre) {
                        pre.scrollTop = target.scrollTop;
                        pre.scrollLeft = target.scrollLeft;
                      }
                    }}
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      tabSize: 2
                    }}
                  />
                  <pre className="absolute inset-0 p-4 font-mono text-sm bg-slate-900 text-slate-100 overflow-hidden leading-relaxed schema-scrollbar pointer-events-none" style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    tabSize: 2
                  }}>
                    <code dangerouslySetInnerHTML={{
                      __html: highlightJSON(resolvedSchema ? JSON.stringify(resolvedSchema, null, 2) : (resolveError ? `// ${resolveError}` : (isResolving ? '// Resolving...' : '// No resolved schema yet')))
                    }} />
                  </pre>
                </div>
              ) : (
                <div className="flex-1 relative">
                  <textarea
                    className={`absolute inset-0 w-full h-full border-0 p-4 font-mono text-sm bg-transparent text-transparent focus:outline-none focus:ring-0 resize-none overflow-y-auto leading-relaxed transition-all duration-200 schema-scrollbar selection:bg-blue-600/30 caret-slate-100 z-10 ${isReadOnly ? 'cursor-not-allowed' : 'cursor-text'}`}
                    value={jsonSchema}
                    onChange={handleJsonChange}
                    readOnly={isReadOnly}
                    onScroll={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      const pre = target.nextElementSibling as HTMLElement;
                      if (pre) {
                        pre.scrollTop = target.scrollTop;
                        pre.scrollLeft = target.scrollLeft;
                      }
                    }}
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      tabSize: 2
                    }}
                    placeholder="Enter your JSON schema here..."
                  />
                  <pre className="absolute inset-0 p-4 font-mono text-sm bg-slate-900 text-slate-100 overflow-hidden leading-relaxed schema-scrollbar pointer-events-none" style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    tabSize: 2
                  }}>
                    <code dangerouslySetInnerHTML={{
                      __html: highlightJSON(jsonSchema)
                    }} />
                  </pre>
                </div>
              )}
            {jsonError && (
              <div className="p-3 border-t border-red-200/60 bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle size={14} />
                  {jsonError}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {validationResult && (
          <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-emerald-600" />
              <div className="font-semibold text-sm text-emerald-800">Validation Result</div>
            </div>
            <pre className="bg-white/80 p-3 rounded-lg text-sm font-mono border border-emerald-200/50 overflow-x-auto">
              {JSON.stringify(validationResult, null, 2)}
            </pre>
          </div>
        )}
        {saveMessage && (
          <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-blue-600" />
              <div className="text-blue-700 font-semibold text-sm">{saveMessage}</div>
            </div>
          </div>
        )}
        </div>
      ) : null}

      {/* CRUD Operations Section */}
      {activeTab === 'createData' && (
        <div className="px-6 py-4 bg-white/90 backdrop-blur-sm border-t border-slate-200/60">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab('edit')}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <X size={16} />
              Back to Editor
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
                <PlusCircle size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Create Data for Table</h2>
                <div className="text-sm text-slate-500">Add new records to your schema table</div>
              </div>
            </div>
          </div>
          
          <label className="block text-sm font-medium mb-2">Account</label>
          <select
            className="border border-gray-200 p-2 rounded text-xs w-full mb-3"
            value={selectedAccountForData}
            onChange={e => setSelectedAccountForData(e.target.value)}
          >
            <option value="">Select account</option>
            {accounts.map(acc => (
              <option key={acc['namespace-account-id']} value={acc['namespace-account-id']}>
                {acc['namespace-account-name']}
              </option>
            ))}
          </select>
          {selectedAccountForData && (() => {
            const acc = accounts.find(a => a['namespace-account-id'] === selectedAccountForData);
            const tableNameMap = acc?.tableName || {};
            const tableNameForMethod = tableNameMap[methodName];
            if (!tableNameForMethod) {
              return (
            <div>
                  <div className="text-red-600 mb-2">
                    No table exists for this account and method. Please create a table first.
                  </div>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs"
                onClick={() => {
                  setShowTableModal(true);
                      setSelectedAccountId(selectedAccountForData); // pre-select account
                      setNewTableName(''); // or auto-generate
                  setTableCreateError(null);
                }}
              >
                Create Table
                    </button>
                  </div>
              );
            }
            // If table exists, show the form
            return (
            <form
              onSubmit={async e => {
                e.preventDefault();
                setCreateDataResult(null);
                setFormErrors(null);
                // Type validation using ajv
                const ajv = new Ajv();
                let schema;
                try {
                  schema = JSON.parse(jsonSchema);
                } catch {
                  setFormErrors('Invalid JSON schema.');
                  return;
                }
                const validate = ajv.compile(schema);
                const valid = validate(formData);
                if (!valid) {
                  setFormErrors(
                    validate.errors?.map(err => `${err.instancePath || err.schemaPath} ${err.message}`).join(', ') ||
                    'Validation failed'
                  );
                  return;
                }
                // If valid, proceed to submit
                try {
                  // Ensure partition key is present (assume 'id' as PK, update if needed)
                  const partitionKey = 'id'; // Change this if your PK is different
                  const dataToSend: Record<string, any> = { ...(typeof formData === 'object' && formData !== null ? formData : {}) };
                  if (!dataToSend[partitionKey]) {
                    dataToSend[partitionKey] = uuidv4();
                  }
                  const res = await fetch(`${API_BASE_URL}/crud?tableName=${tableNameForMethod}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item: dataToSend }),
                  });
                  if (!res.ok) throw new Error('Failed to create data');
                  setCreateDataResult('Data created successfully!');
                  setFormData({});
                } catch (err: any) {
                  setCreateDataResult('Error: ' + err.message);
                }
              }}
              className="max-w-xl"
            >
              <RecursiveDataForm
                schema={JSON.parse(jsonSchema)}
                value={formData}
                onChange={setFormData}
                required={JSON.parse(jsonSchema).required}
              />

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Create
                </button>
                <button
                  type="button"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                  onClick={() => {
                    const acc = accounts.find(a => a['namespace-account-id'] === selectedAccountForData);
                    const tableNameMap = acc?.tableName || {};
                    const tableNameForMethod = tableNameMap[methodName];
                    if (tableNameForMethod) {
                      setShowMockDataPanel(true);
                    } else {
                      setCreateDataResult('Error: No table exists for this account and method. Please create a table first.');
                    }
                  }}
                >
                  Insert Mock Data
                </button>
              </div>
              {formErrors && (
                <div className="mt-2 text-xs text-red-600">{formErrors}</div>
              )}
              {createDataResult && (
                <div className="mt-2 text-xs">{createDataResult}</div>
              )}
            </form>
            );
          })()}
        </div>
      )}

      {activeTab === 'updateData' && (
        <div className="px-6 py-4 bg-white/90 backdrop-blur-sm border-t border-slate-200/60">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab('edit')}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <X size={16} />
              Back to Editor
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg">
                <RefreshCw size={18} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Update Data in Table</h2>
                <div className="text-sm text-slate-500">Modify existing records in your schema table</div>
              </div>
            </div>
          </div>
          <label className="block text-xs font-medium mb-1">Account</label>
          <select
            className="border border-gray-200 p-2 rounded text-xs w-full mb-3"
            value={selectedAccountForData}
            onChange={e => setSelectedAccountForData(e.target.value)}
          >
            <option value="">Select account</option>
            {accounts.map(acc => (
              <option key={acc['namespace-account-id']} value={acc['namespace-account-id']}>
                {acc['namespace-account-name']}
              </option>
            ))}
          </select>
          {selectedAccountForData && (() => {
            const acc = accounts.find(a => a['namespace-account-id'] === selectedAccountForData);
            const tableNameMap = acc?.tableName || {};
            const tableNameForMethod = tableNameMap[methodName];
            if (!tableNameForMethod) {
              return <div className="text-red-600 mb-2">No table exists for this account and method. Please create a table first.</div>;
            }
            return (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setUpdateResult(null);
                  try {
                    const key = JSON.parse(updateKey || '{}');
                    const updates = JSON.parse(updateFields || '{}');
                    const res = await fetch(`${API_BASE_URL}/crud?tableName=${tableNameForMethod}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key, updates }),
                    });
                    const data = await res.json();
                    setUpdateResult(JSON.stringify(data, null, 2));
                  } catch (err: any) {
                    setUpdateResult('Error: ' + err.message);
                  }
                }}
                className="max-w-xl"
              >
                <label className="block text-xs font-medium mb-1">Key (JSON)</label>
                <input
                  className="border border-gray-200 p-2 rounded text-xs w-full mb-2 font-mono"
                  value={updateKey}
                  onChange={e => setUpdateKey(e.target.value)}
                  placeholder='{"id": "..."}'
                  required
                />
                <label className="block text-xs font-medium mb-1">Updates (JSON)</label>
                <input
                  className="border border-gray-200 p-2 rounded text-xs w-full mb-2 font-mono"
                  value={updateFields}
                  onChange={e => setUpdateFields(e.target.value)}
                  placeholder='{"field1": "new value"}'
                  required
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs mt-2">Update</button>
                {updateResult ? <div className="mt-2 text-xs"><pre>{updateResult}</pre></div> : null}
              </form>
            );
          })()}
        </div>
      )}

      {activeTab === 'readData' && (
        <div className="px-6 py-4 bg-white/90 backdrop-blur-sm border-t border-slate-200/60">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab('edit')}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <X size={16} />
              Back to Editor
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
                <Eye size={18} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Read Data from Table</h2>
                <div className="text-sm text-slate-500">View and search records in your schema table</div>
              </div>
            </div>
          </div>
          <label className="block text-xs font-medium mb-1">Account</label>
          <select
            className="border border-gray-200 p-2 rounded text-xs w-full mb-3"
            value={selectedAccountForData}
            onChange={e => setSelectedAccountForData(e.target.value)}
          >
            <option value="">Select account</option>
            {accounts.map(acc => (
              <option key={acc['namespace-account-id']} value={acc['namespace-account-id']}>
                {acc['namespace-account-name']}
              </option>
            ))}
          </select>
          {selectedAccountForData && (() => {
            const acc = accounts.find(a => a['namespace-account-id'] === selectedAccountForData);
            const tableNameMap = acc?.tableName || {};
            const tableNameForMethod = tableNameMap[methodName];
            if (!tableNameForMethod) {
              return <div className="text-red-600 mb-2">No table exists for this account and method. Please create a table first.</div>;
            }
            return (
              <div>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    setReadResult(null);
                    try {
                      const key = JSON.parse(readKey || '{}');
                      const params = new URLSearchParams({ tableName: tableNameForMethod, ...key }).toString();
                      const res = await fetch(`${API_BASE_URL}/crud?${params}`, { method: 'GET' });
                      const data = await res.json();
                      setReadResult(JSON.stringify(data, null, 2));
                    } catch (err: any) {
                      setReadResult('Error: ' + err.message);
                    }
                  }}
                  className="max-w-xl"
                >
                                  <label className="block text-xs font-medium mb-1">Key (JSON, optional)</label>
                <input
                  className="border border-gray-200 p-2 rounded text-xs w-full mb-2 font-mono"
                  value={readKey}
                  onChange={e => setReadKey(e.target.value)}
                  placeholder='{"id": "..."}'
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs mt-2">Read</button>
                {readResult ? <div className="mt-2 text-xs"><pre>{readResult}</pre></div> : null}
              </form>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-xs mt-3"
                onClick={async () => {
                    setReadAllResult(null);
                    try {
                      const params = new URLSearchParams({
                        tableName: tableNameForMethod,
                        pagination: 'true',
                        itemPerPage: '50',
                        maxPage: '1',
                      }).toString();
                      const res = await fetch(`${API_BASE_URL}/crud?${params}`, { method: 'GET' });
                      const data = await res.json();
                      setReadAllResult(JSON.stringify(data, null, 2));
                    } catch (err: any) {
                      setReadAllResult('Error: ' + err.message);
                    }
                  }}
                >Read All</button>
                {readAllResult ? <div className="mt-2 text-xs"><pre>{readAllResult}</pre></div> : null}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'deleteData' && (
        <div className="px-6 py-4 bg-white/90 backdrop-blur-sm border-t border-slate-200/60">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab('edit')}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <X size={16} />
              Back to Editor
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Delete Data from Table</h2>
                <div className="text-sm text-slate-500">Remove records from your schema table</div>
              </div>
            </div>
          </div>
          <label className="block text-xs font-medium mb-1">Account</label>
          <select
            className="border border-gray-200 p-2 rounded text-xs w-full mb-3"
            value={selectedAccountForData}
            onChange={e => setSelectedAccountForData(e.target.value)}
          >
            <option value="">Select account</option>
            {accounts.map(acc => (
              <option key={acc['namespace-account-id']} value={acc['namespace-account-id']}>
                {acc['namespace-account-name']}
              </option>
            ))}
          </select>
          {selectedAccountForData && (() => {
            const acc = accounts.find(a => a['namespace-account-id'] === selectedAccountForData);
            const tableNameMap = acc?.tableName || {};
            const tableNameForMethod = tableNameMap[methodName];
            if (!tableNameForMethod) {
              return <div className="text-red-600 mb-2">No table exists for this account and method. Please create a table first.</div>;
            }
            return (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setDeleteResult(null);
                  try {
                    const key = JSON.parse(deleteKey || '{}');
                    const res = await fetch(`${API_BASE_URL}/crud?tableName=${tableNameForMethod}`, {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(key),
                    });
                    const data = await res.json();
                    setDeleteResult(JSON.stringify(data, null, 2));
                  } catch (err: any) {
                    setDeleteResult('Error: ' + err.message);
                  }
                }}
                className="max-w-xl"
              >
                <label className="block text-xs font-medium mb-1">Key (JSON)</label>
                <input
                  className="border border-gray-200 p-2 rounded text-xs w-full mb-2 font-mono"
                  value={deleteKey}
                  onChange={e => setDeleteKey(e.target.value)}
                  placeholder='{"id": "..."}'
                  required
                />
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs mt-2">Delete</button>
                {deleteResult ? <div className="mt-2 text-xs"><pre>{deleteResult}</pre></div> : null}
              </form>
            );
          })()}
        </div>
      )}
      {/* Move modal here so it always renders when showTableModal is true */}
      {showTableModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
          <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-sm relative z-10 border border-gray-200">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowTableModal(false)}
            >✕</button>
            <h2 className="text-base font-semibold mb-3">Create Table for Schema</h2>
            <label className="block text-xs font-medium mb-1">Account</label>
            <select
              className="border border-gray-200 p-2 rounded text-xs w-full mb-2"
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              disabled={!!selectedAccountId}
            >
              <option value="">Select account</option>
              {accounts.map(acc => (
                <option key={acc['namespace-account-id']} value={acc['namespace-account-id']}>
                  {acc['namespace-account-name']}
                </option>
              ))}
            </select>
            <label className="block text-xs font-medium mb-1">Method Name</label>
            <input
              className="border border-gray-200 p-2 rounded text-xs w-full mb-2 bg-gray-100"
              value={methodName}
              readOnly
            />
            <label className="block text-xs font-medium mb-1">Table Name (auto-generated, can override)</label>
            <input
              className="border border-gray-200 p-2 rounded text-xs w-full mb-2"
              value={newTableName}
              onChange={e => setNewTableName(e.target.value)}
              placeholder="Enter table name"
              autoFocus
            />
            {tableCreateError && <div className="text-xs text-red-600 mb-2">{tableCreateError}</div>}
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs w-full"
              disabled={creatingTable || !selectedAccountId || !methodName}
              onClick={async () => {
                if (!selectedAccountId || !methodName) {
                  setTableCreateError('Please select an account and ensure method name is set.');
                  return;
                }
                setCreatingTable(true);
                setTableCreateError(null);
                try {
                  // 1. Fetch schemaId by schemaName
                  const resSchemas = await fetch(`${API_BASE_URL}/unified/schema`);
                  if (!resSchemas.ok) throw new Error('Failed to fetch schemas');
                  const schemas = await resSchemas.json();
                  let schemaId = schemas.find((s: any) => s.schemaName === schemaName)?.id || schemas.find((s: any) => s.schemaName === schemaName)?.schemaId;
                  // Ensure schemaId and accountId are plain strings
                  const schemaIdStr = getStringId(schemaId);
                  const accountIdStr = getStringId(selectedAccountId);
                  if (!schemaIdStr) throw new Error('Schema ID not found');
                  // 2. Create table (send accountId and methodName)
                  const reqBody = {
                    schemaId: schemaIdStr,
                    accountId: accountIdStr,
                    methodName,
                    tableName: newTableName.trim() || undefined,
                  };
                  console.log('Creating table with:', reqBody);
                  const res = await fetch(`${API_BASE_URL}/unified/schema/table`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reqBody),
                  });
                  if (!res.ok) {
                    let errMsg = 'Failed to create table';
                    try {
                      const err = await res.json();
                      errMsg = err.error || errMsg;
                    } catch {}
                    throw new Error(errMsg);
                  }
                  setShowTableModal(false);
                  setSelectedAccountId('');
                  setNewTableName(schemaName || '');
                  setTableCreateError(null);
                } catch (err: any) {
                  setTableCreateError(err.message);
                } finally {
                  setCreatingTable(false);
                }
              }}
            >
              {creatingTable ? 'Creating...' : 'Create Table'}
            </button>
          </div>
        </div>
      )}

      {/* Mock Data Panel */}
      <MockDataPanel
        isOpen={showMockDataPanel}
        onClose={() => setShowMockDataPanel(false)}
        tableName={(() => {
          const acc = accounts.find(a => a['namespace-account-id'] === selectedAccountForData);
          const tableNameMap = acc?.tableName || {};
          return tableNameMap[methodName] || '';
        })()}
        schema={JSON.parse(jsonSchema)}
        onInsertData={handleInsertMockData}
        onFillForm={(data) => {
          setFormData(data);
          setShowMockDataPanel(false);
        }}
      />
    </div>
  );
} 