/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useMemo, useState } from 'react';

type ApiStep = {
	id: string;
	type: 'api';
	methodId: string;
	accountId: string;
	namespaceId: string;
	input?: Record<string, any>;
	inputMapping?: Record<string, any>;
	resultKey?: string;
	connectionArn?: string;
};

type TransformStep = {
	id: string;
	type: 'transform';
	input?: Record<string, any>;
	inputMapping?: Record<string, any>;
	resultKey?: string;
};

type WorkflowStep = ApiStep | TransformStep;

type Workflow = {
	id?: string;
	workflowId?: string;
	name: string;
	description?: string;
	status?: 'draft' | 'active';
	steps: WorkflowStep[];
	stateMachineArn?: string | null;
	createdAt?: string;
	updatedAt?: string;
};

const BACKEND_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL ||
	process.env.NEXT_PUBLIC_CRUD_API_BASE_URL ||
	'http://localhost:5001';

export default function WorkflowsPage() {
	const [workflows, setWorkflows] = useState<Workflow[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [filter, setFilter] = useState('');
	const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

	// Catalog lists for drag-and-drop and dropdowns
	const [namespaces, setNamespaces] = useState<Array<{ id: string; name?: string }>>([]);
	const [namespacesLoading, setNamespacesLoading] = useState<boolean>(true);
	const [namespacesError, setNamespacesError] = useState<string | null>(null);
	const [accountsByNs, setAccountsByNs] = useState<Record<string, Array<{ id: string; name?: string }>>>({});
	const [methodsByNs, setMethodsByNs] = useState<Record<string, Array<{ id: string; name?: string }>>>({});
	const [loadingAccounts, setLoadingAccounts] = useState<Record<string, boolean>>({});
	const [loadingMethods, setLoadingMethods] = useState<Record<string, boolean>>({});

	// New workflow builder state
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [steps, setSteps] = useState<WorkflowStep[]>([]);
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState<'steps' | 'json' | 'stepFunctions'>('steps');
	const [jsonDefinition, setJsonDefinition] = useState<string>('{}');
	const [jsonError, setJsonError] = useState<string | null>(null);
	const [stepFunctionsDefinition, setStepFunctionsDefinition] = useState<string>('{}');
	const [loadingDefinition, setLoadingDefinition] = useState<boolean>(false);
	const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
	// Track raw JSON strings for inputMapping fields to allow free typing
	const [inputMappingRaw, setInputMappingRaw] = useState<Record<string, string>>({});

	// Template example for input mapping
	const getInputMappingTemplate = () => {
		return JSON.stringify({
			"message": "{{step1.result.title}}",
			"price": "{{step1.result.price}}"
		}, null, 2);
	};

	const headers = useMemo(
		() => ({
			'Content-Type': 'application/json'
		}),
		[]
	);

	const fetchWorkflows = async () => {
		try {
			setLoading(true);
			setError(null);
			const res = await fetch(`${BACKEND_URL}/workflows`, { cache: 'no-store' });
			if (!res.ok) {
				throw new Error(`Failed to fetch workflows: ${res.status}`);
			}
			const data = await res.json();
			setWorkflows(Array.isArray(data) ? data : data.workflows || []);
		} catch (e: any) {
			setError(e?.message || 'Failed to load workflows');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchWorkflows();
	}, []);

	// Load namespaces for palette/selects
	useEffect(() => {
		(async () => {
			try {
				setNamespacesLoading(true);
				setNamespacesError(null);
				const res = await fetch(`${BACKEND_URL}/unified/namespaces`, { cache: 'no-store' });
				if (res.ok) {
					const data = await res.json();
					console.log('[Workflows] Namespaces response:', data);
					const list = Array.isArray(data) ? data : data.data || data.items || [];
					console.log('[Workflows] Namespaces list:', list, 'Length:', list.length);
					const mapped = list
						.map((n: any) => {
							// Backend returns item.data (namespace object), which has namespace-id and namespace-name
							// Also handle case where backend might return full DynamoDB item with id and data fields
							const nsData = n.data || n;
							const id = n.id || nsData['namespace-id'] || nsData.id || nsData.namespaceId || nsData._id || '';
							const name = nsData['namespace-name'] || nsData.name || nsData.namespaceName || nsData.title || id || 'Unnamed';
							console.log('[Workflows] Mapping namespace:', { original: n, nsData, id, name });
							return { id, name };
						})
						.filter((n: any) => n.id && n.id.trim() !== '');
					console.log('[Workflows] Mapped namespaces:', mapped, 'Count:', mapped.length);
					setNamespaces(mapped);
				} else {
					const errorText = await res.text();
					console.error('[Workflows] Failed to fetch namespaces:', res.status, res.statusText, errorText);
					setNamespacesError(`Failed to load: ${res.status} ${res.statusText}`);
				}
			} catch (e: any) {
				console.error('[Workflows] Error fetching namespaces:', e);
				setNamespacesError(e?.message || 'Failed to load namespaces');
			} finally {
				setNamespacesLoading(false);
			}
		})();
	}, []);

	// Auto-load accounts and methods when a step with namespaceId is selected
	useEffect(() => {
		if (selectedStepIndex !== null && steps[selectedStepIndex]) {
			const step = steps[selectedStepIndex];
			if (step.type === 'api' && (step as ApiStep).namespaceId) {
				const nsId = (step as ApiStep).namespaceId;
				if (nsId) {
					ensureAccountsForNamespace(nsId);
					ensureMethodsForNamespace(nsId);
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedStepIndex, steps.length]);

	async function ensureAccountsForNamespace(namespaceId: string) {
		if (!namespaceId || accountsByNs[namespaceId]) return;
		if (loadingAccounts[namespaceId]) return; // Already loading
		try {
			setLoadingAccounts(prev => ({ ...prev, [namespaceId]: true }));
			console.log('[Workflows] Fetching accounts for namespace:', namespaceId);
			const res = await fetch(`${BACKEND_URL}/unified/namespaces/${encodeURIComponent(namespaceId)}/accounts`, { cache: 'no-store' });
			if (res.ok) {
				const data = await res.json();
				console.log('[Workflows] Accounts response:', data);
				const list = Array.isArray(data) ? data : data.data || data.items || [];
				const mapped = list
					.map((a: any) => {
						// Handle both direct account object and nested structure
						const accountData = a.data || a;
						const id = a.id || accountData.id || accountData['namespace-account-id'] || accountData.accountId || accountData._id || '';
						const name = accountData['namespace-account-name'] || accountData.name || accountData.accountName || accountData.title || id || 'Unnamed';
						return { id, name };
					})
					.filter((a: any) => a.id && a.id.trim() !== '');
				console.log('[Workflows] Mapped accounts:', mapped);
				setAccountsByNs(prev => ({ ...prev, [namespaceId]: mapped }));
			} else {
				console.warn('[Workflows] Failed to fetch accounts:', res.status, res.statusText);
			}
		} catch (e: any) {
			console.error('[Workflows] Error fetching accounts:', e);
		} finally {
			setLoadingAccounts(prev => {
				const next = { ...prev };
				delete next[namespaceId];
				return next;
			});
		}
	}

	async function ensureMethodsForNamespace(namespaceId: string) {
		if (!namespaceId || methodsByNs[namespaceId]) return;
		if (loadingMethods[namespaceId]) return; // Already loading
		try {
			setLoadingMethods(prev => ({ ...prev, [namespaceId]: true }));
			console.log('[Workflows] Fetching methods for namespace:', namespaceId);
			const res = await fetch(`${BACKEND_URL}/unified/namespaces/${encodeURIComponent(namespaceId)}/methods`, { cache: 'no-store' });
			if (res.ok) {
				const data = await res.json();
				console.log('[Workflows] Methods response:', data);
				const list = Array.isArray(data) ? data : data.data || data.items || [];
				const mapped = list
					.map((m: any) => {
						// Handle both direct method object and nested structure
						const methodData = m.data || m;
						const id = m.id || methodData.id || methodData['namespace-method-id'] || methodData.methodId || methodData._id || '';
						const name = methodData['namespace-method-name'] || methodData.name || methodData.methodName || methodData.title || methodData.slug || id || 'Unnamed';
						return { id, name };
					})
					.filter((m: any) => m.id && m.id.trim() !== '');
				console.log('[Workflows] Mapped methods:', mapped);
				setMethodsByNs(prev => ({ ...prev, [namespaceId]: mapped }));
			} else {
				console.warn('[Workflows] Failed to fetch methods:', res.status, res.statusText);
			}
		} catch (e: any) {
			console.error('[Workflows] Error fetching methods:', e);
		} finally {
			setLoadingMethods(prev => {
				const next = { ...prev };
				delete next[namespaceId];
				return next;
			});
		}
	}

	// Canvas DnD handlers
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	
	function handleCanvasDragOver(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.stopPropagation();
		// Check for any of the data types we might have set
		const hasNamespaceData = e.dataTransfer.types.includes('application/x-namespace-id') || 
		                         e.dataTransfer.types.includes('text/plain') ||
		                         e.dataTransfer.types.length > 0;
		if (hasNamespaceData) {
			setIsDraggingOver(true);
			e.dataTransfer.dropEffect = 'copy';
		}
	}
	
	function handleCanvasDragLeave(e: React.DragEvent<HTMLDivElement>) {
		// Only reset if we're actually leaving the drop zone
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX;
		const y = e.clientY;
		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			setIsDraggingOver(false);
		}
	}
	
	function handleCanvasDrop(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.stopPropagation();
		setIsDraggingOver(false);
		
		// Try multiple data types
		let nsId = '';
		try {
			nsId = e.dataTransfer.getData('application/x-namespace-id');
		} catch (err) {
			console.warn('[Workflows] Error getting custom type:', err);
		}
		
		if (!nsId) {
			try {
				nsId = e.dataTransfer.getData('text/plain');
			} catch (err) {
				console.warn('[Workflows] Error getting text/plain:', err);
			}
		}
		
		// Fallback to window ref if dataTransfer fails
		if (!nsId && (window as any).__draggedNamespaceId) {
			nsId = (window as any).__draggedNamespaceId;
			delete (window as any).__draggedNamespaceId;
		}
		
		console.log('[Workflows] Drop received, namespace ID:', nsId);
		console.log('[Workflows] Available data types:', Array.from(e.dataTransfer.types));
		
		if (!nsId || !nsId.trim()) {
			console.warn('[Workflows] No namespace ID in drop data. Available types:', Array.from(e.dataTransfer.types));
			// Try to get all data
			for (let i = 0; i < e.dataTransfer.types.length; i++) {
				const type = e.dataTransfer.types[i];
				try {
					const data = e.dataTransfer.getData(type);
					console.log(`[Workflows] Type: ${type}, Data: ${data}`);
					if (data && data.trim()) {
						nsId = data;
						break;
					}
				} catch (err) {
					console.warn(`[Workflows] Error getting data for type ${type}:`, err);
				}
			}
		}
		
		if (!nsId || !nsId.trim()) {
			console.error('[Workflows] Could not extract namespace ID from drop');
			alert('Failed to drop namespace. Please try again or use the "Add API step" button.');
			return;
		}
		
		const newIndex = steps.length;
		const step: ApiStep = {
			id: `step_${newIndex + 1}`,
			type: 'api',
			methodId: '',
			accountId: '',
			namespaceId: nsId.trim(),
			input: {},
			inputMapping: {},
			resultKey: `step${newIndex + 1}`
		};
		setSteps(prev => [...prev, step]);
		setSelectedStepIndex(newIndex);
		ensureAccountsForNamespace(nsId.trim());
		ensureMethodsForNamespace(nsId.trim());
	}

	function addStep(kind: 'api' | 'transform') {
		const newStep: WorkflowStep =
			kind === 'api'
				? {
						id: `step_${steps.length + 1}`,
						type: 'api',
						methodId: '',
						accountId: '',
						namespaceId: '',
						input: {},
						inputMapping: {},
						resultKey: `step${steps.length + 1}`
				  }
				: {
						id: `step_${steps.length + 1}`,
						type: 'transform',
						input: {},
						inputMapping: {},
						resultKey: `step${steps.length + 1}`
				  };
		setSteps(prev => [...prev, newStep]);
		setExpanded(prev => ({ ...prev, [newStep.id]: true }));
	}

	// Sync workflow state to JSON when switching to JSON tab
	useEffect(() => {
		if (activeTab === 'json') {
			const workflowDef = {
				name,
				description,
				steps
			};
			const newJson = JSON.stringify(workflowDef, null, 2);
			setJsonDefinition(newJson);
			setJsonError(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	// Sync workflow state to JSON when state changes (but only if not currently editing JSON)
	useEffect(() => {
		if (activeTab === 'json') {
			const workflowDef = {
				name,
				description,
				steps
			};
			const newJson = JSON.stringify(workflowDef, null, 2);
			// Only update if JSON is different to avoid overwriting user edits
			// This is a simple check - in a real app you might want to debounce or use a ref
			const currentJson = jsonDefinition.trim();
			if (newJson !== currentJson && !jsonError) {
				// Only auto-update if the JSON is valid and matches the state
				try {
					const parsed = JSON.parse(currentJson);
					const parsedState = { name, description, steps };
					// If parsed JSON doesn't match current state, update it
					if (JSON.stringify(parsed) !== JSON.stringify(parsedState)) {
						setJsonDefinition(newJson);
						setJsonError(null);
					}
				} catch {
					// If JSON is invalid, don't auto-update (let user fix it)
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [name, description, steps]);

	// Parse JSON and update workflow state
	function handleJsonChange(newJson: string) {
		setJsonDefinition(newJson);
		setJsonError(null);
		
		try {
			const parsed = JSON.parse(newJson);
			
			// Validate structure
			if (typeof parsed !== 'object' || parsed === null) {
				throw new Error('JSON must be an object');
			}
			
			// Update name and description
			if (parsed.name !== undefined) {
				setName(parsed.name || '');
			}
			if (parsed.description !== undefined) {
				setDescription(parsed.description || '');
			}
			
			// Update steps if present
			if (Array.isArray(parsed.steps)) {
				setSteps(parsed.steps);
			} else if (parsed.steps !== undefined) {
				throw new Error('Steps must be an array');
			}
			
		} catch (e: any) {
			setJsonError(e.message || 'Invalid JSON');
		}
	}

	function updateStep(index: number, field: string, value: any) {
		setSteps(prev => {
			const clone = [...prev];
			(clone[index] as any)[field] = value;
			return clone;
		});
	}

	function removeStep(index: number) {
		setSteps(prev => prev.filter((_, i) => i !== index));
	}

	function moveStep(index: number, direction: -1 | 1) {
		setSteps(prev => {
			const target = index + direction;
			if (target < 0 || target >= prev.length) return prev;
			const clone = [...prev];
			const tmp = clone[index];
			clone[index] = clone[target];
			clone[target] = tmp;
			return clone;
		});
	}

	async function handleSave() {
		try {
			if (!name.trim()) {
				alert('Name is required');
				return;
			}
			if (steps.length === 0) {
				alert('Add at least one step');
				return;
			}

			setSaving(true);

			// Build a linear workflow: each step's "next" is the next step id; final step ends
			const builtSteps = steps.map((s, idx) => {
				const next = idx < steps.length - 1 ? steps[idx + 1].id : undefined;
				return next ? { ...s, next } : s;
			});

			const payload: Workflow = {
				name: name.trim(),
				description: description.trim(),
				status: 'draft',
				steps: builtSteps
			};

			// If editing, use PUT; otherwise use POST
			const method = editingWorkflowId ? 'PUT' : 'POST';
			const url = editingWorkflowId 
				? `${BACKEND_URL}/workflows/${editingWorkflowId}`
				: `${BACKEND_URL}/workflows`;

			const res = await fetch(url, {
				method,
				headers,
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const text = await res.text();
				throw new Error(`Save failed: ${res.status} ${text}`);
			}

			const successMessage = editingWorkflowId ? 'Workflow updated successfully!' : 'Workflow saved successfully!';
			alert(successMessage);
			await fetchWorkflows();
			// Reset form
			setName('');
			setDescription('');
			setSteps([]);
			setJsonDefinition('{}');
			setJsonError(null);
			setEditingWorkflowId(null);
			setActiveTab('steps');
		} catch (e: any) {
			alert(e?.message || 'Failed to save workflow');
		} finally {
			setSaving(false);
		}
	}

	async function handleDeploy(workflowId: string) {
		try {
			const res = await fetch(`${BACKEND_URL}/workflows/${workflowId}/deploy`, {
				method: 'POST',
				headers
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(`Deploy failed: ${res.status} ${text}`);
			}
			await fetchWorkflows();
			alert('Deployed workflow.');
		} catch (e: any) {
			alert(e?.message || 'Failed to deploy workflow');
		}
	}

	const [executionResult, setExecutionResult] = useState<any>(null);
	const [executionLoading, setExecutionLoading] = useState(false);

	async function handleExecute(workflowId: string, waitForResult: boolean = false, autoDeploy: boolean = false) {
		try {
			setExecutionLoading(true);
			setExecutionResult(null);
			
			// Auto-deploy if needed
			if (autoDeploy) {
				const workflow = workflows.find(w => (w.id || w.workflowId) === workflowId);
				if (workflow && !workflow.stateMachineArn) {
					// Deploy first
					const deployRes = await fetch(`${BACKEND_URL}/workflows/${workflowId}/deploy`, {
						method: 'POST',
						headers
					});
					if (!deployRes.ok) {
						const text = await deployRes.text();
						throw new Error(`Deploy failed: ${deployRes.status} ${text}`);
					}
					// Refresh workflows list
					await fetchWorkflows();
				}
			}
			
			const inputRaw = prompt('Provide execution input JSON (optional):', '{}') || '{}';
			let input: any = {};
			try {
				input = JSON.parse(inputRaw);
			} catch {
				alert('Invalid JSON. Using empty object.');
			}
			
			const res = await fetch(`${BACKEND_URL}/workflows/${workflowId}/execute`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ input, waitForCompletion: waitForResult })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(`Execute failed: ${res.status} ${text}`);
			}
			const data = await res.json();
			
			if (waitForResult && data.status) {
				// Result is already available
				setExecutionResult(data);
			} else if (data.executionArn) {
				// Poll for results
				setExecutionResult({ status: 'RUNNING', executionArn: data.executionArn, ...data });
				if (waitForResult) {
					pollExecutionStatus(data.executionArn);
				} else {
					alert(`Execution started: ${data.executionArn}`);
				}
			}
		} catch (e: any) {
			alert(e?.message || 'Failed to execute workflow');
			setExecutionResult({ status: 'FAILED', error: e?.message });
		} finally {
			setExecutionLoading(false);
		}
	}

	async function pollExecutionStatus(executionArn: string) {
		const maxAttempts = 150; // 5 minutes max (2s * 150)
		let attempts = 0;
		
		const poll = async () => {
			try {
				const res = await fetch(`${BACKEND_URL}/workflows/executions/${encodeURIComponent(executionArn)}/status`);
				if (!res.ok) throw new Error('Failed to get status');
				
				const data = await res.json();
				setExecutionResult(data);
				
				if (data.status === 'SUCCEEDED' || data.status === 'FAILED' || data.status === 'TIMED_OUT' || data.status === 'ABORTED') {
					setExecutionLoading(false);
					return; // Done
				}
				
				// Still running, poll again
				attempts++;
				if (attempts < maxAttempts) {
					setTimeout(poll, 2000); // Poll every 2 seconds
				} else {
					setExecutionLoading(false);
					setExecutionResult((prev: any) => ({ ...prev, timeout: true }));
				}
			} catch (e: any) {
				setExecutionLoading(false);
				setExecutionResult((prev: any) => ({ ...prev, error: e?.message }));
			}
		};
		
		poll();
	}

	return (
		<div style={{ padding: 0, display: 'grid', gridTemplateColumns: '280px 1fr 360px', minHeight: '100vh' }}>
			{/* Sidebar */}
			<aside style={{ borderRight: '1px solid #eee', background: '#fafafa', padding: 16, display: 'grid', gridTemplateRows: 'auto auto auto 1fr', gap: 12 }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Workflows</h2>
					<button onClick={fetchWorkflows} title="Refresh" style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>⟳</button>
				</div>
				<input
					placeholder="Search workflows..."
					value={filter}
					onChange={e => setFilter(e.target.value)}
					style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none' }}
				/>
				{/* Namespace palette */}
				<div style={{ display: 'grid', gap: 8 }}>
					<div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Namespaces (drag to canvas)</div>
					<div style={{ display: 'grid', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
						{namespacesLoading && <div style={{ color: '#6b7280', fontSize: 12 }}>Loading namespaces...</div>}
						{namespacesError && <div style={{ color: '#dc2626', fontSize: 12 }}>{namespacesError}</div>}
						{!namespacesLoading && !namespacesError && namespaces.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>No namespaces found</div>}
						{!namespacesLoading && namespaces.map((ns: any) => (
							<div
								key={ns.id}
								draggable
								onDragStart={(e) => {
									console.log('[Workflows] Drag start:', ns.id, ns.name);
									setIsDragging(true);
									// Set data - use text/plain first as it's most compatible
									try {
										e.dataTransfer.setData('text/plain', ns.id);
									} catch (err) {
										console.error('[Workflows] Error setting text/plain:', err);
									}
									try {
										e.dataTransfer.setData('application/x-namespace-id', ns.id);
									} catch (err) {
										console.error('[Workflows] Error setting custom type:', err);
									}
									e.dataTransfer.effectAllowed = 'copy';
									// Store in a ref for fallback
									(window as any).__draggedNamespaceId = ns.id;
								}}
								onDragEnd={(e) => {
									console.log('[Workflows] Drag end');
									setIsDragging(false);
									setIsDraggingOver(false);
									delete (window as any).__draggedNamespaceId;
								}}
								style={{ 
									border: '1px dashed #cbd5e1', 
									padding: 8, 
									borderRadius: 10, 
									background: isDragging ? '#f0f9ff' : '#fff', 
									cursor: 'grab',
									display: 'flex', 
									justifyContent: 'space-between',
									userSelect: 'none',
									WebkitUserSelect: 'none',
									MozUserSelect: 'none',
									msUserSelect: 'none',
									opacity: isDragging ? 0.7 : 1,
									transition: 'all 0.2s'
								}}
								title="Drag to the canvas to create an API step"
							>
								<span style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}>{ns.name || ns.id}</span>
								<span style={{ fontSize: 11, color: '#6b7280', pointerEvents: 'none' }}>drag</span>
							</div>
						))}
					</div>
				</div>
				<div style={{ overflowY: 'auto', display: 'grid', gap: 6 }}>
					{loading && <div style={{ color: '#6b7280', fontSize: 12, padding: 12, textAlign: 'center' }}>Loading workflows…</div>}
					{!loading && workflows.length > 0 && (
						<div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
							{workflows.length} Workflow{workflows.length !== 1 ? 's' : ''}
						</div>
					)}
					{!loading && workflows
						.filter(w => (w.name || '').toLowerCase().includes(filter.toLowerCase()) || (w.id || w.workflowId || '').toLowerCase().includes(filter.toLowerCase()))
						.map(w => {
							const id = (w.id || w.workflowId) as string;
							const isSelected = selectedId === id;
							return (
								<div
									key={id}
									onClick={() => setSelectedId(id)}
									style={{
										border: '1px solid ' + (isSelected ? '#2563eb' : '#e5e7eb'),
										background: isSelected ? '#eff6ff' : '#fff',
										borderRadius: 10,
										padding: 10,
										cursor: 'pointer',
										display: 'grid',
										gap: 6
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
										<div style={{ display: 'grid', gap: 4, flex: 1, minWidth: 0 }}>
											<strong style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name || 'Unnamed Workflow'}</strong>
											<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
												<span style={{ 
													fontSize: 11, 
													padding: '2px 6px', 
													borderRadius: 4, 
													background: w.status === 'active' ? '#d1fae5' : '#f3f4f6',
													color: w.status === 'active' ? '#065f46' : '#6b7280',
													fontWeight: 500
												}}>
													{w.status || 'draft'}
												</span>
												{w.stateMachineArn && (
													<span style={{ fontSize: 10, color: '#10b981' }}>✓ Deployed</span>
												)}
											</div>
											<small style={{ color: '#9ca3af', fontSize: 10, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
												{w.steps?.length || 0} step{w.steps?.length !== 1 ? 's' : ''}
											</small>
										</div>
										<div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
											<button
												onClick={(e) => { e.stopPropagation(); handleDeploy(id); }}
												title={w.status === 'active' ? 'Already deployed' : 'Deploy workflow'}
												disabled={w.status === 'active'}
												style={{ 
													padding: '6px 10px', 
													borderRadius: 6, 
													border: '1px solid #d1d5db', 
													background: w.status === 'active' ? '#f3f4f6' : '#fff',
													cursor: w.status === 'active' ? 'not-allowed' : 'pointer',
													fontSize: 11,
													opacity: w.status === 'active' ? 0.6 : 1
												}}
											>🚀 Deploy</button>
											<button
												onClick={(e) => { e.stopPropagation(); handleExecute(id, true, true); }}
												title={w.stateMachineArn ? 'Test run workflow' : 'Test run (will auto-deploy)'}
												disabled={executionLoading}
												style={{ 
													padding: '6px 10px', 
													borderRadius: 6, 
													border: '1px solid #10b981', 
													background: '#10b981', 
													color: '#fff',
													cursor: executionLoading ? 'wait' : 'pointer',
													fontSize: 11,
													fontWeight: 500
												}}
											>{executionLoading ? '⏳' : '▶ Test'}</button>
										</div>
									</div>
								</div>
							);
						})}
					{!loading && workflows.length === 0 && (
						<div style={{ 
							padding: 24, 
							textAlign: 'center', 
							color: '#9ca3af',
							fontSize: 13,
							display: 'grid',
							gap: 8
						}}>
							<div style={{ fontSize: 32, opacity: 0.5 }}>📋</div>
							<div>No workflows yet</div>
							<div style={{ fontSize: 11, color: '#d1d5db' }}>Create a new workflow in the center panel</div>
						</div>
					)}
				</div>
			</aside>

			{/* Main Content (Center Canvas) */}
			<div style={{ padding: 24, display: 'grid', gap: 24, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
				<h1 style={{ fontSize: 24, fontWeight: 700 }}>Create / Manage</h1>

			<section 
				style={{ 
					display: 'grid', 
					gap: 16, 
					background: isDraggingOver ? '#f0f9ff' : '#fff', 
					border: isDraggingOver ? '2px dashed #2563eb' : '1px solid #eee', 
					borderRadius: 12, 
					boxShadow: '0 2px 12px rgba(0,0,0,0.04)', 
					padding: 16,
					minHeight: 200,
					transition: 'all 0.2s'
				}}
				onDragOver={handleCanvasDragOver}
				onDragLeave={handleCanvasDragLeave}
				onDrop={handleCanvasDrop}
			>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<h2 style={{ margin: 0, fontSize: 18 }}>Create Workflow</h2>
					<span style={{ fontSize: 12, color: '#6b7280' }}>Backend: {BACKEND_URL}</span>
				</div>

				{/* Tabs */}
				<div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #e5e7eb', marginBottom: 16 }}>
					<button
						onClick={() => setActiveTab('steps')}
						style={{
							padding: '10px 16px',
							border: 'none',
							background: 'transparent',
							borderBottom: activeTab === 'steps' ? '2px solid #2563eb' : '2px solid transparent',
							color: activeTab === 'steps' ? '#2563eb' : '#6b7280',
							fontWeight: activeTab === 'steps' ? 600 : 400,
							cursor: 'pointer',
							marginBottom: -2
						}}
					>
						Workflow Steps
					</button>
					<button
						onClick={() => setActiveTab('json')}
						style={{
							padding: '10px 16px',
							border: 'none',
							background: 'transparent',
							borderBottom: activeTab === 'json' ? '2px solid #2563eb' : '2px solid transparent',
							color: activeTab === 'json' ? '#2563eb' : '#6b7280',
							fontWeight: activeTab === 'json' ? 600 : 400,
							cursor: 'pointer',
							marginBottom: -2
						}}
					>
						Workflow JSON
					</button>
					<button
						onClick={async () => {
							setActiveTab('stepFunctions');
							// Generate Step Functions definition from current workflow state
							if (steps.length > 0) {
								setLoadingDefinition(true);
								try {
									const workflowDef = {
										name: name || 'Untitled Workflow',
										description: description || '',
										steps: steps
									};
									
									// Call backend to generate Step Functions definition
									const response = await fetch(`${BACKEND_URL}/workflows/generate-definition`, {
										method: 'POST',
										headers,
										body: JSON.stringify(workflowDef)
									});
									
									if (response.ok) {
										const data = await response.json();
										setStepFunctionsDefinition(JSON.stringify(data.definition, null, 2));
									} else {
										const errorData = await response.json();
										setStepFunctionsDefinition(JSON.stringify({ error: errorData.details || 'Could not generate definition' }, null, 2));
									}
								} catch (error: any) {
									console.error('Error generating definition:', error);
									setStepFunctionsDefinition(JSON.stringify({ error: error.message || 'Error generating definition' }, null, 2));
								} finally {
									setLoadingDefinition(false);
								}
							} else {
								setStepFunctionsDefinition(JSON.stringify({ error: 'No steps defined. Add steps to generate Step Functions definition.' }, null, 2));
							}
						}}
						style={{
							padding: '10px 16px',
							border: 'none',
							background: 'transparent',
							borderBottom: activeTab === 'stepFunctions' ? '2px solid #2563eb' : '2px solid transparent',
							color: activeTab === 'stepFunctions' ? '#2563eb' : '#6b7280',
							fontWeight: activeTab === 'stepFunctions' ? 600 : 400,
							cursor: 'pointer',
							marginBottom: -2
						}}
					>
						Step Functions Definition
					</button>
				</div>

				{activeTab === 'steps' ? (
					<>
						<label style={{ display: 'grid', gap: 6 }}>
							<span style={{ fontSize: 12, color: '#374151' }}>Name</span>
							<input
								value={name}
								onChange={e => setName(e.target.value)}
								placeholder="Create Product and Notify"
								style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none' }}
							/>
						</label>

						<label style={{ display: 'grid', gap: 6 }}>
							<span style={{ fontSize: 12, color: '#374151' }}>Description</span>
							<textarea
								value={description}
								onChange={e => setDescription(e.target.value)}
								placeholder="Describe your workflow"
								rows={3}
								style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none' }}
							/>
						</label>

						<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
							<button onClick={() => addStep('api')} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db', background: '#f9fafb' }}>
								<span role="img" aria-label="api">🌐</span> Add API step
							</button>
							<button onClick={() => addStep('transform')} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db', background: '#f9fafb' }}>
								<span role="img" aria-label="transform">🔧</span> Add Transform step
							</button>
						</div>

						{/* Canvas Drop Zone */}
						{steps.length === 0 && (
					<div 
						style={{ 
							border: isDraggingOver ? '2px dashed #2563eb' : '2px dashed #cbd5e1', 
							borderRadius: 12, 
							padding: 40, 
							textAlign: 'center',
							background: isDraggingOver ? '#eff6ff' : '#f9fafb',
							color: isDraggingOver ? '#2563eb' : '#6b7280',
							transition: 'all 0.2s'
						}}
						onDragOver={handleCanvasDragOver}
						onDragLeave={handleCanvasDragLeave}
						onDrop={handleCanvasDrop}
					>
						<div style={{ fontSize: 14, fontWeight: 500 }}>
							{isDraggingOver ? 'Drop namespace here to create API step' : 'Drag a namespace from the sidebar to create an API step'}
						</div>
					</div>
				)}

				{steps.length > 0 && (
					<div 
						style={{ display: 'grid', gap: 12, marginTop: 8 }}
						onDragOver={handleCanvasDragOver}
						onDragLeave={handleCanvasDragLeave}
						onDrop={handleCanvasDrop}
					>
						{steps.map((s, i) => (
							<div 
								key={s.id} 
								onClick={() => setSelectedStepIndex(i)} 
								style={{ border: selectedStepIndex === i ? '2px solid #2563eb' : '1px solid #eee', background: '#fff', borderRadius: 12, padding: 12, display: 'grid', gap: 8, cursor: 'pointer' }}
							>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
										<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: s.type === 'api' ? '#E5F2FF' : '#FFEFD5', color: '#111827', fontSize: 12 }}>
											{s.type === 'api' ? 'API' : 'TX'}
										</span>
										<strong style={{ fontSize: 14 }}>
											{i + 1}. {s.id}
										</strong>
										<span style={{ fontSize: 12, color: '#6b7280' }}>{s.type === 'api' ? 'HTTP via Step Functions' : 'Lambda transform'}</span>
									</div>
									<div style={{ display: 'flex', gap: 8 }}>
										<button onClick={() => setExpanded(prev => ({ ...prev, [s.id]: !prev[s.id] }))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
											{expanded[s.id] ? 'Collapse' : 'Expand'}
										</button>
										<button onClick={() => moveStep(i, -1)} disabled={i === 0} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
											↑
										</button>
										<button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
											↓
										</button>
										<button onClick={() => removeStep(i)} style={{ color: '#b00', padding: '6px 10px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff5f5' }}>
											Remove
										</button>
									</div>
								</div>

								{expanded[s.id] && (
									<>
										<label style={{ display: 'grid', gap: 4 }}>
											<span style={{ fontSize: 12, color: '#374151' }}>Result Key</span>
											<input
												value={s.resultKey || ''}
												onChange={e => updateStep(i, 'resultKey', e.target.value)}
												placeholder={`step${i + 1}`}
												style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none' }}
											/>
										</label>

										{s.type === 'api' ? (
											<div style={{ display: 'grid', gap: 8 }}>
												<div style={{ display: 'grid', gap: 6 }}>
													<label style={{ display: 'grid', gap: 4 }}>
														<span style={{ fontSize: 12, color: '#374151' }}>Method ID</span>
														<input
															value={(s as ApiStep).methodId}
															onChange={e => updateStep(i, 'methodId', e.target.value)}
															placeholder="shopify-create-product"
															style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none' }}
														/>
													</label>
													<label style={{ display: 'grid', gap: 4 }}>
														<span style={{ fontSize: 12, color: '#374151' }}>Account ID</span>
														<input
															value={(s as ApiStep).accountId}
															onChange={e => updateStep(i, 'accountId', e.target.value)}
															placeholder="shopify-account"
															style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none' }}
														/>
													</label>
													<label style={{ display: 'grid', gap: 4 }}>
														<span style={{ fontSize: 12, color: '#374151' }}>Namespace ID</span>
														<input
															value={(s as ApiStep).namespaceId}
															onChange={e => updateStep(i, 'namespaceId', e.target.value)}
															placeholder="shopify-namespace"
															style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none' }}
														/>
													</label>
												</div>

												<div style={{ display: 'grid', gap: 6 }}>
													<label style={{ display: 'grid', gap: 4 }}>
														<span style={{ fontSize: 12, color: '#374151' }}>Input (JSON)</span>
														<textarea
															value={JSON.stringify((s as ApiStep).input || {}, null, 2)}
															onChange={e => {
																try {
																	updateStep(i, 'input', JSON.parse(e.target.value || '{}'));
																} catch {
																	// ignore
																}
															}}
															rows={4}
															style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
														/>
													</label>
													<label style={{ display: 'grid', gap: 4 }}>
														<span style={{ fontSize: 12, color: '#374151' }}>Input Mapping (JSON)</span>
														<textarea
															value={inputMappingRaw[s.id] !== undefined ? inputMappingRaw[s.id] : (Object.keys((s as ApiStep).inputMapping || {}).length === 0 ? getInputMappingTemplate() : JSON.stringify((s as ApiStep).inputMapping || {}, null, 2))}
															onChange={e => {
																const rawValue = e.target.value;
																setInputMappingRaw(prev => ({ ...prev, [s.id]: rawValue }));
																// Try to parse and update if valid JSON (skip if it's the template placeholder)
																if (rawValue !== getInputMappingTemplate()) {
																	try {
																		const parsed = JSON.parse(rawValue || '{}');
																		updateStep(i, 'inputMapping', parsed);
																	} catch {
																		// Keep raw value, don't update parsed value yet
																	}
																}
															}}
															onBlur={e => {
																// On blur, try to format/validate the JSON (skip if it's the template placeholder)
																if (e.target.value !== getInputMappingTemplate()) {
																	try {
																		const parsed = JSON.parse(e.target.value || '{}');
																		const formatted = JSON.stringify(parsed, null, 2);
																		setInputMappingRaw(prev => ({ ...prev, [s.id]: formatted }));
																		updateStep(i, 'inputMapping', parsed);
																	} catch {
																		// Keep raw value if invalid
																	}
																}
															}}
															onFocus={e => {
																const currentValue = inputMappingRaw[s.id] !== undefined ? inputMappingRaw[s.id] : (Object.keys((s as ApiStep).inputMapping || {}).length === 0 ? getInputMappingTemplate() : JSON.stringify((s as ApiStep).inputMapping || {}, null, 2));
																if (currentValue === getInputMappingTemplate()) {
																	setInputMappingRaw(prev => ({ ...prev, [s.id]: '{}' }));
																}
															}}
															rows={4}
															style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
														/>
														<div style={{ fontSize: 11, color: '#6b7280', marginTop: -4 }}>
															💡 Use <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>{'{{stepId.result.field}}'}</code> to reference previous step results
														</div>
													</label>
												</div>
											</div>
										) : (
											<div style={{ display: 'grid', gap: 6 }}>
												<label style={{ display: 'grid', gap: 4 }}>
													<span style={{ fontSize: 12, color: '#374151' }}>Input Mapping (JSON)</span>
													<textarea
														value={inputMappingRaw[s.id] !== undefined ? inputMappingRaw[s.id] : (Object.keys((s as TransformStep).inputMapping || {}).length === 0 ? getInputMappingTemplate() : JSON.stringify((s as TransformStep).inputMapping || {}, null, 2))}
														onChange={e => {
															const rawValue = e.target.value;
															// Store raw value to allow free typing
															setInputMappingRaw(prev => ({ ...prev, [s.id]: rawValue }));
															// Try to parse and update if valid JSON (skip if it's the template placeholder)
															if (rawValue !== getInputMappingTemplate()) {
																try {
																	const parsed = JSON.parse(rawValue || '{}');
																	updateStep(i, 'inputMapping', parsed);
																} catch {
																	// Keep raw value, don't update parsed value yet
																}
															}
														}}
														onBlur={e => {
															// On blur, try to format/validate the JSON (skip if it's the template placeholder)
															if (e.target.value !== getInputMappingTemplate()) {
																try {
																	const parsed = JSON.parse(e.target.value || '{}');
																	const formatted = JSON.stringify(parsed, null, 2);
																	setInputMappingRaw(prev => ({ ...prev, [s.id]: formatted }));
																	updateStep(i, 'inputMapping', parsed);
																} catch {
																	// Keep raw value if invalid
																}
															}
														}}
														onFocus={e => {
															// If it's the template, clear it on focus
															const currentValue = inputMappingRaw[s.id] !== undefined ? inputMappingRaw[s.id] : (Object.keys((s as TransformStep).inputMapping || {}).length === 0 ? getInputMappingTemplate() : JSON.stringify((s as TransformStep).inputMapping || {}, null, 2));
															if (currentValue === getInputMappingTemplate()) {
																setInputMappingRaw(prev => ({ ...prev, [s.id]: '{}' }));
															}
														}}
														rows={6}
														style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
													/>
													<div style={{ fontSize: 11, color: '#6b7280', marginTop: -4 }}>
														💡 Use <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>{'{{stepId.result.field}}'}</code> to reference previous step results
													</div>
												</label>
											</div>
										)}
									</>
								)}
							</div>
						))}
					</div>
				)}

					</>
				) : activeTab === 'json' ? (
					<div style={{ display: 'grid', gap: 8 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<label style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>Workflow JSON Definition</label>
							{jsonError && (
								<span style={{ fontSize: 12, color: '#dc2626', padding: '4px 8px', background: '#fee2e2', borderRadius: 6 }}>
									{jsonError}
								</span>
							)}
						</div>
						<textarea
							value={jsonDefinition}
							onChange={e => handleJsonChange(e.target.value)}
							placeholder='{\n  "name": "My Workflow",\n  "description": "...",\n  "steps": []\n}'
							rows={20}
							style={{
								padding: 12,
								border: jsonError ? '2px solid #dc2626' : '1px solid #e5e7eb',
								borderRadius: 10,
								outline: 'none',
								fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
								fontSize: 13,
								lineHeight: 1.6,
								background: jsonError ? '#fef2f2' : '#fff',
								resize: 'vertical'
							}}
						/>
						<div style={{ fontSize: 11, color: '#6b7280', padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>
							💡 <strong>Tip:</strong> Changes in this JSON editor will automatically update the workflow steps. The JSON structure should include <code style={{ background: '#fff', padding: '2px 4px', borderRadius: 4 }}>name</code>, <code style={{ background: '#fff', padding: '2px 4px', borderRadius: 4 }}>description</code>, and <code style={{ background: '#fff', padding: '2px 4px', borderRadius: 4 }}>steps</code> array.
						</div>
					</div>
				) : (
					<div style={{ display: 'grid', gap: 8 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<label style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>Step Functions Definition (AWS Format)</label>
							{loadingDefinition && (
								<span style={{ fontSize: 12, color: '#2563eb', padding: '4px 8px', background: '#dbeafe', borderRadius: 6 }}>
									Generating...
								</span>
							)}
						</div>
						<textarea
							value={stepFunctionsDefinition}
							readOnly
							placeholder='Step Functions definition will appear here...'
							rows={25}
							style={{
								padding: 12,
								border: '1px solid #e5e7eb',
								borderRadius: 10,
								outline: 'none',
								fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
								fontSize: 13,
								lineHeight: 1.6,
								background: '#f9fafb',
								resize: 'vertical',
								cursor: 'text'
							}}
						/>
						<div style={{ fontSize: 11, color: '#6b7280', padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>
							💡 <strong>Info:</strong> This is the AWS Step Functions state machine definition that will be deployed. It's generated from your workflow steps and matches the exact format required by AWS Step Functions.
						</div>
					</div>
				)}

				<div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
					{editingWorkflowId && (
						<div style={{ padding: '8px 12px', borderRadius: 8, background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 600 }}>
							✏️ Editing: {name || 'Workflow'}
						</div>
					)}
					<button onClick={handleSave} disabled={saving} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2563eb', background: '#2563eb', color: '#fff' }}>
						{saving ? 'Saving…' : editingWorkflowId ? 'Update workflow' : 'Save workflow'}
					</button>
					<button
						onClick={() => {
							setName('');
							setDescription('');
							setSteps([]);
							setJsonDefinition('{}');
							setJsonError(null);
							setEditingWorkflowId(null);
							setActiveTab('steps');
						}}
						type="button"
						style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}
					>
						{editingWorkflowId ? 'Cancel Edit' : 'Reset'}
					</button>
				</div>
			</section>

			<section style={{ display: 'grid', gap: 12, background: '#fff', border: '1px solid #eee', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: 16 }}>
				<h2 style={{ margin: 0, fontSize: 18 }}>Existing Workflows</h2>
				{loading && <div>Loading…</div>}
				{error && <div style={{ color: 'crimson' }}>{error}</div>}
				{!loading && !error && workflows.length === 0 && <div style={{ color: '#6b7280' }}>No workflows yet.</div>}
				{!loading && !error && workflows.length > 0 && (
					<div style={{ display: 'grid', gap: 12 }}>
						{workflows.map(w => (
							<div key={w.id || w.workflowId} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, background: '#fff' }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<div style={{ display: 'grid', gap: 4 }}>
										<strong style={{ fontSize: 14 }}>{w.name}</strong>
										<small style={{ color: '#6b7280' }}>
											ID: {w.id || w.workflowId} · Status: {w.status} ·{' '}
											{w.stateMachineArn ? 'State machine ready' : 'No state machine'}
										</small>
									</div>
									<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
										<button 
											onClick={() => {
												// Load workflow for editing
												setName(w.name || '');
												setDescription(w.description || '');
												setSteps(w.steps || []);
												setEditingWorkflowId((w.id || w.workflowId) as string);
												setJsonDefinition(JSON.stringify({ name: w.name, description: w.description, steps: w.steps }, null, 2));
												setJsonError(null);
												setActiveTab('steps');
												// Scroll to top
												window.scrollTo({ top: 0, behavior: 'smooth' });
											}}
											style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', fontSize: 12 }}
										>
											✏️ Edit
										</button>
										<button 
											onClick={() => handleDeploy((w.id || w.workflowId) as string)} 
											disabled={w.status === 'active'} 
											style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db', background: '#f9fafb', fontSize: 12 }}
										>
											🚀 Deploy
										</button>
										<button 
											onClick={() => handleExecute((w.id || w.workflowId) as string, true, true)} 
											disabled={executionLoading} 
											style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #10b981', background: '#10b981', color: '#fff', fontSize: 12 }}
										>
											{executionLoading ? '⏳ Running...' : '▶ Test Run'}
										</button>
										<button 
											onClick={async () => {
												if (!confirm(`Are you sure you want to delete "${w.name}"? This action cannot be undone.`)) {
													return;
												}
												try {
													const res = await fetch(`${BACKEND_URL}/workflows/${w.id || w.workflowId}`, {
														method: 'DELETE',
														headers
													});
													if (!res.ok) {
														const errorData = await res.json();
														throw new Error(errorData.error || 'Failed to delete workflow');
													}
													alert('Workflow deleted successfully!');
													await fetchWorkflows();
													// If we were editing this workflow, reset the form
													if (editingWorkflowId === (w.id || w.workflowId)) {
														setName('');
														setDescription('');
														setSteps([]);
														setJsonDefinition('{}');
														setJsonError(null);
														setEditingWorkflowId(null);
													}
												} catch (error: any) {
													alert(`Failed to delete workflow: ${error.message}`);
												}
											}}
											style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #dc2626', background: '#fee2e2', color: '#dc2626', fontSize: 12 }}
										>
											🗑️ Delete
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			{/* Execution Results Panel */}
			{executionResult && (
				<section style={{ display: 'grid', gap: 12, background: '#fff', border: '1px solid #eee', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: 16 }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<h2 style={{ margin: 0, fontSize: 18 }}>Execution Results</h2>
						<button onClick={() => setExecutionResult(null)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>✕</button>
					</div>
					
					<div style={{ display: 'grid', gap: 8 }}>
						<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
							<span style={{ fontSize: 12, color: '#6b7280' }}>Status:</span>
							<span style={{ 
								padding: '4px 8px', 
								borderRadius: 6, 
								fontSize: 12, 
								fontWeight: 600,
								background: executionResult.status === 'SUCCEEDED' ? '#d1fae5' : 
											executionResult.status === 'FAILED' ? '#fee2e2' : 
											executionResult.status === 'RUNNING' ? '#dbeafe' : '#f3f4f6',
								color: executionResult.status === 'SUCCEEDED' ? '#065f46' : 
									   executionResult.status === 'FAILED' ? '#991b1b' : 
									   executionResult.status === 'RUNNING' ? '#1e40af' : '#374151'
							}}>
								{executionResult.status || 'UNKNOWN'}
							</span>
						</div>
						
						{executionResult.executionArn && (
							<div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>
								{executionResult.executionArn}
							</div>
						)}
						
						{executionResult.output && (
							<div style={{ display: 'grid', gap: 4 }}>
								<span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Output:</span>
								<pre style={{ 
									padding: 12, 
									background: '#f9fafb', 
									border: '1px solid #e5e7eb', 
									borderRadius: 8, 
									fontSize: 12, 
									overflow: 'auto',
									maxHeight: 400,
									fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'
								}}>
									{JSON.stringify(executionResult.output, null, 2)}
								</pre>
							</div>
						)}
						
						{executionResult.error && (
							<div style={{ display: 'grid', gap: 4 }}>
								<span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>Error:</span>
								<div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: '#991b1b' }}>
									{executionResult.error}
									{executionResult.cause && (
										<div style={{ marginTop: 8, fontSize: 11, color: '#7f1d1d' }}>
											{executionResult.cause}
										</div>
									)}
								</div>
							</div>
						)}
						
						{executionResult.status === 'RUNNING' && executionLoading && (
							<div style={{ padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#1e40af' }}>
								⏳ Execution is running... Polling for results...
							</div>
						)}
					</div>
				</section>
			)}
			</div>

			{/* Right Configuration Panel */}
			<aside style={{ borderLeft: '1px solid #eee', background: '#ffffff', padding: 16, display: 'grid', gridTemplateRows: 'auto 1fr', gap: 12 }}>
				<h2 style={{ margin: 0, fontSize: 16 }}>Step Configuration</h2>
				<div style={{ overflowY: 'auto' }}>
					{selectedStepIndex === null || steps[selectedStepIndex] === undefined ? (
						<div style={{ color: '#6b7280' }}>Select a step on the canvas to configure it.</div>
					) : (
						(() => {
							const s = steps[selectedStepIndex];
							return (
								<div style={{ display: 'grid', gap: 10 }}>
									<div style={{ display: 'grid', gap: 4 }}>
										<label style={{ fontSize: 12, color: '#374151' }}>Step ID</label>
										<input value={s.id} onChange={(e) => updateStep(selectedStepIndex, 'id', e.target.value)} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10 }} />
									</div>
									<div style={{ display: 'grid', gap: 4 }}>
										<label style={{ fontSize: 12, color: '#374151' }}>Type</label>
										<input value={s.type} disabled style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb' }} />
									</div>
									<div style={{ display: 'grid', gap: 4 }}>
										<label style={{ fontSize: 12, color: '#374151' }}>Result Key</label>
										<input value={s.resultKey || ''} onChange={(e) => updateStep(selectedStepIndex, 'resultKey', e.target.value)} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10 }} />
									</div>

									{s.type === 'api' ? (
										<>
											<div style={{ display: 'grid', gap: 4 }}>
												<label style={{ fontSize: 12, color: '#374151' }}>Namespace</label>
												{namespaces.length ? (
													<select
														value={(s as any).namespaceId}
														onChange={(e) => { updateStep(selectedStepIndex, 'namespaceId', e.target.value); ensureAccountsForNamespace(e.target.value); ensureMethodsForNamespace(e.target.value); }}
														style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10 }}
													>
														<option value="">Select namespace…</option>
														{namespaces.map(ns => (
															<option key={ns.id} value={ns.id}>{ns.name || ns.id}</option>
														))}
													</select>
												) : (
													<input value={(s as any).namespaceId} onChange={(e) => { updateStep(selectedStepIndex, 'namespaceId', e.target.value); ensureAccountsForNamespace(e.target.value); ensureMethodsForNamespace(e.target.value); }} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10 }} />
												)}
											</div>
											<div style={{ display: 'grid', gap: 4 }}>
												<label style={{ fontSize: 12, color: '#374151' }}>Account</label>
												{(s as any).namespaceId ? (
													loadingAccounts[(s as any).namespaceId] ? (
														<div style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', color: '#6b7280', fontSize: 12 }}>
															Loading accounts…
														</div>
													) : accountsByNs[(s as any).namespaceId]?.length ? (
														<select 
															value={(s as any).accountId || ''} 
															onChange={(e) => updateStep(selectedStepIndex, 'accountId', e.target.value)} 
															style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10 }}
														>
															<option value="">Select account…</option>
															{accountsByNs[(s as any).namespaceId].map(a => (
																<option key={a.id} value={a.id}>{a.name || a.id}</option>
															))}
														</select>
													) : accountsByNs[(s as any).namespaceId]?.length === 0 ? (
														<div style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', color: '#6b7280', fontSize: 12 }}>
															No accounts found. <input 
																value={(s as any).accountId || ''} 
																onChange={(e) => updateStep(selectedStepIndex, 'accountId', e.target.value)} 
																placeholder="Enter account ID manually"
																style={{ marginTop: 4, padding: 6, border: '1px solid #d1d5db', borderRadius: 6, width: '100%' }} 
															/>
														</div>
													) : (
														<input 
															value={(s as any).accountId || ''} 
															onChange={(e) => updateStep(selectedStepIndex, 'accountId', e.target.value)} 
															placeholder="Select namespace first, or enter account ID"
															style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10 }} 
														/>
													)
												) : (
													<input 
														value={(s as any).accountId || ''} 
														onChange={(e) => updateStep(selectedStepIndex, 'accountId', e.target.value)} 
														placeholder="Select namespace first"
														style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10 }} 
													/>
												)}
											</div>
											<div style={{ display: 'grid', gap: 4 }}>
												<label style={{ fontSize: 12, color: '#374151' }}>Method</label>
												{(s as any).namespaceId ? (
													loadingMethods[(s as any).namespaceId] ? (
														<div style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', color: '#6b7280', fontSize: 12 }}>
															Loading methods…
														</div>
													) : methodsByNs[(s as any).namespaceId]?.length ? (
														<select 
															value={(s as any).methodId || ''} 
															onChange={(e) => updateStep(selectedStepIndex, 'methodId', e.target.value)} 
															style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10 }}
														>
															<option value="">Select method…</option>
															{methodsByNs[(s as any).namespaceId].map(m => (
																<option key={m.id} value={m.id}>{m.name || m.id}</option>
															))}
														</select>
													) : methodsByNs[(s as any).namespaceId]?.length === 0 ? (
														<div style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', color: '#6b7280', fontSize: 12 }}>
															No methods found. <input 
																value={(s as any).methodId || ''} 
																onChange={(e) => updateStep(selectedStepIndex, 'methodId', e.target.value)} 
																placeholder="Enter method ID manually"
																style={{ marginTop: 4, padding: 6, border: '1px solid #d1d5db', borderRadius: 6, width: '100%' }} 
															/>
														</div>
													) : (
														<input 
															value={(s as any).methodId || ''} 
															onChange={(e) => updateStep(selectedStepIndex, 'methodId', e.target.value)} 
															placeholder="Select namespace first, or enter method ID"
															style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10 }} 
														/>
													)
												) : (
													<input 
														value={(s as any).methodId || ''} 
														onChange={(e) => updateStep(selectedStepIndex, 'methodId', e.target.value)} 
														placeholder="Select namespace first"
														style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10 }} 
													/>
												)}
											</div>
											<div style={{ display: 'grid', gap: 4 }}>
												<label style={{ fontSize: 12, color: '#374151' }}>Input (JSON)</label>
												<textarea
													value={JSON.stringify((s as any).input || {}, null, 2)}
													onChange={(e) => { try { updateStep(selectedStepIndex, 'input', JSON.parse(e.target.value || '{}')); } catch {} }}
													rows={6}
													style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, fontFamily: 'ui-monospace, Menlo, monospace' }}
												/>
											</div>
											<div style={{ display: 'grid', gap: 4 }}>
												<label style={{ fontSize: 12, color: '#374151' }}>Input Mapping (JSON)</label>
												<textarea
													value={inputMappingRaw[s.id] !== undefined ? inputMappingRaw[s.id] : (Object.keys((s as any).inputMapping || {}).length === 0 ? getInputMappingTemplate() : JSON.stringify((s as any).inputMapping || {}, null, 2))}
													onChange={(e) => {
														const rawValue = e.target.value;
														setInputMappingRaw(prev => ({ ...prev, [s.id]: rawValue }));
														// Try to parse and update if valid JSON (skip if it's the template placeholder)
														if (rawValue !== getInputMappingTemplate()) {
															try {
																const parsed = JSON.parse(rawValue || '{}');
																updateStep(selectedStepIndex, 'inputMapping', parsed);
															} catch {
																// Keep raw value, don't update parsed value yet
															}
														}
													}}
													onBlur={(e) => {
														// On blur, try to format/validate the JSON (skip if it's the template placeholder)
														if (e.target.value !== getInputMappingTemplate()) {
															try {
																const parsed = JSON.parse(e.target.value || '{}');
																const formatted = JSON.stringify(parsed, null, 2);
																setInputMappingRaw(prev => ({ ...prev, [s.id]: formatted }));
																updateStep(selectedStepIndex, 'inputMapping', parsed);
															} catch {
																// Keep raw value if invalid
															}
														}
													}}
													onFocus={(e) => {
														const currentValue = inputMappingRaw[s.id] !== undefined ? inputMappingRaw[s.id] : (Object.keys((s as any).inputMapping || {}).length === 0 ? getInputMappingTemplate() : JSON.stringify((s as any).inputMapping || {}, null, 2));
														if (currentValue === getInputMappingTemplate()) {
															setInputMappingRaw(prev => ({ ...prev, [s.id]: '{}' }));
														}
													}}
													rows={6}
													style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, fontFamily: 'ui-monospace, Menlo, monospace' }}
												/>
												<div style={{ fontSize: 11, color: '#6b7280', marginTop: -4 }}>
													💡 Use <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>{'{{stepId.result.field}}'}</code> to reference previous step results
												</div>
											</div>
										</>
									) : (
										<>
											<div style={{ display: 'grid', gap: 4 }}>
												<label style={{ fontSize: 12, color: '#374151' }}>Input Mapping (JSON)</label>
												<textarea
													value={inputMappingRaw[s.id] !== undefined ? inputMappingRaw[s.id] : (Object.keys((s as any).inputMapping || {}).length === 0 ? getInputMappingTemplate() : JSON.stringify((s as any).inputMapping || {}, null, 2))}
													onChange={(e) => {
														const rawValue = e.target.value;
														setInputMappingRaw(prev => ({ ...prev, [s.id]: rawValue }));
														// Try to parse and update if valid JSON (skip if it's the template placeholder)
														if (rawValue !== getInputMappingTemplate()) {
															try {
																const parsed = JSON.parse(rawValue || '{}');
																updateStep(selectedStepIndex, 'inputMapping', parsed);
															} catch {
																// Keep raw value, don't update parsed value yet
															}
														}
													}}
													onBlur={(e) => {
														// On blur, try to format/validate the JSON (skip if it's the template placeholder)
														if (e.target.value !== getInputMappingTemplate()) {
															try {
																const parsed = JSON.parse(e.target.value || '{}');
																const formatted = JSON.stringify(parsed, null, 2);
																setInputMappingRaw(prev => ({ ...prev, [s.id]: formatted }));
																updateStep(selectedStepIndex, 'inputMapping', parsed);
															} catch {
																// Keep raw value if invalid
															}
														}
													}}
													onFocus={(e) => {
														const currentValue = inputMappingRaw[s.id] !== undefined ? inputMappingRaw[s.id] : (Object.keys((s as any).inputMapping || {}).length === 0 ? getInputMappingTemplate() : JSON.stringify((s as any).inputMapping || {}, null, 2));
														if (currentValue === getInputMappingTemplate()) {
															setInputMappingRaw(prev => ({ ...prev, [s.id]: '{}' }));
														}
													}}
													rows={6}
													style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, fontFamily: 'ui-monospace, Menlo, monospace' }}
												/>
												<div style={{ fontSize: 11, color: '#6b7280', marginTop: -4 }}>
													💡 Use <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>{'{{stepId.result.field}}'}</code> to reference previous step results
												</div>
											</div>
										</>
									)}
								</div>
							);
						})()
					)}
				</div>
			</aside>
		</div>
	);
}


