
import { useState, useRef } from 'react';
import { processImages } from '@/services/uploadService';
import { exportToCSV } from '@/utils/exportUtils';
import { ProgressBar } from './ProgressBar';
import { ImageMetadata } from '@/config/imageAnalysis';
import { templates } from '@/utils/csvTemplates';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ImageUploader = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'processing' | 'paused' | 'completed' | 'error'>('completed');
  const [results, setResults] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("AdobeStock");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setStatus('processing');
    setProgress(0);
    setResults([]);

    try {
      const result = await processImages(
        Array.from(files),
        (progress) => {
          setProgress((progress.processed / progress.total) * 100);
          setStatus(progress.status);
        }
      );

      if (result.success) {
        setResults(result.results);
      }
    } catch (error) {
      console.error('Processing error:', error);
      setStatus('error');
    }
  };

  const handleExport = () => {
    if (results.length > 0) {
      exportToCSV(results, selectedTemplate);
    }
  };

  const renderMetadata = (metadata: ImageMetadata) => {
    return (
      <div className="space-y-2 text-sm">
        <p><span className="font-medium">Title:</span> {metadata.title}</p>
        <p><span className="font-medium">Description:</span> {metadata.description}</p>
        <p><span className="font-medium">Category:</span> {metadata.category}</p>
        <div>
          <span className="font-medium">Keywords: </span>
          {metadata.keywords.join(', ')}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={status === 'processing'}
        >
          Select Images
        </Button>
        <p className="mt-2 text-sm text-gray-500">
          Select multiple images to generate metadata
        </p>
      </div>

      {status !== 'completed' && (
        <ProgressBar progress={progress} status={status} />
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Processed {results.length} images
            </h3>
            <div className="flex items-center gap-4">
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleExport}
                className="bg-green-500 hover:bg-green-600"
              >
                Export to CSV
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <p className="font-medium">{result.fileName}</p>
                {result.success ? (
                  result.metadata ? renderMetadata(result.metadata) : <p className="text-sm text-gray-600">No metadata generated</p>
                ) : (
                  <p className="text-sm text-red-600">{result.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
