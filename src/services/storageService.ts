import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';
import logger from '@/utils/logger';

class StorageService {
  /**
   * Upload an image to Firebase Storage
   */
  async uploadImage(
    file: File,
    userId: string,
    leaseId: string,
    category: 'intake' | 'checkout' | 'document',
    itemId?: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const path = itemId 
        ? `users/${userId}/leases/${leaseId}/${category}/${itemId}/${fileName}`
        : `users/${userId}/leases/${leaseId}/${category}/${fileName}`;

      logger.info('📤 Uploading image to Firebase Storage', { path });

      const fileRef = storageRef(storage, path);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      logger.success('✅ Image uploaded successfully', { url: downloadURL });
      return downloadURL;
    } catch (error: any) {
      logger.error('❌ Image upload failed', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(
    files: File[],
    userId: string,
    leaseId: string,
    category: 'intake' | 'checkout' | 'document',
    itemId?: string
  ): Promise<string[]> {
    try {
      logger.info('📤 Uploading multiple images', { count: files.length });

      const uploadPromises = files.map(file => 
        this.uploadImage(file, userId, leaseId, category, itemId)
      );

      const urls = await Promise.all(uploadPromises);
      logger.success('✅ All images uploaded', { count: urls.length });
      return urls;
    } catch (error: any) {
      logger.error('❌ Batch upload failed', error);
      throw error;
    }
  }

  /**
   * Upload lease document (PDF, image, text)
   */
  async uploadDocument(
    file: File,
    userId: string,
    leaseId: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const path = `users/${userId}/leases/${leaseId}/documents/${fileName}`;

      logger.info('📤 Uploading document to Firebase Storage', { path });

      const fileRef = storageRef(storage, path);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      logger.success('✅ Document uploaded successfully', { url: downloadURL });
      return downloadURL;
    } catch (error: any) {
      logger.error('❌ Document upload failed', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  /**
   * Delete an image from Firebase Storage
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      logger.info('🗑️ Deleting image from Firebase Storage', { url: imageUrl });

      const fileRef = storageRef(storage, imageUrl);
      await deleteObject(fileRef);

      logger.success('✅ Image deleted successfully');
    } catch (error: any) {
      logger.error('❌ Image deletion failed', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }
}

export default new StorageService();
