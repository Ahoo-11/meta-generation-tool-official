
import { useState, useRef } from 'react';
import { processImages } from '@/services/uploadService';
import { exportToCSV } from '@/utils/exportUtils';
import { ProgressBar } from './ProgressBar';
import { ImageMetadata } from '@/config/imageAnalysis';

export const ImageUploader = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'processing' | 'paused' | 'completed' | 'error'>('completed');
  const [results, setResults] = useState<any[]>([]);
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
      exportToCSV(results);
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
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={status === 'processing'}
        >
          Select Images
        </button>
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
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Export to CSV
            </button>
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
