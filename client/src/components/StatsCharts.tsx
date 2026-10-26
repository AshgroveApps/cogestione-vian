import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CategoryData {
  name: string;
  value: number;
}

interface BookingData {
  name: string;
  bookings: number;
  capacity: number;
}

const COLORS = ["#C9A227", "#DFC163", "#EAD79A", "#F3E6B3", "#A8871E", "#8A6E17"];

interface StatsChartsProps {
  categoryData: CategoryData[];
  bookingData: BookingData[];
}

export default function StatsCharts({ categoryData, bookingData }: StatsChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Grafico a torta per categorie */}
      <div className="card p-6">
        <h3 className="mb-4 font-display text-lg font-semibold">Corsi per categoria</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tw-bg-opacity)",
                borderRadius: "12px",
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Grafico a barre per prenotazioni */}
      <div className="card p-6">
        <h3 className="mb-4 font-display text-lg font-semibold">Prenotazioni per corso</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bookingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tw-bg-opacity)",
                borderRadius: "12px",
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            />
            <Legend />
            <Bar dataKey="bookings" fill="#C9A227" name="Prenotazioni" radius={[4, 4, 0, 0]} />
            <Bar dataKey="capacity" fill="#DFC163" name="Capacità" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
