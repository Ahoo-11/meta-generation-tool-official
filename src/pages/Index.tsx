import { useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { ImageGrid } from '@/components/ImageGrid';
import { MetadataPanel } from '@/components/MetadataPanel';

const Index = () => {
  const [images] = useState([
    {
      id: '1',
      url: '/lovable-uploads/209638d6-791e-4848-bed4-13cf78329741.png',
      title: 'Green artichoke in water',
      status: 'complete' as const,
    },
  ]);

  const [selectedMetadata, setSelectedMetadata] = useState(null);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 space-y-8 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Image Meta-Generation</h1>
          <p className="text-muted-foreground">
            Upload your images and let AI generate metadata for them.
          </p>
        </div>

        <UploadZone />
        
        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Uploaded Images</h2>
              <p className="text-sm text-muted-foreground">
                {images.length} image{images.length !== 1 ? 's' : ''}
              </p>
            </div>
            <ImageGrid images={images} />
          </div>
        )}
      </main>

      <MetadataPanel
        metadata={selectedMetadata}
        onClose={() => setSelectedMetadata(null)}
      />
    </div>
  );
};

export default Index;