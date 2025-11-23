<template>
  <div class="max-w-4xl mx-auto h-full flex flex-col animate-in slide-in-from-right duration-500 px-2 sm:px-4">
    <!-- Modern Header with Gradient -->
    <div class="bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 text-white p-4 sm:p-6 rounded-t-2xl shadow-2xl border-b-4 border-emerald-500">
      <div class="flex justify-between items-start mb-3 sm:mb-4">
        <div class="flex-1">
          <h2 class="text-lg sm:text-2xl font-bold flex items-center gap-2 sm:gap-3 mb-1">
            <div class="bg-emerald-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg">
              <component :is="getAssetIcon()" :size="20" class="sm:w-6 sm:h-6" />
            </div>
            <span class="truncate">Intake Checklist</span>
          </h2>
          <p class="text-slate-300 text-xs sm:text-sm ml-10 sm:ml-14 hidden sm:block">Document your property condition</p>
        </div>
        <div class="text-right flex-shrink-0 ml-2">
          <div class="text-2xl sm:text-3xl font-bold text-emerald-400">{{ step + 1 }}</div>
          <div class="text-xs text-slate-400">of {{ allItems.length }}</div>
        </div>
      </div>
      
      <!-- Progress Bar - Clickable for completed items -->
      <div class="flex gap-1.5">
        <div 
          v-for="(item, i) in allItems" 
          :key="i"
          @click="handleProgressClick(i)"
          :class="[
            'h-2 rounded-full transition-all duration-300 flex-1',
            i === step ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50 scale-y-125' : 
            i < step ? 'bg-emerald-600 cursor-pointer hover:bg-emerald-500 hover:scale-y-150' : 
            'bg-slate-700',
            evidence[item.id] ? 'cursor-pointer' : ''
          ]"
          :title="i < step || evidence[item.id] ? `Jump to: ${item.name}` : ''"
        />
      </div>
    </div>

    <div class="bg-gradient-to-b from-slate-50 to-white flex-1 p-4 sm:p-6 md:p-8 rounded-b-2xl shadow-2xl border-x border-b border-slate-200 flex flex-col items-center text-center relative overflow-hidden">
      <!-- Decorative Background -->
      <div class="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-emerald-100 rounded-full blur-3xl opacity-20 -z-10"></div>
      <div class="absolute bottom-0 left-0 w-32 sm:w-64 h-32 sm:h-64 bg-indigo-100 rounded-full blur-3xl opacity-20 -z-10"></div>
      
      <!-- Item Info -->
      <div class="text-center mb-4 sm:mb-6 w-full max-w-2xl">
        <!-- Header badges -->
        <div class="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 animate-in fade-in slide-in-from-top duration-500">
          <div v-if="currentItem?.room" class="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg">
            <span class="text-base sm:text-lg">📍</span> <span class="hidden sm:inline">{{ currentItem.room }}</span><span class="sm:hidden">{{ currentItem.room.substring(0, 10) }}</span>
          </div>
          <div v-if="currentItem?.priority" class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg"
               :class="{
                 'bg-gradient-to-r from-red-500 to-pink-500 text-white': currentItem.priority === 'high',
                 'bg-gradient-to-r from-orange-400 to-amber-400 text-white': currentItem.priority === 'medium',
                 'bg-gradient-to-r from-slate-400 to-slate-500 text-white': currentItem.priority === 'low'
               }">
            <span class="text-base sm:text-lg">{{ currentItem.priority === 'high' ? '🔴' : currentItem.priority === 'medium' ? '🟡' : '⚪' }}</span>
            <span class="hidden sm:inline">{{ currentItem.priority.toUpperCase() }} PRIORITY</span>
            <span class="sm:hidden">{{ currentItem.priority.toUpperCase() }}</span>
          </div>
          <div v-if="currentItem?.recommendedPhotos" class="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg">
            <span class="text-base sm:text-lg">📸</span> {{ currentPhotos.length }}/{{ currentItem.recommendedPhotos }}
          </div>
        </div>

        <!-- Title and description -->
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 mb-2 sm:mb-3 animate-in fade-in slide-in-from-top duration-700 px-2">
          {{ currentItem?.name }}
        </h2>
        <p v-if="currentItem?.description" class="text-slate-600 text-sm sm:text-base mb-4 sm:mb-5 max-w-xl mx-auto leading-relaxed animate-in fade-in slide-in-from-top duration-700 delay-100 px-2">
          {{ currentItem.description }}
        </p>
        
        <!-- Why this matters -->
        <div v-if="currentItem?.reason" class="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-400 p-3 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 max-w-2xl mx-2 sm:mx-auto shadow-xl animate-in fade-in slide-in-from-top duration-700 delay-200 hover:shadow-2xl transition-shadow">
          <div class="flex items-start gap-2 sm:gap-3 md:gap-4">
            <div class="bg-gradient-to-br from-amber-400 to-orange-500 p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0 animate-pulse">
              <span class="text-2xl sm:text-2xl md:text-3xl drop-shadow-lg">💡</span>
            </div>
            <div class="text-left flex-1">
              <div class="text-xs sm:text-sm font-black text-amber-900 mb-1 sm:mb-2 tracking-wider flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span class="bg-amber-900 text-amber-50 px-1.5 sm:px-2 py-0.5 rounded-full text-xs">INFO</span>
                <span class="text-xs sm:text-sm">WHY THIS MATTERS</span>
              </div>
              <p class="text-sm sm:text-base text-amber-950 leading-relaxed font-semibold">{{ currentItem.reason }}</p>
            </div>
          </div>
        </div>

        <!-- Contract reference -->
        <div v-if="currentItem?.contractReference" class="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg inline-block mb-4">
          <span class="text-xs text-blue-900">
            📄 <strong>Contract Reference:</strong> {{ currentItem.contractReference }}
          </span>
        </div>
        
        <!-- Photo angles suggestions -->
        <div v-if="currentItem?.photoAngles && currentItem.photoAngles.length > 0" class="mb-4">
          <div class="text-xs font-bold text-slate-600 mb-2">📷 SUGGESTED ANGLES</div>
          <div class="flex flex-wrap justify-center gap-2">
            <span 
              v-for="(angle, idx) in currentItem.photoAngles" 
              :key="idx"
              class="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-300 font-medium"
            >
              {{ angle }}
            </span>
          </div>
        </div>
      </div>

      <div 
        @click="triggerFileInput"
        class="w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl border-3 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-400 transition-all duration-300 mb-8 group relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-700 delay-300"
      >
        <input 
          ref="fileInput" 
          type="file" 
          class="hidden" 
          accept="image/*" 
          capture="environment"
          multiple
          @change="handleFileSelect" 
        />
        <template v-if="currentItem && evidence[currentItem.id]">
          <img :src="evidence[currentItem.id]?.img" class="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex flex-col items-center justify-center backdrop-blur-md">
            <div class="bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-4 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500">
              <CheckCircle :size="40" class="drop-shadow-lg" />
            </div>
            <span class="font-bold text-emerald-900 mt-3 bg-white/90 px-5 py-2 rounded-full shadow-lg text-lg">✓ Captured & Secured</span>
          </div>
        </template>
        <template v-else>
          <div class="w-20 h-20 bg-gradient-to-br from-white to-slate-50 rounded-2xl flex items-center justify-center shadow-xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <Camera :size="40" class="text-slate-400 group-hover:text-emerald-500 transition-colors" />
          </div>
          <span class="text-slate-600 group-hover:text-emerald-700 font-bold text-lg transition-colors">📸 Tap to Capture Photos</span>
          <span class="text-slate-400 text-sm mt-1">Select multiple photos at once</span>
        </template>
      </div>

      <!-- Photo gallery for current item -->
      <div v-if="currentPhotos.length > 0" class="w-full mb-6 animate-in fade-in slide-in-from-bottom duration-500">
        <div class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <span class="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs">{{ currentPhotos.length }}</span>
          Photo{{ currentPhotos.length > 1 ? 's' : '' }} Captured
        </div>
        <div class="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          <div 
            v-for="(photo, idx) in currentPhotos" 
            :key="idx"
            class="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-3 border-emerald-400 shadow-lg hover:scale-105 transition-transform duration-200 group"
          >
            <img :src="photo" class="w-full h-full object-cover" />
            <button 
              @click.stop="removePhoto(idx)"
              class="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white w-8 h-8 rounded-full shadow-xl flex items-center justify-center font-black text-base transition-all hover:scale-125 hover:rotate-90 active:scale-95 border-2 border-white"
              title="Remove photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs text-center py-1 font-bold">
              #{{ idx + 1 }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap w-full gap-2 sm:gap-3 mt-auto pt-3 sm:pt-4 border-t-2 border-slate-200">
        <button 
          @click="goBack"
          :disabled="step === 0"
          class="px-3 sm:px-6 py-2.5 sm:py-3.5 text-sm sm:text-base text-slate-600 hover:text-slate-900 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
        >
          ← <span class="hidden sm:inline">Back</span>
        </button>
        <button 
          v-if="currentPhotos.length > 0"
          @click="triggerFileInput"
          class="px-3 sm:px-6 py-2.5 sm:py-3.5 text-sm sm:text-base border-2 border-emerald-500 bg-emerald-50 text-emerald-700 rounded-lg sm:rounded-xl font-bold hover:bg-emerald-100 hover:border-emerald-600 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
        >
          📸 <span class="hidden sm:inline">Add More Photos</span><span class="sm:hidden">+</span>
        </button>
        <button 
          v-if="isLast"
          @click="showAddCustom = true"
          class="px-3 sm:px-6 py-2.5 sm:py-3.5 text-sm sm:text-base border-2 border-indigo-500 bg-indigo-50 text-indigo-700 rounded-lg sm:rounded-xl font-bold hover:bg-indigo-100 hover:border-indigo-600 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
        >
          ➕ <span class="hidden sm:inline">Custom Item</span>
        </button>
        <button 
          @click="goNext"
          :class="[
            'flex-1 min-w-[120px] py-2.5 sm:py-3.5 text-sm sm:text-base rounded-lg sm:rounded-xl font-bold text-white flex items-center justify-center gap-1 sm:gap-2 shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95',
            isLast ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700' : 'bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black'
          ]"
        >
          <span class="hidden sm:inline">{{ isLast ? '✓ Complete Intake' : 'Next Item' }}</span>
          <span class="sm:hidden">{{ isLast ? '✓ Done' : 'Next' }}</span>
          <ChevronRight :size="16" class="sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
    
    <!-- Add Custom Item Modal -->
    <div v-if="showAddCustom" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showAddCustom = false">
      <div class="bg-white rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95">
        <h3 class="text-xl font-bold text-slate-800 mb-4">Add Custom Inspection Item</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Item Name</label>
            <input 
              v-model="customItemName"
              placeholder="e.g., Balcony Railing"
              class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea 
              v-model="customItemDescription"
              placeholder="What to photograph and why..."
              class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows="3"
            ></textarea>
          </div>
          <div class="flex gap-3">
            <button 
              @click="showAddCustom = false"
              class="flex-1 px-4 py-3 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              @click="addCustomItem"
              class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
            >
              Add Item
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Car, Bike, Building, Camera, CheckCircle, ChevronRight } from 'lucide-vue-next';
import storageService from '@/services/storageService';
import { useLeaseStore } from '@/stores/leaseStore';
import { auth } from '@/config/firebase';
import logger from '@/utils/logger';
import type { InspectionItem, Evidence } from '@/constants';

