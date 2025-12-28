import React, { useState } from "react";
import {
  Database,
  Table,
  ChevronDown,
  ChevronRight,
  Hash,
  Type,
  Calendar,
  Info,
  BarChart2,
} from "lucide-react";

const SchemaExplorer = ({ tables, onTableClick, onColumnStats }) => {
  const [expandedTables, setExpandedTables] = useState({});

  const toggleTable = (tableName) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case "INTEGER":
      case "REAL":
        return <Hash className="w-3.5 h-3.5 text-blue-400" />;
      case "TEXT":
        return <Type className="w-3.5 h-3.5 text-green-400" />;
      case "DATE":
        return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Type className="w-3.5 h-3.5 text-dark-400" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toUpperCase()) {
      case "INTEGER":
        return "text-blue-400";
      case "REAL":
        return "text-cyan-400";
      case "TEXT":
        return "text-green-400";
      default:
        return "text-dark-400";
    }
  };

  if (!tables || tables.length === 0) {
    return (
      <div className="text-center py-8 text-dark-400">
        <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No tables loaded</p>
        <p className="text-sm mt-1">Upload Excel files to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-sm font-medium text-dark-300 mb-3">
        <Database className="w-4 h-4" />
        <span>Database Schema</span>
        <span className="text-dark-500">({tables.length} tables)</span>
      </div>

      {tables.map((table) => (
        <div
          key={table.name}
          className="bg-dark-800/30 rounded-xl border border-dark-700/50 overflow-hidden"
        >
          {/* Table Header */}
          <button
            onClick={() => toggleTable(table.name)}
            className="w-full flex items-center justify-between p-3 hover:bg-dark-700/30 transition-colors"
          >
            <div className="flex items-center space-x-2">
              {expandedTables[table.name] ? (
                <ChevronDown className="w-4 h-4 text-dark-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-dark-400" />
              )}
              <Table className="w-4 h-4 text-primary-400" />
              <span className="font-medium text-dark-200">{table.name}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-dark-400">
              <span>{table.rowCount?.toLocaleString()} rows</span>
              <span>•</span>
              <span>{table.columns?.length} cols</span>
            </div>
          </button>

          {/* Columns List */}
          {expandedTables[table.name] && (
            <div className="border-t border-dark-700/50">
              {/* Original name if different */}
              {table.originalTableName &&
                table.originalTableName !== table.name && (
                  <div className="px-4 py-2 text-xs text-dark-500 bg-dark-900/30 flex items-center space-x-1">
                    <Info className="w-3 h-3" />
                    <span>Original: "{table.originalTableName}"</span>
                  </div>
                )}

              <div className="divide-y divide-dark-700/30">
                {table.columns?.map((col, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-2 hover:bg-dark-700/20 group"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {getTypeIcon(col.type)}
                      <span className="text-sm text-dark-300 truncate">
                        {col.sanitized}
                      </span>
                      {col.original !== col.sanitized && (
                        <span className="text-xs text-dark-500 truncate hidden group-hover:inline">
                          ({col.original})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${getTypeColor(col.type)}`}>
                        {col.type}
                      </span>
                      {onColumnStats && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onColumnStats(table.name, col.sanitized);
                          }}
                          className="p-1 rounded hover:bg-dark-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="View column statistics"
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-dark-400 hover:text-primary-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="p-2 bg-dark-900/30 border-t border-dark-700/50">
                <button
                  onClick={() => onTableClick?.(table.name)}
                  className="w-full text-xs text-primary-400 hover:text-primary-300 py-1.5 
                           hover:bg-primary-500/10 rounded-lg transition-colors"
                >
                  View all data from this table
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SchemaExplorer;
