<template>
  <div class="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in">
    <!-- Dashboard Header -->
    <div class="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">My Dashboard</h1>
        <p class="text-slate-500 flex items-center gap-2 mt-1">
          <Shield :size="14" class="text-slate-500" /> Protected under {{ user?.location }} Law
        </p>
      </div>
      <button 
        @click="$emit('startNew')"
        class="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
      >
        <Plus :size="20" /> New Lease
      </button>
    </div>
    
    <!-- Leases List -->
    <LeasesList 
      @new-lease="$emit('startNew')"
      @select-lease="handleSelectLease"
    />
  </div>
</template>

<script setup lang="ts">
import { Shield, Plus } from 'lucide-vue-next';
import LeasesList from './LeasesList.vue';
import type { User } from '@/constants';
import { useLeaseStore } from '@/stores/leaseStore';
import { demoLeases } from '@/data/demoLeases';

defineProps<{
  user: User | null;
}>();

const emit = defineEmits<{
  startNew: []
  selectLease: [leaseId: string]
  loadDemo: []
}>();

const store = useLeaseStore();

const handleSelectLease = (leaseId: string) => {
  emit('selectLease', leaseId);
};

const loadDemoLease = (type: 'car' | 'property') => {
  const demoData = type === 'car' ? demoLeases.car : demoLeases.property;
  store.setLeaseData(demoData);
  store.unlockStage('review');
  emit('loadDemo');
};
</script>
