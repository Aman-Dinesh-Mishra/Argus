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

interface ThresholdChartProps {
  data: ThresholdPoint[];
}

export default function ThresholdChart({ data }: ThresholdChartProps) {
  if (data.length === 0) {
    return <p>No threshold data available.</p>;
  }

  return (
    <div className="threshold-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 16, right: 20, left: 4, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="threshold"
            domain={[0, 1]}
            tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
            label={{
              value: "Classification threshold",
              position: "insideBottom",
              offset: -4,
            }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
          />
          <Tooltip
            formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`}
            labelFormatter={(value) => `Threshold: ${Number(value).toFixed(4)}`}
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
          <Line
            type="monotone"
            dataKey="recall"
            name="Recall"
            stroke="#34d399"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="f1"
            name="F1 Score"
            stroke="#c084fc"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
