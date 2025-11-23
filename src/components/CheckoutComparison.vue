<template>
  <div class="max-w-7xl mx-auto min-h-[600px] flex flex-col lg:flex-row gap-4 lg:gap-6 animate-in zoom-in-95 p-4">
    <!-- Sidebar Guidance -->
    <div class="w-full lg:w-64 bg-slate-900 rounded-2xl p-4 lg:p-6 text-white">
      <h2 class="font-bold text-lg mb-6 flex items-center gap-2">
        <LogOut :size="20" /> Exit Review
      </h2>
      <div class="space-y-2">
        <button 
          v-for="(item, i) in items" 
          :key="i"
          @click="jumpToItem(i)"
          :class="[
            'w-full text-sm p-3 rounded-lg flex justify-between items-center transition-all cursor-pointer hover:scale-105',
            i === step ? 'bg-emerald-600 font-bold shadow-lg' : 
            isItemCompleted(item.id) ? 'text-white bg-emerald-700 hover:bg-emerald-600' :
            'text-slate-400 bg-slate-800 hover:bg-slate-700'
          ]"
        >
          <span>{{ item.name }}</span>
          <CheckCircle v-if="isItemCompleted(item.id)" :size="16" class="text-emerald-300" />
          <span v-else-if="i === step" class="text-xs bg-white/20 px-2 py-0.5 rounded">Current</span>
        </button>
      </div>
    </div>

    <!-- Main Comparison Area -->
    <div class="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[500px]">
      <div class="p-4 border-b bg-slate-50 flex justify-between items-center">
        <h3 class="font-bold text-slate-800 text-lg">{{ currentItem?.name }}: Condition Check</h3>
        <div class="text-xs font-mono text-slate-400">ID: {{ currentItem?.id.toUpperCase() }}</div>
      </div>

      <!-- Paired Photo Upload Grid -->
      <div class="flex-1 p-6 overflow-y-auto">
        <div class="mb-4 text-center">
          <p class="text-sm text-slate-600">
            Upload checkout photos to match each intake photo
          </p>
          <p class="text-xs text-slate-400 mt-1">
            {{ uploadedPairsCount }} / {{ intakePhotoCount }} photos uploaded
          </p>
        </div>

        <!-- Photo Pairs Grid -->
        <div class="space-y-4">
          <div 
            v-for="(intakePhoto, idx) in intakePhotos" 
            :key="idx"
            class="bg-slate-50 rounded-xl p-4 border-2 transition-all"
            :class="[
              idx === currentPairIndex ? 'border-indigo-500 shadow-lg' : 'border-slate-200',
              checkoutPhotos[idx] ? 'bg-emerald-50' : ''
            ]"
          >
            <div class="flex gap-4 items-center">
              <!-- Intake Photo (Left) -->
              <div class="flex-1">
                <p class="text-xs font-bold text-slate-600 mb-2">INTAKE PHOTO {{ idx + 1 }}</p>
                <div class="aspect-video bg-slate-100 rounded-lg overflow-hidden border-2 border-emerald-500 relative">
                  <img :src="intakePhoto" class="w-full h-full object-cover" />
                  <div class="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                    ✓ ORIGINAL
                  </div>
                </div>
              </div>

              <!-- Arrow -->
              <div class="flex-shrink-0 text-slate-400">
                →
              </div>

              <!-- Checkout Photo (Right) -->
              <div class="flex-1">
                <p class="text-xs font-bold text-slate-600 mb-2">CHECKOUT PHOTO {{ idx + 1 }}</p>
                <div 
                  v-if="checkoutPhotos[idx]"
                  @click="currentPairIndex = idx"
                  class="aspect-video bg-black rounded-lg overflow-hidden border-2 border-blue-500 relative cursor-pointer hover:border-indigo-500 transition-all group"
                >
                  <img :src="checkoutPhotos[idx]" class="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                  <div class="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                    ✓ UPLOADED
                  </div>
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <span class="text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to view
                    </span>
                  </div>
                </div>
                <div 
                  v-else
                  @click="startUploadForPair(idx)"
                  :class="[
                    'aspect-video rounded-lg overflow-hidden border-2 flex items-center justify-center cursor-pointer transition-all',
                    idx === currentPairIndex && isValidating ? 'border-blue-500 bg-blue-50' : 'border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-100'
                  ]"
                >
                  <div v-if="idx === currentPairIndex && isValidating" class="text-center">
                    <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p class="text-xs text-blue-600 font-bold">Validating...</p>
                  </div>
                  <div v-else class="text-center">
                    <div class="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Camera :size="20" />
                    </div>
                    <p class="text-xs font-medium text-indigo-600">Upload Photo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input ref="fileInput" type="file" class="hidden" @change="handleFile" accept="image/*" />


      <!-- AI Analysis Panel -->
      <div class="p-6 border-t bg-white min-h-[140px]">
        <!-- No photos uploaded - show skip option -->
        <div v-if="uploadedPairsCount === 0" class="space-y-3">
          <p class="text-center text-slate-400 text-sm">
            Upload checkout photos to match each intake photo, or skip this item.
          </p>
          <button 
            @click="skipItem"
            class="w-full bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 transition-all"
          >
            Skip Item →
          </button>
        </div>
        
        <!-- Show analyze button only when all pairs uploaded -->
        <div v-else-if="!analysis && allPairsUploaded" class="space-y-3">
          <div class="text-center text-sm text-emerald-600 mb-3 font-bold">
            ✅ All {{ intakePhotoCount }} photo(s) uploaded!
          </div>
          
          <!-- Analyze All Button -->
          <button 
            @click="runBatchAnalysis"
            :disabled="isAnalyzing"
            class="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg disabled:opacity-50"
          >
            <Loader2 v-if="isAnalyzing" class="animate-spin" />
            <Search v-else :size="20" />
            {{ isAnalyzing ? 'Analyzing...' : 'Analyze All Photos' }}
          </button>
        </div>
        
        <!-- Show progress if not all uploaded -->
        <div v-else-if="!analysis" class="space-y-3">
          <div class="text-center text-slate-600 text-sm">
            <p class="mb-2">📸 {{ uploadedPairsCount }} / {{ intakePhotoCount }} photos uploaded</p>
            <p class="text-xs text-slate-400">Upload remaining photos or skip to next item</p>
          </div>
          
          <!-- Navigation between uploaded photos -->
          <div v-if="uploadedPairsCount > 0" class="flex justify-center gap-2 mb-3">
            <template v-for="(photo, idx) in checkoutPhotos" :key="idx">
              <button
                v-if="photo !== null"
                @click="currentPairIndex = idx"
                :class="[
                  'px-3 py-1 rounded-lg text-sm font-bold transition-all',
                  idx === currentPairIndex ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                ]"
              >
                {{ idx + 1 }}
              </button>
            </template>
          </div>
          
          <!-- Skip button for partial uploads -->
          <button 
            @click="skipItem"
            class="w-full bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 transition-all"
          >
            Skip to Next Item →
          </button>
        </div>
        
        <!-- Analysis Results -->
        <div v-else class="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-in slide-in-from-bottom-4">
          <div class="mb-4">
            <h4 class="font-bold text-slate-800 flex items-center gap-2 mb-2">
              State Deterioration: 
              <span :class="[
                'text-2xl font-bold px-3 py-1 rounded',
                analysis.stateGrade === 'A+' || analysis.stateGrade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                analysis.stateGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                analysis.stateGrade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                analysis.stateGrade === 'D' ? 'bg-orange-100 text-orange-700' :
                'bg-rose-100 text-rose-700'
              ]">
                {{ analysis.stateGrade || analysis.severity?.toUpperCase() }}
              </span>
            </h4>
            <p class="text-sm text-slate-600 mb-3">{{ analysis.description }}</p>
            
            <!-- Specific Issues -->
            <div v-if="analysis.specificIssues && analysis.specificIssues.length > 0" class="bg-white rounded-lg p-3 mb-3">
              <p class="text-xs font-bold text-slate-700 mb-2">Detected Issues:</p>
              <ul class="space-y-1">
                <li v-for="(issue, idx) in analysis.specificIssues" :key="idx" class="text-xs text-slate-600 flex items-start gap-2">
                  <span class="text-rose-500">•</span>
                  <span>{{ issue }}</span>
                </li>
              </ul>
            </div>
            
            <!-- Damage Types -->
            <div v-if="analysis.damageTypes && analysis.damageTypes.length > 0" class="flex flex-wrap gap-1 mb-3">
              <span v-for="type in analysis.damageTypes" :key="type" class="text-xs bg-rose-50 text-rose-700 px-2 py-1 rounded">
                {{ type }}
              </span>
            </div>
          </div>
          
          <div class="flex gap-2">
            <button @click="resetPhoto" class="flex-1 text-sm font-medium text-slate-500 hover:text-slate-800 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">
              Reset & Retake
            </button>
            <button @click="nextItem" class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700">
              Confirm & Next Item
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { LogOut, CheckCircle, Clock, Camera, Loader2, Search } from 'lucide-vue-next';
import type { InspectionItem, Evidence, DamageAnalysis } from '@/constants';
import togetherService from '@/services/togetherService';
import storageService from '@/services/storageService';
import leaseService from '@/services/leaseService';
import { useLeaseStore } from '@/stores/leaseStore';
import { auth } from '@/config/firebase';
import logger from '@/utils/logger';
import Swal from 'sweetalert2';

