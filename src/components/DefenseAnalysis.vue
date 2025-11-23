<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Mobile Menu Toggle -->
    <button 
      @click="sidebarOpen = !sidebarOpen"
      class="lg:hidden fixed top-20 left-4 z-50 bg-slate-900 text-white p-3 rounded-lg shadow-lg"
    >
      <svg v-if="!sidebarOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>

    <!-- Overlay for mobile -->
    <div 
      v-if="sidebarOpen" 
      @click="sidebarOpen = false"
      class="lg:hidden fixed inset-0 bg-black/50 z-30 top-16"
    ></div>

    <!-- Sidebar with stacked queries -->
    <div :class="[
      'fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 shadow-xl transition-transform duration-300 z-40 flex flex-col',
      'w-80 lg:w-80',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]">
      <!-- Fixed Header -->
      <div class="flex-shrink-0 p-6 border-b border-slate-200 bg-slate-900 text-white">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-2xl">
            ⚖️
          </div>
          <div>
            <h2 class="text-xl font-bold">Legal Cases</h2>
            <p class="text-xs text-slate-400 mt-0.5">{{ savedAnalyses.length }} case{{ savedAnalyses.length !== 1 ? 's' : '' }}</p>
          </div>
        </div>
      </div>
      
      <!-- Fixed New Query Button -->
      <div class="flex-shrink-0 p-4 border-b border-slate-200 bg-white">
        <button @click="startNewQuery"
                class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
          <span class="text-xl">+</span> New Case Analysis
        </button>
      </div>
      
      <!-- Scrollable Queries List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        <button
          v-for="(analysis, idx) in savedAnalyses"
          :key="analysis.id"
          @click="selectAnalysis(analysis)"
          :class="[
            'w-full text-left p-3 rounded-lg transition-all border-2',
            selectedAnalysisId === analysis.id 
              ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          ]"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-bold truncate', selectedAnalysisId === analysis.id ? 'text-white' : 'text-slate-900']">{{ analysis.query || 'General Analysis' }}</p>
              <p :class="['text-xs mt-1', selectedAnalysisId === analysis.id ? 'text-slate-300' : 'text-slate-500']">{{ formatDate(analysis.timestamp) }}</p>
              <div v-if="analysis.result" class="mt-2">
                <span :class="[
                  'text-xs font-bold px-2 py-1 rounded',
                  selectedAnalysisId === analysis.id 
                    ? (analysis.result.recommendation === 'FIGHT' ? 'bg-emerald-500 text-white' :
                       analysis.result.recommendation === 'ACCEPT' ? 'bg-red-500 text-white' :
                       'bg-amber-500 text-white')
                    : (analysis.result.recommendation === 'FIGHT' ? 'bg-emerald-100 text-emerald-700' :
                       analysis.result.recommendation === 'ACCEPT' ? 'bg-red-100 text-red-700' :
                       'bg-amber-100 text-amber-700')
                ]">
                  {{ analysis.result.recommendation }}
                </span>
              </div>
            </div>
            <div :class="['text-xs font-medium', selectedAnalysisId === analysis.id ? 'text-slate-400' : 'text-slate-400']">{{ idx + 1 }}</div>
          </div>
        </button>
        
        <div v-if="savedAnalyses.length === 0" class="text-center py-8 text-slate-400">
          <p class="text-sm">No queries yet</p>
          <p class="text-xs mt-1">Create your first defense query</p>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="lg:ml-80 pt-16 p-4 md:p-6 lg:p-8">
      <!-- Loading State -->
      <div v-if="isAnalyzing" class="bg-white rounded-2xl p-12 text-center shadow-lg">
        <div class="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-lg font-bold text-slate-800">Analyzing evidence...</p>
        <p class="text-sm text-slate-500 mt-2">This may take 30-60 seconds</p>
      </div>

      <!-- Query Input Form -->
      <div v-else-if="showQueryInput" class="max-w-4xl mx-auto">
        <div class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200">
          <h2 class="text-2xl font-bold text-slate-800 mb-6">New Case Analysis</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">
                Landlord's Claim or Dispute Details (Optional)
              </label>
              <textarea
                v-model="currentQuery"
                placeholder="e.g., 'Landlord alleges water damage to bathroom fixtures and demands CHF 800 in repairs' or leave empty for comprehensive property assessment"
                class="w-full h-32 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:ring-2 focus:ring-slate-200 outline-none resize-none"
              ></textarea>
            </div>
            
            <!-- Quick Examples -->
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="example in quickExamples"
                :key="example"
                @click="currentQuery = example"
                class="text-left text-xs p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-900 rounded-lg transition-all"
              >
                {{ example }}
              </button>
            </div>
            
            <div class="flex gap-3 pt-4">
              <button
                @click="runAnalysis"
                class="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                ⚖️ Generate Legal Analysis
              </button>
              <button
                v-if="savedAnalyses.length > 0"
                @click="cancelQuery"
                class="px-6 bg-slate-200 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Analysis Result View -->
      <div v-else-if="currentAnalysis" class="max-w-5xl mx-auto space-y-6">
        <!-- Header with actions -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl md:text-3xl font-bold text-slate-800">{{ currentAnalysis.query || 'General Analysis' }}</h2>
            <p class="text-sm text-slate-500">{{ formatDate(currentAnalysis.timestamp) }}</p>
          </div>
          <div class="flex gap-2">
            <button @click="downloadAnalysis(currentAnalysis)"
                    class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm font-bold flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Download
            </button>
            <button @click="deleteAnalysis(currentAnalysis.id)"
                    class="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all text-sm font-bold flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete
            </button>
          </div>
        </div>

        <!-- Recommendation Card -->
        <div v-if="currentAnalysis.result.recommendation" :class="[
          'rounded-2xl p-6 md:p-8 shadow-xl border-4 transform transition-all hover:scale-[1.01]',
          currentAnalysis.result.recommendation === 'FIGHT' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-500' :
          currentAnalysis.result.recommendation === 'ACCEPT' ? 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-500' :
          'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-500'
        ]">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-4xl md:text-5xl">
                  {{ currentAnalysis.result.recommendation === 'FIGHT' ? '⚔️' : 
                     currentAnalysis.result.recommendation === 'ACCEPT' ? '🏳️' : '🤝' }}
                </span>
                <div>
                  <h3 :class="[
                    'text-3xl md:text-4xl font-black',
                    currentAnalysis.result.recommendation === 'FIGHT' ? 'text-emerald-700' :
                    currentAnalysis.result.recommendation === 'ACCEPT' ? 'text-rose-700' :
                    'text-yellow-700'
                  ]">
                    {{ currentAnalysis.result.recommendation }}
                  </h3>
                  <p class="text-sm font-bold mt-1" :class="[
                    currentAnalysis.result.recommendation === 'FIGHT' ? 'text-emerald-600' :
                    currentAnalysis.result.recommendation === 'ACCEPT' ? 'text-rose-600' :
                    'text-yellow-600'
                  ]">
                    Win Probability: {{ currentAnalysis.result.winProbability?.toUpperCase() || 'UNKNOWN' }}
                  </p>
                </div>
              </div>
              <p v-if="currentAnalysis.result.summary" class="text-slate-700 text-base md:text-lg leading-relaxed mt-4">
                {{ currentAnalysis.result.summary }}
              </p>
            </div>
          </div>
        </div>

        <!-- Content Blocks (Dynamic Rendering) -->
        <div v-if="currentAnalysis.result.content && Array.isArray(currentAnalysis.result.content)" class="space-y-6">
          <div v-for="(block, idx) in currentAnalysis.result.content" :key="idx">
            <!-- Text Block -->
            <div v-if="block.type === 'text'" class="bg-white rounded-xl p-6 shadow-md">
              <p class="text-slate-700 leading-relaxed whitespace-pre-wrap">{{ block.content }}</p>
            </div>

            <!-- Heading Block -->
            <div v-else-if="block.type === 'heading'" class="mt-8 mb-4">
              <h3 class="text-2xl font-bold text-slate-800 border-l-4 border-indigo-500 pl-4">{{ block.content }}</h3>
            </div>

            <!-- Comparison Block -->
            <div v-else-if="block.type === 'comparison'" class="bg-white rounded-xl p-6 shadow-md">
              <h4 class="font-bold text-lg text-slate-800 mb-4">📸 {{ block.item }}</h4>
              <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p class="text-xs font-bold text-emerald-600 mb-2">BEFORE (Intake)</p>
                  <img :src="block.beforeImage" class="w-full rounded-lg border-2 border-emerald-500" alt="Before" />
                </div>
                <div>
                  <p class="text-xs font-bold text-blue-600 mb-2">AFTER (Checkout)</p>
                  <img :src="block.afterImage" class="w-full rounded-lg border-2 border-blue-500" alt="After" />
                </div>
              </div>
              <p class="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg">{{ block.caption }}</p>
            </div>

            <!-- Evidence Block -->
            <div v-else-if="block.type === 'evidence'" class="bg-amber-50 rounded-xl p-6 shadow-md border-l-4 border-amber-500">
              <h4 class="font-bold text-lg text-amber-800 mb-3 flex items-center gap-2">
                <span>📋</span> Evidence
              </h4>
              <p class="text-slate-700 mb-4">{{ block.content }}</p>
              <div v-if="block.images && block.images.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <img v-for="(img, i) in block.images" :key="i" :src="img" class="w-full rounded-lg border-2 border-amber-300" :alt="`Evidence ${i + 1}`" />
              </div>
            </div>

            <!-- Timeline Block -->
            <div v-else-if="block.type === 'timeline'" class="bg-white rounded-xl p-6 shadow-md">
              <h4 class="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                <span>📅</span> Timeline
              </h4>
              <div class="space-y-4">
                <div v-for="(event, i) in block.events" :key="i" class="flex gap-4">
                  <div class="flex flex-col items-center">
                    <div class="w-4 h-4 bg-indigo-500 rounded-full"></div>
                    <div v-if="i < block.events.length - 1" class="w-0.5 h-full bg-indigo-200 mt-2"></div>
                  </div>
                  <div class="flex-1 pb-4">
                    <p class="font-bold text-slate-800">{{ event.date }}</p>
                    <p class="text-sm text-slate-600 mt-1">{{ event.event }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recommendation Block -->
            <div v-else-if="block.type === 'recommendation'" class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 shadow-md border-l-4 border-indigo-500">
              <h4 class="font-bold text-lg text-indigo-800 mb-3 flex items-center gap-2">
                <span>💡</span> Recommendation
              </h4>
              <p class="text-slate-700 whitespace-pre-wrap leading-relaxed">{{ block.content }}</p>
            </div>
          </div>
        </div>

        <!-- Legal References -->
        <div v-if="currentAnalysis.result.legalReferences && currentAnalysis.result.legalReferences.length > 0" 
             class="bg-white rounded-xl p-6 shadow-md">
          <h3 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>📚</span> Legal References
          </h3>
          <ul class="space-y-2">
            <li v-for="(ref, idx) in currentAnalysis.result.legalReferences" :key="idx" 
                class="text-sm text-slate-600 flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all">
              <span class="text-indigo-500 font-bold">•</span>
              <span>{{ ref }}</span>
            </li>
          </ul>
        </div>

        <!-- Action Steps -->
        <div v-if="currentAnalysis.result.actionSteps && currentAnalysis.result.actionSteps.length > 0" 
             class="bg-white rounded-xl p-6 shadow-md">
          <h3 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>✅</span> Action Steps
          </h3>
          <ol class="space-y-3">
            <li v-for="(step, idx) in currentAnalysis.result.actionSteps" :key="idx" 
                class="flex items-start gap-4 p-4 bg-gradient-to-r from-indigo-50 to-transparent rounded-lg hover:from-indigo-100 transition-all">
              <span class="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {{ idx + 1 }}
              </span>
              <span class="text-slate-700 pt-1">{{ step }}</span>
            </li>
          </ol>
        </div>

        <!-- Estimated Cost -->
        <div v-if="currentAnalysis.result.estimatedCost" 
             class="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-6 text-center shadow-md">
          <p class="text-sm text-slate-600 mb-2 font-bold">Estimated Cost</p>
          <p class="text-3xl font-black text-slate-800">{{ currentAnalysis.result.estimatedCost }}</p>
        </div>

        <!-- Fallback: Show formatted JSON if no structured content -->
        <div v-if="!currentAnalysis.result.content && !currentAnalysis.result.recommendation" 
             class="bg-white rounded-xl p-6 shadow-md">
          <h3 class="text-lg font-bold text-slate-800 mb-4">Analysis Result</h3>
          <pre class="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded-lg overflow-x-auto">{{ JSON.stringify(currentAnalysis.result, null, 2) }}</pre>
        </div>
      </div>

      <!-- Welcome Screen -->
      <div v-else class="max-w-4xl mx-auto text-center py-20">
        <div class="text-6xl mb-4">⚖️</div>
        <h2 class="text-3xl font-bold text-slate-800 mb-4">Legal Defense Analysis</h2>
        <p class="text-slate-600 mb-8">Initiate a comprehensive legal analysis of your documented evidence</p>
        <button @click="startNewQuery"
                class="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg">
          + Initiate Case Analysis
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import togetherService from '@/services/togetherService';
import leaseService from '@/services/leaseService';
import { useLeaseStore } from '@/stores/leaseStore';
import logger from '@/utils/logger';

const store = useLeaseStore();
const isAnalyzing = ref(false);
const savedAnalyses = ref<any[]>([]);
const currentAnalysis = ref<any>(null);
const selectedAnalysisId = ref<number | null>(null);
const currentQuery = ref('');
const showQueryInput = ref(false);
const sidebarOpen = ref(false);

const quickExamples = [
  'Landlord alleges water damage to bathroom fixtures - CHF 800 claimed',
  'Dispute over kitchen countertop surface condition - CHF 500 demanded',
  'Claim for living room wall repainting costs - CHF 1200 assessed',
  'Alleged bedroom carpet damage beyond normal wear - CHF 600 requested'
];

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const startNewQuery = () => {
  currentQuery.value = '';
  currentAnalysis.value = null;
  selectedAnalysisId.value = null;
  showQueryInput.value = true;
};

const cancelQuery = () => {
  showQueryInput.value = false;
  if (savedAnalyses.value.length > 0) {
    selectAnalysis(savedAnalyses.value[0]);
  }
};

const selectAnalysis = (analysis: any) => {
  currentAnalysis.value = analysis;
  selectedAnalysisId.value = analysis.id;
  showQueryInput.value = false;
  sidebarOpen.value = false; // Close sidebar on mobile
};

const runAnalysis = async () => {
  isAnalyzing.value = true;
  showQueryInput.value = false;
  
  // Store the query before clearing
  const queryToAnalyze = currentQuery.value;
  
  try {
    // Load evidence from Firebase if not in store
    let checkoutEvidence = store.checkoutEvidence || {};
    let intakeEvidence = store.intakeEvidence || {};
    
    if (store.currentLeaseId && (Object.keys(checkoutEvidence).length === 0 || Object.keys(intakeEvidence).length === 0)) {
      logger.info('📥 Loading evidence from Firebase...');
      const lease = await leaseService.getLease(store.currentLeaseId);
      
      if (lease) {
        checkoutEvidence = (lease.checkoutEvidence || {}) as any;
        intakeEvidence = (lease.intakeEvidence || {}) as any;
        
        // Update store
        store.checkoutEvidence = checkoutEvidence;
        store.intakeEvidence = intakeEvidence;
        
        logger.success('✅ Evidence loaded from Firebase', {
          checkoutItems: Object.keys(checkoutEvidence).length,
          intakeItems: Object.keys(intakeEvidence).length
        });
      }
    }
    
    console.log('🔍 Evidence being sent to analysis:');
    console.log('Checkout items:', Object.keys(checkoutEvidence).length);
    console.log('Intake items:', Object.keys(intakeEvidence).length);
    
    const result = await togetherService.analyzeDefenseClaim(
      store.leaseData,
      checkoutEvidence,
      intakeEvidence,
      queryToAnalyze
    );
    
    const analysis = {
      id: Date.now(),
      query: queryToAnalyze || 'General Analysis',
      timestamp: new Date(),
      result: result
    };
    
    savedAnalyses.value.unshift(analysis);
    selectAnalysis(analysis);
    
    // Save to Firebase
    if (store.currentLeaseId) {
      await leaseService.saveDefenseAnalysis(store.currentLeaseId, analysis);
    }
    
    // Clear the query input for next analysis
    currentQuery.value = '';
    
    logger.success('✅ Defense analysis complete and saved');
  } catch (error) {
    logger.error('Defense analysis failed', error);
    // Show error and return to input
    showQueryInput.value = true;
  } finally {
    isAnalyzing.value = false;
  }
};

const downloadAnalysis = (analysis: any) => {
  const dataStr = JSON.stringify(analysis.result, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `defense-analysis-${analysis.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const deleteAnalysis = (id: number) => {
  savedAnalyses.value = savedAnalyses.value.filter(a => a.id !== id);
  if (currentAnalysis.value?.id === id) {
    if (savedAnalyses.value.length > 0) {
      selectAnalysis(savedAnalyses.value[0]);
    } else {
      currentAnalysis.value = null;
      selectedAnalysisId.value = null;
    }
  }
};

onMounted(async () => {
  // Load saved analyses from Firebase
  if (store.currentLeaseId) {
    try {
      const analyses = await leaseService.getDefenseAnalyses(store.currentLeaseId);
      if (analyses && analyses.length > 0) {
        savedAnalyses.value = analyses;
        selectAnalysis(analyses[0]);
      } else {
        showQueryInput.value = true;
      }
    } catch (error) {
      logger.error('Failed to load defense analyses', error);
      showQueryInput.value = true;
    }
  } else {
    showQueryInput.value = true;
  }
});
</script>
