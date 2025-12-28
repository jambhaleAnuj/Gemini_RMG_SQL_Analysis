import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  AreaChartIcon,
  Table,
} from "lucide-react";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#6366f1",
  "#f43f5e",
  "#84cc16",
  "#14b8a6",
  "#a855f7",
  "#f97316",
  "#22c55e",
  "#0ea5e9",
  "#e879f9",
];

const DynamicChart = ({
  data,
  chartType = "bar",
  config = {},
  onChartTypeChange,
}) => {
  // Process data for charts
  const chartData = useMemo(() => {
    if (!data || !data.values || data.values.length === 0) return [];

    const { xField, yField, groupField } = config;

    // Find column indices
    const xIndex = xField ? data.columns.indexOf(xField) : 0;
    const yIndex = yField
      ? data.columns.indexOf(yField)
      : data.columns.length > 1
      ? 1
      : 0;

    // Map data to chart format
    return data.values.slice(0, 50).map((row, idx) => {
      const item = { name: row[xIndex] ?? `Item ${idx + 1}` };

      // Add all numeric columns as potential values
      data.columns.forEach((col, colIdx) => {
        const value = row[colIdx];
        if (typeof value === "number") {
          item[col] = value;
        } else if (typeof value === "string") {
          const num = parseFloat(value.replace(/,/g, ""));
          if (!isNaN(num)) {
            item[col] = num;
          } else {
            item[col] = value;
          }
        } else {
          item[col] = value;
        }
      });

      return item;
    });
  }, [data, config]);

  // Determine which columns are numeric (for Y axis)
  const numericColumns = useMemo(() => {
    if (!data || !data.values || data.values.length === 0) return [];

    return data.columns.filter((col, colIdx) => {
      // Check first few rows to determine if column is numeric
      const sampleValues = data.values.slice(0, 10).map((row) => row[colIdx]);
      return sampleValues.some(
        (v) =>
          typeof v === "number" ||
          (typeof v === "string" && !isNaN(parseFloat(v?.replace?.(/,/g, ""))))
      );
    });
  }, [data]);

  // Get the Y axis field (prioritize config, then first numeric column)
  const yAxisField = config.yField || numericColumns[0] || data?.columns?.[1];
  const xAxisField = config.xField || data?.columns?.[0];

  // Chart type buttons
  const chartTypes = [
    { type: "table", icon: Table, label: "Table" },
    { type: "bar", icon: BarChart3, label: "Bar" },
    { type: "line", icon: LineChartIcon, label: "Line" },
    { type: "area", icon: AreaChartIcon, label: "Area" },
    { type: "pie", icon: PieChartIcon, label: "Pie" },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
        <p className="text-dark-200 font-medium mb-2">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-sm" style={{ color: entry.color }}>
            {entry.name}:{" "}
            {typeof entry.value === "number"
              ? entry.value.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })
              : entry.value}
          </p>
        ))}
      </div>
    );
  };

  if (!data || !data.values || data.values.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400">
        No data available for visualization
      </div>
    );
  }

  // Render pie chart data
  const renderPieChart = () => {
    const pieData = chartData
      .slice(0, 10)
      .map((item) => ({
        name: String(item.name),
        value: typeof item[yAxisField] === "number" ? item[yAxisField] : 0,
      }))
      .filter((item) => item.value > 0);

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      {onChartTypeChange && (
        <div className="flex items-center space-x-1 bg-dark-800/50 p-1 rounded-xl w-fit">
          {chartTypes.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => onChartTypeChange(type)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${
                  chartType === type
                    ? "bg-primary-500 text-white shadow-lg"
                    : "text-dark-400 hover:text-dark-200 hover:bg-dark-700"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chart Container */}
      <div className="bg-dark-800/30 rounded-xl p-4 border border-dark-700/50">
        {chartType === "table" ? (
          <div className="text-center text-dark-400 py-8">
            Switch to table view above to see detailed data
          </div>
        ) : chartType === "pie" ? (
          renderPieChart()
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === "bar" ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {numericColumns.slice(0, 5).map((col, idx) => (
                  <Bar
                    key={col}
                    dataKey={col}
                    fill={COLORS[idx % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {numericColumns.slice(0, 5).map((col, idx) => (
                  <Line
                    key={col}
                    type="monotone"
                    dataKey={col}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: COLORS[idx % COLORS.length], strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            ) : chartType === "area" ? (
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {numericColumns.slice(0, 5).map((col, idx) => (
                  <Area
                    key={col}
                    type="monotone"
                    dataKey={col}
                    stroke={COLORS[idx % COLORS.length]}
                    fill={COLORS[idx % COLORS.length]}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            ) : null}
          </ResponsiveContainer>
        )}
      </div>

      {/* Data info */}
      <div className="flex items-center justify-between text-sm text-dark-400">
        <span>
          Showing {Math.min(chartData.length, 50)} of {data.rowCount} records
        </span>
        {numericColumns.length > 0 && (
          <span>Numeric columns: {numericColumns.join(", ")}</span>
        )}
      </div>
    </div>
  );
};

export default DynamicChart;
