import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  MessageSquare,
  Code,
  Lightbulb,
  RefreshCw,
  Key,
  X,
  CheckCircle,
} from "lucide-react";
import geminiService from "../services/gemini";

const QueryInterface = ({
  onQueryExecute,
  isLoading,
  schemaContext,
  sampleData,
  suggestedQuestions = [],
  onRefreshSuggestions,
}) => {
  const [query, setQuery] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [history, setHistory] = useState([]);
  const inputRef = useRef();

  useEffect(() => {
    const savedKey = geminiService.getApiKey();
    setHasApiKey(!!savedKey);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    if (!hasApiKey) {
      setShowApiKeyModal(true);
      return;
    }

    const trimmedQuery = query.trim();
    setHistory((prev) => [...prev.slice(-9), trimmedQuery]);

    await onQueryExecute(trimmedQuery);
    setQuery("");
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      geminiService.setApiKey(apiKey.trim());
      setHasApiKey(true);
      setShowApiKeyModal(false);
      setApiKey("");
    }
  };

  const clearApiKey = () => {
    geminiService.clearApiKey();
    setHasApiKey(false);
  };

  return (
    <div className="space-y-4">
      {/* Query Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <MessageSquare className="w-5 h-5 text-dark-400" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your data in natural language..."
            className="w-full pl-12 pr-32 py-4 bg-dark-800/80 border border-dark-600 rounded-2xl 
                     text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 
                     focus:ring-primary-500/50 focus:border-primary-500 text-lg
                     transition-all duration-300"
            disabled={isLoading}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            {/* API Key Status */}
            <button
              type="button"
              onClick={() => setShowApiKeyModal(true)}
              className={`p-2 rounded-lg transition-colors ${
                hasApiKey
                  ? "text-green-400 hover:bg-green-500/10"
                  : "text-yellow-400 hover:bg-yellow-500/10"
              }`}
              title={hasApiKey ? "API Key configured" : "Configure API Key"}
            >
              <Key className="w-5 h-5" />
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="btn-primary flex items-center space-x-2 py-2 px-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Questions */}
      {suggestedQuestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-dark-400">
              <Lightbulb className="w-4 h-4" />
              <span>Suggested questions</span>
            </div>
            <button
              onClick={onRefreshSuggestions}
              className="text-dark-400 hover:text-primary-400 transition-colors p-1"
              title="Get new suggestions"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(q)}
                className="px-3 py-1.5 bg-dark-800/50 hover:bg-dark-700 border border-dark-600 
                         hover:border-primary-500/50 rounded-full text-sm text-dark-300 
                         hover:text-dark-100 transition-all duration-200"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Queries */}
      {history.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-dark-400">
            <Code className="w-4 h-4" />
            <span>Recent queries</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {history
              .slice()
              .reverse()
              .slice(0, 5)
              .map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(q)}
                  className="px-3 py-1.5 bg-dark-900/50 hover:bg-dark-800 border border-dark-700 
                         rounded-lg text-sm text-dark-400 hover:text-dark-200 
                         transition-all duration-200 truncate max-w-xs"
                >
                  {q}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark-100">
                Gemini API Key
              </h3>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="p-1 hover:bg-dark-700 rounded-lg"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>

            {hasApiKey ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>API Key is configured</span>
                </div>
                <p className="text-sm text-dark-400">
                  Your API key is securely stored in your browser's local
                  storage.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={clearApiKey}
                    className="flex-1 btn-secondary text-red-400 hover:text-red-300"
                  >
                    Remove Key
                  </button>
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="flex-1 btn-primary"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-dark-300">
                  Enter your Google Gemini API key to enable AI-powered natural
                  language queries. You can get a free API key from{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 underline"
                  >
                    Google AI Studio
                  </a>
                </p>

                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key..."
                  className="input-field"
                  autoFocus
                />

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveApiKey}
                    disabled={!apiKey.trim()}
                    className="flex-1 btn-primary"
                  >
                    Save Key
                  </button>
                </div>

                <p className="text-xs text-dark-500 text-center">
                  Your API key is stored locally and never sent to any server
                  except Google's API.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryInterface;
