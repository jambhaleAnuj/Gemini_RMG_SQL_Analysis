import React from "react";
import {
  X,
  Code,
  Lightbulb,
  BarChart2,
  Table,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { useState } from "react";
import excelParser from "../utils/excelParser";

const ResultsPanel = ({
  results,
  query,
  sql,
  explanation,
  visualization,
  visualizationConfig,
  isLoading,
  error,
}) => {
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleExport = () => {
    if (results) {
      excelParser.exportQueryResults(results, "query_results.xlsx");
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
          <span className="text-dark-300">Analyzing your question...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border-red-500/30">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <X className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h4 className="font-medium text-red-400">Error</h4>
            <p className="text-sm text-dark-300 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Query Info */}
      <div className="glass-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Original Question */}
            <div className="flex items-center space-x-2 text-sm text-dark-400 mb-2">
              <Lightbulb className="w-4 h-4" />
              <span>Your question</span>
            </div>
            <p className="text-dark-200 font-medium">{query}</p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Toggle SQL */}
            <button
              onClick={() => setShowSql(!showSql)}
              className={`btn-secondary text-sm py-1.5 flex items-center space-x-1 
                        ${showSql ? "bg-dark-600" : ""}`}
            >
              <Code className="w-4 h-4" />
              <span>SQL</span>
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              className="btn-secondary text-sm py-1.5 flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* SQL Query (toggleable) */}
        {showSql && sql && (
          <div className="mt-4 relative">
            <div className="bg-dark-900 rounded-xl p-4 font-mono text-sm text-green-400 overflow-x-auto">
              <pre className="whitespace-pre-wrap">{sql}</pre>
            </div>
            <button
              onClick={() => copyToClipboard(sql)}
              className="absolute top-2 right-2 p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-dark-400" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="glass-card p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary-500/10 rounded-lg mt-0.5">
              <BarChart2 className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h4 className="font-medium text-dark-200 mb-1">Analysis</h4>
              <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">
                {explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-dark-400 px-1">
        <div className="flex items-center space-x-2">
          <Table className="w-4 h-4" />
          <span>
            {results.rowCount.toLocaleString()} results •{" "}
            {results.columns.length} columns
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-dark-500">Recommended:</span>
          <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full text-xs capitalize">
            {visualization || "table"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
