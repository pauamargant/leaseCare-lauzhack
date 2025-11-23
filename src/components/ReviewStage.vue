<template>
  <div class="max-w-4xl mx-auto space-y-6 animate-in fade-in">
    <!-- Header with Risk Score -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">
          <component :is="getAssetIcon()" :size="16" />
          {{ leaseData.assetType }} Lease Detected
        </div>
        <h2 class="text-2xl font-bold text-slate-800">{{ leaseData.title }}</h2>
        <p class="text-slate-500 text-sm">{{ leaseData.assetName }}</p>
      </div>
      <div :class="[
        'px-4 py-2 rounded-lg border font-bold flex flex-col items-end',
        leaseData.riskScore > 30 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      ]">
        <span class="text-xs opacity-70 uppercase">Risk Score</span>
        <span class="text-xl">{{ leaseData.riskScore }}/100</span>
      </div>
    </div>

    <!-- Lease Information Card - Light Design -->
    <div v-if="leaseData.info && leaseData.info.length > 0" 
         class="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex items-center gap-3 mb-6">
        <div class="bg-slate-100 p-3 rounded-xl">
          <FileText :size="24" class="text-slate-700" />
        </div>
        <h3 class="font-bold text-slate-900 text-xl md:text-2xl">Lease Information</h3>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div v-for="(item, idx) in leaseData.info" :key="idx" 
             class="group bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-in fade-in slide-in-from-bottom-2"
             :style="{ animationDelay: `${idx * 50}ms` }">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl group-hover:scale-110 transition-transform duration-300">{{ item.icon }}</span>
            <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">{{ item.label }}</span>
          </div>
          <span class="text-base md:text-lg text-slate-900 font-semibold block break-words">{{ item.value }}</span>
        </div>
      </div>

      <!-- Responsibilities -->
      <div v-if="leaseData.responsibilities" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style="animation-delay: 200ms;">
        <div v-if="leaseData.responsibilities.tenant && leaseData.responsibilities.tenant.length > 0" 
             class="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-lg">👤</span>
            <span class="text-xs text-slate-600 font-bold uppercase tracking-wider">Your Responsibilities</span>
          </div>
          <ul class="space-y-2">
            <li v-for="(item, i) in leaseData.responsibilities.tenant" :key="i" 
                class="text-sm text-slate-700 flex items-start gap-2 hover:text-slate-900 transition-colors">
              <span class="text-slate-400 mt-0.5">•</span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
        <div v-if="leaseData.responsibilities.lessor && leaseData.responsibilities.lessor.length > 0" 
             class="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-lg">🏢</span>
            <span class="text-xs text-slate-600 font-bold uppercase tracking-wider">Provider Responsibilities</span>
          </div>
          <ul class="space-y-2">
            <li v-for="(item, i) in leaseData.responsibilities.lessor" :key="i" 
                class="text-sm text-slate-700 flex items-start gap-2 hover:text-slate-900 transition-colors">
              <span class="text-slate-400 mt-0.5">•</span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Irregularities Card -->
    <div v-if="leaseData.irregularities && leaseData.irregularities.length > 0" class="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 class="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
        <AlertTriangle :size="20" />
        ⚠️ Legal Irregularities Found ({{ leaseData.irregularities.length }})
      </h3>
      <p class="text-sm text-slate-800 mb-4">
        The following clauses may violate Swiss rental law. Review carefully with legal counsel.
      </p>
      <div class="space-y-3">
        <div v-for="(irregularity, i) in leaseData.irregularities" :key="i" 
             class="bg-white p-5 rounded-lg border-l-4 shadow-sm"
             :class="{
               'border-yellow-400': irregularity.severity === 'minor',
               'border-orange-500': irregularity.severity === 'moderate',
               'border-red-600': irregularity.severity === 'severe'
             }">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs px-2 py-1 rounded-full font-bold uppercase"
                      :class="{
                        'bg-yellow-100 text-yellow-800': irregularity.severity === 'minor',
                        'bg-orange-100 text-orange-800': irregularity.severity === 'moderate',
                        'bg-red-100 text-red-800': irregularity.severity === 'severe'
                      }">
                  {{ irregularity.severity }} RISK
                </span>
                <span class="text-xs text-slate-500">Issue #{{ i + 1 }}</span>
              </div>
              <h4 class="font-bold text-slate-900 text-base">{{ irregularity.issue }}</h4>
            </div>
          </div>
          
          <!-- Exact clause text from document -->
          <div v-if="irregularity.clauseText" class="bg-slate-50 border-l-4 border-slate-400 p-3 mb-2">
            <div class="flex items-start gap-2 mb-1">
              <div class="bg-slate-600 text-white text-xs font-bold px-2 py-1 rounded">
                📄 FOUND IN DOCUMENT
              </div>
              <span v-if="irregularity.location" class="text-xs text-slate-500 font-medium">
                {{ irregularity.location }}
              </span>
            </div>
            <p class="text-sm text-slate-800 font-mono bg-white p-2 rounded border border-slate-200 italic">
              "{{ irregularity.clauseText }}"
            </p>
          </div>

          <!-- Legal basis -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
            <div class="flex items-start gap-2">
              <div class="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                📖 LEGAL BASIS
              </div>
              <p class="text-sm text-blue-900 flex-1 leading-relaxed" v-html="makeClickable(irregularity.legalBasis)" :ref="el => irregularityRefs[i] = el as HTMLElement"></p>
            </div>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-600 mt-2">
            <Info :size="14" class="text-blue-500" />
            <span>Consult with a tenant rights organization or lawyer for specific advice</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Benchmark Card -->
    <div v-if="leaseData.benchmark" class="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-sm border border-purple-200">
      <h3 class="font-bold text-purple-900 text-lg mb-4 flex items-center gap-2">
        <TrendingUp :size="20" />
        Benchmark Analysis
      </h3>
      <div class="bg-white p-4 rounded-lg mb-4">
        <span class="text-xs text-slate-500 font-bold uppercase block mb-2">Compared to Standard</span>
        <span class="text-2xl font-bold"
              :class="{
                'text-emerald-600': leaseData.benchmark.comparedToStandard === 'better',
                'text-slate-600': leaseData.benchmark.comparedToStandard === 'standard',
                'text-rose-600': leaseData.benchmark.comparedToStandard === 'worse'
              }">
          {{ leaseData.benchmark.comparedToStandard.toUpperCase() }}
        </span>
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <div v-if="leaseData.benchmark.tenantAdvantages && leaseData.benchmark.tenantAdvantages.length > 0" class="bg-white p-3 rounded-lg">
          <span class="text-xs text-emerald-600 font-bold uppercase block mb-2">✓ Advantages</span>
          <ul class="space-y-1">
            <li v-for="(item, i) in leaseData.benchmark.tenantAdvantages" :key="i" class="text-sm text-slate-700">
              • {{ item }}
            </li>
          </ul>
        </div>
        <div v-if="leaseData.benchmark.tenantDisadvantages && leaseData.benchmark.tenantDisadvantages.length > 0" class="bg-white p-3 rounded-lg">
          <span class="text-xs text-rose-600 font-bold uppercase block mb-2">✗ Disadvantages</span>
          <ul class="space-y-1">
            <li v-for="(item, i) in leaseData.benchmark.tenantDisadvantages" :key="i" class="text-sm text-slate-700">
              • {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Clauses & Evidence Stacked Vertically -->
    <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style="animation-delay: 300ms;">
      <!-- Clause Analysis -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-4">
          <div class="bg-slate-100 p-2 rounded-lg">
            <FileText :size="18" class="text-slate-700" />
          </div>
          <h3 class="font-bold text-slate-900 text-lg">Clause Analysis</h3>
        </div>
        <div class="space-y-3">
          <div 
            v-for="(clause, i) in leaseData.clauses" 
            :key="i" 
            class="group bg-white border border-slate-200 p-5 rounded-xl hover:border-slate-300 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-left-2"
            :style="{ animationDelay: `${i * 100}ms` }"
          >
            <div class="flex justify-between items-start mb-3">
              <span class="font-bold text-slate-900 text-base">{{ clause.section }}</span>
              <span :class="[
                'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide',
                clause.status === 'clean' ? 'bg-emerald-100 text-emerald-700' :
                clause.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              ]">
                {{ clause.status }}
              </span>
            </div>
            <p class="text-sm text-slate-600 italic leading-relaxed mb-3" v-html="makeClickable(`&quot;${clause.text}&quot;`)" :ref="el => clauseRefs[i] = el as HTMLElement"></p>
            <div v-if="clause.note" class="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              <Info :size="14" class="shrink-0 mt-0.5 text-slate-400" />
              <span v-html="makeClickable(clause.note)" :ref="el => noteRefs[i] = el as HTMLElement"></span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Required Evidence -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-4">
          <div class="bg-slate-100 p-2 rounded-lg">
            <CheckCircle :size="18" class="text-slate-700" />
          </div>
          <h3 class="font-bold text-slate-900 text-lg">Required Evidence</h3>
        </div>
        <div class="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-6 rounded-xl animate-in fade-in slide-in-from-right-2" style="animation-delay: 200ms;">
          <p class="text-sm text-slate-700 mb-5 leading-relaxed">
            Based on the asset type <strong class="text-slate-900">{{ leaseData.assetType }}</strong>, our AI has generated this intake checklist:
          </p>
          <div class="flex flex-wrap gap-2 mb-6">
            <span 
              v-for="(item, idx) in leaseData.inspectionItems" 
              :key="item.id" 
              class="group bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-300 cursor-default animate-in fade-in zoom-in-50"
              :style="{ animationDelay: `${idx * 50}ms` }"
            >
              {{ item.name }}
            </span>
          </div>
        </div>
        <button 
          @click="$emit('confirmAndStart')" 
          class="w-full bg-slate-900 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all duration-300 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2"
          style="animation-delay: 400ms;"
        >
          <CheckCircle :size="22" />
          <span>Confirm & Start Intake</span>
        </button>
      </div>
    </div>

    <!-- Law Explanation Modal -->
    <LawExplanationModal 
      :show="showModal" 
      :article="selectedArticle"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { Car, Bike, Building, CheckCircle, Info, FileText, AlertTriangle, TrendingUp } from 'lucide-vue-next';
import type { LeaseData } from '@/constants';
import { useLawCitations } from '@/composables/useLawCitations';
import LawExplanationModal from './LawExplanationModal.vue';

const props = defineProps<{
  leaseData: LeaseData;
}>();

defineEmits<{
  confirmAndStart: []
}>();

// Law citations composable
const { showModal, selectedArticle, makeClickable, closeModal, setupClickListeners } = useLawCitations();

// Refs for clause, note, and irregularity elements
const clauseRefs = ref<HTMLElement[]>([]);
const noteRefs = ref<HTMLElement[]>([]);
const irregularityRefs = ref<HTMLElement[]>([]);

// Setup click listeners after mount
onMounted(async () => {
  await nextTick();
  [...clauseRefs.value, ...noteRefs.value, ...irregularityRefs.value].forEach(el => {
    if (el) setupClickListeners(el);
  });
});

const getAssetIcon = () => {
  switch (props.leaseData.assetType) {
    case 'Car': return Car;
    case 'Motorbike': return Bike;
    default: return Building;
  }
};
</script>
