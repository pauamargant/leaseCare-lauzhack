<template>
  <div class="h-[600px] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in">
    <!-- Chat Header -->
    <div class="p-4 bg-slate-50 border-b flex justify-between items-center">
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <MessageSquare :size="20" />
          </div>
          <div class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
        </div>
        <div>
          <h3 class="font-bold text-slate-800">Lease Assistant</h3>
          <p class="text-xs text-slate-500">Context: {{ leaseData.assetName }}</p>
        </div>
      </div>
      <button 
        @click="$emit('endLease')"
        class="bg-white border-2 border-rose-100 text-rose-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center gap-2"
      >
        <LogOut :size="14" /> End Lease
      </button>
    </div>

    <!-- Messages Area -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
      <div 
        v-for="(m, i) in messages" 
        :key="i" 
        :class="['flex', m.role === 'user' ? 'justify-end' : 'justify-start']"
      >
        <div :class="[
          'max-w-[85%] p-4 rounded-2xl leading-relaxed',
          m.role === 'user' ? 'bg-slate-900 text-white rounded-br-sm' : 
          m.role === 'system' ? 'bg-amber-50 text-amber-800 border border-amber-100 text-center w-full font-medium' :
          'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'
        ]">
          <div v-if="m.role === 'ai'" class="prose prose-sm max-w-none" :ref="el => messageRefs[i] = el as HTMLElement">
            <div v-html="makeClickable(formatMessage(m.text))"></div>
          </div>
          <div v-else>{{ m.text }}</div>
        </div>
      </div>
      <div v-if="isTyping" class="flex justify-start">
        <div class="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
          <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-4 bg-white border-t flex gap-3">
      <button 
        @click="handleFileUpload"
        :disabled="isTyping"
        class="p-3 text-slate-400 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Upload file"
      >
        <Paperclip :size="20" />
      </button>
      <input 
        v-model="input"
        @keydown.enter="sendMessage"
        :disabled="isTyping"
        :placeholder="isTyping ? 'Waiting for response...' : 'Ask about repairs, deposit return, or notice period...'"
        class="flex-1 bg-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button 
        @click="sendMessage"
        :disabled="isTyping || !input.trim()"
        class="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
      >
        <ArrowRight :size="20" />
      </button>
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
import { ref, nextTick, watch } from 'vue';
import { MessageSquare, LogOut, Paperclip, ArrowRight } from 'lucide-vue-next';
import type { LeaseData, ChatMessage, Evidence } from '@/constants';
import togetherService from '@/services/togetherService';
import { useLawCitations } from '@/composables/useLawCitations';
import LawExplanationModal from './LawExplanationModal.vue';
import { useLeaseStore } from '@/stores/leaseStore';
import Swal from 'sweetalert2';

const props = defineProps<{
  leaseData: LeaseData;
  jurisdiction: string;
  intakeEvidence?: Record<string, Evidence>;
  documentText?: string | null;
}>();

defineEmits<{
  endLease: []
}>();

const messages = ref<ChatMessage[]>([
  { 
    role: 'system', 
    text: `LeaseCare Active. Monitoring ${props.leaseData.assetName} under ${props.jurisdiction} jurisdiction.` 
  }
]);
const input = ref('');
const isTyping = ref(false);
const messagesContainer = ref<HTMLDivElement | null>(null);

// Law citations composable
const { showModal, selectedArticle, makeClickable, closeModal, setupClickListeners } = useLawCitations();
const messageRefs = ref<HTMLElement[]>([]);

// Watch messages and setup click listeners
watch(messages, async () => {
  await nextTick();
  messageRefs.value.forEach(el => {
    if (el) setupClickListeners(el);
  });
}, { deep: true });

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const formatMessage = (text: string): string => {
  // Convert markdown-style formatting to HTML
  let formatted = text;
  
  // Bold: **text** or __text__
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Bullet points: - item or * item
  formatted = formatted.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc ml-4 space-y-1">$1</ul>');
  
  // Numbered lists: 1. item
  formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Line breaks
  formatted = formatted.replace(/\n\n/g, '<br/><br/>');
  formatted = formatted.replace(/\n/g, '<br/>');
  
  // Legal references: Art XXX CO
  formatted = formatted.replace(/(Art\.?\s+\d+[a-z]?\s+CO)/gi, '<span class="font-bold text-indigo-600">$1</span>');
  
  return formatted;
};

const handleFileUpload = () => {
  Swal.fire({
    icon: 'info',
    title: 'Feature Coming Soon',
    html: `
      <p class="text-slate-600 mb-2">File upload is not available yet.</p>
      <p class="text-sm text-slate-500">This feature may be added in a future update.</p>
    `,
    confirmButtonText: 'Got it',
    confirmButtonColor: '#10b981',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg px-6 py-2.5'
    }
  });
};

