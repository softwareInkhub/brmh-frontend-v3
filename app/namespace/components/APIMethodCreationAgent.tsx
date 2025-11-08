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
      <div className="bg-indigo-600 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-white rounded-lg shadow-md">
            <Zap className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="font-bold text-xl text-white tracking-tight">API Method Creation Agent</h3>
        </div>
        <p className="text-sm text-white/95 leading-relaxed">
          Transform API Gateway URLs into reusable methods with OpenAPI specifications. 
          Create methods that can be overridden with different URLs and saved to your namespace.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 shadow-md animate-fade-in">
          <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
            <span className="text-lg">✅</span>
            {successMessage}
          </p>
        </div>
      )}

      {/* Quick Select from Deployed Endpoints */}
      {deployedEndpoints.length > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all">
          <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-green-600 rounded-lg shadow-sm">
              <Globe className="w-5 h-5 text-white" />
            </div>
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
                className={`p-4 text-left border-2 rounded-xl transition-all shadow-sm hover:shadow-md ${
                  selectedEndpoint === endpoint.apiGatewayUrl
                    ? 'border-green-600 bg-green-100 shadow-md'
                    : 'border-green-200 bg-white hover:bg-green-50'
                }`}
              >
                <div className="font-bold text-green-900 mb-1">{endpoint.functionName}</div>
                <div className="text-xs text-green-700 break-all font-mono bg-white/70 px-2 py-1 rounded">{endpoint.apiGatewayUrl}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Method Creation Form */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all">
        <h4 className="font-bold text-lg mb-5 flex items-center gap-2 text-gray-900">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Plus className="w-5 h-5 text-blue-600" />
          </div>
          Create New Method
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API Gateway URL *
            </label>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:border-indigo-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Method Name *
            </label>
            <input
              type="text"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              placeholder="getUserData"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:border-indigo-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              HTTP Method
            </label>
            <select
              value={methodType}
              onChange={(e) => setMethodType(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:border-indigo-300 bg-white"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Override URL (Optional)
            </label>
            <input
              type="url"
              value={overrideUrl}
              onChange={(e) => setOverrideUrl(e.target.value)}
              placeholder="https://custom-api.example.com/endpoint"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:border-indigo-300"
            />
            <p className="text-xs text-gray-500 mt-2 italic">
              💡 Use a different URL for this method (overrides the original)
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this API method does..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:border-indigo-300"
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

        <div className="mt-6">
          <button
            onClick={handleGenerateMethod}
            disabled={isGenerating || !inputUrl || !methodName}
            className={`w-full px-6 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg ${
              isGenerating || !inputUrl || !methodName
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Method...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate Method
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Methods */}
      {generatedMethods.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all">
          <h4 className="font-bold text-lg mb-5 flex items-center gap-2 text-gray-900">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            Generated Methods ({generatedMethods.length})
          </h4>
          
          <div className="space-y-4">
            {generatedMethods.map((method) => (
              <div key={method.id} className="border-2 border-gray-200 rounded-xl p-5 bg-white hover:shadow-lg transition-all animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h5 className="font-bold text-lg text-gray-900 mb-1">{method.name}</h5>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${
                      method.method === 'GET' ? 'bg-green-600 text-white' :
                      method.method === 'POST' ? 'bg-indigo-600 text-white' :
                      method.method === 'PUT' ? 'bg-yellow-600 text-white' :
                      method.method === 'DELETE' ? 'bg-red-600 text-white' :
                      'bg-gray-600 text-white'
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

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleTestMethod(method)}
                    className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <TestTube className="w-4 h-4" />
                    Test
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(method.openApiSpec, null, 2))}
                    className="px-4 py-2 text-sm font-semibold bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    Copy OpenAPI
                  </button>
                  <button
                    onClick={() => handleSaveToNamespace(method)}
                    disabled={savingMethods.has(method.id)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all ${
                      savingMethods.has(method.id)
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {savingMethods.has(method.id) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
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
