"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Play, RefreshCw, Database } from "lucide-react";

// Types for Electron API
interface ElectronAPI {
  dbQuery: (sql: string, params?: any[]) => Promise<any>;
}

const DatabaseViewer = () => {
  const [query, setQuery] = useState(
    "SELECT name FROM sqlite_master WHERE type='table';",
  );
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);

  const executeQuery = async (sql: string) => {
    setLoading(true);
    setError(null);
    try {
      const api = (window as any).electronAPI as ElectronAPI;
      if (!api) throw new Error("Electron API not available");

      const res = await api.dbQuery(sql);
      setResults(Array.isArray(res) ? res : [res]);
    } catch (err: any) {
      setError(err.message || "Query failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const api = (window as any).electronAPI as ElectronAPI;
      if (!api) return;
      const res = await api.dbQuery(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
      );
      if (Array.isArray(res)) {
        setTables(res.map((row: any) => row.name));
      }
    } catch (err) {
      console.error("Failed to fetch tables", err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleTableClick = (tableName: string) => {
    const sql = `SELECT * FROM ${tableName} LIMIT 100;`;
    setQuery(sql);
    executeQuery(sql);
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-green-600" />
          Database Inspector
        </h1>
        <button
          onClick={fetchTables}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="Refresh Tables"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Sidebar: Table List */}
        <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <div className="p-3 border-b bg-gray-50 font-medium text-gray-700">
            Tables ({tables.length})
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => handleTableClick(table)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded transition-colors truncate"
              >
                {table}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Query & Results */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Query Editor */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex gap-2 mb-2">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-24 p-3 font-mono text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                placeholder="Enter SQL query..."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => executeQuery(query)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Execute
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            {error ? (
              <div className="p-4 text-red-600 bg-red-50 border-b border-red-100">
                Error: {error}
              </div>
            ) : results.length > 0 ? (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      {Object.keys(results[0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 border-b whitespace-nowrap"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, idx) => (
                      <tr
                        key={idx}
                        className="bg-white border-b hover:bg-gray-50"
                      >
                        {Object.values(row).map((val: any, i) => (
                          <td
                            key={i}
                            className="px-6 py-4 whitespace-nowrap max-w-xs truncate"
                          >
                            {typeof val === "object"
                              ? JSON.stringify(val)
                              : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                No results to display
              </div>
            )}
            <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-right">
              {results.length} rows found
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;
