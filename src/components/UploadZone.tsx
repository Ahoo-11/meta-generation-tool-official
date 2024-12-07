import { useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file upload logic here
  };

  return (
    <div
      className={cn(
        "w-full h-64 rounded-lg border-2 border-dashed transition-all duration-200",
        "flex flex-col items-center justify-center gap-4 p-8",
        "hover:border-primary/50 hover:bg-secondary/50",
        isDragging ? "border-primary bg-secondary/50 scale-[1.02]" : "border-border"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
        <Upload className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">Drag and drop your images</h3>
        <p className="text-sm text-muted-foreground mt-1">
          or click to browse (up to 2000 images)
        </p>
      </div>
    </div>
  );
}