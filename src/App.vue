<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Shield, User, FileText, Camera, MessageSquare, LogOut, Lock, ChevronRight } from 'lucide-vue-next';
import { useLeaseStore } from './stores/leaseStore';
import { STAGES } from './constants';
import authService from './services/authService';
import logger from './utils/logger';
import type { User as FirebaseUser } from 'firebase/auth';

// Components
import LandingPage from './components/LandingPage.vue';
import LoginPage from './components/LoginPage.vue';
import SignUpPage from './components/SignUpPage.vue';
import ProfileSetup from './components/ProfileSetup.vue';
import DashboardView from './components/DashboardView.vue';
import UploadAnalyzer from './components/UploadAnalyzer.vue';
import ReviewStage from './components/ReviewStage.vue';
import GuidedIntake from './components/GuidedIntake.vue';
import LiveLeaseChat from './components/LiveLeaseChat.vue';
import CheckoutComparison from './components/CheckoutComparison.vue';
import DefenseHub from './components/DefenseHub.vue';
import TermsAndConditions from './components/TermsAndConditions.vue';
import ProfileDropdown from './components/ProfileDropdown.vue';

const store = useLeaseStore();

type View = 'landing' | 'login' | 'signup' | 'profile-setup' | 'dashboard' | 'upload' | 'process';
const view = ref<View>('landing');
const showTerms = ref(false);
const currentUserId = ref<string | null>(null);

// Check if user is already logged in
onMounted(() => {
  // Listen to Firebase auth state changes
  authService.onAuthStateChange(async (user: FirebaseUser | null) => {
    if (user) {
      // User is signed in
      currentUserId.value = user.uid;
      const profile = await authService.getUserProfile(user.uid);
      
      // Check if terms are accepted
      if (!profile?.termsAccepted) {
        showTerms.value = true;
        return;
      }
      
      // Check if profile is complete
      if (!profile?.profileComplete) {
        // Redirect to profile setup
        if (view.value !== 'profile-setup') {
          view.value = 'profile-setup';
        }
      } else {
        // Profile is complete, set user data
        store.setUser({ 
          name: profile.name || user.displayName || 'User',
          location: profile.location || 'Vaud'
        });
        if (view.value === 'landing' || view.value === 'login' || view.value === 'signup' || view.value === 'profile-setup') {
          view.value = 'dashboard';
        }
      }
    } else {
      // User is signed out
      currentUserId.value = null;
      if (view.value !== 'landing' && view.value !== 'login' && view.value !== 'signup') {
        view.value = 'landing';
      }
    }
  });
});

const iconMap: Record<string, any> = {
  FileText,
  Camera,
  MessageSquare,
  LogOut,
  Shield,
};

const handleLogin = (user: { name: string; location: string }) => {
  store.setUser(user);
  view.value = 'dashboard';
};

const handleStartNew = () => {
  view.value = 'upload';
};

const handleAnalyzeComplete = (data: any) => {
  store.setLeaseData(data);
  view.value = 'process';
};

const handleCancel = () => {
  view.value = 'dashboard';
};

const handleConfirmAndStart = () => {
  store.unlockStage('intake');
};

const handleIntakeComplete = (evidence: any) => {
  store.setIntakeEvidence(evidence);
  store.unlockStage('chat');
};

const handleEndLease = () => {
  store.unlockStage('checkout');
};

const handleCheckoutComplete = () => {
  store.unlockStage('claims');
};

const isStageUnlocked = (index: number) => {
  return index <= store.unlockedStages;
};

const setActiveStage = (stageId: string, index: number) => {
  if (isStageUnlocked(index)) {
    store.setActiveStage(stageId);
  }
};

const handleProfileComplete = (userData: { name: string; location: string }) => {
  store.setUser(userData);
  view.value = 'dashboard';
};

const handleSelectLease = async (leaseId: string) => {
  try {
    logger.info('📖 Loading lease', { leaseId });
    await store.loadLease(leaseId);
    logger.success('✅ Lease loaded successfully');
    view.value = 'process';
  } catch (error) {
    logger.error('❌ Failed to load lease', error);
  }
};

const handleLogout = async () => {
  try {
    logger.info('👋 Logging out...');
    await authService.signOut();
    store.reset();
    view.value = 'landing';
    logger.success('✅ Logged out successfully');
  } catch (error) {
    logger.error('❌ Failed to logout', error);
  }
};

const handleAcceptTerms = async () => {
  if (!currentUserId.value) return;
  
  try {
    await authService.acceptTerms(currentUserId.value);
    showTerms.value = false;
    
    // Reload user profile to continue flow
    const user = authService.getCurrentUser();
    if (user) {
      const profile = await authService.getUserProfile(user.uid);
      if (!profile?.profileComplete) {
        view.value = 'profile-setup';
      } else {
        store.setUser({ 
          name: profile.name || user.displayName || 'User',
          location: profile.location || 'Vaud'
        });
        view.value = 'dashboard';
      }
    }
  } catch (error) {
    logger.error('❌ Failed to accept terms', error);
  }
};

const handleDeclineTerms = async () => {
  await authService.signOut();
  showTerms.value = false;
  view.value = 'landing';
};

