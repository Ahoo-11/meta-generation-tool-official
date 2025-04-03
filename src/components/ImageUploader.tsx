import { useState, useRef, DragEvent } from 'react';
import { processImages } from '@/services/uploadService';
import { useProfileStore } from '@/stores/profileStore';
import { ImageMetadata } from '@/config/imageAnalysis';
import { ProgressBar } from './ProgressBar';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';
import { validateMetadata } from '@/services/imageAnalysisService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResultsView, ProcessStatus } from './ResultsView';

interface ProcessResult {
  fileName: string;
  success: boolean;
  metadata?: ImageMetadata;
  error?: string;
  imageUrl?: string; // Added for displaying the image
  status: ProcessStatus; // Added status field
}

export const ImageUploader = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'processing' | 'paused' | 'completed' | 'error'>('completed');
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState<'upload' | 'results'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files?.length) return;

    setStatus('processing');
    setProgress(0);
    
    // Create initial results with pending status
    const initialResults: ProcessResult[] = Array.from(files).map(file => ({
      fileName: file.name,
      success: false,
      imageUrl: URL.createObjectURL(file),
      status: 'pending'
    }));
    
    setResults(initialResults);
    setView('results'); // Switch to results view immediately to show pending status

    try {
      // Update results to processing status
      setResults(prevResults => 
        prevResults.map(result => ({
          ...result,
          status: 'processing'
        }))
      );

      const result = await processImages(
        Array.from(files),
        (progress) => {
          setProgress(progress.processedImages / progress.totalImages * 100);
          if (progress.status) {
            setStatus(progress.status);
          }
        }
      );

      console.log('🔍 Raw API Result:', {
        success: result.success,
        metadataLength: result.metadata?.length || 0,
        hasMetadata: !!result.metadata,
        fullResult: result
      });

      if (result.success && result.metadata) {
        console.log('🔍 Processing API response:', {
          totalMetadata: result.metadata.length,
          metadata: result.metadata,
          metadataDetails: result.metadata.map(m => ({
            fileName: m.fileName,
            hasTitle: !!m.title,
            hasDescription: !!m.description,
            keywordsCount: m.keywords?.length,
            category: m.category
          }))
        });
        
        // Convert metadata to ProcessResult format and update status
        const processedResults: ProcessResult[] = [];
        
        // Match metadata with files by filename or by index order
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileName = file.name;
          
          // Find matching metadata by filename
          const matchingMetadata = result.metadata.find(m => m.fileName === fileName);
          
          if (matchingMetadata) {
            // Validate the metadata
            const validationResult = validateMetadata(matchingMetadata, i);
            const isValid = validationResult.isValid;
            const errors = validationResult.errors;
            
            console.log(`🔍 Validating metadata for ${fileName}:`, {
              index: i,
              fileName: matchingMetadata.fileName,
              hasTitle: !!matchingMetadata.title,
              titleLength: matchingMetadata.title?.length,
              hasDescription: !!matchingMetadata.description,
              descriptionLength: matchingMetadata.description?.length,
              keywordsCount: matchingMetadata.keywords?.length,
              category: matchingMetadata.category,
              isValid,
              errors
            });
            
            if (isValid) {
              processedResults.push({
                fileName: fileName,
                success: true,
                metadata: matchingMetadata,
                imageUrl: URL.createObjectURL(file),
                status: 'completed' as ProcessStatus
              });
            } else {
              processedResults.push({
                fileName: fileName,
                success: false,
                status: 'failed' as ProcessStatus,
                error: `Invalid metadata: ${errors}`,
                imageUrl: URL.createObjectURL(file)
              });
            }
          } else {
            // No matching metadata found for this file
            processedResults.push({
              fileName: fileName,
              success: false,
              status: 'failed' as ProcessStatus,
              error: 'No metadata generated for this image',
              imageUrl: URL.createObjectURL(file)
            });
          }
        }
        
        // Log final results
        console.log('🔍 Final processing results:', {
          totalProcessed: processedResults.length,
          successful: processedResults.filter(r => r.success).length,
          failed: processedResults.filter(r => !r.success).length,
          results: processedResults.map(r => ({
            fileName: r.fileName,
            success: r.success,
            error: r.error
          }))
        });
        
        setResults(processedResults);
        await useProfileStore.getState().refreshProfile();
      } else {
        console.log('🔍 API returned no metadata or failed:', result);
        // Mark all as failed if overall processing failed
        setResults(prevResults => 
          prevResults.map(result => ({
            ...result,
            status: 'failed' as ProcessStatus,
            error: 'Processing failed'
          }))
        );
      }
    } catch (error) {
      console.error('Processing error:', error);
      setStatus('error');
      
      // Mark all as failed
      setResults(prevResults => 
        prevResults.map(result => ({
          ...result,
          status: 'failed' as ProcessStatus,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      );
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

  // Reset to upload view
  const handleBackToUpload = () => {
    setView('upload');
  };

  // Render the upload view
  const renderUploadView = () => (
    <div className="p-8 space-y-8">
      {/* Section Header */}
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-foreground">Get Started</h2>
        <p className="text-foreground/80">Upload your images to generate AI-powered metadata</p>
      </div>
      {/* Upload Area */}
      <div 
        className={`relative group flex flex-col items-center justify-center w-full min-h-[500px] p-12 border-2 border-dashed rounded-xl transition-all duration-300 ${
          isDragging 
            ? 'border-primary bg-primary/5 scale-[0.99]' 
            : 'border-border hover:border-primary/50 hover:bg-accent/5'
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
        
        {/* Upload Icon with Animation */}
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center">
          <div className="rounded-full bg-primary/10 p-6 mb-6">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Upload your images</h2>
          <p className="text-foreground/80 mb-8">
            Drag and drop your images here, or click the button below to browse your files
          </p>
          <Button 
            size="lg" 
            variant="stockfillPrimary" 
            className="min-w-[200px] text-base font-semibold py-6 px-8 shadow-md hover:shadow-lg transition-all duration-200 scale-105 hover:scale-110">
            Select Images
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Supported formats: JPG, PNG, WEBP (Max 10MB)
          </p>
        </div>
      </div>

      {/* Processing Status */}
      {status === 'processing' && (
        <div className="space-y-6 max-w-xl mx-auto bg-card border rounded-xl p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-center">Processing your images</h3>
            <p className="text-sm text-center text-muted-foreground">
              Using AI-powered image analysis
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-16rem)]">
      {view === 'upload' ? (
        renderUploadView()
      ) : (
        <ResultsView 
          results={results} 
          onBackToUpload={handleBackToUpload} 
        />
      )}
    </div>
  );
}
