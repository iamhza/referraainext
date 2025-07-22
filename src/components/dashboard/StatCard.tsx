import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  isLoading?: boolean;
  change?: string;
  changeType?: 'positive' | 'negative';
  chartData?: any;
}

const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            enabled: false,
        },
    },
    scales: {
        y: {
            display: false,
        },
        x: {
            display: false,
        },
    },
    elements: {
        point: {
            radius: 0,
        },
    },
};

export function StatCard({ title, value, icon, description, isLoading, change, changeType, chartData }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-2/3" />
          {icon && <div className="text-gray-400">{icon}</div>}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
          {chartData && <Skeleton className="h-16 w-full mt-4" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
            {icon && <div className="text-gray-400">{icon}</div>}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <div className="flex items-center text-xs text-gray-500">
            {change && (
                <span className={`mr-2 ${changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                {change}
                </span>
            )}
            {description}
            </div>
            {chartData && (
            <div className="h-16 mt-4">
                <Line data={chartData} options={defaultChartOptions} />
            </div>
            )}
      </CardContent>
    </Card>
  );
} 