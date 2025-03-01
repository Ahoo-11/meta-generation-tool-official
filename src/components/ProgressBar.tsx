interface ProgressBarProps {
  progress: number;
  status?: 'processing' | 'paused' | 'completed' | 'error';
}

export const ProgressBar = ({ progress, status = 'processing' }: ProgressBarProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="w-full">
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};
