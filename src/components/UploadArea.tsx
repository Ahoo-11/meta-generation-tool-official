import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

export function UploadArea({
  onFilesSelected,
  maxFiles = 1000,
  maxSize = 40,
  acceptedFormats = ['JPG', 'PNG', 'WEBP']
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${isDragging 
        ? 'border-primary bg-primary/5 scale-[1.01]' 
        : 'border-border/60 dark:border-border/40 hover:border-primary/50 dark:hover:border-primary/40 bg-secondary/30 dark:bg-secondary/20'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
        accept={acceptedFormats.map(format => `.${format.toLowerCase()}`).join(',')}
      />
      
      <div className="flex flex-col items-center justify-center p-10 h-72">
        <div className="w-16 h-16 rounded-full bg-secondary/80 dark:bg-secondary/40 flex items-center justify-center mb-6 shadow-sm">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        
        <h3 className="text-xl font-medium mb-2">Drag and drop your files here</h3>
        <p className="text-center text-muted-foreground text-sm mb-6">or</p>
        
        <Button 
          variant="stockfillPrimary" 
          onClick={handleBrowseClick}
          className="mb-4 px-6 py-5 h-auto text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
          size="lg"
        >
          Browse Your Computer
        </Button>
        
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/60"></span>
            <span>Max {maxFiles} files</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/60"></span>
            <span>Max size: {maxSize} MB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/60"></span>
            <span>Formats: {acceptedFormats.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}