const props = defineProps<{
  items: InspectionItem[];
  assetType: 'Car' | 'Motorbike' | 'Property';
}>();

const emit = defineEmits<{
  complete: [evidence: Record<string, Evidence>]
}>();

const store = useLeaseStore();
const step = ref(0);
const evidence = ref<Record<string, Evidence>>({});

// Initialize evidence from store when component mounts (for loading existing leases)
onMounted(() => {
  if (store.intakeEvidence && Object.keys(store.intakeEvidence).length > 0) {
    logger.info('🔄 Initializing GuidedIntake with existing evidence from store', {
      itemCount: Object.keys(store.intakeEvidence).length
    });
    evidence.value = { ...store.intakeEvidence };
    logger.info('📸 Loaded evidence into component', evidence.value);
  } else {
    logger.info('📝 Starting fresh intake (no existing evidence)');
  }
});
const fileInput = ref<HTMLInputElement | null>(null);
const showAddCustom = ref(false);
const customItemName = ref('');
const customItemDescription = ref('');
const customItems = ref<InspectionItem[]>([]);
const uploading = ref(false);

const allItems = computed(() => [...props.items, ...customItems.value]);
const currentItem = computed(() => allItems.value[step.value]);
const isLast = computed(() => step.value === allItems.value.length - 1);

