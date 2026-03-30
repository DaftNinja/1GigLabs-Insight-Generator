import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Label
} from "recharts";

interface RevenueChartProps {
  data: Array<{ year: string; revenue: number; netIncome: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Format huge numbers to B/M
  const formatYAxis = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    return `$${value}`;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="year" 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickFormatter={formatYAxis} 
            tickLine={false} 
            axisLine={false}
          >
            <Label 
              value="Values in USD (M/B)" 
              angle={-90} 
              position="insideLeft" 
              style={{ textAnchor: 'middle', fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              offset={10}
            />
          </YAxis>
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
            }}
          />
          <Legend />
          <Bar dataKey="revenue" name="Revenue (USD)" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={50} />
          <Bar dataKey="netIncome" name="Net Income (USD)" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SpendPieChartProps {
  data: Array<{ name: string; value: number }>;
}

// Professional, high-contrast professional palette starting with a deep corporate blue
const COLORS = [
  '#003366', // Deep Navy Blue
  '#0047BB', // Corporate Blue
  '#1E3A8A', // Indigo Blue
  '#2563EB', // Royal Blue
  '#3B82F6', // Sky Blue
  '#60A5FA', // Light Blue
  '#93C5FD', // Pale Blue
];

export function SpendPieChart({ data }: SpendPieChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
             formatter={(value: number) => [`${value}%`, 'Estimated Spend']}
             contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
            }}
          />
          <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: '20px', fontSize: '13px', fontWeight: 500, color: '#1e293b' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
