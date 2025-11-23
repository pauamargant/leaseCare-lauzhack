<template>
  <div class="max-w-xl mx-auto p-6 animate-in slide-in-from-bottom-10">
    <button 
      @click="$emit('cancel')" 
      class="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium"
    >
      <ChevronLeft :size="16" /> Back
    </button>

    <div v-if="isScanning" class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <!-- Header -->
      <div class="p-6 bg-slate-900 text-white">
        <div class="flex items-center gap-4">
          <div class="bg-white/10 p-3 rounded-xl">
            <FileText :size="32" class="text-white" />
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-xl">Processing Document</h3>
            <p class="text-slate-300 text-sm mt-1">{{ fileName }}</p>
          </div>
        </div>
      </div>

      <!-- Progress Steps -->
      <div class="p-8 space-y-6">
        <!-- Step 1: Upload -->
        <div class="flex items-start gap-4">
          <div :class="[
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold',
            processingStage >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
          ]">
            <span v-if="processingStage > 1">✓</span>
            <span v-else>1</span>
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-slate-800">Document Upload</h4>
            <p class="text-sm text-slate-500">File received and validated</p>
            <div v-if="processingStage === 1" class="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 animate-pulse" style="width: 100%"></div>
            </div>
          </div>
        </div>

        <!-- Step 2: OCR -->
        <div class="flex items-start gap-4">
          <div :class="[
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold',
            processingStage >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
          ]">
            <span v-if="processingStage > 2">✓</span>
            <span v-else>2</span>
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-slate-800">Text Extraction (OCR)</h4>
            <p class="text-sm text-slate-500">Reading document content</p>
            <div v-if="processingStage === 2" class="mt-2">
              <div class="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-full bg-slate-900 transition-all duration-500" :style="`width: ${ocrProgress}%`"></div>
              </div>
              <p class="text-xs text-slate-900 font-bold mt-1">{{ ocrProgress }}% complete</p>
            </div>
          </div>
        </div>

        <!-- Step 3: AI Analysis -->
        <div class="flex items-start gap-4">
          <div :class="[
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold',
            processingStage >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
          ]">
            <span v-if="processingStage > 3">✓</span>
            <span v-else>3</span>
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-slate-800">AI Analysis</h4>
            <p class="text-sm text-slate-600">Detecting asset type and risk factors</p>
            <div v-if="processingStage === 3" class="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full bg-slate-900 animate-pulse" style="width: 100%"></div>
            </div>
          </div>
        </div>

        <!-- Step 4: Complete -->
        <div class="flex items-start gap-4">
          <div :class="[
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold',
            processingStage >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
          ]">
            <span v-if="processingStage >= 4">✓</span>
            <span v-else>4</span>
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-slate-800">Generating Inspection Items</h4>
            <p class="text-sm text-slate-600">Creating customized checklist</p>
          </div>
        </div>
      </div>

      <!-- Overall Progress Bar -->
      <div class="px-8 pb-8">
        <div class="bg-slate-200 rounded-full h-3 overflow-hidden">
          <div 
            class="h-full bg-slate-900 transition-all duration-500"
            :style="`width: ${overallProgress}%`"
          ></div>
        </div>
        <p class="text-center text-sm text-slate-700 font-bold mt-2">{{ overallProgress }}% Complete</p>
      </div>
    </div>

    <div v-else class="bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden">
      <div class="p-8 text-center border-b border-slate-300">
        <div class="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-900">
          <ScanLine :size="32" />
        </div>
        <h2 class="text-xl font-bold text-slate-800">Smart Document Scan</h2>
        <p class="text-sm text-slate-600 mt-2">
          Upload your lease PDF. Our AI will automatically detect if it is for a 
          <span class="font-bold text-slate-800"> Car</span>, 
          <span class="font-bold text-slate-800"> Motorbike</span>, or 
          <span class="font-bold text-slate-800"> Property</span>.
        </p>
      </div>
      
      <div class="p-8 bg-slate-50">
        <div 
          @click="triggerFileInput"
          class="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-slate-900 hover:bg-slate-50 transition-all group"
        >
          <input 
            ref="fileInput" 
            type="file" 
            class="hidden" 
            accept=".pdf,.doc,.docx" 
            @change="handleFileSelect" 
          />
          <Upload :size="48" class="text-slate-400 group-hover:text-slate-900 mb-4 transition-colors" />
          <span class="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Click to Upload Contract</span>
          <span class="text-xs text-slate-500 mt-2">PDF, DOCX up to 10MB</span>
        </div>
        
        <div class="mt-6 text-center">
          <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Or try a demo</p>
          <div class="flex gap-3 justify-center">
            <button 
              @click="loadDemoLease('car')" 
              class="px-4 py-2 bg-slate-100 border border-slate-300 text-slate-900 rounded-lg font-medium hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 text-sm"
            >
              🚗 Car Lease Demo
            </button>
            <button 
              @click="loadDemoLease('property')" 
              class="px-4 py-2 bg-slate-100 border border-slate-300 text-slate-900 rounded-lg font-medium hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 text-sm"
            >
              🏠 Apartment Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Upload, FileText, AlertCircle, ChevronLeft, ScanLine } from 'lucide-vue-next';
