import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { MetadataPanel } from './MetadataPanel';

interface Image {
  id: string;
  url: string;
  title: string;
  status: 'processing' | 'complete' | 'error';
  metadata: {
    title: string;
    category: string;
    keywords: string[];
  } | null;
}

export function ImageGrid() {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(image => ({
        id: image.id,
        url: `${import.meta.env.VITE_R2_PUBLIC_URL}/${image.file_path}`,
        title: image.title,
        status: (image.status as 'processing' | 'complete' | 'error') || 'processing',
        metadata: image.metadata as Image['metadata'],
      }));
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
        {images.map((image) => (
          <div
            key={image.id}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden hover-scale",
              "group cursor-pointer"
            )}
            onClick={() => setSelectedImage(image)}
          >
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white text-sm font-medium truncate">
                  {image.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <MetadataPanel
        metadata={selectedImage?.metadata}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
}