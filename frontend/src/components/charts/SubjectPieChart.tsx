import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type SubjectPieChartProps = {
  data: Array<{ name: string; minutes: number; color: string }>;
};

export function SubjectPieChart({ data }: SubjectPieChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="minutes"
            nameKey="name"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={4}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