const props = defineProps<{
  items: InspectionItem[];
  intakeEvidence: Record<string, Evidence>;
}>();

const emit = defineEmits<{
  complete: []
}>();

const step = ref(0);
const newImg = ref<string | null>(null);
const analysis = ref<DamageAnalysis | null>(null);
const isAnalyzing = ref(false);
const isValidating = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const currentIntakePhotoIndex = ref(0);

const currentItem = computed(() => props.items[step.value]);

// Get all intake photos for current item
const intakePhotos = computed(() => {
  if (!currentItem.value) return [];
  const evidence = props.intakeEvidence?.[currentItem.value.id];
  const photos = evidence?.photos || (evidence?.img ? [evidence.img] : []);
  
  console.log('📸 Intake photos for', currentItem.value.id, ':', photos.length, 'photos');
  if (photos.length > 0) {
    console.log('  First photo:', photos[0]?.substring(0, 100) + '...');
  }
  
  return photos;
});

const intakePhotoCount = computed(() => intakePhotos.value.length);

const currentIntakePhoto = computed(() => {
  return intakePhotos.value[currentIntakePhotoIndex.value] || null;
});

const oldImg = computed(() => currentIntakePhoto.value || "");

const cycleIntakePhoto = () => {
  if (intakePhotoCount.value > 1) {
    currentIntakePhotoIndex.value = (currentIntakePhotoIndex.value + 1) % intakePhotoCount.value;
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

// Paired upload system: one checkout photo per intake photo
const checkoutPhotos = ref<(string | null)[]>([]);
const currentPairIndex = ref(0);

// Initialize checkout photos array with nulls
const initializeCheckoutPhotos = () => {
  checkoutPhotos.value = new Array(intakePhotoCount.value).fill(null);
};

// Count how many pairs have been uploaded
const uploadedPairsCount = computed(() => {
  return checkoutPhotos.value.filter(photo => photo !== null).length;
});

// Check if all pairs are uploaded
const allPairsUploaded = computed(() => {
  return uploadedPairsCount.value === intakePhotoCount.value && intakePhotoCount.value > 0;
});

// Check if an item is completed (has analysis or was skipped)
const isItemCompleted = (itemId: string) => {
  const store = useLeaseStore();
  const evidence = store.checkoutEvidence?.[itemId];
  
  if (!evidence) return false;
  
  // Check if processState indicates completion (most reliable)
  if (evidence.processState?.analysisComplete === true) {
    console.log(`✅ Item ${itemId} is completed (analysisComplete: true)`);
    return true;
  }
  
  // Check if analysis exists and is complete
  if (evidence.analysis) {
    const isComplete = evidence.analysis.description !== 'Checkout in progress';
    console.log(`${isComplete ? '✅' : '⏳'} Item ${itemId} analysis: ${evidence.analysis.description?.substring(0, 50)}...`);
    return isComplete;
  }
  
  console.log(`❌ Item ${itemId} not completed`);
  return false;
};

// Jump to a specific item
const jumpToItem = (index: number) => {
  if (index >= 0 && index < props.items.length && props.items[index]) {
    step.value = index;
    logger.info(`📍 Jumped to item: ${props.items[index].name}`);
  }
};

// Load existing progress from Firebase
const loadProgressFromFirebase = async () => {
  const store = useLeaseStore();
  if (!store.currentLeaseId) return;
  
  try {
    // Always load lease data from Firebase to ensure we have all items
    logger.info('📥 Loading lease data from Firebase...');
    const lease = await leaseService.getLease(store.currentLeaseId);
    
    if (lease && lease.checkoutEvidence) {
      // Use type assertion to handle Firebase data structure
      store.checkoutEvidence = lease.checkoutEvidence as any;
      logger.success('✅ Loaded checkout evidence from Firebase', {
        items: Object.keys(lease.checkoutEvidence).length
      });
      
      // Log details of loaded checkout evidence
      console.log('📦 Checkout Evidence Details:');
      Object.entries(lease.checkoutEvidence).forEach(([itemId, evidence]: [string, any]) => {
        console.log(`  ${itemId}:`);
        console.log(`    - Photos: ${evidence.photos?.length || 0}`);
        console.log(`    - Analysis Complete: ${evidence.processState?.analysisComplete || false}`);
        console.log(`    - Has Analysis: ${!!evidence.analysis}`);
      });
    } else {
      logger.info('⚠️ No checkout evidence found in Firebase');
    }
    
    if (lease && lease.intakeEvidence) {
      // Use type assertion to handle Firebase data structure
      store.intakeEvidence = lease.intakeEvidence as any;
      logger.success('✅ Loaded intake evidence from Firebase', {
        items: Object.keys(lease.intakeEvidence).length
      });
      
      // Log details of loaded intake evidence
      console.log('📦 Intake Evidence Details:');
      Object.entries(lease.intakeEvidence).forEach(([itemId, evidence]: [string, any]) => {
        console.log(`  ${itemId}: ${evidence.photos?.length || 0} photos`);
        if (evidence.photos && evidence.photos.length > 0) {
          console.log(`    First photo: ${evidence.photos[0].substring(0, 80)}...`);
        }
      });
    } else {
      logger.info('⚠️ No intake evidence found in Firebase');
    }
    
    // Now restore UI state for current item if it exists
    if (!currentItem.value) return;
    
    // Check if there's existing checkout evidence for this item
    if (store.checkoutEvidence && store.checkoutEvidence[currentItem.value.id]) {
      const evidence = store.checkoutEvidence[currentItem.value.id];
      
      // Restore photos
      if (evidence.photos && Array.isArray(evidence.photos)) {
        // Initialize array with nulls
        checkoutPhotos.value = new Array(intakePhotoCount.value).fill(null);
        
        // Fill in the uploaded photos
        evidence.photos.forEach((photoUrl: string, idx: number) => {
          if (idx < checkoutPhotos.value.length) {
            checkoutPhotos.value[idx] = photoUrl;
          }
        });
        
        // Restore analysis if it exists
        if (evidence.analysis && evidence.analysis.description !== 'Checkout in progress') {
          analysis.value = evidence.analysis;
          logger.info('✅ Loaded saved analysis from Firebase');
        }
        
        logger.info('✅ Loaded checkout progress from Firebase', {
          uploaded: uploadedPairsCount.value,
          total: intakePhotoCount.value,
          hasAnalysis: !!analysis.value
        });
        
        // Set current pair to first empty slot
        const firstEmpty = checkoutPhotos.value.findIndex(photo => photo === null);
        if (firstEmpty !== -1) {
          currentPairIndex.value = firstEmpty;
        }
      }
    }
  } catch (error) {
    logger.error('Failed to load progress', error);
  }
};

// Initialize on mount
onMounted(async () => {
  initializeCheckoutPhotos();
  await loadProgressFromFirebase();
  
  // Log completion status of all items after loading
  console.log('\n📋 CHECKOUT ITEMS STATUS:');
  props.items.forEach((item, idx) => {
    const completed = isItemCompleted(item.id);
    console.log(`  ${idx + 1}. ${item.name}: ${completed ? '✅ Complete' : '⏳ Incomplete'}`);
  });
  console.log('');
});

// Watch for step changes and clear state
watch(step, (newStep, oldStep) => {
  if (newStep !== oldStep) {
    logger.info(`📍 Step changed: ${oldStep} → ${newStep}`);
    
    // Clear all state for new item
    newImg.value = null;
    analysis.value = null;
    currentPairIndex.value = 0;
    currentIntakePhotoIndex.value = 0;
    isAnalyzing.value = false;
    isValidating.value = false;
    
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    
    // Initialize fresh checkout photos array for new item
    initializeCheckoutPhotos();
    
    // Load progress for new item
    setTimeout(() => {
      loadProgressFromFirebase();
    }, 100);
  }
});

// Start upload for a specific pair
const startUploadForPair = (pairIndex: number) => {
  if (isValidating.value) return;
  currentPairIndex.value = pairIndex;
  fileInput.value?.click();
};

// Save progress to Firebase
const saveProgressToFirebase = async () => {
  const store = useLeaseStore();
  if (!store.currentLeaseId || !currentItem.value) return;
  
  try {
    // Get all uploaded photo URLs (filter out nulls)
    const photoUrls = checkoutPhotos.value.filter((photo): photo is string => photo !== null);
    
    // Calculate which pairs are verified
    const verifiedPairs = checkoutPhotos.value.map((photo, idx) => ({
      index: idx,
      verified: photo !== null,
      photoUrl: photo || null
    }));
    
    // Save progress to Firestore
    await leaseService.saveCheckoutEvidence(
      store.currentLeaseId,
      currentItem.value.id,
      photoUrls,
      false, // Not analyzed yet
      {
        hasDamage: false,
        severity: 'none',
        description: 'Checkout in progress',
        verifiedPairs, // Save which pairs are done
        uploadProgress: {
          uploaded: uploadedPairsCount.value,
          total: intakePhotoCount.value,
          complete: allPairsUploaded.value
        }
      } as any
    );
    
    logger.info('💾 Progress saved to Firebase', {
      uploaded: uploadedPairsCount.value,
      total: intakePhotoCount.value
    });
  } catch (error) {
    logger.error('Failed to save progress', error);
  }
};

const handleFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const uploadedImage = e.target?.result as string;
      
      // Get the intake photo for this pair
      const intakePhotoForPair = intakePhotos.value[currentPairIndex.value];
      
      if (!intakePhotoForPair || !currentItem.value) {
        target.value = '';
        return;
      }
      
      // Fast validation: Check if photo matches location/angle
      isValidating.value = true;
      try {
        const validation = await togetherService.validatePhotoMatch(
          currentItem.value.name,
          intakePhotoForPair,
          uploadedImage
        );
        
        if (!validation.isMatch || validation.recommendation === 'retake') {
          isValidating.value = false;
          await Swal.fire({
            icon: 'error',
            title: '⚠️ Photo Validation Issue!',
            html: `
              <p class="text-slate-700 mb-4">${validation.reason}</p>
              <div class="text-left bg-slate-50 p-4 rounded-lg">
                <p class="font-bold text-slate-800 mb-2">Please:</p>
                <ul class="list-disc list-inside space-y-1 text-slate-600">
                  <li>Take a photo from the same angle as intake photo ${currentPairIndex.value + 1}</li>
                  <li>Ensure you're photographing the same location</li>
                  <li>Match the perspective and framing</li>
                </ul>
              </div>
              <p class="text-sm text-slate-500 mt-3">Confidence: <span class="font-bold">${validation.confidence}</span></p>
            `,
            confirmButtonText: 'OK, I\'ll Retake',
            confirmButtonColor: '#ef4444',
            customClass: {
              popup: 'rounded-2xl',
              title: 'text-xl font-bold',
              confirmButton: 'rounded-lg px-6 py-3 font-bold'
            }
          });
          target.value = '';
          return;
        }
        
        // Save to Firebase immediately
        const store = useLeaseStore();
        if (!store.currentLeaseId) {
          isValidating.value = false;
          target.value = '';
          return;
        }
        
        const userId = auth.currentUser?.uid;
        if (!userId) {
          isValidating.value = false;
          target.value = '';
          return;
        }
        
        // Convert base64 to File and upload
        const response = await fetch(uploadedImage);
        const blob = await response.blob();
        const file = new File([blob], `checkout_${currentItem.value.id}_${currentPairIndex.value}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        const photoUrl = await storageService.uploadImage(
          file,
          userId,
          store.currentLeaseId,
          'checkout'
        );
        
        // Store the photo in the array at the correct index
        checkoutPhotos.value[currentPairIndex.value] = photoUrl;
        
        // Save progress to Firebase immediately
        await saveProgressToFirebase();
        
        isValidating.value = false;
        
        logger.success(`✅ Photo ${currentPairIndex.value + 1} saved to Firebase`);
        
        // Auto-move to next empty pair or show analyze button
        const nextEmptyIndex = checkoutPhotos.value.findIndex((photo, idx) => idx > currentPairIndex.value && photo === null);
        if (nextEmptyIndex !== -1) {
          currentPairIndex.value = nextEmptyIndex;
        }
        
      } catch (error) {
        logger.error('Upload failed', error);
        isValidating.value = false;
        await Swal.fire({
          icon: 'error',
          title: '❌ Upload Failed',
          text: 'Failed to save photo. Please try again.',
          confirmButtonColor: '#ef4444'
        });
      }
      
      // Reset file input
      target.value = '';
    };
    reader.readAsDataURL(file);
  }
};

const runBatchAnalysis = async () => {
  if (!currentItem.value || !allPairsUploaded.value) return;
  
  isAnalyzing.value = true;
  try {
    // Get ALL intake photos for this item
    const beforeImages = intakePhotos.value;
    
    // Get ALL checkout photos (filter out nulls)
    const afterImages = checkoutPhotos.value.filter((photo): photo is string => photo !== null);
    
    logger.info('🔍 Starting analysis', {
      item: currentItem.value.name,
      beforeCount: beforeImages.length,
      afterCount: afterImages.length
    });
    
    // Simple state deterioration analysis
    const result = await togetherService.analyzeStateDeterioration(
      currentItem.value.name,
      beforeImages,
      afterImages
    );
    
    analysis.value = result;
    
    // Save analysis result to Firebase immediately
    await saveAnalysisToFirebase(result);
    
    logger.success('✅ Analysis complete', result);
  } catch (error) {
    logger.error('Analysis failed', error);
    // Fallback analysis
    analysis.value = {
      hasDamage: false,
      severity: 'none',
      description: 'Analysis failed. Please try again.',
      isNormalWear: true,
      tenantLiable: false
    };
  } finally {
    isAnalyzing.value = false;
  }
};

// Skip item entirely (no photos uploaded)
const skipItem = async () => {
  if (!currentItem.value) return;
  
  try {
    // Create a minimal "skipped" analysis
    const skippedAnalysis: DamageAnalysis = {
      hasDamage: false,
      severity: 'none',
      description: 'Analysis skipped by user',
      isNormalWear: true,
      tenantLiable: false,
      stateGrade: 'B' // Default grade for skipped
    };
    
    analysis.value = skippedAnalysis;
    
    // Save skipped state to Firebase
    await saveAnalysisToFirebase(skippedAnalysis);
    
    logger.info('⏭️ Analysis skipped for', currentItem.value.name);
    
    // Move to next item immediately
    await nextItem();
  } catch (error) {
    logger.error('Failed to skip', error);
  }
};

// Save analysis result to Firebase
const saveAnalysisToFirebase = async (analysisResult: DamageAnalysis) => {
  const store = useLeaseStore();
  if (!store.currentLeaseId || !currentItem.value) return;
  
  try {
    const photoUrls = checkoutPhotos.value.filter((photo): photo is string => photo !== null);
    
    await leaseService.saveCheckoutEvidence(
      store.currentLeaseId,
      currentItem.value.id,
      photoUrls,
      analysisResult.hasDamage,
      analysisResult
    );
    
    logger.success('💾 Analysis saved to Firebase');
  } catch (error) {
    logger.error('Failed to save analysis', error);
  }
};


const resetPhoto = () => {
  // Clear all state
  newImg.value = null;
  analysis.value = null;
  currentPairIndex.value = 0;
  currentIntakePhotoIndex.value = 0;
  isAnalyzing.value = false;
  isValidating.value = false;
  
  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  
  // Initialize fresh checkout photos array
  initializeCheckoutPhotos();
  
  // Load any existing progress from Firebase for new item
  setTimeout(() => {
    loadProgressFromFirebase();
  }, 100);
};

const nextItem = async () => {
  // Photos are already saved to Firebase, just save analysis
  if (currentItem.value && allPairsUploaded.value && analysis.value) {
    try {
      const store = useLeaseStore();
      if (!store.currentLeaseId) return;
      
      // Get all uploaded photo URLs (filter out nulls)
      const photoUrls = checkoutPhotos.value.filter((photo): photo is string => photo !== null);
      
      // Save analysis to Firestore
      await leaseService.saveCheckoutEvidence(
        store.currentLeaseId,
        currentItem.value.id,
        photoUrls,
        analysis.value.hasDamage,
        analysis.value
      );
      
      logger.success(`✅ Saved ${photoUrls.length} checkout photo(s) for ${currentItem.value.name}`);
      
      await Swal.fire({
        icon: 'success',
        title: '✅ Evidence Saved!',
        text: `${currentItem.value.name} checkout complete`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      logger.error('Failed to save evidence', error);
      await Swal.fire({
        icon: 'error',
        title: '❌ Save Failed',
        text: 'Failed to save evidence. Please try again.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }
  }
  
  // Move to next item
  if (step.value < props.items.length - 1) {
    step.value++;
    resetPhoto();
  } else {
    // All items processed - go to defense
    const result = await Swal.fire({
      icon: 'success',
      title: '🎉 Checkout Complete!',
      text: 'All items have been reviewed. Ready for legal defense analysis.',
      confirmButtonText: 'Finish Lease & Analyze Defense',
      confirmButtonColor: '#4f46e5',
      showCancelButton: false,
      allowOutsideClick: false
    });
    
    if (result.isConfirmed) {
      // Navigate to defense stage
      emit('complete');
    }
  }
};
</script>
