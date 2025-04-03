import { useTheme } from '@/components/theme/ThemeProvider';

interface KeywordCloudChartProps {
  data: Record<string, number>;
}

export const KeywordCloudChart = ({ data }: KeywordCloudChartProps) => {
  const { theme } = useTheme();

  if (Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No keyword data available</p>
      </div>
    );
  }

  // Sort keywords by frequency
  const sortedEntries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50); // Limit to top 50 keywords

  // Calculate the maximum and minimum values for scaling
  const maxValue = sortedEntries[0][1];
  const minValue = sortedEntries[sortedEntries.length - 1][1];
  const range = maxValue - minValue;

  // Generate colors based on theme
  const colors = theme === 'dark' 
    ? ['#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#f9fafb'] 
    : ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af'];

  return (
    <div className="flex flex-wrap justify-center items-center h-full gap-2 p-4 overflow-auto">
      {sortedEntries.map(([keyword, count]) => {
        // Calculate size based on count (normalize between 1 and 5)
        const normalizedValue = range > 0 
          ? 1 + Math.floor(((count - minValue) / range) * 4) 
          : 3;
        
        return (
          <div
            key={keyword}
            className="px-2 py-1 rounded-md transition-transform hover:scale-110 cursor-default"
            style={{
              fontSize: `${0.75 + (normalizedValue * 0.25)}rem`,
              color: colors[normalizedValue - 1] || colors[0]
            }}
            title={`${keyword}: ${count} occurrences`}
          >
            {keyword}
          </div>
        );
      })}
    </div>
  );
};
