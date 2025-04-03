import { useState } from 'react';
import { ImageMetadata } from '@/config/imageAnalysis';
import { MetadataPanel } from './MetadataPanel';
import { Button } from './ui/button';
import { templates } from '@/utils/csvTemplates';
import { exportToCSV } from '@/utils/exportUtils';
import { ImagePreview } from './ImagePreview';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from '@/lib/utils';
import { Upload, Download, X } from 'lucide-react';

export type ProcessStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface ProcessResult {
  fileName: string;
  success: boolean;
  metadata?: ImageMetadata;
  error?: string;
  imageUrl?: string; // Added for displaying the image
  status: ProcessStatus; // Added status field
}

interface ResultsViewProps {
  results: ProcessResult[];
  onBackToUpload: () => void;
}

export function ResultsView({ results, onBackToUpload }: ResultsViewProps) {
  const [selectedMetadata, setSelectedMetadata] = useState<ImageMetadata | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("AdobeStock");

  const handleExport = () => {
    if (results.length > 0) {
      exportToCSV(results, selectedTemplate);
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: ProcessStatus): string => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500'; // Gray for pending
      case 'processing':
        return 'bg-yellow-500'; // Yellow for processing
      case 'completed':
        return 'bg-green-500'; // Green for completed
      case 'failed':
        return 'bg-red-500'; // Red for failed
      default:
        return 'bg-gray-500';
    }
  };

  // Helper function to get status tooltip text
  const getStatusText = (status: ProcessStatus): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  // Helper function to determine if image is loading
  const isLoading = (status: ProcessStatus): boolean => {
    return status === 'pending' || status === 'processing';
  };

  // Helper function to get image opacity based on status
  const getImageOpacity = (status: ProcessStatus): string => {
    return isLoading(status) ? 'opacity-30' : 'opacity-100';
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Processing Results</h2>
          <p className="text-muted-foreground">
            {results.length} image{results.length !== 1 ? 's' : ''} processed
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBackToUpload}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload More
          </Button>
          <Button
            onClick={handleExport}
            disabled={!results.some(r => r.status === 'completed')}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Results
          </Button>
        </div>
      </div>

      {/* Processing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Images</h3>
          <p className="text-2xl font-bold">{results.length}</p>
        </div>
        <div className="bg-card border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Completed</h3>
          <p className="text-2xl font-bold text-green-500">
            {results.filter(r => r.status === 'completed').length}
          </p>
        </div>
        <div className="bg-card border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Processing</h3>
          <p className="text-2xl font-bold text-yellow-500">
            {results.filter(r => r.status === 'processing' || r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-card border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Failed</h3>
          <p className="text-2xl font-bold text-red-500">
            {results.filter(r => r.status === 'failed').length}
          </p>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {results.map((result, index) => (
          <div
            key={index}
            className={cn(
              "group relative aspect-square rounded-xl overflow-hidden border transition-all duration-300",
              result.status === 'completed' ? 'hover:border-primary cursor-pointer' : 
              result.status === 'failed' ? 'border-destructive/50' : 'border-border',
              selectedMetadata?.fileName === result.fileName ? 'ring-2 ring-primary' : ''
            )}
            onClick={() => result.status === 'completed' && setSelectedMetadata(result.metadata!)}
          >
            {/* Image Preview */}
            <div className={cn(
              "w-full h-full transition-all duration-300",
              getImageOpacity(result.status)
            )}>
              <ImagePreview 
                src={result.imageUrl} 
                alt={result.fileName} 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Loading Overlay */}
            {isLoading(result.status) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-3 right-3 group/badge">
              <div 
                className={cn(
                  "w-3 h-3 rounded-full",
                  getStatusColor(result.status)
                )}
              />
              <div className="absolute right-0 top-5 scale-0 transition-all rounded-lg bg-popover border p-2 text-xs text-popover-foreground group-hover/badge:scale-100 whitespace-nowrap shadow-md">
                {getStatusText(result.status)}
              </div>
            </div>

            {/* Filename */}
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
              <p className="text-sm text-white truncate">{result.fileName}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Metadata Side Panel */}
      {selectedMetadata && (
        <MetadataPanel 
          metadata={selectedMetadata} 
          onClose={() => setSelectedMetadata(null)} 
        />
      )}
    </div>
  );
}
