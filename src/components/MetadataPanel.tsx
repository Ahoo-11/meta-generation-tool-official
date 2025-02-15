
import { X } from 'lucide-react';
import { ImageMetadata } from '@/config/imageAnalysis';

interface MetadataPanelProps {
  metadata: ImageMetadata | null;
  onClose: () => void;
}

export function MetadataPanel({ metadata, onClose }: MetadataPanelProps) {
  if (!metadata) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l animate-slide-in-right">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Image Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Title</label>
            <p className="mt-1 text-foreground">{metadata.title}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <p className="mt-1 text-foreground">{metadata.description}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Category</label>
            <p className="mt-1 text-foreground">{metadata.category}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Keywords</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {metadata.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
