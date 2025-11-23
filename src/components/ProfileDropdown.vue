<template>
  <div class="relative" ref="dropdownRef">
    <!-- Profile Button -->
    <button
      @click.stop="toggleDropdown"
      class="flex items-center gap-3 hover:bg-slate-100 rounded-lg p-2 transition-all"
    >
      <div class="text-right hidden sm:block leading-tight">
        <div class="text-xs font-bold text-slate-700">{{ user?.name }}</div>
        <div class="text-[10px] text-slate-500">{{ user?.location }}</div>
      </div>
      <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-sm">
        {{ userInitials }}
      </div>
      <svg 
        class="w-4 h-4 text-slate-400 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        @click.stop
        class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
      >
        <!-- User Info -->
        <div class="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {{ userInitials }}
            </div>
            <div>
              <div class="font-bold text-slate-900">{{ user?.name }}</div>
              <div class="text-xs text-slate-600">{{ user?.location }}</div>
            </div>
          </div>
        </div>

        <!-- Menu Items -->
        <div class="py-2">
          <button
            @click="handleDashboard"
            class="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 text-sm"
          >
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            <span class="font-medium text-slate-700">Dashboard</span>
          </button>

          <button
            @click="handleProfile"
            class="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 text-sm"
          >
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span class="font-medium text-slate-700">Profile Settings</span>
          </button>

          <button
            @click="handleTerms"
            class="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 text-sm"
          >
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span class="font-medium text-slate-700">Terms & Conditions</span>
          </button>

          <div class="border-t border-slate-200 my-2"></div>

          <button
            @click="handleLogout"
            class="w-full px-4 py-2.5 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-sm text-red-600"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span class="font-bold">Logout</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { User } from '@/constants';

const props = defineProps<{
  user: User | null;
}>();

const emit = defineEmits<{
  logout: []
  dashboard: []
  profile: []
  terms: []
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const userInitials = computed(() => {
  if (!props.user?.name) return 'U';
  return props.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

const handleLogout = () => {
  isOpen.value = false;
  emit('logout');
};

const handleDashboard = () => {
  isOpen.value = false;
  emit('dashboard');
};

const handleProfile = () => {
  isOpen.value = false;
  emit('profile');
};

const handleTerms = () => {
  isOpen.value = false;
  emit('terms');
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
