import { useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartData, ChartOptions } from 'chart.js';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryDistributionChartProps {
  data: Record<string, number>;
}

export const CategoryDistributionChart = ({ data }: CategoryDistributionChartProps) => {
  const { theme } = useTheme();

  if (Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No category data available</p>
      </div>
    );
  }

  // Prepare data
  const labels = Object.keys(data);
  const values = Object.values(data);
  const backgroundColor = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
    'rgba(40, 159, 64, 0.7)',
    'rgba(210, 199, 199, 0.7)',
  ];

  const chartData: ChartData<'pie'> = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor,
        borderColor: backgroundColor.map(color => color.replace('0.7', '1')),
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: theme === 'dark' ? '#e5e7eb' : '#374151',
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
        titleColor: theme === 'dark' ? '#e5e7eb' : '#111827',
        bodyColor: theme === 'dark' ? '#e5e7eb' : '#374151',
        borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};
