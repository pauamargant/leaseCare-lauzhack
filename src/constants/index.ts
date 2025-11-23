export const SWISS_CANTONS = [
  "Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "Basel-Landschaft", "Basel-Stadt", 
  "Bern", "Fribourg", "Geneva", "Glarus", "Graubünden", "Jura", "Lucerne", "Neuchâtel", 
  "Nidwalden", "Obwalden", "Schaffhausen", "Schwyz", "Solothurn", "St. Gallen", "Thurgau", 
  "Ticino", "Uri", "Valais", "Vaud", "Zug", "Zurich"
];

export const STAGES = [
  { id: 'review', label: 'Review', icon: 'FileText' },
  { id: 'intake', label: 'Intake', icon: 'Camera' },
  { id: 'chat', label: 'Live Lease', icon: 'MessageSquare' },
  { id: 'checkout', label: 'Checkout', icon: 'LogOut' },
  { id: 'claims', label: 'Defense', icon: 'Shield' },
];

export interface User {
  name: string;
  location: string;
}

export interface InfoItem {
  label: string;
  value: string;
  icon: string;
}

export interface Responsibilities {
  tenant: string[];
  lessor: string[];
}

export interface LeaseData {
  title: string;
  assetType: 'Car' | 'Motorbike' | 'Property';
  assetName: string;
  riskScore: number;
  inspectionItems: InspectionItem[];
  clauses: Clause[];
  irregularities?: Irregularity[];
  benchmark?: Benchmark | null;
  recommendations?: string[];
  // NEW: Flexible info array format
  info?: InfoItem[];
  responsibilities?: Responsibilities;
  // Progress tracking
  activeStage?: string;
  unlockedStages?: number;
}

export interface Irregularity {
  issue: string;
  severity: 'minor' | 'moderate' | 'severe';
  legalBasis: string;
  clauseText: string; // Exact text from lease where issue was found
  location: string; // Where in document (e.g., "Section 5, Paragraph 2")
}

export interface Benchmark {
  comparedToStandard: 'better' | 'standard' | 'worse';
  keyDifferences: string[];
  tenantAdvantages: string[];
  tenantDisadvantages: string[];
}

export interface InspectionItem {
  id: string;
  name: string;
  room?: string;
  description: string;
  photoAngles?: string[];
  recommendedPhotos?: number;
  priority?: 'high' | 'medium' | 'low';
  reason?: string;
  contractReference?: string;
}

export interface Clause {
  section: string;
  text: string;
  status: 'clean' | 'warning' | 'risk';
  note?: string;
}

export interface Evidence {
  captured: boolean;
  timestamp: Date;
  img: string;
  photos?: string[]; // Support multiple photos
  photoCount?: number;
}

export interface ChatMessage {
  role: 'user' | 'ai' | 'system';
  text: string;
}

export interface DamageAnalysis {
  hasDamage: boolean;
  severity: 'none' | 'minor' | 'moderate' | 'major';
  description: string;
  isNormalWear?: boolean;
  tenantLiable?: boolean;
  damageTypes?: string[];
  specificIssues?: string[];
  liabilityReasoning?: string;
  repairEstimate?: string;
  sameLocation?: boolean;
  locationConfidence?: string;
  photosAnalyzed?: number;
  stateGrade?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  verifiedPairs?: Array<{
    index: number;
    verified: boolean;
    photoUrl: string | null;
  }>;
  uploadProgress?: {
    uploaded: number;
    total: number;
    complete: boolean;
  };
}

export interface Claim {
  id: number;
  text: string;
  status: 'analyzing' | 'ready';
}