// Track photos for current item
const currentPhotos = computed(() => {
  if (!currentItem.value) return [];
  const ev = evidence.value[currentItem.value.id];
  return ev?.photos || (ev?.img ? [ev.img] : []);
});

const getAssetIcon = () => {
  switch (props.assetType) {
    case 'Car': return Car;
    case 'Motorbike': return Bike;
    default: return Building;
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
  if (!currentItem.value) return;
  
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (files && files.length > 0) {
    uploading.value = true;
    const itemId = currentItem.value!.id;
    
    try {
      const user = auth.currentUser;
      const leaseId = store.currentLeaseId || `temp_${Date.now()}`;
      
      if (user) {
        // Upload all selected files
        logger.info(`📤 Uploading ${files.length} photo(s) to Firebase Storage...`);
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file) continue;
          
          // Upload to Firebase Storage
          const photoUrl = await storageService.uploadImage(file, user.uid, leaseId, 'intake', itemId);
          logger.success(`✅ Photo ${i + 1}/${files.length} uploaded`, { url: photoUrl });
          
          // Save to store (which appends to Firestore)
          await store.saveIntakePhoto(itemId, photoUrl);
          
          // Also keep local preview
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageData = e.target?.result as string;
            const existing = evidence.value[itemId];
            
            if (existing && existing.photos) {
              existing.photos.push(imageData);
              existing.photoCount = existing.photos.length;
              if (!existing.img) {
                existing.img = imageData; // Set first as primary if none exists
              }
            } else {
              evidence.value[itemId] = { 
                captured: true, 
                timestamp: new Date(), 
                img: imageData,
                photos: [imageData],
                photoCount: 1
              };
            }
          };
          reader.readAsDataURL(file);
        }
        
        logger.success(`🎉 All ${files.length} photos uploaded successfully!`);
      }
    } catch (error) {
      logger.error('❌ Failed to upload photos', error);
    } finally {
      uploading.value = false;
      target.value = '';
    }
  }
};

