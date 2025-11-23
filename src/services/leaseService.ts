import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  listAll, 
  deleteObject 
} from 'firebase/storage';
import { db } from '@/config/firebase';
import logger from '@/utils/logger';
import type { LeaseData, InspectionItem } from '@/constants';

export interface SavedLease {
  id: string;
  userId: string;
  leaseData: LeaseData;
  documentUrl?: string;
  documentText?: string;
  intakeEvidence?: {
    [itemId: string]: {
      photos: string[];
      notes?: string;
      timestamp: Date;
    };
  };
  checkoutEvidence?: {
    [itemId: string]: {
      photos: string[];
      notes?: string;
      damageDetected?: boolean;
      timestamp: Date;
    };
  };
  defenseAnalyses?: Array<{
    id: number;
    query: string;
    timestamp: Date;
    result: any;
  }>;
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

class LeaseService {
  /**
   * Create a new lease
   */
  async createLease(
    userId: string,
    leaseData: LeaseData,
    documentUrl?: string,
    documentText?: string
  ): Promise<string> {
    try {
      const leaseId = `lease_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      logger.info('📝 Creating new lease', { leaseId, userId });

      const lease: SavedLease = {
        id: leaseId,
        userId,
        leaseData,
        documentUrl,
        documentText,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // DEBUG: Log what we're saving
      console.log('💾 SAVING TO FIREBASE:', {
        leaseId,
        hasInfo: !!(leaseData as any).info,
        infoLength: (leaseData as any).info?.length,
        infoSample: (leaseData as any).info?.[0],
        fullLeaseData: JSON.stringify(leaseData, null, 2)
      });

      const leaseRef = doc(db, 'leases', leaseId);
      await setDoc(leaseRef, {
        ...lease,
        createdAt: Timestamp.fromDate(lease.createdAt),
        updatedAt: Timestamp.fromDate(lease.updatedAt)
      });

      logger.success('✅ Lease created', { leaseId });
      return leaseId;
    } catch (error: any) {
      logger.error('❌ Failed to create lease', error);
      throw new Error(`Failed to create lease: ${error.message}`);
    }
  }

  /**
   * Get a specific lease
   */
  async getLease(leaseId: string): Promise<SavedLease | null> {
    try {
      logger.info('📖 Fetching lease', { leaseId });

      const leaseRef = doc(db, 'leases', leaseId);
      const leaseSnap = await getDoc(leaseRef);

      if (!leaseSnap.exists()) {
        logger.info('⚠️ Lease not found', { leaseId });
        return null;
      }

      const data = leaseSnap.data();
      const lease: SavedLease = {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as SavedLease;

      // DEBUG: Log what we're loading
      console.log('📥 LOADED FROM FIREBASE:', {
        leaseId,
        hasInfo: !!(lease.leaseData as any)?.info,
        infoLength: (lease.leaseData as any)?.info?.length,
        infoSample: (lease.leaseData as any)?.info?.[0],
        leaseDataKeys: Object.keys(lease.leaseData || {})
      });

      logger.success('✅ Lease fetched', { leaseId });
      return lease;
    } catch (error: any) {
      logger.error('❌ Failed to fetch lease', error);
      throw new Error(`Failed to fetch lease: ${error.message}`);
    }
  }

  /**
   * Get all leases for a user
   */
  async getUserLeases(userId: string): Promise<SavedLease[]> {
    try {
      logger.info('📖 Fetching user leases', { userId });

      const leasesRef = collection(db, 'leases');
      const q = query(
        leasesRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const leases: SavedLease[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leases.push({
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as SavedLease);
      });

      logger.success('✅ User leases fetched', { count: leases.length });
      return leases;
    } catch (error: any) {
      logger.error('❌ Failed to fetch user leases', error);
      throw new Error(`Failed to fetch user leases: ${error.message}`);
    }
  }

  /**
   * Save intake evidence (photos)
   * FIXED: 2025-11-22 - Removed undefined notes field
   */
  async saveIntakeEvidence(
    leaseId: string,
    itemId: string,
    photos: string[],
    notes?: string
  ): Promise<void> {
    try {
      logger.info('📸 [FIXED VERSION] Saving intake evidence', { leaseId, itemId, photosCount: photos.length });

      const leaseRef = doc(db, 'leases', leaseId);
      
      // CRITICAL: Build evidence object WITHOUT any undefined values
      // Firestore will reject the entire update if ANY field is undefined
      const evidence: Record<string, any> = {
        photos: photos,
        timestamp: Timestamp.fromDate(new Date())
      };

      // Only add notes field if it actually has a value
      if (notes !== undefined && notes !== null && notes !== '') {
        evidence.notes = notes;
      }

      logger.info('📦 Evidence object (no undefined values)', evidence);

      await updateDoc(leaseRef, {
        [`intakeEvidence.${itemId}`]: evidence,
        updatedAt: Timestamp.fromDate(new Date())
      });

      logger.success('✅ Intake evidence saved');
    } catch (error: any) {
      logger.error('❌ Failed to save intake evidence', error);
      throw new Error(`Failed to save intake evidence: ${error.message}`);
    }
  }

  /**
   * Save checkout evidence (photos + damage detection + AI analysis + process state)
   */
  async saveCheckoutEvidence(
    leaseId: string,
    itemId: string,
    photos: string[],
    damageDetected: boolean,
    analysis?: any,
    notes?: string
  ): Promise<void> {
    try {
      logger.info('📸 Saving checkout evidence', { leaseId, itemId, photosCount: photos.length });

      const leaseRef = doc(db, 'leases', leaseId);
      const evidence: any = {
        photos,
        damageDetected,
        timestamp: Timestamp.fromDate(new Date()),
        itemId,
        itemName: itemId // Will be overwritten if analysis has better name
      };

      // Add complete AI analysis if provided (includes all model outputs)
      if (analysis) {
        const analysisData: any = {
          // Core analysis
          hasDamage: analysis.hasDamage,
          severity: analysis.severity,
          description: analysis.description,
          
          // Detailed findings
          damageTypes: analysis.damageTypes || [],
          specificIssues: analysis.specificIssues || [],
          
          // Process tracking
          verifiedPairs: analysis.verifiedPairs || [],
          uploadProgress: analysis.uploadProgress || {
            uploaded: photos.length,
            total: photos.length,
            complete: true
          },
          
          // Metadata
          analyzedAt: Timestamp.fromDate(new Date()),
          modelVersion: 'llama-vision-4',
          analysisType: analysis.stateGrade ? 'state_deterioration' : 'damage_detection',
          photosAnalyzed: analysis.photosAnalyzed || photos.length
        };
        
        // Only add fields if they exist (Firestore doesn't allow undefined)
        if (analysis.stateGrade !== undefined) analysisData.stateGrade = analysis.stateGrade;
        if (analysis.isNormalWear !== undefined) analysisData.isNormalWear = analysis.isNormalWear;
        if (analysis.tenantLiable !== undefined) analysisData.tenantLiable = analysis.tenantLiable;
        if (analysis.liabilityReasoning !== undefined) analysisData.liabilityReasoning = analysis.liabilityReasoning;
        if (analysis.repairEstimate !== undefined) analysisData.repairEstimate = analysis.repairEstimate;
        if (analysis.sameLocation !== undefined) analysisData.sameLocation = analysis.sameLocation;
        if (analysis.locationConfidence !== undefined) analysisData.locationConfidence = analysis.locationConfidence;
        
        evidence.analysis = analysisData;
      }

      // Only add notes if provided
      if (notes !== undefined && notes !== null && notes !== '') {
        evidence.notes = notes;
      }

      // Process state
      evidence.processState = {
        photosUploaded: photos.length,
        analysisComplete: !!analysis,
        lastUpdated: Timestamp.fromDate(new Date())
      };

      await updateDoc(leaseRef, {
        [`checkoutEvidence.${itemId}`]: evidence,
        updatedAt: Timestamp.fromDate(new Date()),
        'checkoutProgress.lastItem': itemId,
        'checkoutProgress.lastUpdated': Timestamp.fromDate(new Date())
      });

      logger.success('✅ Checkout evidence saved with complete analysis', {
        itemId,
        photos: photos.length,
        hasAnalysis: !!analysis,
        grade: analysis?.stateGrade
      });
    } catch (error: any) {
      logger.error('❌ Failed to save checkout evidence', error);
      throw new Error(`Failed to save checkout evidence: ${error.message}`);
    }
  }

  /**
   * Save defense analysis to lease
   */
  async saveDefenseAnalysis(
    leaseId: string,
    analysis: any
  ): Promise<void> {
    try {
      logger.info('💼 Saving defense analysis', { leaseId, analysisId: analysis.id });

      const leaseRef = doc(db, 'leases', leaseId);
      const lease = await this.getLease(leaseId);

      if (!lease) {
        throw new Error('Lease not found');
      }

      const defenseAnalyses = lease.defenseAnalyses || [];
      defenseAnalyses.push({
        ...analysis,
        timestamp: Timestamp.fromDate(new Date(analysis.timestamp))
      });

      await updateDoc(leaseRef, {
        defenseAnalyses: defenseAnalyses,
        updatedAt: Timestamp.fromDate(new Date())
      });

      logger.success('✅ Defense analysis saved');
    } catch (error: any) {
      logger.error('❌ Failed to save defense analysis', error);
      throw new Error(`Failed to save defense analysis: ${error.message}`);
    }
  }

  /**
   * Get defense analyses for a lease
   */
  async getDefenseAnalyses(leaseId: string): Promise<any[]> {
    try {
      const lease = await this.getLease(leaseId);
      if (!lease || !lease.defenseAnalyses) {
        return [];
      }

      return lease.defenseAnalyses.map((analysis: any) => ({
        ...analysis,
        timestamp: analysis.timestamp?.toDate() || new Date()
      }));
    } catch (error: any) {
      logger.error('❌ Failed to get defense analyses', error);
      return [];
    }
  }

  /**
   * Add chat message to lease history
   */
  async addChatMessage(
    leaseId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    try {
      logger.info('💬 Adding chat message', { leaseId, role });

      const leaseRef = doc(db, 'leases', leaseId);
      const lease = await this.getLease(leaseId);

      if (!lease) {
        throw new Error('Lease not found');
      }

      const chatHistory = lease.chatHistory || [];
      chatHistory.push({
        role,
        content,
        timestamp: new Date()
      });

      await updateDoc(leaseRef, {
        chatHistory: chatHistory.map(msg => ({
          ...msg,
          timestamp: Timestamp.fromDate(msg.timestamp)
        })),
        updatedAt: Timestamp.fromDate(new Date())
      });

      logger.success('✅ Chat message added');
    } catch (error: any) {
      logger.error('❌ Failed to add chat message', error);
      throw new Error(`Failed to add chat message: ${error.message}`);
    }
  }

  /**
   * Delete lease and all associated data
   */
  async deleteLease(leaseId: string, userId: string): Promise<void> {
    try {
      logger.info('🗑️ Deleting lease', { leaseId, userId });

      // Delete from Firestore
      const leaseRef = doc(db, 'leases', leaseId);
      await deleteDoc(leaseRef);

      // Delete all photos from Storage
      // Storage path: /users/{userId}/leases/{leaseId}/
      const storage = getStorage();
      const leaseStoragePath = `users/${userId}/leases/${leaseId}`;
      
      try {
        const storageRef = ref(storage, leaseStoragePath);
        const listResult = await listAll(storageRef);
        
        // Delete all files in all subdirectories
        const deletePromises: Promise<void>[] = [];
        
        // Delete files in root
        listResult.items.forEach(itemRef => {
          deletePromises.push(deleteObject(itemRef));
        });
        
        // Delete files in subdirectories (intake, checkout, etc.)
        for (const folderRef of listResult.prefixes) {
          const folderContents = await listAll(folderRef);
          folderContents.items.forEach(itemRef => {
            deletePromises.push(deleteObject(itemRef));
          });
        }
        
        await Promise.all(deletePromises);
        logger.success(`✅ Deleted ${deletePromises.length} files from Storage`);
      } catch (storageError: any) {
        // Storage deletion might fail if no files exist, that's okay
        logger.info('⚠️ Storage deletion warning', storageError);
      }

      logger.success('✅ Lease deleted successfully');
    } catch (error: any) {
      logger.error('❌ Failed to delete lease', error);
      throw new Error(`Failed to delete lease: ${error.message}`);
    }
  }

  /**
   * Update lease status
   */
  async updateLeaseStatus(
    leaseId: string,
    status: 'active' | 'completed' | 'archived'
  ): Promise<void> {
    try {
      logger.info('🔄 Updating lease status', { leaseId, status });

      const leaseRef = doc(db, 'leases', leaseId);
      await updateDoc(leaseRef, {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      });

      logger.success('✅ Lease status updated');
    } catch (error: any) {
      logger.error('❌ Failed to update lease status', error);
      throw new Error(`Failed to update lease status: ${error.message}`);
    }
  }

  /**
   * Update lease data
   */
  async updateLeaseData(
    leaseId: string,
    leaseData: Partial<LeaseData>
  ): Promise<void> {
    try {
      logger.info('🔄 Updating lease data', { leaseId });

      const leaseRef = doc(db, 'leases', leaseId);
      await updateDoc(leaseRef, {
        leaseData,
        updatedAt: Timestamp.fromDate(new Date())
      });

      logger.success('✅ Lease data updated');
    } catch (error: any) {
      logger.error('❌ Failed to update lease data', error);
      throw new Error(`Failed to update lease data: ${error.message}`);
    }
  }
}

export default new LeaseService();
