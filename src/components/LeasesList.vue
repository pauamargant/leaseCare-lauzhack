<template>
  <div class="max-w-6xl mx-auto p-4 sm:p-6">
    <!-- Header -->
    <div class="mb-6 sm:mb-8 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900">My Leases</h1>
          <span v-if="!loading && leases.length > 0" class="px-3 py-1 bg-slate-100 text-slate-900 rounded-full text-sm font-bold">
            {{ leases.length }}
          </span>
        </div>
        <p class="text-slate-600">Manage all your rental agreements in one place</p>
      </div>
      <button 
        @click="refreshLeases"
        :disabled="loading"
        class="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
      >
        <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Refresh
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
      <div class="flex items-center gap-3 text-red-700">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <h3 class="font-bold">Error Loading Leases</h3>
          <p class="text-sm">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="leases.length === 0 && !error" class="text-center py-12 bg-white rounded-2xl shadow-lg">
      <div class="text-6xl mb-4">📄</div>
      <h3 class="text-xl font-bold text-slate-800 mb-2">No Leases Yet</h3>
      <p class="text-slate-600 mb-6">Upload your first lease agreement to get started</p>
      <button 
        @click="$emit('new-lease')"
        class="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
      >
        + Upload Lease
      </button>
    </div>

    <!-- Leases Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div 
        v-for="lease in leases" 
        :key="lease.id"
        @click="$emit('select-lease', lease.id)"
        class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden group border-2"
        :class="getStageColor(lease.status).border"
      >
        <!-- Status Badge -->
        <div class="p-4 sm:p-5" :class="getStageColor(lease.status).bg">
          <div class="flex items-center justify-between mb-3">
            <span class="px-3 py-1 rounded-full text-xs font-bold" :class="getStageColor(lease.status).badge">
              {{ getStageLabel(lease.status) }}
            </span>
            <span class="text-2xl">{{ getAssetIcon(lease.leaseData.assetType) }}</span>
          </div>
          
          <!-- Lease Title -->
          <h3 class="text-lg sm:text-xl font-bold text-slate-900 mb-1 group-hover:text-slate-700 transition-colors line-clamp-1">
            {{ lease.leaseData.title || 'Lease Agreement' }}
          </h3>
          <p class="text-sm text-slate-600 line-clamp-1">{{ lease.leaseData.assetName }}</p>
        </div>

        <!-- Details -->
        <div class="p-4 sm:p-5 border-t border-slate-100">
          <!-- Risk Score -->
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-600">RISK SCORE</span>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-slate-200 rounded-full h-2 w-20">
                <div 
                  class="h-2 rounded-full transition-all"
                  :class="getRiskColor(lease.leaseData.riskScore)"
                  :style="{ width: `${Math.min(lease.leaseData.riskScore, 100)}%` }"
                ></div>
              </div>
              <span class="text-sm font-bold" :class="getRiskTextColor(lease.leaseData.riskScore)">
                {{ lease.leaseData.riskScore }}
              </span>
            </div>
          </div>

          <!-- Evidence Count -->
          <div v-if="lease.intakeEvidence" class="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <span>📸</span>
            <span>{{ Object.keys(lease.intakeEvidence).length }} items documented</span>
          </div>

          <!-- Date -->
          <div class="text-xs text-slate-500">
            Created {{ formatDate(lease.createdAt) }}
          </div>
        </div>

        <!-- Actions -->
        <div class="px-4 sm:px-5 pb-4 flex items-center justify-between gap-2">
          <span class="text-sm font-bold text-indigo-600 group-hover:text-indigo-700">View Details</span>
          <div class="flex items-center gap-2">
            <button
              @click.stop="handleDelete(lease.id)"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Delete lease"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
            <svg class="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-slate-900 mb-2">Delete Lease?</h3>
        <p class="text-slate-600 mb-6">This will permanently delete the lease and all associated photos from Firebase. This action cannot be undone.</p>
        <div class="flex gap-3">
          <button
            @click="showDeleteModal = false"
            class="flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button
            @click="confirmDelete"
            :disabled="deleting"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg"
          >
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLeaseStore } from '@/stores/leaseStore';
import type { SavedLease } from '@/services/leaseService';
import logger from '@/utils/logger';

