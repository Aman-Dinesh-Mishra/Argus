import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ThresholdPoint } from "../types/api";

interface PrecisionRecallChartProps {
  data: ThresholdPoint[];
}

export default function PrecisionRecallChart({
  data,
}: PrecisionRecallChartProps) {
  const chartData = [...data].sort((a, b) => a.recall - b.recall);

  if (chartData.length === 0) {
    return <p>No precision–recall data available.</p>;
  }

  return (
    <div className="threshold-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 16, right: 20, left: 4, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="recall"
            domain={[0, 1]}
            tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
            label={{
              value: "Recall",
              position: "insideBottom",
              offset: -4,
            }}
          />
          <YAxis
            type="number"
            domain={[0, 1]}
            tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
            label={{
              value: "Precision",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`}
            labelFormatter={(value) =>
              `Recall: ${(Number(value) * 100).toFixed(2)}%`
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="precision"
            name="Precision"
            stroke="#60a5fa"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
