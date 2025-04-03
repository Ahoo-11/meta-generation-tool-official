import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<string> => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        } else {
          reject(new Error('Failed to convert compressed image to base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    throw error;
  }
}; 