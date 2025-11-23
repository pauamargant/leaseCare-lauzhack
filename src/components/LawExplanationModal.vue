<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="close">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          <!-- Header -->
          <div class="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="bg-white/10 p-2 rounded-lg">
                <Scale :size="24" class="text-white" />
              </div>
              <div>
                <h3 class="text-xl font-bold text-white">{{ article }}</h3>
                <p class="text-sm text-slate-300">Swiss Code of Obligations</p>
              </div>
            </div>
            <button @click="close" class="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
              <X :size="24" />
            </button>
          </div>

          <!-- Content - Scrollable -->
          <div class="p-6 overflow-y-auto flex-1">
            <!-- Loading State -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-12">
              <div class="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
              <p class="text-slate-600">Fetching legal explanation...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="bg-rose-50 border border-rose-200 rounded-xl p-6">
              <div class="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle :size="24" class="text-rose-600" />
              </div>
              <p class="text-rose-800 font-medium mb-2 text-center">Failed to load explanation</p>
              <p class="text-rose-600 text-sm mb-4 text-center">{{ error }}</p>
              
              <!-- Troubleshooting tips -->
              <div class="bg-white border border-rose-200 rounded-lg p-4 text-left mb-4">
                <p class="text-xs font-bold text-rose-800 mb-2">Possible solutions:</p>
                <ul class="text-xs text-slate-700 space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Verify OpenJustice API key is in .env file</li>
                  <li>• Restart dev server after adding API key</li>
                  <li>• Check browser console (F12) for detailed errors</li>
                </ul>
              </div>
              
              <button @click="fetchExplanation" class="w-full px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                Try Again
              </button>
            </div>

            <!-- Explanation Content -->
            <div v-else-if="explanation" class="space-y-4">
              <!-- Parse and display sections -->
              <div v-for="(section, index) in parsedSections" :key="index" 
                   class="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-300">
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                       :class="getSectionColor(index)">
                    {{ section.icon }}
                  </div>
                  <div class="flex-1">
                    <h4 class="font-bold text-slate-900 mb-2 text-sm">{{ section.title }}</h4>
                    <p class="text-sm text-slate-700 leading-relaxed">{{ section.content }}</p>
                  </div>
                </div>
              </div>

              <!-- Additional Info -->
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-4">
                <div class="flex items-start gap-2">
                  <Info :size="18" class="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div class="text-xs text-blue-800">
                    <strong>Note:</strong> This explanation is provided by AI and should not be considered as legal advice. 
                    For specific legal matters, please consult a qualified attorney.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer - Always Visible -->
          <div class="bg-slate-50 px-6 py-4 flex justify-between items-center border-t flex-shrink-0">
            <div class="flex items-center gap-2">
              <div class="text-xs text-slate-500 font-medium">Powered by</div>
              <div class="text-xs font-bold text-slate-700">OpenJustice AI</div>
            </div>
            <button @click="close" class="px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95">
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Scale, X, AlertCircle, BookOpen, Info } from 'lucide-vue-next';
import openJusticeService from '@/services/openJusticeService';
import logger from '@/utils/logger';

const props = defineProps<{
  show: boolean;
  article: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const error = ref('');
const explanation = ref('');
const parsedSections = computed(() => {
  if (!explanation.value) return [];
  
  const sections = [];
  const lines = explanation.value.split('\n');
  
  // Parse numbered sections (1. **Title**: content)
  const sectionRegex = /^(\d+)\.\s*\*\*(.+?)\*\*:\s*(.+)/;
  
  for (const line of lines) {
    const match = line.match(sectionRegex);
    if (match && match[1] && match[2] && match[3]) {
      const number = match[1];
      const title = match[2];
      const content = match[3];
      sections.push({
        number: parseInt(number),
        title: title.trim(),
        content: content.trim(),
        icon: getIcon(parseInt(number))
      });
    } else if (sections.length > 0 && line.trim()) {
      // Append to last section if it's a continuation
      const lastSection = sections[sections.length - 1];
      if (lastSection) {
        lastSection.content += ' ' + line.trim();
      }
    }
  }
  
  return sections.length > 0 ? sections : [{
    number: 1,
    title: 'Explanation',
    content: explanation.value,
    icon: '📖'
  }];
});

const getIcon = (number: number): string => {
  const icons = ['📋', '👤', '💡', '🔒', '⚖️'];
  return icons[number - 1] || '📖';
};

const getSectionColor = (index: number): string => {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500', 
    'bg-amber-500',
    'bg-purple-500',
    'bg-rose-500'
  ];
  return colors[index % colors.length] || 'bg-slate-500';
};

const fetchExplanation = async () => {
  if (!props.article) return;

  loading.value = true;
  error.value = '';
  explanation.value = '';

  try {
    const result = await openJusticeService.explainLawArticle(props.article);
    explanation.value = result;
    logger.success('✅ Law explanation loaded', { article: props.article });
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch explanation';
    logger.error('❌ Failed to load law explanation', err);
  } finally {
    loading.value = false;
  }
};

const close = () => {
  emit('close');
};

// Fetch explanation when modal opens
watch(() => props.show, (newShow) => {
  if (newShow && props.article) {
    fetchExplanation();
  }
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.animate-in {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
