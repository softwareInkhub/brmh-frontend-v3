"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Plus, Search, Database, Loader2, ChevronRight, Copy, Download, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Add new interface for table details
interface TableDetails {
  TableName: string;
  TableStatus: string;
  KeySchema: Array<{
    AttributeName: string;
    KeyType: string;
  }>;
  GlobalSecondaryIndexes?: Array<any>;
  LocalSecondaryIndexes?: Array<any>;
  ReplicaDescriptions?: Array<any>;
  DeletionProtectionEnabled?: boolean;
  BillingModeSummary?: {
    BillingMode: string;
  };
}

export default function DynamoDBPage() {
  const [tables, setTables] = useState<TableDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [creatingTable, setCreatingTable] = useState(false);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [tableDetails, setTableDetails] = useState<Record<string, TableDetails>>({});

  const router = useRouter();

  // Fetch tables on component mount
  useEffect(() => {
    console.log("Fetching tables...");
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      if (isInitialLoad) {
        setLoadingProgress(0);
      }

      const awsUrl = process.env.NEXT_PUBLIC_AWS_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      
      if (!awsUrl) {
        throw new Error("AWS URL is not configured");
      }

      const response = await fetch(`${awsUrl}/api/dynamodb/tables`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Failed to fetch tables`);
      }

      const data = await response.json();
      console.log("Tables response:", data);
      
      if (!Array.isArray(data.tables)) {
        console.error("Invalid tables data:", data);
        toast.error("Received invalid data format from server");
        return;
      }

      setTables(data.tables);
      // Fetch details for all tables immediately
      data.tables.forEach((table: TableDetails) => fetchTableDetails(table.TableName));
      setIsInitialLoad(false);
    } catch (error) {
      console.error("Error fetching tables:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to fetch DynamoDB tables: ${errorMessage}`);
    } finally {
      setLoading(false);
      setLoadingProgress(100);
    }
  };

  // Safe filtering of tables
  const filteredTables = tables?.filter((table) => {
    if (!table?.TableName || !searchTerm) return true;
    return table.TableName.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  // Debug logs for data flow
  useEffect(() => {
    console.log("Current tables state:", tables);
    console.log("Filtered tables:", filteredTables);
  }, [tables, filteredTables]);

  const handleCreateTable = async () => {
    if (!newTableName.trim()) {
      toast.error("Please enter a table name");
      return;
    }

    try {
      setCreatingTable(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_AWS_URL}/api/dynamodb/tables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tableName: newTableName }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create table");
      }

      toast.success("Table created successfully");
      setShowCreateDialog(false);
      setNewTableName("");
      fetchTables();
    } catch (error) {
      console.error("Error creating table:", error);
      toast.error("Failed to create table. Check console for details.");
    } finally {
      setCreatingTable(false);
    }
  };

  const handleDeleteTable = async (tableName: string) => {
    if (!confirm(`Are you sure you want to delete table "${tableName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AWS_URL}/api/dynamodb/tables?tableName=${encodeURIComponent(tableName)}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete table");
      }

      toast.success("Table deleted successfully");
      fetchTables();
    } catch (error) {
      console.error("Error deleting table:", error);
      toast.error("Failed to delete table. Check console for details.");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTables(new Set(filteredTables.map(t => t.TableName)));
    } else {
      setSelectedTables(new Set());
    }
  };

  const handleSelectTable = (tableName: string, checked: boolean) => {
    const newSelected = new Set(selectedTables);
    if (checked) {
      newSelected.add(tableName);
    } else {
      newSelected.delete(tableName);
    }
    setSelectedTables(newSelected);
  };

  const handleCopySelected = async () => {
    const selectedTablesList = Array.from(selectedTables);
    await navigator.clipboard.writeText(selectedTablesList.join('\n'));
    toast.success(`Copied ${selectedTables.size} table names to clipboard`);
  };

  const handleDownloadSelected = () => {
    const selectedTablesList = Array.from(selectedTables);
    const content = selectedTablesList.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected-tables.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${selectedTables.size} table names`);
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTables.size} tables?`)) {
      return;
    }

    const selectedTablesList = Array.from(selectedTables);
    let successCount = 0;
    let failCount = 0;

    for (const tableName of selectedTablesList) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_AWS_URL}/api/dynamodb/tables?tableName=${encodeURIComponent(tableName)}`, {
          method: "DELETE",
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Error deleting table ${tableName}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} tables`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} tables`);
    }

    setSelectedTables(new Set());
    fetchTables();
  };

  const fetchTableDetails = async (tableName: string) => {
    if (tableDetails[tableName]) return; // Skip if already loaded

    try {
      const awsUrl = process.env.NEXT_PUBLIC_AWS_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      
      if (!awsUrl) {
        throw new Error("AWS URL is not configured");
      }

      const response = await fetch(`${awsUrl}/api/dynamodb/tables`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tableName }),
      });
      
      if (!response.ok) {
        // Handle 404 specifically
        if (response.status === 404) {
          console.warn(`Table details not found for ${tableName} (404)`);
          // Don't show error toast for 404, just log it
          return;
        }
        
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText || `HTTP ${response.status}` };
        }
        
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Failed to fetch table details`);
      }

      const details = await response.json();
      setTableDetails(prev => ({
        ...prev,
        [tableName]: details
      }));
    } catch (error) {
      // Only show toast for non-404 errors
      if (error instanceof Error && !error.message.includes('404')) {
        console.error("Error fetching table details:", error);
        const errorMessage = error.message;
        // Only show toast for significant errors, not for missing endpoints
        if (!errorMessage.includes('Not Found') && !errorMessage.includes('404')) {
          toast.error(`Failed to load details for ${tableName}: ${errorMessage}`);
        }
      } else {
        console.warn(`Table details endpoint not available for ${tableName}`);
      }
    }
  };

  const handleRowClick = async (tableName: string) => {
    router.push(`/aws/dynamodb/${encodeURIComponent(tableName)}`);
  };

  // Loading skeleton component
  const TableSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="ml-4 w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="ml-auto flex space-x-16">
          <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 h-[89vh] overflow-hidden">
      <div className="h-full flex flex-col md:p-0 sm:p-0">
        {/* Header Section */}
        <div className="flex flex-col gap-2 bg-gradient-to-r from-blue-500 to-blue-600 p-3 md:p-4   rounded-lg md:rounded-xl shadow-lg md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-white/10 backdrop-blur-sm">
              <Database className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
        <div>
              <h2 className="text-base md:text-lg font-semibold text-white">DynamoDB Tables</h2>
              <div className="flex items-center gap-1.5">
                <p className="text-xs md:text-sm text-blue-100">Tables</p>
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs">
                  {tables.length}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {selectedTables.size > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs md:text-sm text-white">{selectedTables.size} selected</span>
                <div className="flex gap-1">
                  <Button
                    onClick={handleCopySelected}
                    className="bg-white/10 text-white hover:bg-white/20 transition-all duration-300 h-7 w-7 p-0 md:h-9 md:w-auto md:px-3"
                  >
                    <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden md:inline ml-1.5 text-sm">Copy</span>
                  </Button>
                  <Button
                    onClick={handleDownloadSelected}
                    className="bg-white/10 text-white hover:bg-white/20 transition-all duration-300 h-7 w-7 p-0 md:h-9 md:w-auto md:px-3"
                  >
                    <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden md:inline ml-1.5 text-sm">Download</span>
                  </Button>
                  <Button
                    onClick={handleDeleteSelected}
                    className="bg-red-500/80 text-white hover:bg-red-500 transition-all duration-300 h-7 w-7 p-0 md:h-9 md:w-auto md:px-3"
                  >
                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden md:inline ml-1.5 text-sm">Delete</span>
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1 md:gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search tables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 md:pl-9 h-7 md:h-9 text-xs md:text-sm border-transparent bg-white/10 text-white placeholder:text-white/60 rounded-md md:rounded-lg focus:border-white/30 focus:ring-0 transition-all duration-300 w-full min-w-0"
                />
              </div>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-white text-blue-600 hover:bg-blue-50 transition-all duration-300 h-7 w-7 p-0 md:h-9 md:w-auto md:px-3"
              >
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden md:inline ml-1.5 text-sm">Create Table</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tables List */}
        <div className="flex-1   overflow-hidden flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 mt-2 md:mt-4">
          {/* Table Header - Responsive for both Mobile and Desktop */}
          <div className="flex items-center px-3 py-2 md:px-4 md:py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs md:text-sm">
            <div className="w-4 md:w-6 flex items-center justify-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 h-3.5 w-3.5 md:h-4 md:w-4"
                checked={selectedTables.size === filteredTables.length && filteredTables.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </div>
            <div className="flex-1 min-w-0 pl-4 ">
              <div className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Name</div>
            </div>
            <div className="w-[100px] md:w-[120px] flex justify-center">
              <div className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Status</div>
            </div>
            {/* Desktop-only columns */}
            <div className="hidden lg:flex w-[120px] justify-center">
              <div className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Partition key</div>
            </div>
            <div className="hidden lg:flex w-[100px] justify-center">
              <div className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Sort key</div>
            </div>
            <div className="hidden lg:flex w-[100px] justify-center">
              <div className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Indexes</div>
            </div>
            <div className="hidden xl:flex w-[150px] justify-center">
              <div className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Replication Regions</div>
            </div>
            <div className="hidden lg:flex w-[150px] justify-center">
              <div className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Deletion protection</div>
            </div>
            <div className="hidden md:flex w-[120px] justify-center">
              <div className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Read/Write</div>
            </div>
            <div className="w-6 md:w-8"></div>
          </div>

          {/* Scrollable Table Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div>
                {[...Array(5)].map((_, i) => (
                  <TableSkeleton key={i} />
                ))}
                {isInitialLoad && (
                  <div className="px-3 py-2 md:px-4 md:py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-blue-600 dark:text-blue-400">Loading tables...</span>
                      <div className="w-20 md:w-48 h-1.5 md:h-2 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                          style={{ width: `${loadingProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : filteredTables.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredTables.map((table) => {
                  const details = tableDetails[table.TableName];
                  const isExpanded = expandedTable === table.TableName;

                  return (
                    <div 
                      key={table.TableName} 
                      className="px-3 py-2 md:px-4 md:py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(table.TableName)}
                    >
                      <div className="flex items-center min-w-0">
                        <div className="w-4 md:w-6 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 h-3.5 w-3.5 md:h-4 md:w-4"
                            checked={selectedTables.has(table.TableName)}
                            onChange={(e) => handleSelectTable(table.TableName, e.target.checked)}
                          />
                        </div>
                        <div className="flex-1 min-w-0 pl-4">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                              {table.TableName}
                            </span>
                          </div>
                          <div className="mt-0.5 md:mt-1 flex items-center gap-1.5 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                            <span>{!details ? '...' : details.KeySchema?.find(k => k.KeyType === 'HASH')?.AttributeName || '-'}</span>
                            <span>•</span>
                            <span>{!details ? '...' : details.BillingModeSummary?.BillingMode === 'PAY_PER_REQUEST' ? 'On-demand' : 'Provisioned'}</span>
                          </div>
                        </div>
                        <div className="w-[100px] md:w-[120px] flex justify-center">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${
                            (details?.TableStatus || table.TableStatus) === 'ACTIVE' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {(details?.TableStatus || table.TableStatus) === 'ACTIVE' ? 'Active' : details?.TableStatus || table.TableStatus}
                          </span>
                        </div>
                        <div className="hidden lg:flex w-[120px] justify-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {!details ? '...' : details.KeySchema?.find(k => k.KeyType === 'HASH')?.AttributeName || '-'}
                          </span>
                        </div>
                        <div className="hidden lg:flex w-[100px] justify-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {!details ? '...' : details.KeySchema?.find(k => k.KeyType === 'RANGE')?.AttributeName || '-'}
                          </span>
                        </div>
                        <div className="hidden lg:flex w-[100px] justify-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {!details ? '...' : 
                              ((details.GlobalSecondaryIndexes?.length || 0) + 
                               (details.LocalSecondaryIndexes?.length || 0))}
                          </span>
                        </div>
                        <div className="hidden xl:flex w-[150px] justify-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {!details ? '...' : details.ReplicaDescriptions?.length || 0}
                          </span>
                        </div>
                        <div className="hidden lg:flex w-[150px] justify-center">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <span className={`h-2 w-2 rounded-full ${
                              !details ? 'bg-gray-300 dark:bg-gray-600' :
                              details.DeletionProtectionEnabled ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}></span>
                            {!details ? '...' : details.DeletionProtectionEnabled ? 'On' : 'Off'}
                          </span>
                        </div>
                        <div className="hidden md:flex w-[120px] justify-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {!details ? '...' : 
                              details.BillingModeSummary?.BillingMode === 'PAY_PER_REQUEST' 
                                ? 'On-demand' 
                                : 'Provisioned'}
                          </span>
                        </div>
                        <div className="w-6 md:w-8 flex items-center justify-center">
                          <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-6 md:py-8">
                <div className="p-2 md:p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-2 md:mb-3">
                  <Database className="w-5 h-5 md:w-6 md:h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No tables match your search' : 'No tables found'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Table Dialog - Mobile Responsive */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[calc(100%-32px)] md:w-[90vw] max-w-[425px] rounded-lg mx-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-base md:text-xl font-semibold text-gray-900 dark:text-white">Create New Table</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:gap-4 py-3 md:py-4">
            <div className="space-y-1.5 md:space-y-2">
              <label htmlFor="tableName" className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                Table Name
              </label>
              <Input
                id="tableName"
                placeholder="Enter table name"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="w-full sm:w-auto border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTable}
              disabled={creatingTable}
              className="w-full sm:w-auto bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              {creatingTable ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Table'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 