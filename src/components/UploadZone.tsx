import { useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@supabase/auth-helpers-react';
import { Alert, AlertDescription } from './ui/alert';
import { UploadProgress } from './UploadProgress';
import { analyzeImages } from '@/services/imageAnalysisService';

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

    for (const file of files) {
      try {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;
        
        // Process with OpenRouter
        const result = await analyzeImages([file]);

        // Store image info in localStorage
        const storedImages = JSON.parse(localStorage.getItem('userImages') || '[]');
        storedImages.push({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(file),
          title: file.name,
          userId: session.user.id,
          metadata: result.metadata
        });
        localStorage.setItem('userImages', JSON.stringify(storedImages));
        
        setUploadProgress(prev => ({
          ...prev!,
          current: prev!.current + 1,
          processed: prev!.processed + 1
        }));

      } catch (error) {
        console.error('Processing error:', error);
        setUploadProgress(prev => ({
          ...prev!,
          current: prev!.current + 1,
          failed: prev!.failed + 1
        }));
        toast({
          title: "Processing failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }

    const successCount = uploadProgress?.processed || 0;
    const failedCount = uploadProgress?.failed || 0;

    toast({
      title: "Batch processing complete",
      description: `Successfully processed ${successCount} images${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
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
            {isUploading ? 'Processing...' : 'Drag and drop your images'}
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
