import React, { useMemo, useState, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  Download,
  Filter,
  Search,
  X,
  Columns,
  ArrowUpDown,
} from "lucide-react";
import excelParser from "../utils/excelParser";

const DataTable = ({ data, title, showExport = true }) => {
  const gridRef = useRef();
  const [quickFilterText, setQuickFilterText] = useState("");
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(null);

  // Generate column definitions from data
  const columnDefs = useMemo(() => {
    if (!data || !data.columns || data.columns.length === 0) return [];

    return data.columns.map((col, idx) => ({
      field: col,
      headerName: col,
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 100,
      flex: 1,
      hide: visibleColumns ? !visibleColumns.includes(col) : false,
      cellStyle: (params) => {
        // Style based on data type
        const value = params.value;
        if (typeof value === "number") {
          return { textAlign: "right" };
        }
        return null;
      },
      valueFormatter: (params) => {
        const value = params.value;
        if (value === null || value === undefined) return "";
        if (typeof value === "number") {
          // Format numbers with commas
          return value.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          });
        }
        return value;
      },
    }));
  }, [data, visibleColumns]);

  // Convert data to row format
  const rowData = useMemo(() => {
    if (!data || !data.values) return [];

    return data.values.map((row, rowIdx) => {
      const rowObj = { _id: rowIdx };
      data.columns.forEach((col, colIdx) => {
        rowObj[col] = row[colIdx];
      });
      return rowObj;
    });
  }, [data]);

  // Default column config
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: true,
    }),
    []
  );

  // Export to Excel
  const handleExport = useCallback(() => {
    if (!data) return;
    excelParser.exportQueryResults(data, `${title || "export"}.xlsx`);
  }, [data, title]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.api.setFilterModel(null);
      setQuickFilterText("");
    }
  }, []);

  // Toggle column visibility
  const toggleColumn = (colName) => {
    if (!visibleColumns) {
      // Initialize with all columns except the clicked one
      setVisibleColumns(data.columns.filter((c) => c !== colName));
    } else if (visibleColumns.includes(colName)) {
      setVisibleColumns(visibleColumns.filter((c) => c !== colName));
    } else {
      setVisibleColumns([...visibleColumns, colName]);
    }
  };

  // Show all columns
  const showAllColumns = () => {
    setVisibleColumns(null);
  };

  if (!data || !data.columns || data.columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400">
        No data to display
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Quick Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Quick search in all columns..."
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 
                     placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 
                     focus:border-primary-500 text-sm"
          />
          {quickFilterText && (
            <button
              onClick={() => setQuickFilterText("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-dark-400 hover:text-dark-200" />
            </button>
          )}
        </div>

        {/* Row count */}
        <div className="text-sm text-dark-400">
          {data.rowCount.toLocaleString()} rows
        </div>

        {/* Column Selector */}
        <div className="relative">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="btn-secondary flex items-center space-x-2 text-sm py-2"
          >
            <Columns className="w-4 h-4" />
            <span>Columns</span>
          </button>

          {showColumnSelector && (
            <div
              className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-dark-800 border border-dark-600 
                          rounded-xl shadow-xl z-50 p-2"
            >
              <div className="flex justify-between items-center p-2 border-b border-dark-700 mb-2">
                <span className="text-sm font-medium text-dark-200">
                  Toggle Columns
                </span>
                <button
                  onClick={showAllColumns}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Show all
                </button>
              </div>
              {data.columns.map((col) => (
                <label
                  key={col}
                  className="flex items-center space-x-2 p-2 hover:bg-dark-700/50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!visibleColumns || visibleColumns.includes(col)}
                    onChange={() => toggleColumn(col)}
                    className="rounded border-dark-500 bg-dark-700 text-primary-500 
                             focus:ring-primary-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-dark-200 truncate">{col}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Clear Filters */}
        <button
          onClick={clearFilters}
          className="btn-secondary flex items-center space-x-2 text-sm py-2"
        >
          <Filter className="w-4 h-4" />
          <span>Clear Filters</span>
        </button>

        {/* Export */}
        {showExport && (
          <button
            onClick={handleExport}
            className="btn-primary flex items-center space-x-2 text-sm py-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        )}
      </div>

      {/* AG Grid */}
      <div className="ag-theme-custom w-full h-[500px] rounded-xl overflow-hidden border border-dark-700">
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          animateRows={true}
          pagination={true}
          paginationPageSize={100}
          paginationPageSizeSelector={[50, 100, 250, 500]}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          enableCellTextSelection={true}
          ensureDomOrder={true}
        />
      </div>

      {/* Click outside to close column selector */}
      {showColumnSelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowColumnSelector(false)}
        />
      )}
    </div>
  );
};

export default DataTable;