const removePhoto = (photoIndex: number) => {
  if (!currentItem.value) return;
  
  const itemId = currentItem.value.id;
  const existing = evidence.value[itemId];
  
  if (existing && existing.photos) {
    existing.photos.splice(photoIndex, 1);
    existing.photoCount = existing.photos.length;
    
    if (existing.photos.length === 0) {
      // Remove evidence entirely if no photos left
      delete evidence.value[itemId];
    } else if (existing.photos[0]) {
      // Update primary image
      existing.img = existing.photos[0];
    }
  }
};

const goBack = () => {
  if (step.value > 0) {
    step.value--;
  }
};

const goNext = () => {
  if (isLast.value) {
    emit('complete', evidence.value);
  } else {
    step.value++;
  }
};

const handleProgressClick = (index: number) => {
  const targetItem = allItems.value[index];
  if (!targetItem) return;
  
  // Allow clicking on completed items or items with evidence
  if (index < step.value || evidence.value[targetItem.id]) {
    step.value = index;
    logger.info(`📍 Jumped to step ${index + 1}: ${targetItem.name}`);
  }
};

const addCustomItem = () => {
  if (!customItemName.value.trim()) return;
  
  const newItem: InspectionItem = {
    id: `custom_${Date.now()}`,
    name: customItemName.value,
    description: customItemDescription.value || 'Custom inspection item'
  };
  
  customItems.value.push(newItem);
  customItemName.value = '';
  customItemDescription.value = '';
  showAddCustom.value = false;
  
  // Move to the new custom item
  step.value = allItems.value.length - 1;
};
</script>
