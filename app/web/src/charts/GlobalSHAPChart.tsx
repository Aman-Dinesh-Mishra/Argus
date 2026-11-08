import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GlobalSHAPFeature } from "../types/api";

interface GlobalSHAPChartProps {
  data: GlobalSHAPFeature[];
}

export default function GlobalSHAPChart({ data }: GlobalSHAPChartProps) {
  const chartData = [...data]
    .sort((a, b) => b.mean_abs_shap - a.mean_abs_shap)
    .slice(0, 10);

  if (chartData.length === 0) {
    return <p>No global SHAP data available.</p>;
  }

  return (
    <div className="threshold-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 12, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value) => Number(value).toFixed(3)}
          />
          <YAxis type="category" dataKey="feature" width={55} />
          <Tooltip
            formatter={(value) => Number(value).toFixed(5)}
            labelFormatter={(label) => `Feature: ${label}`}
          />
          <Bar
            dataKey="mean_abs_shap"
            name="Mean absolute SHAP"
            fill="#60a5fa"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
