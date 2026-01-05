import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Model colors matching the database
const MODEL_COLORS: Record<string, string> = {
  "GPT-5.2": "#10B981",
  "Claude Opus 4.5": "#F59E0B",
  "Gemini 3 Pro": "#3B82F6",
  "Grok 4": "#8B5CF6",
  "DeepSeek V3.2": "#EF4444",
  "Qwen3-235B": "#06B6D4",
  "Mistral Large 3": "#EC4899",
  "Llama 3.3 70B": "#F97316",
};

interface SnapshotData {
  index: number;
  timestamp: string;
  fullTimestamp: string;
  isDecisionPoint?: boolean;
  [key: string]: string | number | boolean | undefined;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  // Get full timestamp from the data point
  const dataPoint = payload[0]?.payload;
  const fullTimestamp = dataPoint?.fullTimestamp || dataPoint?.timestamp;
  const isDecision = dataPoint?.isDecisionPoint;

  // Sort by value descending
  const sorted = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

  return (
    <div className="bg-background border-2 border-foreground p-3 shadow-brutal">
      <div className="flex items-center gap-2 mb-2 border-b border-foreground pb-2">
        <p className="font-bold text-sm">{fullTimestamp}</p>
        {isDecision && (
          <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5">
            Decision
          </span>
        )}
      </div>
      <div className="space-y-1">
        {sorted.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 border border-foreground"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.name}</span>
            </div>
            <span className={entry.value >= 10000 ? "text-green-500" : "text-red-500"}>
              ${entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom legend component
const CustomLegend = ({ models }: { models: string[] }) => {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-border">
      {models.map((model) => (
        <div key={model} className="flex items-center gap-2">
          <div
            className="w-3 h-3 border border-foreground"
            style={{ backgroundColor: MODEL_COLORS[model] || "#888" }}
          />
          <span className="text-xs font-medium">{model}</span>
        </div>
      ))}
    </div>
  );
};

interface PortfolioChartProps {
  height?: number;
  maxDataPoints?: number;
}

export const PortfolioChart = ({ height = 400, maxDataPoints = 50 }: PortfolioChartProps) => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["portfolio-chart"],
    queryFn: async () => {
      // Get active season
      const { data: season } = await supabase
        .from("seasons")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!season) return { data: [], models: [] };

      // Get snapshots with model info
      const { data: snapshots } = await supabase
        .from("portfolio_snapshots")
        .select(`
          snapshot_timestamp,
          total_value,
          agents!inner(
            season_id,
            models!inner(display_name)
          )
        `)
        .eq("agents.season_id", season.id)
        .order("snapshot_timestamp", { ascending: true });

      if (!snapshots || snapshots.length === 0) return { data: [], models: [] };

      // Helper to check if a date is a decision day (Mon/Wed/Fri) near 00:00 UTC
      const isDecisionTime = (date: Date): boolean => {
        const dayOfWeek = date.getUTCDay();
        const hour = date.getUTCHours();
        // Mon=1, Wed=3, Fri=5, within first few hours of the day
        return [1, 3, 5].includes(dayOfWeek) && hour <= 2;
      };

      // Group by timestamp and pivot to have model names as columns
      const timestampMap = new Map<string, SnapshotData>();
      const modelSet = new Set<string>();

      for (const snap of snapshots) {
        const date = new Date(snap.snapshot_timestamp);
        // Short format for X-axis (just date)
        const shortTs = date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        });
        // Full format for tooltip
        const fullTs = date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        // Unique key including time for grouping
        const uniqueKey = date.toISOString();
        const modelName = (snap.agents as any).models.display_name;
        modelSet.add(modelName);

        if (!timestampMap.has(uniqueKey)) {
          timestampMap.set(uniqueKey, {
            timestamp: shortTs,
            fullTimestamp: fullTs,
            isDecisionPoint: isDecisionTime(date),
          });
        }
        timestampMap.get(uniqueKey)![modelName] = parseFloat(snap.total_value);
      }

      // Sort models by their latest value (for legend order)
      // Add index to each data point for unique identification
      const allData = Array.from(timestampMap.values()).map((d, i) => ({
        ...d,
        index: i,
      }));
      const models = Array.from(modelSet);

      // Fill missing values with previous value (forward fill)
      // This ensures continuous lines without gaps
      const lastKnown: Record<string, number> = {};
      for (const model of models) {
        lastKnown[model] = 10000; // Start with initial value
      }

      for (const dataPoint of allData) {
        for (const model of models) {
          if (dataPoint[model] !== undefined) {
            lastKnown[model] = dataPoint[model] as number;
          } else {
            dataPoint[model] = lastKnown[model];
          }
        }
      }

      const latestData = allData[allData.length - 1] || {};
      const sortedModels = models.sort((a, b) => {
        const valA = (latestData[a] as number) || 0;
        const valB = (latestData[b] as number) || 0;
        return valB - valA;
      });

      // Filter out initial data points where all models are at exactly $10,000 (no trading yet)
      // Keep at least one starting point for context
      const STARTING_VALUE = 10000;
      const hasVariation = (dataPoint: SnapshotData) => {
        return sortedModels.some((model) => {
          const val = dataPoint[model] as number;
          return val !== undefined && Math.abs(val - STARTING_VALUE) > 0.01;
        });
      };

      // Find the first index with actual variation
      let firstVariationIndex = allData.findIndex(hasVariation);
      if (firstVariationIndex === -1) firstVariationIndex = allData.length - 1;

      // Keep one point before variation for context, or start from beginning if very few points
      const startIndex = Math.max(0, firstVariationIndex - 1);
      const filteredData = allData.slice(startIndex);

      // Aggregate data if too many points (take every Nth point)
      // Always preserve decision points
      let finalData = filteredData;
      if (filteredData.length > maxDataPoints) {
        const step = Math.ceil(filteredData.length / maxDataPoints);
        finalData = filteredData.filter(
          (d, i) => i % step === 0 || i === filteredData.length - 1 || d.isDecisionPoint
        );
      }

      // Re-index after filtering for proper x-axis positioning
      finalData = finalData.map((d, i) => ({ ...d, index: i }));

      // Find decision point indices for reference lines
      const decisionIndices = finalData
        .map((d, i) => (d.isDecisionPoint ? i : -1))
        .filter((i) => i >= 0);

      return {
        data: finalData,
        models: sortedModels,
        decisionIndices,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!chartData?.data?.length) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-muted-foreground flex-col gap-2">
        <p className="font-medium">No performance data yet</p>
        <p className="text-sm">Charts will appear after the first market sync</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData.data}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="index"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              dy={10}
              tickFormatter={(idx) => {
                const point = chartData.data[idx];
                return point?.timestamp || "";
              }}
            />
            <YAxis
              domain={["dataMin - 50", "dataMax + 50"]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              width={50}
            />
            <ReferenceLine
              y={10000}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
              label={{
                value: "Start",
                position: "right",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 10,
              }}
            />
            {/* Decision point markers - subtle tick marks at x-axis */}
            {chartData.data
              .filter((d) => d.isDecisionPoint)
              .map((d) => (
                <ReferenceLine
                  key={`decision-${d.index}`}
                  x={d.index}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  strokeOpacity={0.4}
                />
              ))}
            <Tooltip content={<CustomTooltip />} />
            {chartData.models.map((model) => (
              <Line
                key={model}
                type="monotone"
                dataKey={model}
                stroke={MODEL_COLORS[model] || "#888"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: "hsl(var(--background))" }}
                name={model}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <CustomLegend models={chartData.models} />
    </div>
  );
};
