import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type StudyTrendChartProps = {
  data: Array<{ label: string; minutes: number }>;
};

export function StudyTrendChart({ data }: StudyTrendChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="studyFlowArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" opacity={0.2} />
          <XAxis
            dataKey="label"
            stroke="#64748B"
            tickLine={false}
            axisLine={false}
            minTickGap={26}
            tickMargin={10}
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#64748B" />
          <Tooltip
            contentStyle={{ borderRadius: 18, border: "1px solid rgba(148,163,184,0.22)" }}
            labelStyle={{ fontWeight: 700 }}
            formatter={(value: number) => [`${value} min`, "Study time"]}
          />
          <Area type="monotone" dataKey="minutes" stroke="#14B8A6" fill="url(#studyFlowArea)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
