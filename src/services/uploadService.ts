import { supabase } from '@/integrations/supabase/client';
import { compressImage, validateImageFile } from '@/utils/imageUtils';

export const uploadImage = async (file: File) => {
  validateImageFile(file);
  
  // First check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Please sign in to upload images');
  }

  const compressedFile = await compressImage(file);
  const formData = new FormData();
  formData.append('file', compressedFile);

  // Upload to R2
  const response = await supabase.functions.invoke('upload-image', {
    body: formData,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.data.success) {
    throw new Error(response.data.error || 'Upload failed');
  }

  // Trigger metadata analysis
  const imageUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${response.data.filePath}`;
  const analysisResponse = await supabase.functions.invoke('analyze-image', {
    body: { imageUrl },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!analysisResponse.data.success) {
    console.error('Metadata analysis failed:', analysisResponse.data.error);
    throw new Error('Metadata generation failed');
  }

  return response.data;
};