import { defineStore } from 'pinia';
import type { User, LeaseData, Evidence } from '@/constants';
import leaseService from '@/services/leaseService';
import type { SavedLease } from '@/services/leaseService';
import logger from '@/utils/logger';

interface LeaseState {
  user: User | null;
  leaseData: LeaseData | null;
  currentLeaseId: string | null;
  documentText: string | null;
  intakeEvidence: Record<string, Evidence>;
  checkoutEvidence: Record<string, any>;
  activeStage: string;
  unlockedStages: number;
  userLeases: SavedLease[];
}

export const useLeaseStore = defineStore('lease', {
  state: (): LeaseState => ({
    user: null,
    leaseData: null,
    currentLeaseId: null,
    documentText: null,
    intakeEvidence: {},
    checkoutEvidence: {},
    activeStage: 'review',
    unlockedStages: 0,
    userLeases: [],
  }),

  actions: {
    setUser(user: User) {
      this.user = user;
    },

    setLeaseData(data: LeaseData) {
      this.leaseData = data;
      this.activeStage = 'review';
      this.unlockedStages = 0;
    },

    setIntakeEvidence(evidence: Record<string, Evidence>) {
      this.intakeEvidence = evidence;
    },

    async unlockStage(stageId: string) {
      const stages = ['review', 'intake', 'chat', 'checkout', 'claims'];
      const idx = stages.findIndex(s => s === stageId);
      if (idx > this.unlockedStages) {
        this.unlockedStages = idx;
      }
      this.activeStage = stageId;
      
      // Auto-save progress to Firebase
      await this.saveProgress();
    },

    async setActiveStage(stageId: string) {
      this.activeStage = stageId;
      
      // Auto-save when switching stages
      await this.saveProgress();
    },
    
    async saveProgress() {
      if (!this.currentLeaseId || !this.leaseData) return;
      
      try {
        const { auth } = await import('@/config/firebase');
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        // Update lease with current progress
        await leaseService.updateLeaseData(this.currentLeaseId, {
          ...this.leaseData,
          activeStage: this.activeStage,
          unlockedStages: this.unlockedStages
        } as any);
      } catch (error) {
        console.error('Failed to save progress', error);
      }
    },

    async saveCurrentLease(documentUrl?: string, documentText?: string) {
      if (!this.user || !this.leaseData) return;

      // Get Firebase user ID
      const { auth } = await import('@/config/firebase');
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const leaseId = await leaseService.createLease(
        userId,
        this.leaseData,
        documentUrl,
        documentText
      );
      this.currentLeaseId = leaseId;
      
      // Reload user leases to include the new one
      await this.loadUserLeases();
      
      return leaseId;
    },

    async loadUserLeases() {
      if (!this.user) return;

      // Get Firebase user ID
      const { auth } = await import('@/config/firebase');
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const leases = await leaseService.getUserLeases(userId);
      this.userLeases = leases;
    },

    async loadLease(leaseId: string) {
      const lease = await leaseService.getLease(leaseId);
      if (lease) {
        this.currentLeaseId = leaseId;
        this.leaseData = lease.leaseData;
        this.documentText = lease.documentText || null;
        
        // DEBUG: Log the entire lease object
        logger.info('🔍 DEBUG: Full lease data', lease);
        logger.info('🔍 DEBUG: intakeEvidence exists?', { 
          exists: !!lease.intakeEvidence,
          keys: lease.intakeEvidence ? Object.keys(lease.intakeEvidence) : []
        });
        
        // Restore progress state
        this.activeStage = (lease.leaseData as any).activeStage || 'review';
        this.unlockedStages = (lease.leaseData as any).unlockedStages || 0;
        
        // Convert Firebase evidence format to app Evidence format with all photos
        const evidence: Record<string, Evidence> = {};
        if (lease.intakeEvidence) {
          logger.info('📸 Loading intake photos from Firebase', { 
            itemCount: Object.keys(lease.intakeEvidence).length 
          });
          
          Object.entries(lease.intakeEvidence).forEach(([key, val]) => {
            logger.info(`🔍 Processing item: ${key}`, val);
            
            if (val.photos && val.photos.length > 0 && val.photos[0]) {
              evidence[key] = {
                captured: true,
                timestamp: val.timestamp,
                img: val.photos[0] || '', // First photo as primary
                photos: val.photos, // All photos from Firebase
                photoCount: val.photos.length
              };
              
              logger.info(`📷 Loaded ${val.photos.length} photo(s) for ${key}`, {
                urls: val.photos
              });
            } else {
              logger.info(`⚠️ No photos found for ${key}`, val);
            }
          });
          
          logger.success(`✅ Loaded photos for ${Object.keys(evidence).length} items`);
        } else {
          logger.info('⚠️ No intakeEvidence in lease data');
        }
        
        this.intakeEvidence = evidence;
        logger.info('🔍 Final intakeEvidence state', this.intakeEvidence);
        
        // Load checkout evidence if available
        if (lease.checkoutEvidence) {
          logger.info('📸 Loading checkout photos from Firebase', {
            itemCount: Object.keys(lease.checkoutEvidence).length
          });
          this.checkoutEvidence = lease.checkoutEvidence;
          logger.success(`✅ Loaded checkout evidence for ${Object.keys(lease.checkoutEvidence).length} items`);
        } else {
          this.checkoutEvidence = {};
        }
      }
    },

    async saveIntakePhoto(itemId: string, photoUrl: string) {
      if (!this.currentLeaseId) return;

      // Get existing photos for this item from Firebase
      const lease = await leaseService.getLease(this.currentLeaseId);
      const existingPhotos = lease?.intakeEvidence?.[itemId]?.photos || [];
      
      // Append new photo to existing list
      const allPhotos = [...existingPhotos, photoUrl];

      // Update local state with all photos
      this.intakeEvidence[itemId] = {
        captured: true,
        timestamp: new Date(),
        img: allPhotos[0] || photoUrl, // First photo as primary
        photos: allPhotos,
        photoCount: allPhotos.length
      };

      // Save all photos to Firebase (no notes parameter to avoid undefined)
      await leaseService.saveIntakeEvidence(
        this.currentLeaseId,
        itemId,
        allPhotos,
        undefined  // Explicitly pass undefined so the function can handle it
      );
    },

    async saveCheckoutPhoto(itemId: string, photoUrl: string, damageDetected: boolean, analysis?: any) {
      if (!this.currentLeaseId) return;

      await leaseService.saveCheckoutEvidence(
        this.currentLeaseId,
        itemId,
        [photoUrl],
        damageDetected,
        analysis
      );
    },

    reset() {
      this.leaseData = null;
      this.currentLeaseId = null;
      this.intakeEvidence = {};
      this.activeStage = 'review';
      this.unlockedStages = 0;
    },
  },
});
