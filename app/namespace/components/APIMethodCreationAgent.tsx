import React, { useState, useEffect } from 'react';
import { Plus, Link, Save, Copy, TestTube, Globe, Settings, FileText, Zap } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

interface APIMethodCreationAgentProps {
  namespace: any;
  onMethodCreated?: (method: any) => void;
  deployedEndpoints?: Array<{
    functionName: string;
    apiGatewayUrl: string;
    functionArn: string;
    deployedAt: Date;
  }>;
}

interface GeneratedMethod {
  id: string;
  name: string;
  method: string;
  path: string;
  originalUrl: string;
  overrideUrl?: string;
  openApiSpec: any;
  description: string;
  parameters: any[];
  requestBody?: any;
  responses: any;
  tags: string[];
  createdAt: Date;
}

const APIMethodCreationAgent: React.FC<APIMethodCreationAgentProps> = ({
  namespace,
  onMethodCreated,
  deployedEndpoints = []
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [methodName, setMethodName] = useState('');
  const [methodType, setMethodType] = useState('POST');
  const [description, setDescription] = useState('');
  const [overrideUrl, setOverrideUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMethods, setGeneratedMethods] = useState<GeneratedMethod[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customParameters, setCustomParameters] = useState<Array<{name: string, type: string, required: boolean, description: string}>>([]);
  const [customHeaders, setCustomHeaders] = useState<Array<{name: string, value: string, required: boolean}>>([]);
  const [savingMethods, setSavingMethods] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Auto-populate from deployed endpoints
  useEffect(() => {
    if (deployedEndpoints.length > 0 && !inputUrl) {
      const firstEndpoint = deployedEndpoints[0];
      setInputUrl(firstEndpoint.apiGatewayUrl);
      setMethodName(firstEndpoint.functionName);
      setSelectedEndpoint(firstEndpoint.apiGatewayUrl);
    }
  }, [deployedEndpoints, inputUrl]);

  const generateOpenAPISpec = (url: string, method: string, name: string, description: string) => {
    const urlObj = new URL(url);
    const path = urlObj.pathname || '/';
    
    const openApiSpec = {
      openapi: '3.0.0',
      info: {
        title: name || 'Generated API Method',
        description: description || `API method for ${url}`,
        version: '1.0.0'
      },
      servers: [
        {
          url: `${urlObj.protocol}//${urlObj.host}`,
          description: 'Generated API Server'
        }
      ],
      paths: {
        [path]: {
          [method.toLowerCase()]: {
            summary: name || 'Generated Method',
            description: description || `API method for ${url}`,
            operationId: name?.toLowerCase().replace(/\s+/g, '_') || 'generated_method',
            tags: ['Generated'],
            parameters: [
              ...customParameters.map(param => ({
                name: param.name,
                in: 'query',
                required: param.required,
                schema: { type: param.type },
                description: param.description
              })),
              ...customHeaders.map(header => ({
                name: header.name,
                in: 'header',
                required: header.required,
                schema: { type: 'string' },
                description: `Custom header: ${header.name}`
              }))
            ],
            requestBody: method !== 'GET' ? {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        description: 'Request payload'
                      }
                    }
                  }
                }
              }
            } : undefined,
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                        message: { type: 'string' }
                      }
                    }
                  }
                }
              },
              '400': {
                description: 'Bad Request',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                      }
                    }
                  }
                }
              },
              '500': {
                description: 'Internal Server Error',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    return openApiSpec;
  };

  const handleGenerateMethod = async () => {
    if (!inputUrl || !methodName) {
      alert('Please provide both URL and method name');
      return;
    }

    setIsGenerating(true);
    try {
      const openApiSpec = generateOpenAPISpec(
        overrideUrl || inputUrl,
        methodType,
        methodName,
        description
      );

      const newMethod: GeneratedMethod = {
        id: Date.now().toString(),
        name: methodName,
        method: methodType,
        path: new URL(overrideUrl || inputUrl).pathname || '/',
        originalUrl: inputUrl,
        overrideUrl: overrideUrl || undefined,
        openApiSpec,
        description,
        parameters: customParameters,
        responses: openApiSpec.paths[Object.keys(openApiSpec.paths)[0]][methodType.toLowerCase()].responses,
        tags: ['Generated', 'API Gateway'],
        createdAt: new Date()
      };

      setGeneratedMethods(prev => [...prev, newMethod]);
      
      // Reset form
      setMethodName('');
      setDescription('');
      setOverrideUrl('');
      setCustomParameters([]);
      setCustomHeaders([]);
      
    } catch (error) {
      console.error('Error generating method:', error);
      alert('Error generating method. Please check the URL format.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToNamespace = async (method: GeneratedMethod) => {
    if (!namespace?.['namespace-id']) {
      alert('No namespace selected');
      return;
    }

    setSavingMethods(prev => new Set(prev).add(method.id));
    setSuccessMessage('');

    try {
      const methodData = {
        'namespace-method-name': method.name,
        'namespace-method-type': method.method,
        'namespace-method-url-override': method.overrideUrl || method.originalUrl,
        'namespace-method-description': method.description,
        'namespace-method-openapi': method.openApiSpec,
        'namespace-method-parameters': method.parameters,
        'namespace-method-responses': method.responses,
        'namespace-method-tags': method.tags,
        'namespace-method-created-at': method.createdAt.toISOString(),
        'request-schema': method.openApiSpec.paths[Object.keys(method.openApiSpec.paths)[0]][method.method.toLowerCase()]?.requestBody?.content?.['application/json']?.schema,
        'response-schema': method.openApiSpec.paths[Object.keys(method.openApiSpec.paths)[0]][method.method.toLowerCase()]?.responses?.['200']?.content?.['application/json']?.schema,
        'isInitialized': true
      };

      const response = await fetch(`${API_BASE_URL}/unified/namespaces/${namespace['namespace-id']}/methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(methodData),
      });

      if (response.ok) {
        const savedMethod = await response.json();
        setSuccessMessage(`✅ Method "${method.name}" saved to namespace successfully!`);
        onMethodCreated?.(savedMethod);
        
        // Remove the method from generated methods list after successful save
        setGeneratedMethods(prev => prev.filter(m => m.id !== method.id));
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save method');
      }
    } catch (error) {
      console.error('Error saving method:', error);
      alert(`Error saving method to namespace: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSavingMethods(prev => {
        const newSet = new Set(prev);
        newSet.delete(method.id);
        return newSet;
      });
    }
  };

  const handleTestMethod = async (method: GeneratedMethod) => {
    try {
      const testUrl = method.overrideUrl || method.originalUrl;
      
      const response = await fetch(`${API_BASE_URL}/api-method/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testUrl,
          method: method.method,
          headers: customHeaders.reduce((acc, header) => {
            if (header.value) acc[header.name] = header.value;
            return acc;
          }, {} as Record<string, string>),
          body: method.method !== 'GET' ? { test: true, timestamp: new Date().toISOString() } : undefined,
          timeout: 30000
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const testResult = result.data;
        alert(`Test Result (${testResult.status}):\n\n${JSON.stringify(testResult.body, null, 2)}`);
      } else {
        alert(`Test failed: ${result.error}\nDetails: ${result.details}`);
      }
    } catch (error) {
      alert(`Test failed: ${error}`);
    }
  };

  const addCustomParameter = () => {
    setCustomParameters(prev => [...prev, { name: '', type: 'string', required: false, description: '' }]);
  };

  const updateCustomParameter = (index: number, field: string, value: any) => {
    setCustomParameters(prev => prev.map((param, i) => 
      i === index ? { ...param, [field]: value } : param
    ));
  };

  const removeCustomParameter = (index: number) => {
    setCustomParameters(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomHeader = () => {
    setCustomHeaders(prev => [...prev, { name: '', value: '', required: false }]);
  };

  const updateCustomHeader = (index: number, field: string, value: string) => {
    setCustomHeaders(prev => prev.map((header, i) => 
      i === index ? { ...header, [field]: value } : header
    ));
  };

  const removeCustomHeader = (index: number) => {
    setCustomHeaders(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">API Method Creation Agent</h3>
        </div>
        <p className="text-sm text-blue-700">
          Transform API Gateway URLs into reusable methods with OpenAPI specifications. 
          Create methods that can be overridden with different URLs and saved to your namespace.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Quick Select from Deployed Endpoints */}
      {deployedEndpoints.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Quick Select from Deployed Endpoints
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deployedEndpoints.map((endpoint, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputUrl(endpoint.apiGatewayUrl);
                  setMethodName(endpoint.functionName);
                  setSelectedEndpoint(endpoint.apiGatewayUrl);
                }}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  selectedEndpoint === endpoint.apiGatewayUrl
                    ? 'border-green-500 bg-green-100'
                    : 'border-green-200 bg-white hover:bg-green-50'
                }`}
              >
                <div className="font-medium text-green-800">{endpoint.functionName}</div>
                <div className="text-xs text-green-600 break-all">{endpoint.apiGatewayUrl}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Method Creation Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Method
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Gateway URL *
            </label>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method Name *
            </label>
            <input
              type="text"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              placeholder="getUserData"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTTP Method
            </label>
            <select
              value={methodType}
              onChange={(e) => setMethodType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Override URL (Optional)
            </label>
            <input
              type="url"
              value={overrideUrl}
              onChange={(e) => setOverrideUrl(e.target.value)}
              placeholder="https://custom-api.example.com/endpoint"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use a different URL for this method (overrides the original)
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this API method does..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Advanced Options */}
        <div className="mt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <Settings className="w-4 h-4" />
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 border-t pt-4">
              {/* Custom Parameters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Custom Parameters</label>
                  <button
                    onClick={addCustomParameter}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Parameter
                  </button>
                </div>
                {customParameters.map((param, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Parameter name"
                      value={param.name}
                      onChange={(e) => updateCustomParameter(index, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <select
                      value={param.type}
                      onChange={(e) => updateCustomParameter(index, 'type', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="array">Array</option>
                    </select>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => updateCustomParameter(index, 'required', e.target.checked)}
                      />
                      Required
                    </label>
                    <button
                      onClick={() => removeCustomParameter(index)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Custom Headers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Custom Headers</label>
                  <button
                    onClick={addCustomHeader}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Header
                  </button>
                </div>
                {customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Header name"
                      value={header.name}
                      onChange={(e) => updateCustomHeader(index, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={header.required}
                        onChange={(e) => updateCustomHeader(index, 'required', e.target.checked.toString())}
                      />
                      Required
                    </label>
                    <button
                      onClick={() => removeCustomHeader(index)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <button
            onClick={handleGenerateMethod}
            disabled={isGenerating || !inputUrl || !methodName}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              isGenerating || !inputUrl || !methodName
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Method
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Methods */}
      {generatedMethods.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Generated Methods ({generatedMethods.length})
          </h4>
          
          <div className="space-y-4">
            {generatedMethods.map((method) => (
              <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">{method.name}</h5>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      method.method === 'GET' ? 'bg-green-100 text-green-800' :
                      method.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      method.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      method.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {method.method}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Original URL</label>
                    <div className="text-sm bg-gray-100 p-2 rounded break-all">{method.originalUrl}</div>
                  </div>
                  {method.overrideUrl && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Override URL</label>
                      <div className="text-sm bg-blue-100 p-2 rounded break-all">{method.overrideUrl}</div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestMethod(method)}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
                  >
                    <TestTube className="w-3 h-3" />
                    Test
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(method.openApiSpec, null, 2))}
                    className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy OpenAPI
                  </button>
                  <button
                    onClick={() => handleSaveToNamespace(method)}
                    disabled={savingMethods.has(method.id)}
                    className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${
                      savingMethods.has(method.id)
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {savingMethods.has(method.id) ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        Save to Namespace
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default APIMethodCreationAgent;
