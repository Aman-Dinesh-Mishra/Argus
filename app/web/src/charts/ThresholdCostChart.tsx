import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ThresholdPoint } from "../types/api";

interface ThresholdCostChartProps {
  data: ThresholdPoint[];
}

export default function ThresholdCostChart({ data }: ThresholdCostChartProps) {
  const chartData = [...data].sort((a, b) => a.threshold - b.threshold);

  if (chartData.length === 0) {
    return <p>No threshold cost data available.</p>;
  }

  const minimumCostPoint = chartData.reduce((minimum, current) =>
    current.total_cost < minimum.total_cost ? current : minimum,
  );

  return (
    <div className="threshold-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 16, right: 20, left: 12, bottom: 8 }}
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
            tickFormatter={(value) => Number(value).toLocaleString()}
            label={{
              value: "Total cost",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            formatter={(value) =>
              Number(value).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })
            }
            labelFormatter={(value) => `Threshold: ${Number(value).toFixed(4)}`}
          />
          <ReferenceLine
            x={minimumCostPoint.threshold}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            label={{
              value: "Minimum cost",
              position: "insideTopRight",
            }}
          />
          <Line
            type="monotone"
            dataKey="total_cost"
            name="Total cost"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
