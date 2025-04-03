import { X, Copy, Check } from 'lucide-react';
import { ImageMetadata } from '@/config/imageAnalysis';
import { useState } from 'react';
import { Button } from './ui/button';

interface MetadataPanelProps {
  metadata: ImageMetadata | null;
  onClose: () => void;
}

export function MetadataPanel({ metadata, onClose }: MetadataPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!metadata) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg animate-slide-in-right z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Image Details</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-secondary rounded-full transition-colors"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Filename */}
        <div className="pb-4 border-b">
          <p className="text-sm text-muted-foreground">Filename</p>
          <p className="font-medium truncate">{metadata.fileName || 'Unnamed'}</p>
        </div>
        
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Title</label>
            <button 
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => copyToClipboard(metadata.title, 'title')}
            >
              {copied === 'title' ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="p-3 bg-muted rounded-md text-sm">{metadata.title}</p>
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <button 
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => copyToClipboard(metadata.description, 'description')}
            >
              {copied === 'description' ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="p-3 bg-muted rounded-md text-sm">{metadata.description}</p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Category</label>
            <button 
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => copyToClipboard(metadata.category, 'category')}
            >
              {copied === 'category' ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="flex">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              {metadata.category}
            </span>
          </div>
        </div>
        
        {/* Keywords */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">
              Keywords ({metadata.keywords.length})
            </label>
            <button 
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => copyToClipboard(metadata.keywords.join(', '), 'keywords')}
            >
              {copied === 'keywords' ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="p-3 bg-muted rounded-md max-h-60 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {metadata.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="keyword-tag"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t">
        <Button 
          className="w-full"
          variant="outline"
          onClick={() => copyToClipboard(
            `Title: ${metadata.title}\nDescription: ${metadata.description}\nCategory: ${metadata.category}\nKeywords: ${metadata.keywords.join(', ')}`, 
            'all'
          )}
        >
          {copied === 'all' ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied All Metadata
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy All Metadata
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