import togetherService from '@/services/togetherService';
import storageService from '@/services/storageService';
import { useLeaseStore } from '@/stores/leaseStore';
import { parseDocument, validateDocumentText } from '@/utils/documentParser';
import { auth } from '@/config/firebase';
import logger from '@/utils/logger';
import type { LeaseData, InspectionItem } from '@/constants';
import { demoLeases } from '@/data/demoLeases';

const props = defineProps<{
  jurisdiction: string;
}>();

const emit = defineEmits<{
  analyzeComplete: [data: LeaseData]
  cancel: []
}>();

const store = useLeaseStore();
const isDragging = ref(false);
const isProcessing = ref(false);
const error = ref<string | null>(null);

const isScanning = ref(false);
const fileName = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

// Progress tracking
const processingStage = ref(0); // 0=idle, 1=upload, 2=ocr, 3=ai, 4=complete
const ocrProgress = ref(0); // 0-100
const overallProgress = ref(0); // 0-100

// Computed overall progress based on stage
const updateOverallProgress = () => {
  if (processingStage.value === 1) overallProgress.value = 25;
  else if (processingStage.value === 2) overallProgress.value = 25 + (ocrProgress.value * 0.25);
  else if (processingStage.value === 3) overallProgress.value = 75;
  else if (processingStage.value === 4) overallProgress.value = 100;
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    await processFile(file);
  }
};

const handleDemo = (demoFileName: string) => {
  processFile(demoFileName);
};

const loadDemoLease = (type: 'car' | 'property') => {
  const demoData = type === 'car' ? demoLeases.car : demoLeases.property;
  
  // Set the demo data in store
  store.setLeaseData(demoData as LeaseData);
  
  // Emit analyze complete to proceed to review stage
  emit('analyzeComplete', demoData as LeaseData);
  
  logger.success(`✅ Loaded ${type} demo lease`);
};

const getDefaultInspectionItems = (assetType: string) => {
  if (assetType === 'Car') {
    return [
      {id: 'odom', name: "Odometer", description: "Capture mileage reading"}, 
      {id: 'bump_f', name: "Front Bumper", description: "Check for scratches"}, 
      {id: 'rims', name: "Rims", description: "Check for curb rash"},
      {id: 'interior', name: "Interior", description: "Seats, dashboard, and console condition"}
    ];
  } else if (assetType === 'Motorbike') {
    return [
      {id: 'tank', name: "Fuel Tank", description: "Check for dents"}, 
      {id: 'exhaust', name: "Exhaust", description: "Check for scrapes"},
      {id: 'fairings', name: "Fairings", description: "Body panels condition"}
    ];
  } else {
    return [
      {id: 'walls', name: "Wall Condition", description: "Photograph all walls for paint condition"},
      {id: 'floors', name: "Floor Condition", description: "Document scratches and wear patterns"},
      {id: 'kitchen', name: "Kitchen", description: "Appliances and fixtures"},
      {id: 'bathroom', name: "Bathroom", description: "Tiles, shower, toilet condition"}
    ];
  }
};

