import { useState, useRef, DragEvent } from 'react';
import { processImages } from '@/services/uploadService';
import { useProfileStore } from '@/stores/profileStore';
import { useApiProviderStore } from '@/stores/apiProviderStore';
import { ApiProvider } from '@/config/apiConfig';
import { exportToCSV } from '@/utils/exportUtils';
import { ProgressBar } from './ProgressBar';
import { ImageMetadata } from '@/config/imageAnalysis';
import { templates } from '@/utils/csvTemplates';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProcessResult {
  fileName: string;
  success: boolean;
  metadata?: ImageMetadata;
  error?: string;
}

export const ImageUploader = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'processing' | 'paused' | 'completed' | 'error'>('completed');
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("AdobeStock");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // API Provider state
  const { currentProvider, setProvider } = useApiProviderStore();

  const handleFiles = async (files: FileList | File[]) => {
    if (!files?.length) return;

    setStatus('processing');
    setProgress(0);
    setResults([]);

    try {
      const result = await processImages(
        Array.from(files),
        (progress) => {
          setProgress(progress.processedImages / progress.totalImages * 100);
          if (progress.status) {
            setStatus(progress.status);
          }
        }
      );

      if (result.success && result.metadata) {
        // Convert metadata to ProcessResult format
        const processedResults: ProcessResult[] = result.metadata.map(metadata => ({
          fileName: metadata.fileName || 'unknown',
          success: true,
          metadata: metadata
        }));
        setResults(processedResults);
        await useProfileStore.getState().refreshProfile();
      }
    } catch (error) {
      console.error('Processing error:', error);
      setStatus('error');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleExport = () => {
    if (results.length > 0) {
      exportToCSV(results, selectedTemplate);
    }
  };

  const renderMetadata = (metadata: ImageMetadata) => {
    if (!metadata) return <p className="text-sm text-gray-600">No metadata available</p>;
    
    return (
      <div className="space-y-2 text-sm">
        <p><span className="font-medium">Title:</span> {metadata.title || 'No title available'}</p>
        <p><span className="font-medium">Description:</span> {metadata.description || 'No description available'}</p>
        <p><span className="font-medium">Category:</span> {metadata.category || 'No category available'}</p>
        <div>
          <span className="font-medium">Keywords: </span>
          {metadata.keywords?.join(', ') || 'No keywords available'}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col mb-4">
        <span className="text-sm mb-1">API Provider</span>
        <Select value={currentProvider} onValueChange={setProvider}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="API Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gemini">Google Gemini</SelectItem>
            <SelectItem value="openrouter">OpenRouter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div 
        className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-colors duration-200 ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="w-12 h-12 mb-4 text-gray-400" />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={status === 'processing'}
          className="mb-2"
        >
          Select Images
        </Button>
        <p className="text-sm text-gray-500">
          Drag and drop images here or click to select
        </p>
      </div>

      {status === 'processing' ? (
        <div className="my-6 space-y-2">
          <ProgressBar progress={progress} />
          <p className="text-center text-sm text-gray-600">
            Processing images... {Math.round(progress)}%
          </p>
          <p className="text-center text-xs text-gray-500">
            Using {currentProvider === 'gemini' ? 'Google Gemini' : 'OpenRouter'} API
          </p>
        </div>
      ) : null}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 mt-4 items-end">
            <div className="flex flex-col">
              <span className="text-sm mb-1">Export Template</span>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(templates).map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleExport} disabled={results.length === 0}>
              Export CSV
            </Button>
          </div>

          <div className="grid gap-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-card"
              >
                <h3 className="font-medium mb-2">{result.fileName}</h3>
                {result.success ? (
                  renderMetadata(result.metadata!)
                ) : (
                  <p className="text-sm text-destructive">{result.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
