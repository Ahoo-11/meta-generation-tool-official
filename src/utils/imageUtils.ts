import { toast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 384; // Maximum width or height

export const validateImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} is not an image file`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${file.name} is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }
};

export const compressImage = async (file: File): Promise<{ base64Data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Use better quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image with white background to handle transparency
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const base64Data = canvas.toDataURL(file.type, 0.9);
        const base64WithoutPrefix = base64Data.split(',')[1];

        resolve({
          base64Data: base64WithoutPrefix,
          mimeType: file.type
        });
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${file.name}`));
      };
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
};