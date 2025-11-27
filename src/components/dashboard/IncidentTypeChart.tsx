import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface IncidentTypeData {
  type: string;
  count: number;
  percentage: number;
  [key: string]: any;
}

interface IncidentTypeChartProps {
  data: IncidentTypeData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export function IncidentTypeChart({ data }: IncidentTypeChartProps) {
  return (
    <div className="bg-linear-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Incident Distribution by Type</h3>
        <p className="text-xs text-gray-500 mt-1">Breakdown of incidents by category</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${percent}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div key={item.type} className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{item.type}</p>
              <p className="text-xs text-gray-500">{item.count} incidents ({item.percentage}%)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
