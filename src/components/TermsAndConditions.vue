<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-slate-200">
        <h2 class="text-2xl font-bold text-slate-900">Terms and Conditions</h2>
        <p class="text-sm text-slate-600 mt-1">Please read and accept our terms to continue</p>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
        <section>
          <h3 class="font-bold text-lg text-slate-900 mb-2">1. Acceptance of Terms</h3>
          <p>By accessing and using LeaseCare ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.</p>
        </section>

        <section>
          <h3 class="font-bold text-lg text-slate-900 mb-2">2. Use of Service</h3>
          <p>LeaseCare provides tools to help manage rental agreements and property inspections. The Service is provided "as is" without warranty of any kind.</p>
        </section>

        <section>
          <h3 class="font-bold text-lg text-slate-900 mb-2">3. Data Storage and Privacy</h3>
          <p class="mb-2">We use Firebase (Google Cloud Platform) to store your data securely:</p>
          <ul class="list-disc pl-6 space-y-1">
            <li>Your lease documents and photos are stored in Firebase Storage</li>
            <li>Your profile information is stored in Firebase Firestore</li>
            <li>Authentication is handled by Firebase Authentication</li>
            <li>All data is encrypted in transit and at rest</li>
            <li>You retain ownership of all your data</li>
          </ul>
        </section>

        <section>
          <h3 class="font-bold text-lg text-slate-900 mb-2">4. User Responsibilities</h3>
          <ul class="list-disc pl-6 space-y-1">
            <li>You are responsible for maintaining the confidentiality of your account</li>
            <li>You must provide accurate and complete information</li>
            <li>You must not use the Service for any illegal purposes</li>
            <li>You must not upload malicious content or viruses</li>
          </ul>
        </section>

        <section>
          <h3 class="font-bold text-lg text-slate-900 mb-2">5. AI-Generated Content</h3>
          <p>LeaseCare uses AI (Together AI) to analyze lease documents. While we strive for accuracy, AI-generated analysis should not be considered legal advice. Always consult with a qualified legal professional for important decisions.</p>
        </section>

        <section>
          <h3 class="font-bold text-lg text-slate-900 mb-2">6. Data Retention</h3>
          <p>Your data is stored as long as your account is active. You can request deletion of your data at any time by contacting support or deleting your account.</p>
        </section>

        <section>
          <h3 class="font-bold text-lg text-slate-900 mb-2">7. Third-Party Services</h3>
          <p class="mb-2">We use the following third-party services:</p>
          <ul class="list-disc pl-6 space-y-1">
            <li><strong>Firebase (Google)</strong> - Data storage and authentication</li>
            <li><strong>Together AI</strong> - Document analysis and AI features</li>
          </ul>
          <p class="mt-2">These services have their own terms and privacy policies.</p>
        </section>

        <section>
          <h3 class="font-bold text-lg text-slate-900 mb-2">8. Limitation of Liability</h3>
          <p>LeaseCare shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the Service.</p>
        </section>

        <section>
          <h3 class="font-bold text-lg text-slate-900 mb-2">9. Changes to Terms</h3>
          <p>We reserve the right to modify these terms at any time. Continued use of the Service constitutes acceptance of modified terms.</p>
        </section>

        <section>
          <h3 class="font-bold text-lg text-slate-900 mb-2">10. Contact</h3>
          <p>For questions about these terms, please contact us at: <strong>support@leasecare.app</strong></p>
        </section>

        <section class="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p class="text-xs text-slate-600">
            <strong>Last Updated:</strong> November 22, 2025<br>
            <strong>Version:</strong> 1.0
          </p>
        </section>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-slate-200 bg-slate-50">
        <div class="flex items-start gap-3 mb-4">
          <input 
            type="checkbox" 
            id="accept-terms" 
            v-model="accepted"
            class="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          >
          <label for="accept-terms" class="text-sm text-slate-700 cursor-pointer">
            I have read and agree to the Terms and Conditions, including the use of Firebase for data storage and AI for document analysis.
          </label>
        </div>
        <div class="flex gap-3">
          <button
            v-if="canDecline"
            @click="$emit('decline')"
            class="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all"
          >
            Decline
          </button>
          <button
            @click="handleAccept"
            :disabled="!accepted"
            class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  canDecline?: boolean;
}>();

const emit = defineEmits<{
  accept: []
  decline: []
}>();

const accepted = ref(false);

const handleAccept = () => {
  if (accepted.value) {
    emit('accept');
  }
};
</script>
