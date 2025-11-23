<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Navigation -->
    <nav class="bg-white border-b border-slate-200 fixed w-full top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Shield class="w-6 h-6 text-white" />
            </div>
            <span class="text-2xl font-bold text-slate-900">LeaseCare</span>
          </div>
          <div class="flex space-x-3">
            <button @click="$emit('show-login')" class="px-5 py-2.5 text-slate-700 hover:text-slate-900 font-medium transition-colors">
              Log In
            </button>
            <button @click="$emit('show-signup')" class="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-all hover:scale-105">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-40 pb-32 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <div class="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div class="inline-block px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-700 mb-4">
            🇨🇭 Swiss Rental Law Compliance
          </div>
          <h1 class="text-6xl md:text-7xl font-bold text-slate-900 leading-tight">
            Protect Your Tenant Rights
            <span class="block mt-2 text-slate-600">with AI-Powered Analysis</span>
          </h1>
          <p class="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Analyze lease agreements, document property conditions, and defend against unfair claims—all backed by Swiss law (OR Art. 253-274g).
          </p>
          <div class="flex justify-center gap-4 pt-4">
            <button @click="$emit('show-signup')" class="px-8 py-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold text-lg transition-all hover:scale-105 shadow-lg">
              Start Free Analysis
            </button>
            <button @click="scrollToFeatures" class="px-8 py-4 bg-white text-slate-900 rounded-lg hover:bg-slate-50 font-semibold text-lg transition-all border-2 border-slate-200">
              See How It Works
            </button>
          </div>
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-3 gap-8 mt-20 pt-20 border-t border-slate-200">
          <div class="text-center animate-in fade-in slide-in-from-bottom-4 duration-700" style="animation-delay: 200ms">
            <div class="text-4xl font-bold text-slate-900 mb-2">100%</div>
            <div class="text-sm text-slate-600 font-medium">Swiss Law Compliant</div>
          </div>
          <div class="text-center animate-in fade-in slide-in-from-bottom-4 duration-700" style="animation-delay: 400ms">
            <div class="text-4xl font-bold text-slate-900 mb-2">&lt;2min</div>
            <div class="text-sm text-slate-600 font-medium">Average Analysis Time</div>
          </div>
          <div class="text-center animate-in fade-in slide-in-from-bottom-4 duration-700" style="animation-delay: 600ms">
            <div class="text-4xl font-bold text-slate-900 mb-2">AI</div>
            <div class="text-sm text-slate-600 font-medium">Vision + Legal Expert</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-4xl font-bold text-center text-gray-900 mb-16">
          Why Choose LeaseCare?
        </h2>
        
        <div class="grid md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="p-8 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
            <FileSearch class="w-12 h-12 text-indigo-600 mb-4" />
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Smart Document Analysis</h3>
            <p class="text-gray-600">
              Upload your lease agreement (PDF, image, or text) and our AI instantly extracts and analyzes 
              every clause against Swiss rental law (OR Art. 253-274g).
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="p-8 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
            <AlertTriangle class="w-12 h-12 text-purple-600 mb-4" />
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Identify Unfair Clauses</h3>
            <p class="text-gray-600">
              Automatically detect irregular terms, excessive deposits, unfair termination clauses, 
              and other tenant-unfavorable conditions with exact legal references.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="p-8 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
            <Camera class="w-12 h-12 text-pink-600 mb-4" />
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Photo Documentation</h3>
            <p class="text-gray-600">
              Guided photo intake at move-in and AI-powered comparison at move-out. 
              Protect yourself from unfair damage claims with timestamped evidence.
            </p>
          </div>

          <!-- Feature 4 -->
          <div class="p-8 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
            <MessageSquare class="w-12 h-12 text-blue-600 mb-4" />
            <h3 class="text-2xl font-bold text-gray-900 mb-3">AI Legal Assistant</h3>
            <p class="text-gray-600">
              Ask questions about your lease in natural language. Get instant answers based on 
              Swiss rental law and your specific contract terms.
            </p>
          </div>

          <!-- Feature 5 -->
          <div class="p-8 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
            <Shield class="w-12 h-12 text-green-600 mb-4" />
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Swiss Law Compliant</h3>
            <p class="text-gray-600">
              All analysis based on the Swiss Code of Obligations (OR) and cantonal regulations. 
              Know your rights and obligations under Swiss law.
            </p>
          </div>

          <!-- Feature 6 -->
          <div class="p-8 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
            <FileText class="w-12 h-12 text-yellow-600 mb-4" />
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Detailed Reports</h3>
            <p class="text-gray-600">
              Generate comprehensive reports with risk assessments, legal citations, 
              and actionable recommendations for your protection.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-4xl font-bold text-center text-gray-900 mb-16">
          How It Works
        </h2>
        
        <div class="grid md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 hover:bg-indigo-700 transition-colors">
              1
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Upload Document</h3>
            <p class="text-gray-600">Upload your lease agreement in any format (PDF, image, or text)</p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 hover:bg-purple-700 transition-colors">
              2
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">AI Analysis</h3>
            <p class="text-gray-600">Our AI extracts text and analyzes every clause against Swiss law</p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 hover:bg-pink-700 transition-colors">
              3
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Review Results</h3>
            <p class="text-gray-600">See identified issues, risk scores, and legal recommendations</p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 hover:bg-blue-700 transition-colors">
              4
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Document & Protect</h3>
            <p class="text-gray-600">Take guided photos and get ongoing AI assistance</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-32 bg-slate-900">
      <div class="max-w-4xl mx-auto text-center px-4">
        <h2 class="text-5xl font-bold text-white mb-6">
          Start Protecting Your Rights Today
        </h2>
        <p class="text-xl text-slate-400 mb-10 leading-relaxed">
          Join Swiss tenants using AI-powered analysis to understand their leases and defend against unfair claims.
        </p>
        <button @click="$emit('show-signup')" class="px-10 py-4 bg-white text-slate-900 rounded-lg hover:bg-slate-100 font-bold text-lg transition-all hover:scale-105 shadow-xl">
          Get Started Free
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-12">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex flex-col items-center space-y-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Shield class="w-5 h-5 text-white" />
            </div>
            <span class="text-xl font-bold text-slate-900">LeaseCare</span>
          </div>
          <p class="text-slate-600 text-sm">AI-powered lease protection for Swiss tenants</p>
          <p class="text-slate-400 text-xs">© 2025 LeaseCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Shield, FileSearch, AlertTriangle, Camera, MessageSquare, FileText } from 'lucide-vue-next';

defineEmits(['show-login', 'show-signup']);

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
};
</script>
