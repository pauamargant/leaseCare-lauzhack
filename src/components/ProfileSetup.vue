<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-200 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="flex items-center justify-center space-x-2 mb-2">
          <Shield class="w-10 h-10 text-slate-600" />
          <span class="text-3xl font-bold text-gray-900">LeaseCare</span>
        </div>
        <p class="text-gray-600">Select your canton to get started</p>
      </div>

      <!-- Profile Setup Form -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- Location (Canton) -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Canton (Where you live) *
            </label>
            <select
              v-model="location"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            >
              <option value="">Select your canton</option>
              <option value="Aargau">Aargau</option>
              <option value="Appenzell Ausserrhoden">Appenzell Ausserrhoden</option>
              <option value="Appenzell Innerrhoden">Appenzell Innerrhoden</option>
              <option value="Basel-Landschaft">Basel-Landschaft</option>
              <option value="Basel-Stadt">Basel-Stadt</option>
              <option value="Bern">Bern</option>
              <option value="Fribourg">Fribourg</option>
              <option value="Geneva">Geneva</option>
              <option value="Glarus">Glarus</option>
              <option value="Graubünden">Graubünden</option>
              <option value="Jura">Jura</option>
              <option value="Lucerne">Lucerne</option>
              <option value="Neuchâtel">Neuchâtel</option>
              <option value="Nidwalden">Nidwalden</option>
              <option value="Obwalden">Obwalden</option>
              <option value="Schaffhausen">Schaffhausen</option>
              <option value="Schwyz">Schwyz</option>
              <option value="Solothurn">Solothurn</option>
              <option value="St. Gallen">St. Gallen</option>
              <option value="Thurgau">Thurgau</option>
              <option value="Ticino">Ticino</option>
              <option value="Uri">Uri</option>
              <option value="Valais">Valais</option>
              <option value="Vaud">Vaud</option>
              <option value="Zug">Zug</option>
              <option value="Zurich">Zurich</option>
            </select>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Saving...' : 'Complete Profile' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Shield } from 'lucide-vue-next';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import logger from '@/utils/logger';

const location = ref('');
const loading = ref(false);
const error = ref('');

const emit = defineEmits(['profile-complete']);

const handleSubmit = async () => {
  if (!location.value) {
    error.value = 'Please select your canton';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    // Update Firestore user document (use setDoc with merge to create or update)
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      location: location.value,
      profileComplete: true,
      updatedAt: new Date()
    }, { merge: true });

    logger.success('✅ Profile updated successfully');
    emit('profile-complete', {
      name: user.displayName || user.email?.split('@')[0] || 'User',
      location: location.value
    });
  } catch (err: any) {
    if (err.code === 'permission-denied' || err.message.includes('insufficient permissions')) {
      error.value = '⚠️ Firebase rules not configured. Please update Firestore rules in Firebase Console (see QUICK_FIX_RULES.txt)';
    } else {
      error.value = err.message || 'Failed to update profile';
    }
    logger.error('❌ Profile update failed', err);
  } finally {
    loading.value = false;
  }
};
</script>