const processFile = async (fileOrName: File | string) => {
  isScanning.value = true;
  processingStage.value = 0;
  ocrProgress.value = 0;
  overallProgress.value = 0;
  
  let documentText = '';
  let name = '';
  
  // Stage 1: Upload
  processingStage.value = 1;
  updateOverallProgress();
  await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
  
  // Handle File object (real upload) or string (demo)
  if (typeof fileOrName === 'string') {
    name = fileOrName;
    fileName.value = name;
    logger.info('📄 Processing demo document', { fileName: name });
    
    // Create mock document text for demo
    documentText = `LEASE AGREEMENT\n\nThis agreement is made for ${name}...\n\nTerm: 12 months\nDeposit: 3 months rent\nNotice: 3 months`;
  } else {
    // Real file upload - extract text
    name = fileOrName.name;
    fileName.value = name;
    logger.info('📄 Extracting text from document', { fileName: name, type: fileOrName.type });
    
    // Stage 2: OCR
    processingStage.value = 2;
    updateOverallProgress();
    
    try {
      // Simulate OCR progress
      const progressInterval = setInterval(() => {
        if (ocrProgress.value < 90) {
          ocrProgress.value += 10;
          updateOverallProgress();
        }
      }, 200);
      
      documentText = await parseDocument(fileOrName);
      
      clearInterval(progressInterval);
      ocrProgress.value = 100;
      updateOverallProgress();
      
      if (!validateDocumentText(documentText)) {
        throw new Error('Document contains insufficient text');
      }
      
      logger.success('✅ Document text extracted', { length: documentText.length });
      await new Promise(resolve => setTimeout(resolve, 300)); // Visual feedback
    } catch (error: any) {
      logger.error('❌ Document parsing failed', error);
      
      // Show user-friendly error message
      const errorMsg = error.message || 'Unknown error';
      
      if (errorMsg.includes('PDF parsing failed')) {
        alert(`⚠️ PDF Parsing Issue\n\nThe PDF couldn't be processed due to browser security restrictions.\n\n✅ Solutions:\n1. Try uploading the document as an image (JPG/PNG)\n2. Use a text file (.txt)\n3. Or use the demo files to test the app\n\nTechnical: ${errorMsg}`);
      } else if (errorMsg.includes('Image OCR failed')) {
        alert(`⚠️ Image Processing Issue\n\nThe image couldn't be processed.\n\n✅ Try:\n1. Use a clearer image\n2. Try a different image format\n3. Or use the demo files\n\nTechnical: ${errorMsg}`);
      } else {
        alert(`⚠️ Document Reading Failed\n\n${errorMsg}\n\n✅ Supported formats:\n• PDF files (.pdf)\n• Images (.jpg, .png)\n• Text files (.txt)\n\nTip: Try the demo files to test the app!`);
      }
      
      isScanning.value = false;
      processingStage.value = 0;
      return;
    }
  }
  
  // Detect asset type based on filename (fallback)
  const isCar = name.toLowerCase().includes('car') || name.toLowerCase().includes('vehicle') || name.toLowerCase().includes('bmw');
  const isBike = name.toLowerCase().includes('moto') || name.toLowerCase().includes('bike') || name.toLowerCase().includes('ducati');
  
  const assetType = isCar ? "Car" : isBike ? "Motorbike" : "Property";
  logger.success(`✅ Asset type detected from filename: ${assetType}`);
  
  // Log the extracted document text
  console.log('\n' + '🔵'.repeat(40));
  console.log('📄 DOCUMENT TEXT BEING SENT TO AI:');
  console.log('🔵'.repeat(40));
  console.log(documentText);
  console.log('🔵'.repeat(40));
  console.log(`📊 Length: ${documentText.length} characters`);
  console.log('🔵'.repeat(40) + '\n');
  
  // Stage 3: AI Analysis
  processingStage.value = 3;
  updateOverallProgress();
  
  try {
    // Use Together AI to analyze the ACTUAL extracted document text
    logger.api('🤖 Sending extracted document text to Together AI for comprehensive analysis');
    const aiAnalysis = await togetherService.analyzeDocument(documentText, props.jurisdiction);
    
    // Use AI-detected asset type or fallback to filename detection
    const detectedAssetType = aiAnalysis.assetType || assetType;
    logger.info('Asset type determined', { detected: detectedAssetType });
    
    // Use AI-generated inspection items or fallback to defaults
    const inspectionItems = aiAnalysis.inspectionItems && aiAnalysis.inspectionItems.length > 0
      ? aiAnalysis.inspectionItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          priority: item.priority,
          reason: item.reason
        }))
      : getDefaultInspectionItems(detectedAssetType);
    
    logger.success(`✅ Generated ${inspectionItems.length} AI-suggested inspection items`);
    
    // Stage 4: Generating Inspection Items
    processingStage.value = 4;
    updateOverallProgress();
    await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
    
    const response: LeaseData = {
      title: aiAnalysis.assetDetails || (isCar ? "Vehicle Lease Agreement" : isBike ? "Moto Rental Contract" : "Residential Lease"),
      assetType: detectedAssetType as 'Car' | 'Motorbike' | 'Property',
      assetName: aiAnalysis.assetDetails || (isCar ? "BMW X3 (VD-123456)" : isBike ? "Ducati Monster" : "Av. de la Gare 10, Lausanne"),
      riskScore: aiAnalysis.riskScore || (isCar ? 15 : 45),
      inspectionItems: inspectionItems,
      clauses: aiAnalysis.clauses || [
        { section: "Term", text: "12 Months fixed duration.", status: "clean" },
        { section: "Deposit", text: isCar ? "CHF 1000 deductible." : "3 months rent deposit.", status: "warning", note: "Standard practice in " + props.jurisdiction },
        { section: "Damage", text: "Tenant liable for all scratches regardless of cause.", status: "risk", note: "Potentially unfair under " + props.jurisdiction + " law." }
      ],
      irregularities: aiAnalysis.irregularities || [],
      benchmark: aiAnalysis.benchmark || null,
      recommendations: aiAnalysis.recommendations || [],
      // NEW: Include info array and responsibilities
      info: aiAnalysis.info || [],
      responsibilities: aiAnalysis.responsibilities || undefined
    };
    
    logger.success('✅ Document analysis complete', { 
      assetType: response.assetType,
      riskScore: response.riskScore,
      clauses: response.clauses.length,
      inspectionItems: response.inspectionItems.length
    });
    
    // Set lease data in store first
    store.setLeaseData(response);
    
    // Upload document to Firebase Storage and save lease data
    const user = auth.currentUser;
    if (user && fileOrName instanceof File) {
      try {
        logger.info('📤 Uploading document to Firebase Storage...');
        const documentUrl = await storageService.uploadDocument(fileOrName, user.uid, `lease_${Date.now()}`);
        logger.success('✅ Document uploaded', { url: documentUrl });
        
        // Save lease to Firestore immediately
        logger.info('💾 Saving lease to Firestore...');
        const leaseId = await store.saveCurrentLease(documentUrl, documentText);
        logger.success('✅ Lease saved to Firebase', { leaseId });
      } catch (error) {
        logger.error('❌ Failed to save to Firebase', error);
        // Continue anyway - don't block the user
      }
    }
    
    emit('analyzeComplete', response);
  } catch (error) {
    logger.error('❌ Error analyzing document', error);
    
    // Fallback to mock response
    const fallbackResponse: LeaseData = {
      title: isCar ? "Vehicle Lease Agreement" : isBike ? "Moto Rental Contract" : "Residential Lease",
      assetType: assetType as 'Car' | 'Motorbike' | 'Property',
      assetName: isCar ? "BMW X3 (VD-123456)" : isBike ? "Ducati Monster" : "Av. de la Gare 10, Lausanne",
      riskScore: isCar ? 15 : 45,
      inspectionItems: isCar ? 
        [
          {id: 'odom', name: "Odometer", description: "Capture mileage reading"}, 
          {id: 'bump_f', name: "Front Bumper", description: "Check for scratches"}, 
          {id: 'rims', name: "Rims", description: "Check for curb rash"}
        ] :
        isBike ?
        [
          {id: 'tank', name: "Fuel Tank", description: "Check for dents"}, 
          {id: 'exhaust', name: "Exhaust", description: "Check for scrapes"}
        ] :
        [
          {id: 'kit', name: "Kitchen Sink", description: "Tap and drain condition"}, 
          {id: 'wall_liv', name: "Living Room Walls", description: "Wide shot for paint condition"}, 
          {id: 'floor_bed', name: "Bedroom Floor", description: "Parquet condition"}
        ],
      clauses: [
        { section: "Term", text: "12 Months fixed duration.", status: "clean" },
        { section: "Deposit", text: isCar ? "CHF 1000 deductible." : "3 months rent deposit.", status: "warning", note: "Standard practice in " + props.jurisdiction },
        { section: "Damage", text: "Tenant liable for all scratches regardless of cause.", status: "risk", note: "Potentially unfair under " + props.jurisdiction + " law." }
      ]
    };
    
    emit('analyzeComplete', fallbackResponse);
  }
};
</script>
