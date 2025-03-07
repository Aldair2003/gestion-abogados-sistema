import {
  
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const monthlyData = {
  labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  datasets: [
    {
      label: 'Casos Mensuales',
      data: [65, 120, 80, 140, 90, 100, 150, 80, 120, 180, 140, 90],
      borderColor: '#60A5FA',
      backgroundColor: 'rgba(96, 165, 250, 0.1)',
      tension: 0.4,
    }
  ]
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: '#9CA3AF'
      }
    },
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: '#9CA3AF'
      }
    }
  }
};

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive?: boolean;
}

const StatCard = ({ title, value, change, isPositive = true }: StatCardProps) => (
  <div className="bg-[#232936] rounded-lg p-6">
    <h3 className="text-gray-400 text-sm">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <span className={`ml-2 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {change}
      </span>
    </div>
  </div>
);

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Casos Activos"
          value="3,782"
          change="+11.01%"
        />
        <StatCard
          title="Clientes"
          value="5,359"
          change="-9.05%"
          isPositive={false}
        />
        <StatCard
          title="Audiencias Pendientes"
          value="12"
          change="+3.45%"
        />
        <StatCard
          title="Tasa de Éxito"
          value="75.55%"
          change="+10%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#232936] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Casos Mensuales</h2>
            <select className="bg-[#1a1f2b] text-gray-300 rounded-lg border-gray-700 focus:ring-blue-500 focus:border-blue-500">
              <option>Último Año</option>
              <option>Último Mes</option>
              <option>Última Semana</option>
            </select>
          </div>
          <div className="h-80">
            <Line data={monthlyData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-[#232936] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-white">Meta Mensual</h2>
              <p className="text-sm text-gray-400">Meta establecida para cada mes</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">75.55%</div>
              <div className="text-sm text-green-400 mt-2">+10% vs mes anterior</div>
              <div className="mt-4 text-gray-400">
                Has ganado $3,287 hoy, es más alto que el mes pasado.
                <br />
                ¡Sigue con el buen trabajo!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 