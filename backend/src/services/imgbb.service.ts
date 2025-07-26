import { config } from '../config/app.js';

interface ImgBBUploadResponse {
  data: {
    id: string;
    title: string;
    url: string;
    display_url: string;
    size: number;
    delete_url: string;
    time: string;
  };
  success: boolean;
  status: number;
}

interface ImgBBUploadResult {
  url: string;
  deleteUrl: string;
  id: string;
}

export class ImgBBService {
  private static readonly API_URL = 'https://api.imgbb.com/1/upload';

  /**
   * Upload a single image to ImgBB
   */
  static async uploadImage(imageBuffer: Buffer, filename: string): Promise<ImgBBUploadResult> {
    try {
      if (!config.IMGBB_API_KEY) {
        throw new Error('ImgBB API key not configured');
      }

      const formData = new FormData();
      formData.append('image', new Blob([imageBuffer]), filename);
      formData.append('key', config.IMGBB_API_KEY);

      if (config.IMGBB_EXPIRATION) {
        formData.append('expiration', config.IMGBB_EXPIRATION);
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`ImgBB upload failed: ${response.status} ${response.statusText}`);
      }

      const result: ImgBBUploadResponse = await response.json();

      if (!result.success) {
        throw new Error(`ImgBB upload failed: ${result.status}`);
      }

      return {
        url: result.data.url,
        deleteUrl: result.data.delete_url,
        id: result.data.id
      };
    } catch (error) {
      console.error('❌ ImgBB upload failed:', error);
      throw new Error(`Failed to upload image to ImgBB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple images to ImgBB
   */
  static async uploadMultipleImages(
    imageBuffers: Buffer[],
    filenames: string[]
  ): Promise<ImgBBUploadResult[]> {
    try {
      const uploadPromises = imageBuffers.map((buffer, index) =>
        this.uploadImage(buffer, filenames[index] || `image-${index}.jpg`)
      );

      const results = await Promise.all(uploadPromises);
      console.log(`✅ Successfully uploaded ${results.length} images to ImgBB`);

      return results;
    } catch (error) {
      console.error('❌ Multiple image upload failed:', error);
      throw new Error(`Failed to upload multiple images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an image from ImgBB using delete URL
   */
  static async deleteImage(deleteUrl: string): Promise<boolean> {
    try {
      const response = await fetch(deleteUrl, {
        method: 'DELETE'
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to delete image from ImgBB:', error);
      return false;
    }
  }
} 
