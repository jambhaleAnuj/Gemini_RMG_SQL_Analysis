import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Upload,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Analytics } from "@vercel/analytics/react";

// Components
import FileUpload from "./components/FileUpload";
import DataTable from "./components/DataTable";
import QueryInterface from "./components/QueryInterface";
import DynamicChart from "./components/DynamicChart";
import SchemaExplorer from "./components/SchemaExplorer";
import ResultsPanel from "./components/ResultsPanel";

// Services
import databaseService from "./services/database";
import geminiService from "./services/gemini";
import excelParser from "./utils/excelParser";

function App() {
  // State
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [queryResults, setQueryResults] = useState(null);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentSql, setCurrentSql] = useState("");
  const [explanation, setExplanation] = useState("");
  const [visualization, setVisualization] = useState("table");
  const [visualizationConfig, setVisualizationConfig] = useState({});
  const [error, setError] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("upload"); // upload, explore, query
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({ tables: 0, rows: 0, columns: 0 });

  // Initialize database
  useEffect(() => {
    const initDb = async () => {
      try {
        await databaseService.initialize();
        setIsDbInitialized(true);
      } catch (err) {
        console.error("Failed to initialize database:", err);
        setError("Failed to initialize database. Please refresh the page.");
      }
    };
    initDb();
  }, []);

  // Update stats when tables change
  useEffect(() => {
    const newStats = {
      tables: tables.length,
      rows: tables.reduce((sum, t) => sum + (t.rowCount || 0), 0),
      columns: tables.reduce((sum, t) => sum + (t.columns?.length || 0), 0),
    };
    setStats(newStats);
  }, [tables]);

  // Process uploaded files
  const handleFilesProcessed = useCallback(async (files, updateStatus) => {
    setIsLoading(true);
    setError(null);

    try {
      for (const file of files) {
        updateStatus(file.name, "processing", "Parsing file...");

        try {
          const result = await excelParser.parseFile(file);

          updateStatus(
            file.name,
            "processing",
            `Found ${result.sheets.length} sheets`
          );

          for (const sheet of result.sheets) {
            // Create table name from file + sheet
            const tableName = `${file.name.replace(/\.[^/.]+$/, "")}_${
              sheet.name
            }`;

            updateStatus(file.name, "processing", `Loading "${sheet.name}"...`);

            // Create table in database
            const schemaInfo = databaseService.createTableFromData(
              tableName,
              sheet.data,
              sheet.headers
            );

            if (schemaInfo) {
              console.log(`Created table: ${schemaInfo.tableName}`);
            }
          }

          updateStatus(
            file.name,
            "success",
            `Loaded ${result.sheets.length} sheets`
          );
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
          updateStatus(file.name, "error", err.message);
        }
      }

      // Update tables list
      setTables(databaseService.getAllTablesInfo());

      // Switch to explore tab
      setActiveTab("explore");

      // Generate suggested questions
      refreshSuggestions();
    } catch (err) {
      console.error("Error processing files:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle natural language query
  const handleQuery = useCallback(
    async (question) => {
      if (!isDbInitialized || tables.length === 0) {
        setError("Please upload some data first");
        return;
      }

      setIsQueryLoading(true);
      setError(null);
      setCurrentQuery(question);
      setQueryResults(null);
      setExplanation("");

      try {
        // Get schema context
        const schemaContext = databaseService.getSchemaDescription();
        const sampleData = databaseService.getFullContext();

        // Generate SQL from natural language
        const aiResponse = await geminiService.generateSQL(
          question,
          schemaContext,
          sampleData
        );

        setCurrentSql(aiResponse.sql);
        setVisualization(aiResponse.visualization || "table");
        setVisualizationConfig(aiResponse.visualizationConfig || {});

        // Execute SQL
        const results = databaseService.executeQuery(aiResponse.sql);
        setQueryResults(results);

        // Generate explanation
        const explainText = await geminiService.explainResult(
          question,
          aiResponse.sql,
          results,
          schemaContext
        );
        setExplanation(explainText);

        // Switch to query tab if not already there
        setActiveTab("query");
      } catch (err) {
        console.error("Query error:", err);
        setError(err.message);
      } finally {
        setIsQueryLoading(false);
      }
    },
    [isDbInitialized, tables]
  );

  // View table data
  const handleTableClick = useCallback((tableName) => {
    try {
      const data = databaseService.getTableData(tableName);
      setTableData(data);
      setSelectedTable(tableName);
      setActiveTab("explore");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Refresh suggested questions
  const refreshSuggestions = useCallback(async () => {
    if (tables.length === 0) return;

    try {
      const schemaContext = databaseService.getSchemaDescription();
      const suggestions = await geminiService.suggestQuestions(schemaContext);
      setSuggestedQuestions(suggestions);
    } catch (err) {
      console.error("Error getting suggestions:", err);
    }
  }, [tables]);

  // Clear all data
  const handleClearAll = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This cannot be undone."
      )
    ) {
      databaseService.clearAll();
      setTables([]);
      setTableData(null);
      setQueryResults(null);
      setSelectedTable(null);
      setSuggestedQuestions([]);
      setActiveTab("upload");
    }
  }, []);

  // Change chart type
  const handleChartTypeChange = useCallback((type) => {
    setVisualization(type);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 flex">
      <Analytics />
      {/* Sidebar */}
      <aside
        className={`
          ${sidebarCollapsed ? "w-16" : "w-72"} 
          bg-dark-900/80 border-r border-dark-800 
          flex flex-col transition-all duration-300
          fixed h-full z-30
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-dark-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl">
                <Database className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="font-bold text-dark-100">Excel AI</h1>
                  <p className="text-xs text-dark-500">RMG Analytics</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-dark-700 rounded-lg"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-dark-400" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-dark-400" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {[
            { id: "upload", icon: Upload, label: "Upload Data" },
            { id: "explore", icon: Layers, label: "Explore Data" },
            { id: "query", icon: MessageSquare, label: "Ask Questions" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl
                transition-all duration-200
                ${
                  activeTab === id
                    ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                    : "text-dark-400 hover:text-dark-200 hover:bg-dark-800"
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium">{label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Stats */}
        {!sidebarCollapsed && tables.length > 0 && (
          <div className="mx-4 mt-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700/50">
            <h3 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-3">
              Database Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-dark-400 text-sm">Tables</span>
                <span className="text-dark-200 font-medium">
                  {stats.tables}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400 text-sm">Total Rows</span>
                <span className="text-dark-200 font-medium">
                  {stats.rows.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400 text-sm">Columns</span>
                <span className="text-dark-200 font-medium">
                  {stats.columns}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Schema Explorer */}
        {!sidebarCollapsed && tables.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4">
            <SchemaExplorer tables={tables} onTableClick={handleTableClick} />
          </div>
        )}

        {/* Clear Button */}
        {tables.length > 0 && (
          <div className="p-4 border-t border-dark-800">
            <button
              onClick={handleClearAll}
              className={`
                ${sidebarCollapsed ? "p-2" : "w-full py-2 px-4"}
                text-red-400 hover:bg-red-500/10 rounded-xl
                flex items-center justify-center space-x-2 transition-colors
              `}
            >
              <Trash2 className="w-4 h-4" />
              {!sidebarCollapsed && (
                <span className="text-sm">Clear All Data</span>
              )}
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={`
          flex-1 transition-all duration-300
          ${sidebarCollapsed ? "ml-16" : "ml-72"}
        `}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-dark-100">
                  {activeTab === "upload" && "Upload Data"}
                  {activeTab === "explore" && "Explore Data"}
                  {activeTab === "query" && "Ask Questions"}
                </h1>
                <p className="text-dark-400 mt-1">
                  {activeTab === "upload" &&
                    "Upload Excel files to analyze your resource data"}
                  {activeTab === "explore" &&
                    "Browse and filter your data tables"}
                  {activeTab === "query" && "Ask questions in natural language"}
                </p>
              </div>

              {tables.length > 0 && activeTab !== "upload" && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-dark-400">
                    {stats.rows.toLocaleString()} total records
                  </span>
                </div>
              )}
            </div>

            {/* Query Interface - Always visible when we have data */}
            {tables.length > 0 && (
              <div className="mt-4">
                <QueryInterface
                  onQueryExecute={handleQuery}
                  isLoading={isQueryLoading}
                  schemaContext={databaseService.getSchemaDescription()}
                  sampleData={databaseService.getFullContext()}
                  suggestedQuestions={suggestedQuestions}
                  onRefreshSuggestions={refreshSuggestions}
                />
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-red-300/80 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto p-1 hover:bg-red-500/20 rounded"
              >
                <span className="sr-only">Dismiss</span>×
              </button>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="max-w-3xl mx-auto">
              <div className="glass-card p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex p-4 bg-primary-500/10 rounded-2xl mb-4">
                    <FileSpreadsheet className="w-12 h-12 text-primary-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-dark-100">
                    Import Your Excel Data
                  </h2>
                  <p className="text-dark-400 mt-2 max-w-md mx-auto">
                    Upload one or more Excel files. All sheets will be
                    automatically loaded into the in-memory database for fast
                    querying.
                  </p>
                </div>

                <FileUpload
                  onFilesProcessed={handleFilesProcessed}
                  isLoading={isLoading}
                />

                {/* Features */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: Database,
                      title: "In-Memory DB",
                      desc: "Fast SQLite queries",
                    },
                    {
                      icon: Sparkles,
                      title: "AI Powered",
                      desc: "Natural language search",
                    },
                    {
                      icon: BarChart3,
                      title: "Visualize",
                      desc: "Dynamic charts",
                    },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="text-center p-4">
                      <div className="inline-flex p-2 bg-dark-800 rounded-xl mb-2">
                        <Icon className="w-5 h-5 text-primary-400" />
                      </div>
                      <h3 className="font-medium text-dark-200">{title}</h3>
                      <p className="text-sm text-dark-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Explore Tab */}
          {activeTab === "explore" && (
            <div>
              {tables.length === 0 ? (
                <div className="text-center py-16">
                  <Database className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-dark-300">
                    No Data Loaded
                  </h3>
                  <p className="text-dark-500 mt-2">
                    Upload Excel files to start exploring your data
                  </p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="btn-primary mt-4"
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Files
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Table Selector */}
                  <div className="flex items-center space-x-3 flex-wrap gap-2">
                    <span className="text-dark-400">Select table:</span>
                    {tables.map((table) => (
                      <button
                        key={table.name}
                        onClick={() => handleTableClick(table.name)}
                        className={`
                          px-4 py-2 rounded-xl text-sm font-medium transition-all
                          ${
                            selectedTable === table.name
                              ? "bg-primary-500 text-white"
                              : "bg-dark-800 text-dark-300 hover:bg-dark-700"
                          }
                        `}
                      >
                        {table.name}
                        <span className="ml-2 text-xs opacity-70">
                          ({table.rowCount?.toLocaleString()})
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Data Table */}
                  {tableData && (
                    <div className="glass-card p-4">
                      <DataTable data={tableData} title={selectedTable} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Query Tab */}
          {activeTab === "query" && (
            <div className="space-y-6">
              {tables.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-dark-300">
                    No Data to Query
                  </h3>
                  <p className="text-dark-500 mt-2">
                    Upload Excel files first to start asking questions
                  </p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="btn-primary mt-4"
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Files
                  </button>
                </div>
              ) : (
                <>
                  {/* Results Panel */}
                  <ResultsPanel
                    results={queryResults}
                    query={currentQuery}
                    sql={currentSql}
                    explanation={explanation}
                    visualization={visualization}
                    visualizationConfig={visualizationConfig}
                    isLoading={isQueryLoading}
                    error={null}
                  />

                  {/* Chart or Table */}
                  {queryResults && queryResults.rowCount > 0 && (
                    <div className="glass-card p-4">
                      {visualization !== "table" ? (
                        <DynamicChart
                          data={queryResults}
                          chartType={visualization}
                          config={visualizationConfig}
                          onChartTypeChange={handleChartTypeChange}
                        />
                      ) : (
                        <DataTable data={queryResults} title="Query Results" />
                      )}

                      {/* Toggle between table and chart */}
                      {visualization !== "table" && (
                        <div className="mt-4 pt-4 border-t border-dark-700">
                          <button
                            onClick={() => setVisualization("table")}
                            className="btn-secondary text-sm"
                          >
                            Show as Table
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
