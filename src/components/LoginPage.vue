<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="flex items-center justify-center space-x-3 mb-2">
          <div class="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <Shield class="w-6 h-6 text-white" />
          </div>
          <span class="text-3xl font-bold text-slate-900">LeaseCare</span>
        </div>
        <p class="text-slate-600">Welcome back! Log in to your account</p>
      </div>

      <!-- Login Form -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin">
          <!-- Email -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="you@example.com"
            />
          </div>

          <!-- Password -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="••••••••"
            />
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between mb-6">
            <label class="flex items-center">
              <input type="checkbox" class="rounded text-slate-900 focus:ring-slate-900" />
              <span class="ml-2 text-sm text-slate-600">Remember me</span>
            </label>
            <a href="#" class="text-sm text-slate-900 hover:text-slate-700 font-medium">
              Forgot password?
            </a>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Logging in...' : 'Log In' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-slate-500">Or continue with</span>
          </div>
        </div>

        <!-- Social Login - Google Only -->
        <div class="mb-6">
          <button 
            @click="handleGoogleSignIn"
            type="button"
            :disabled="loading"
            class="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span class="font-medium text-slate-700">Continue with Google</span>
          </button>
        </div>

        <!-- Sign Up Link -->
        <p class="text-center text-sm text-gray-600">
          Don't have an account? <button @click="$emit('show-signup')" class="text-slate-900 hover:text-slate-700 font-medium">Sign up</button>
        </p>
      </div>

      <!-- Back to Home -->
      <div class="text-center mt-6">
        <button @click="$emit('back-to-home')" class="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium">
          ← Back to home
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Shield } from 'lucide-vue-next';
import authService from '@/services/authService';
import logger from '@/utils/logger';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const emit = defineEmits(['show-signup', 'back-to-home', 'login-success']);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please enter email and password';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await authService.signIn(email.value, password.value);
    logger.success('✅ Login successful');
    emit('login-success');
  } catch (err: any) {
    error.value = err.message;
    logger.error('❌ Login failed', err);
  } finally {
    loading.value = false;
  }
};

const handleGoogleSignIn = async () => {
  loading.value = true;
  error.value = '';

  try {
    await authService.signInWithGoogle();
    logger.success('✅ Google sign in successful');
    emit('login-success');
  } catch (err: any) {
    error.value = err.message;
    logger.error('❌ Google sign in failed', err);
  } finally {
    loading.value = false;
  }
};

const handleGithubSignIn = async () => {
  loading.value = true;
  error.value = '';

  try {
    await authService.signInWithGithub();
    logger.success('✅ GitHub sign in successful');
    emit('login-success');
  } catch (err: any) {
    error.value = err.message;
    logger.error('❌ GitHub sign in failed', err);
  } finally {
    loading.value = false;
  }
};
</script>