const sendMessage = async () => {
  if (!input.value.trim()) return;
  
  const userMsg: ChatMessage = { role: 'user', text: input.value };
  messages.value.push(userMsg);
  input.value = '';
  isTyping.value = true;
  
  await nextTick();
  scrollToBottom();
  
  try {
    // Build inspection items context with photos
    let inspectionContext = '';
    if (props.intakeEvidence && Object.keys(props.intakeEvidence).length > 0) {
      inspectionContext = '\n\nInspection Items Documented:';
      const items = props.leaseData.inspectionItems || [];
      items.forEach(item => {
        const evidence = props.intakeEvidence![item.id];
        if (evidence) {
          inspectionContext += `\n- ${item.name}: Photo captured at ${evidence.timestamp.toLocaleString()}`;
        }
      });
    }

    // Build document context if available
    let documentContext = '';
    if (props.documentText && props.documentText.length > 0) {
      // Include first 2000 characters of document text as context
      const truncatedText = props.documentText.substring(0, 2000);
      documentContext = `\n\nOriginal Lease Document (OCR Extract):\n${truncatedText}${props.documentText.length > 2000 ? '...(truncated)' : ''}`;
    }

    // Get user info from store if available
    const store = useLeaseStore();
    const userInfo = store.user;

    // Prepare messages with full context
    const contextMessages: any[] = [
      {
        role: 'system',
        content: `You are a Swiss rental law expert assistant specializing in ${props.jurisdiction} cantonal law.

**JURISDICTION**: ${props.jurisdiction} - Apply canton-specific regulations and tenant protections.

**USER CONTEXT**:
${userInfo ? `- Tenant Name: ${userInfo.name || 'User'}
- Location: ${userInfo.location || 'Not specified'}` : '- Anonymous user'}

**LEASE DETAILS**:
- Asset Type: ${props.leaseData.assetType}
- Asset: ${props.leaseData.assetName}
- Risk Score: ${props.leaseData.riskScore}/100
${props.leaseData.info ? props.leaseData.info.map(item => `- ${item.label}: ${item.value}`).join('\n') : ''}

**RESPONSIBILITIES**:
${props.leaseData.responsibilities ? `- Your duties: ${props.leaseData.responsibilities.tenant?.join(', ') || 'N/A'}
- Provider duties: ${props.leaseData.responsibilities.lessor?.join(', ') || 'N/A'}` : 'Not specified'}

**KEY CLAUSES**: ${props.leaseData.clauses.map(c => `${c.section}: ${c.text}`).join('; ')}${inspectionContext}${documentContext}

Provide detailed, structured advice:
- Use **bold** for important terms
- Use bullet points with - for lists
- **CRITICAL**: ALWAYS wrap law citations with ** markers for clickability
  - Correct: **Art. 257 CO**, **OR Art. 267**, **Art. 268a CO**
  - Wrong: Art. 257 CO (plain text)
- Be thorough and cite Swiss law frequently
- Format responses clearly with paragraphs
- When discussing specific items, reference the inspection photos AND the original lease document text if available

**REMEMBER**: Wrap ALL law citations with ** so users can click them for explanations!

Be professional, precise, and actionable.`
      }
    ];

    // Add ALL intake photos as context (including multiple photos per item)
    if (props.intakeEvidence && Object.keys(props.intakeEvidence).length > 0) {
      const photoUrls: string[] = [];
      Object.entries(props.intakeEvidence).forEach(([itemId, evidence]) => {
        // Include ALL photos from the photos array
        if (evidence.photos && evidence.photos.length > 0) {
          photoUrls.push(...evidence.photos);
        } else if (evidence.img) {
          // Fallback to single img if photos array not available
          photoUrls.push(evidence.img);
        }
      });
      
      if (photoUrls.length > 0) {
        contextMessages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Here are ALL the intake inspection photos of the property (${photoUrls.length} total images from ${Object.keys(props.intakeEvidence).length} inspection items). Please analyze these when answering questions about the property condition.`
            },
            ...photoUrls.map(url => ({
              type: 'image_url',
              image_url: { url }
            }))
          ]
        });
        contextMessages.push({
          role: 'assistant',
          content: `I have reviewed all ${photoUrls.length} intake inspection photos covering ${Object.keys(props.intakeEvidence).length} different areas. I can now help you with questions about the property condition, potential issues, and your rights regarding the documented state.`
        });
      }
    }

    // Add conversation history
    contextMessages.push(...messages.value.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text
    })));

    const response = await togetherService.chat({
      messages: contextMessages
    });
    
    messages.value.push({ role: 'ai', text: response });
  } catch (error) {
    messages.value.push({ 
      role: 'system', 
      text: 'Sorry, I encountered an error. Please try again.' 
    });
  } finally {
    isTyping.value = false;
    await nextTick();
    scrollToBottom();
  }
};
</script>