const emit = defineEmits<{
  'new-lease': []
  'select-lease': [leaseId: string]
}>();

const store = useLeaseStore();
const leases = ref<SavedLease[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const showDeleteModal = ref(false);
const deleteLeaseId = ref<string | null>(null);
const deleting = ref(false);

const refreshLeases = async () => {
  loading.value = true;
  error.value = null;
  try {
    logger.info('🔄 Refreshing leases...');
    
    // Check if user is authenticated
    const { auth } = await import('@/config/firebase');
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      error.value = 'Not authenticated. Please log in.';
      logger.error('❌ No authenticated user found');
      return;
    }
    
    logger.info('👤 Current user ID:', currentUser.uid);
    
    await store.loadUserLeases();
    leases.value = store.userLeases;
    logger.success(`✅ Loaded ${leases.value.length} leases`);
    
    if (leases.value.length === 0) {
      logger.info('ℹ️ No leases found for this user');
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load leases';
    logger.error('❌ Failed to load leases', err);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await refreshLeases();
});

const getStageColor = (status: string) => {
  switch (status) {
    case 'active':
      return {
        bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
        border: 'border-emerald-400',
        badge: 'bg-emerald-500 text-white'
      };
    case 'completed':
      return {
        bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        border: 'border-blue-400',
        badge: 'bg-blue-500 text-white'
      };
    case 'archived':
      return {
        bg: 'bg-gradient-to-br from-slate-50 to-gray-50',
        border: 'border-slate-300',
        badge: 'bg-slate-500 text-white'
      };
    default:
      return {
        bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
        border: 'border-purple-400',
        badge: 'bg-purple-500 text-white'
      };
  }
};

const getStageLabel = (status: string) => {
  switch (status) {
    case 'active': return '🟢 ACTIVE';
    case 'completed': return '✅ COMPLETED';
    case 'archived': return '📦 ARCHIVED';
    default: return '📝 IN PROGRESS';
  }
};

const getAssetIcon = (assetType: string) => {
  switch (assetType) {
    case 'Car': return '🚗';
    case 'Motorbike': return '🏍️';
    case 'Property': return '🏠';
    default: return '📄';
  }
};

const getRiskColor = (score: number) => {
  if (score < 30) return 'bg-emerald-500';
  if (score < 60) return 'bg-amber-500';
  return 'bg-red-500';
};

const getRiskTextColor = (score: number) => {
  if (score < 30) return 'text-emerald-600';
  if (score < 60) return 'text-amber-600';
  return 'text-red-600';
};

const formatDate = (date: Date) => {
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString();
};

const handleDelete = (leaseId: string) => {
  deleteLeaseId.value = leaseId;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!deleteLeaseId.value) return;
  
  deleting.value = true;
  try {
    logger.info('🗑️ Deleting lease', { leaseId: deleteLeaseId.value });
    
    // Get current user ID
    const { auth } = await import('@/config/firebase');
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      error.value = 'Not authenticated';
      return;
    }
    
    // Import leaseService
    const leaseService = (await import('@/services/leaseService')).default;
    
    // Delete lease
    await leaseService.deleteLease(deleteLeaseId.value, currentUser.uid);
    
    logger.success('✅ Lease deleted successfully');
    
    // Refresh leases list
    await refreshLeases();
    
    // Close modal
    showDeleteModal.value = false;
    deleteLeaseId.value = null;
  } catch (err: any) {
    logger.error('❌ Failed to delete lease', err);
    error.value = 'Failed to delete lease: ' + err.message;
  } finally {
    deleting.value = false;
  }
};
</script>
