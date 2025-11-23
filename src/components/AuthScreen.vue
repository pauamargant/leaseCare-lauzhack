<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-500">
      <div class="flex justify-center mb-6">
        <div class="bg-red-600 p-3 rounded-xl text-white shadow-lg rotate-3">
          <Shield :size="32" />
        </div>
      </div>
      <h1 class="text-2xl font-bold text-center text-slate-800 mb-2">LeaseCare Switzerland</h1>
      <p class="text-center text-slate-500 mb-8">Automated Tenant Protection</p>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
          <input 
            v-model="name" 
            class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-slate-50" 
          />
        </div>
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Jurisdiction (Canton)</label>
          <div class="relative">
            <select 
              v-model="canton" 
              class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-slate-50"
            >
              <option v-for="c in SWISS_CANTONS" :key="c" :value="c">{{ c }}</option>
            </select>
            <ChevronRight class="absolute right-3 top-3.5 text-slate-400 rotate-90" :size="16" />
          </div>
        </div>
        <button 
          @click="handleLogin" 
          class="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg mt-4 flex items-center justify-center gap-2"
        >
          <Lock :size="18" /> Access Secure Vault
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Shield, ChevronRight, Lock } from 'lucide-vue-next';
import { SWISS_CANTONS } from '@/constants';

const emit = defineEmits<{
  login: [user: { name: string; location: string }]
}>();

const name = ref('Jean Dupont');
const canton = ref('Vaud');

const handleLogin = () => {
  emit('login', { name: name.value, location: canton.value });
};
</script>
