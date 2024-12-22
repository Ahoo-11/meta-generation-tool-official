import { useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { uploadImage } from '@/services/uploadService';
import { UploadProgress } from './UploadProgress';
import { useSession } from '@supabase/auth-helpers-react';
import { Alert, AlertDescription } from './ui/alert';

interface UploadProgress {
  total: number;
  current: number;
  processed: number;
  failed: number;
}

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const session = useSession();

  const processBatch = async (files: File[]) => {
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images",
        variant: "destructive"
      });
      return;
    }

    const maxBatchSize = 2000;
    if (files.length > maxBatchSize) {
      toast({
        title: "Batch size exceeded",
        description: `Maximum batch size is ${maxBatchSize} images`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress({
      total: files.length,
      current: 0,
      processed: 0,
      failed: 0
    });

    const results = [];
    for (const file of files) {
      try {
        const result = await uploadImage(file);
        results.push(result);
        setUploadProgress(prev => ({
          ...prev!,
          current: prev!.current + 1,
          processed: prev!.processed + 1
        }));
      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress(prev => ({
          ...prev!,
          current: prev!.current + 1,
          failed: prev!.failed + 1
        }));
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }

    queryClient.invalidateQueries({ queryKey: ['images'] });
    
    const successCount = results.length;
    const failedCount = files.length - successCount;

    toast({
      title: "Batch upload complete",
      description: `Successfully uploaded ${successCount} images${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      variant: successCount > 0 ? "default" : "destructive"
    });

    setIsUploading(false);
    setUploadProgress(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await processBatch(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processBatch(files);
  };

  if (!session) {
    return (
      <Alert>
        <AlertDescription>
          Please sign in to upload images
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <label
        className={cn(
          "w-full h-64 rounded-lg border-2 border-dashed transition-all duration-200",
          "flex flex-col items-center justify-center gap-4 p-8",
          "hover:border-primary/50 hover:bg-secondary/50",
          isDragging ? "border-primary bg-secondary/50 scale-[1.02]" : "border-border",
          isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <Upload className={cn(
            "w-8 h-8",
            isUploading ? "text-muted-foreground animate-bounce" : "text-primary"
          )} />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {isUploading ? 'Uploading...' : 'Drag and drop your images'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isUploading ? 'Please wait while we process your images' : 'or click to browse (up to 2000 images)'}
          </p>
        </div>
      </label>

      {uploadProgress && <UploadProgress {...uploadProgress} />}
    </div>
  );
}