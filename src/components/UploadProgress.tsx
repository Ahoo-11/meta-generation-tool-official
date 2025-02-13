
import { Progress } from '@/components/ui/progress';

interface UploadProgressProps {
  total: number;
  current: number;
  processed: number;
  failed: number;
}

export function UploadProgress({ total, current, processed, failed }: UploadProgressProps) {
  return (
    <div className="space-y-2">
      <Progress value={(current / total) * 100} />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Processing: {current} / {total}</span>
        <span>
          Success: {processed} | 
          Failed: {failed}
        </span>
      </div>
    </div>
  );
}
