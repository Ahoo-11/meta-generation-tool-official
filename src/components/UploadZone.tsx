import { useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import imageCompression from 'browser-image-compression';
import { useQueryClient } from '@tanstack/react-query';

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

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 384,
      useWebWorker: true,
      preserveExif: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return new File([compressedFile], file.name, { type: compressedFile.type });
    } catch (error) {
      console.error('Compression error:', error);
      throw new Error('Failed to compress image');
    }
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload only image files.');
    }

    const compressedFile = await compressImage(file);
    const formData = new FormData();
    formData.append('file', compressedFile);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await supabase.functions.invoke('upload-image', {
      body: formData,
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Upload failed');
    }

    return response.data;
  };

  const processBatch = async (files: File[]) => {
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
        const result = await uploadFile(file);
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

      {uploadProgress && (
        <div className="space-y-2">
          <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Processing: {uploadProgress.current} / {uploadProgress.total}</span>
            <span>
              Success: {uploadProgress.processed} | 
              Failed: {uploadProgress.failed}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}