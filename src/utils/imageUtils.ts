import imageCompression from 'browser-image-compression';

const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 384,
  useWebWorker: true,
  preserveExif: true,
};

export const compressImage = async (file: File) => {
  try {
    const compressedFile = await imageCompression(file, options);
    return new File([compressedFile], file.name, { type: compressedFile.type });
  } catch (error) {
    console.error('Compression error:', error);
    throw new Error('Failed to compress image');
  }
};

export const validateImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Please upload only image files.');
  }
  return true;
};