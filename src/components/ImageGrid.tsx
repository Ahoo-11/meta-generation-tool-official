import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSession } from '@supabase/auth-helpers-react';

interface Image {
  id: string;
  url: string;
  title: string;
}

export function ImageGrid() {
  const [images, setImages] = useState<Image[]>([]);
  const session = useSession();

  useEffect(() => {
    const storedImages = localStorage.getItem('userImages');
    if (storedImages && session?.user) {
      const parsedImages = JSON.parse(storedImages);
      // Only show images for the current user
      setImages(parsedImages.filter((img: Image) => 
        img.userId === session.user.id
      ));
    }
  }, [session]);

  if (!session) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
      {images.map((image) => (
        <div
          key={image.id}
          className={cn(
            "relative aspect-square rounded-lg overflow-hidden hover-scale",
            "group cursor-pointer"
          )}
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
  );
}