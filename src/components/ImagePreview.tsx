import { useState, useEffect } from 'react';

interface ImagePreviewProps {
  file?: File;
  src?: string;
  alt: string;
  className?: string;
}

export function ImagePreview({ file, src, alt, className = '' }: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // If a file is provided, create a preview URL
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Cleanup function to revoke the object URL when component unmounts
      return () => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      };
    } else if (src) {
      // If a src URL is provided, use that
      setPreviewUrl(src);
    }
  }, [file, src]);

  if (!previewUrl) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <img 
      src={previewUrl} 
      alt={alt} 
      className={`object-cover ${className}`}
      onError={(e) => {
        // On error, show a placeholder
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite error loop
        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
      }}
    />
  );
}
