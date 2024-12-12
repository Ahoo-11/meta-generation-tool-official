import { UploadZone } from '@/components/UploadZone';
import { ImageGrid } from '@/components/ImageGrid';
import { MetadataPanel } from '@/components/MetadataPanel';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const Index = () => {
  const [selectedMetadata, setSelectedMetadata] = useState(null);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <main className="container py-8 space-y-8 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Image Meta-Generation</h1>
            <p className="text-muted-foreground">
              Upload your images and let AI generate metadata for them.
            </p>
          </div>

          <UploadZone />
          <ImageGrid />
        </main>

        <MetadataPanel
          metadata={selectedMetadata}
          onClose={() => setSelectedMetadata(null)}
        />
      </div>
    </QueryClientProvider>
  );
};

export default Index;