const handleShowTerms = () => {
  showTerms.value = true;
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans text-slate-900">
    <!-- Landing Page -->
    <LandingPage 
      v-if="view === 'landing'" 
      @show-login="view = 'login'"
      @show-signup="view = 'signup'"
    />

    <!-- Login Page -->
    <LoginPage 
      v-else-if="view === 'login'"
      @show-signup="view = 'signup'"
      @back-to-home="view = 'landing'"
      @login-success="view = 'dashboard'"
    />

    <!-- Sign Up Page -->
    <SignUpPage 
      v-else-if="view === 'signup'"
      @show-login="view = 'login'"
      @back-to-home="view = 'landing'"
      @signup-success="view = 'dashboard'"
    />

    <!-- Profile Setup -->
    <ProfileSetup 
      v-else-if="view === 'profile-setup'"
      @profile-complete="handleProfileComplete"
    />

    <!-- Main App with Header -->
    <template v-else>
      <!-- Header -->
      <header class="bg-white border-b border-slate-200 sticky top-0 z-50 h-20 backdrop-blur-md bg-white/95">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div @click="view = 'dashboard'" class="flex items-center gap-3 cursor-pointer group">
            <div class="bg-slate-900 text-white p-2 rounded-lg transition-transform group-hover:scale-105">
              <Shield :size="20" />
            </div>
            <span class="font-bold text-2xl tracking-tight text-slate-900">LeaseCare</span>
          </div>

          <!-- Stage Navigation (only in process view) -->
          <nav v-if="view === 'process'" class="hidden md:flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button 
              v-for="(s, i) in STAGES" 
              :key="s.id"
              @click="setActiveStage(s.id, i)"
              :disabled="!isStageUnlocked(i)"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all',
                store.activeStage === s.id ? 'bg-slate-900 text-white shadow-sm' : 
                isStageUnlocked(i) ? 'text-slate-700 hover:bg-slate-200' : 
                'text-slate-400 cursor-not-allowed'
              ]"
            >
              <component :is="isStageUnlocked(i) ? iconMap[s.icon] : Lock" :size="16" />
              <span>{{ s.label }}</span>
            </button>
          </nav>

          <!-- Profile Dropdown -->
          <ProfileDropdown 
            :user="store.user"
            @logout="handleLogout"
            @dashboard="view = 'dashboard'"
            @profile="view = 'profile-setup'"
            @terms="handleShowTerms"
          />
        </div>
      </header>

      <!-- Mobile Bottom Navigation (only in process view) -->
      <nav v-if="view === 'process'" class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-inset-bottom">
        <div class="flex overflow-x-auto scrollbar-hide">
          <button 
            v-for="(s, i) in STAGES" 
            :key="s.id"
            @click="setActiveStage(s.id, i)"
            :disabled="!isStageUnlocked(i)"
            :class="[
              'flex-1 min-w-[80px] px-3 py-3 flex flex-col items-center gap-1 transition-all border-t-2',
              store.activeStage === s.id ? 'bg-slate-50 border-slate-900 text-slate-900' : 
              isStageUnlocked(i) ? 'border-transparent text-slate-600 active:bg-slate-50' : 
              'border-transparent text-slate-300 cursor-not-allowed'
            ]"
          >
            <component :is="isStageUnlocked(i) ? iconMap[s.icon] : Lock" :size="20" />
            <span class="text-xs font-medium text-center leading-tight">{{ s.label }}</span>
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main :class="['w-full mt-4', view === 'process' ? 'pb-20 md:pb-0' : '']">
        <!-- Dashboard -->
        <DashboardView 
          v-if="view === 'dashboard'" 
          :user="store.user" 
          @start-new="handleStartNew"
          @select-lease="handleSelectLease"
          @load-demo="view = 'process'"
        />

        <!-- Upload -->
        <UploadAnalyzer 
          v-if="view === 'upload'" 
          :jurisdiction="store.user?.location || 'Vaud'"
          @analyze-complete="handleAnalyzeComplete"
          @cancel="handleCancel"
        />

        <!-- Process Stages -->
        <div v-if="view === 'process' && store.leaseData" class="p-4 md:p-8">
          <ReviewStage 
            v-if="store.activeStage === 'review'"
            :lease-data="store.leaseData"
            @confirm-and-start="handleConfirmAndStart"
          />

          <GuidedIntake 
            v-if="store.activeStage === 'intake'"
            :items="store.leaseData.inspectionItems"
            :asset-type="store.leaseData.assetType"
            @complete="handleIntakeComplete"
          />

          <div v-if="store.activeStage === 'chat'" class="max-w-4xl mx-auto">
            <LiveLeaseChat 
              :lease-data="store.leaseData"
              :jurisdiction="store.user?.location || 'Vaud'"
              :intake-evidence="store.intakeEvidence"
              :document-text="store.documentText"
              @end-lease="handleEndLease"
            />
          </div>

          <CheckoutComparison 
            v-if="store.activeStage === 'checkout'"
            :items="store.leaseData.inspectionItems"
            :intake-evidence="store.intakeEvidence"
            @complete="handleCheckoutComplete"
          />

          <DefenseHub v-if="store.activeStage === 'claims'" />
        </div>
      </main>
    </template>

    <!-- Terms and Conditions Modal -->
    <TermsAndConditions 
      v-if="showTerms"
      :can-decline="true"
      @accept="handleAcceptTerms"
      @decline="handleDeclineTerms"
    />
  </div>
</template>
