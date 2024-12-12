import { useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload only image files",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

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

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
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
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await uploadFile(file);
    }
  };

  return (
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
          {isUploading ? 'Please wait while we process your images' : 'or click to browse'}
        </p>
      </div>
    </label>
  );
}