// lib/imageUpload.ts - Upload utility functions
export interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
  format: string;
  uploadedAt: string;
  dimensions?: { width: number; height: number };
}

export async function uploadImages(files: FileList): Promise<UploadedImage[]> {
  const formData = new FormData();
  
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  try {
    const response = await fetch('/api/upload/images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.images || [];
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export async function getUploadedImages(): Promise<UploadedImage[]> {
  try {
 const response = await fetch('/api/upload/images');
    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }
    const result = await response.json();
    return result.images || [];
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}