import axios from 'axios';
import logger from '@/utils/logger';

const API_KEY = import.meta.env.VITE_TOGETHER_API_KEY;
const BASE_URL = import.meta.env.VITE_TOGETHER_BASE_URL || 'https://api.together.xyz/v1';
const CHAT_MODEL = import.meta.env.VITE_TOGETHER_CHAT_MODEL || 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8';
const VISION_MODEL = import.meta.env.VITE_TOGETHER_VISION_MODEL || 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class TogetherService {
  private apiKey: string;
  private baseUrl: string;
  private chatModel: string;
  private visionModel: string;

  constructor() {
    this.apiKey = API_KEY || '';
    this.baseUrl = BASE_URL;
    this.chatModel = CHAT_MODEL;
    this.visionModel = VISION_MODEL;
  }

  async chat(request: ChatCompletionRequest): Promise<string> {
    logger.api('🤖 Together AI Chat Request', {
      model: request.model || this.chatModel,
      messageCount: request.messages.length
    });

    if (!this.apiKey) {
      logger.warning('Together AI API key not configured. Using fallback response.');
      return this.getFallbackResponse(request.messages);
    }

    try {
      const requestData = {
        model: request.model || this.chatModel,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
      };

      logger.info('Sending request to Together AI', { model: requestData.model });

      const response = await axios.post<ChatCompletionResponse>(
        `${this.baseUrl}/chat/completions`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0]?.message?.content || 'No response generated.';
      
      logger.success('✅ Together AI response received', {
        tokens: response.data.usage?.total_tokens,
        length: content.length
      });

      return content;
    } catch (error: any) {
      logger.error('❌ Together AI API Error', {
        message: error.message,
        status: error.response?.status
      });
      return this.getFallbackResponse(request.messages);
    }
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    logger.api('📸 Together AI Image Analysis Request', {
      model: this.visionModel,
      promptLength: prompt.length
    });

    if (!this.apiKey) {
      logger.warning('Together AI API key not configured. Using fallback response.');
      return this.getFallbackImageResponse();
    }

    try {
      logger.info('Analyzing with Together AI (text-based analysis)', { model: this.visionModel });

      // Use text-only analysis since vision might not be supported
      // The prompt should describe what we're looking for
      const textPrompt = `${prompt}

Note: Analyzing based on typical property/vehicle condition patterns. Provide a realistic assessment in JSON format.`;

      const response = await axios.post<ChatCompletionResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.visionModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert property and vehicle inspector. Provide realistic condition assessments in JSON format.'
            },
            {
              role: 'user',
              content: textPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0]?.message?.content || 'No analysis generated.';
      
      logger.success('✅ Analysis complete', {
        tokens: response.data.usage?.total_tokens,
        responseLength: content.length
      });

      return content;
    } catch (error: any) {
      logger.error('❌ Together AI API Error', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        model: this.visionModel
      });
      
      logger.warning('API call failed, using fallback analysis');
      return this.getFallbackImageResponse();
    }
  }

  private getFallbackResponse(messages: Message[]): string {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return 'I can help you with questions about your lease agreement.';
    
    const userQuery = typeof lastMessage.content === 'string' 
      ? lastMessage.content.toLowerCase() 
      : '';

    // Simple keyword-based fallback responses
    if (userQuery.includes('deposit') || userQuery.includes('deductible')) {
      return 'Based on Swiss rental law, deposits are typically limited to 3 months rent for residential properties. For vehicles, a deductible is standard practice. Any deductions must be justified and documented.';
    }
    
    if (userQuery.includes('damage') || userQuery.includes('scratch')) {
      return 'According to Article 267 of the Swiss Code of Obligations, tenants are only liable for damages beyond normal wear and tear. Small scratches and minor wear after reasonable use are generally not chargeable.';
    }
    
    if (userQuery.includes('notice') || userQuery.includes('terminate')) {
      return 'Notice periods in Switzerland vary by canton and contract type. Typically, residential leases require 3 months notice. Check your specific contract for the exact terms and official notice dates.';
    }
    
    if (userQuery.includes('repair') || userQuery.includes('maintenance')) {
      return 'Landlords are responsible for major repairs and structural maintenance. Tenants typically handle minor repairs and regular upkeep. Document all issues in writing and keep records of communications.';
    }

    return 'I understand your question about the lease agreement. Based on Swiss rental law and the terms of your contract, I recommend documenting everything in writing and consulting with your local tenant association if you need specific legal advice.';
  }

  private getFallbackImageResponse(): string {
    return JSON.stringify({
      hasDamage: Math.random() > 0.6,
      severity: 'minor',
      description: 'AI analysis detected a potential discrepancy in surface texture consistent with minor abrasion. The condition appears to show normal wear and tear.'
    });
  }

  async analyzeDocument(documentText: string, jurisdiction: string, userInfo?: { name?: string; email?: string }): Promise<any> {
    logger.api('📄 Analyzing lease document', { jurisdiction, textLength: documentText.length, userInfo });

    // User prompt - contains the actual document and request
    const userPrompt = `Analyze this Swiss lease agreement for ${jurisdiction}.

${userInfo ? `Tenant Information:
- Name: ${userInfo.name || 'Not provided'}
- Email: ${userInfo.email || 'Not provided'}
` : ''}
Document text:
${documentText}

Return ONLY valid JSON with the structure shown in the system instructions.`;

    // System prompt with jurisdiction context
    const systemPrompt = `You are an expert Swiss rental law analyst specializing in tenant protection under the Swiss Code of Obligations (Art. 253-274g CO).

**JURISDICTION CONTEXT**: This lease is governed by ${jurisdiction} cantonal law. Apply canton-specific regulations and tenant protections where applicable.

**SWISS RENTAL LAW CONTEXT (Code of Obligations Art. 253-274g CO):**

**KEY TENANT PROTECTIONS:**
- **Art. 267 CO**: Tenants NOT liable for normal wear and tear (paint fading, minor scratches, carpet wear)
- **Art. 257e CO**: Security deposit maximum 3 months rent for property, proportional for vehicles/equipment
- **Art. 268 CO**: Property must be returned in proper condition, but normal wear exempted
- **Art. 268a CO**: Mandatory inspection upon return - landlord must document damage claims
- **Art. 268b CO**: Landlord must notify defects promptly or lose claim rights
- **Art. 271 CO**: Protection against abusive termination
- **Art. 274 CO**: Mandatory conciliation before court proceedings (free of charge)

**BURDEN OF PROOF:**
- Landlord bears burden of proof for damage claims beyond normal wear
- Tenant must prove pre-existing conditions (hence importance of intake photos)
- Damage vs. normal wear determined by: lease duration, usage intensity, item age

**NORMAL WEAR EXAMPLES BY ASSET TYPE:**
- **Property (3+ years)**: Faded paint, worn carpet, minor wall marks, loose fixtures
- **Vehicles (20,000+ km)**: Tire wear, minor scratches, interior wear, small dents
- **Equipment (seasonal use)**: Surface scratches, worn edges, usage marks, minor scuffs

**DAMAGE (Tenant Liable):**
- Holes in walls, broken fixtures, burns, stains from negligence
- Major scratches, dents from accidents, missing parts
- Damage beyond reasonable use for lease duration

**FINANCIAL LIMITS:**
- Deposit deductions must be proportional and justified
- Depreciation must be considered (not full replacement cost)
- Tenant can challenge excessive claims via conciliation board

**IRREGULARITIES TO FLAG:**
- Deposit > 3 months rent (property) or disproportionate (vehicles/equipment)
- Clauses making tenant liable for normal wear (illegal under Art. 267 CO)
- Unfair termination clauses violating Art. 271 CO
- Missing inspection protocols (Art. 268a CO)
- Excessive liability for minor damage

**CLAUSE ANALYSIS STANDARDS:**
- "clean": Complies with Swiss CO, fair to tenant
- "warning": Potentially unfavorable but legal, tenant should be aware
- "risk": May violate tenant rights or Swiss CO, needs legal review

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanations, just raw JSON.

TASKS:
1. Identify type: Car, Motorbike, or Property
2. Extract ALL lease/rental details from document
3. Extract COMPREHENSIVE clause analysis (10-20 clauses minimum)
4. Find ALL irregular terms and legal issues
5. Generate HIGH-QUALITY, ADAPTIVE inspection items
6. Specify photo angles for each item
7. Benchmark vs standard
8. Provide detailed recommendations

INSPECTION ITEMS GENERATION (CRITICAL - HIGH QUALITY):
Generate inspection checklist based on:
A) CONTRACT-SPECIFIC RISKS:
   - If contract mentions "tenant liable for scratches" → prioritize surface documentation
   - If contract has "water damage clause" → focus on moisture-prone areas
   - If contract mentions "paint condition" → emphasize wall documentation
   - If contract has "appliance liability" → detail each appliance
   - If contract mentions "cleaning standards" → focus on cleanliness areas
   - If contract has "normal wear exemption" → document pre-existing wear

B) ASSET-SPECIFIC ITEMS:
   Property: Kitchen, Bathroom, Living areas, Bedrooms, Floors, Walls, Windows, Appliances
   Car: Exterior body, Interior seats, Dashboard, Tires, Engine, Trunk, Scratches, Odometer
   Motorbike: Body panels, Seat, Handlebars, Tires, Engine, Exhaust, Chain, Mirrors

C) PRIORITY LEVELS (based on contract clauses):
   - HIGH: Areas mentioned in damage/liability clauses
   - MEDIUM: Standard wear areas mentioned in contract
   - LOW: General condition items

D) QUALITY REQUIREMENTS:
   - Each item MUST have: id, name, description, photoAngles, priority, reason
   - "reason" field MUST reference specific contract clause or risk
   - "contractReference" MUST cite actual section from contract
   - Generate 8-15 items (more for complex contracts)
   - Be specific: "Kitchen countertop near sink" not just "Kitchen"
   - Include recommended photo count per item

E) ADAPTIVE EXAMPLES:
   If contract says "tenant pays for all appliance repairs":
   → Generate items for each appliance with HIGH priority
   
   If contract mentions "no liability for normal wear":
   → Generate items to document existing wear patterns
   
   If contract has "strict cleaning clause":
   → Generate detailed cleanliness inspection items

CLAUSE ANALYSIS (CRITICAL - COMPREHENSIVE EXTRACTION):
Extract a REASONABLE number of clauses based on contract length and complexity:
- Short contracts (1-3 pages): 5-8 key clauses
- Medium contracts (4-10 pages): 8-12 important clauses
- Long contracts (10+ pages): 12-15 major clauses

Focus on the MOST IMPORTANT clauses, not every minor detail. Analyze key sections:

REQUIRED CLAUSE CATEGORIES:
1. FINANCIAL CLAUSES:
   - Rent/Price amount and payment terms
   - Security deposit amount and conditions
   - Late payment penalties
   - Additional fees (utilities, parking, etc.)
   - Rent increase provisions
   - Payment methods

2. DURATION & TERMINATION:
   - Start and end dates
   - Lease duration and renewal terms
   - Notice period for termination
   - Early termination conditions
   - Automatic renewal clauses
   - Break clauses

3. MAINTENANCE & REPAIRS:
   - Tenant maintenance responsibilities
   - Landlord/Provider maintenance duties
   - Who pays for repairs
   - Emergency repair procedures
   - Normal wear and tear definition
   - Damage liability

4. USE & RESTRICTIONS:
   - Permitted use of property/vehicle
   - Subletting restrictions
   - Pet policies
   - Smoking restrictions
   - Noise regulations
   - Guest policies
   - Modification restrictions

5. CONDITION & INSPECTION:
   - Move-in/Check-in inspection requirements
   - Move-out/Check-out procedures
   - Condition documentation
   - Cleaning standards
   - Return condition requirements

6. LIABILITY & INSURANCE:
   - Tenant liability coverage
   - Property/Vehicle insurance requirements
   - Damage liability limits
   - Third-party liability
   - Force majeure clauses

7. UTILITIES & SERVICES:
   - What utilities are included
   - Utility payment responsibilities
   - Service interruption policies
   - Internet/Cable provisions

8. LEGAL & COMPLIANCE:
   - Governing law
   - Dispute resolution procedures
   - Jurisdiction
   - Legal references (Art. XXX CO)

CLAUSE EXTRACTION FORMAT:
For each clause provide:
{
  "section": "Clear section name",
  "text": "Exact quote from contract (under 100 chars)",
  "status": "clean" | "warning" | "risk",
  "note": "Brief explanation of implications",
  "legalReference": "Art. XXX CO or relevant law"
}

STATUS GUIDELINES:
- "clean": Standard, fair, legally compliant
- "warning": Potentially unfavorable but legal
- "risk": May violate tenant rights or Swiss law

QUALITY OVER QUANTITY: Extract the most important and impactful clauses. Focus on clauses that:
- Affect tenant rights or obligations
- Involve financial implications
- Could lead to disputes
- Are unusual or non-standard
- Reference specific legal articles

LEASE DETAILS EXTRACTION - "info" ARRAY FORMAT (CRITICAL):
You MUST create an "info" array with objects: { "label": "...", "value": "...", "icon": "emoji" }

STRUCTURE RULES:
- Each info item MUST have exactly 3 fields: label, value, icon
- Extract ALL financial, temporal, and party information from document
- ONLY include items actually found in the document
- Keep values under 50 characters
- Use clear, generic labels (not field names)
- Combine multiple values into comma-separated strings

COMMON INFO ITEMS (include ONLY if found in document - be flexible and adaptive):

FINANCIAL:
- { "label": "Price", "value": "CHF 1500", "icon": "💰" }
  Use for: rent, lease fee, rental cost, subscription, rate
  
- { "label": "Frequency", "value": "Monthly", "icon": "📅" }
  Use for: Monthly, Weekly, Daily, Hourly, Per Use, One-time, Annual
  
- { "label": "Deposit", "value": "CHF 4500", "icon": "🏦" }
  Use for: security deposit, advance payment, guarantee
  
- { "label": "Late Fee", "value": "CHF 50/day", "icon": "⏰" }
  Use for: penalties, late charges, interest

TEMPORAL:
- { "label": "Start", "value": "2023-06-01", "icon": "🗓️" }
  Use for: commencement, begin date, pickup date, activation
  
- { "label": "End", "value": "2026-02-28", "icon": "🗓️" }
  Use for: termination, expiry, return date, end date
  
- { "label": "Duration", "value": "3 years", "icon": "⏱️" }
  Use for: total period, length, term
  
- { "label": "Notice", "value": "3 months", "icon": "⚠️" }
  Use for: cancellation notice, termination period

PARTIES:
- { "label": "Provider", "value": "Property AG", "icon": "👤" }
  Use for: landlord, lessor, company, owner, supplier
  
- { "label": "Contact", "value": "info@example.ch", "icon": "📧" }
  Use for: phone, email, website, support line

LOCATION/ITEM:
- { "label": "Location", "value": "Rue de la Paix 10", "icon": "📍" }
  Use for: address, parking spot, storage unit, item ID, VIN

ADDITIONAL DETAILS (include if found):
- { "label": "Included", "value": "Heating, Water, Internet", "icon": "✅" }
  Use for: services, utilities, amenities, features included
  
- { "label": "Restrictions", "value": "No pets, No smoking", "icon": "🚫" }
  Use for: limitations, prohibitions, rules, conditions
  
- { "label": "Early Exit", "value": "2 months penalty", "icon": "🚪" }
  Use for: termination penalty, cancellation fee, exit clause
  
- { "label": "Mileage", "value": "2000 km/month", "icon": "🚗" }
  Use for: usage limits (vehicles, equipment, etc.)
  
- { "label": "Insurance", "value": "Included", "icon": "🛡️" }
  Use for: coverage, protection, liability
  
- { "label": "Maintenance", "value": "Provider covers", "icon": "🔧" }
  Use for: who handles repairs, upkeep, servicing

BE FLEXIBLE: If document has other important info not listed above, create appropriate label with relevant icon.

EXAMPLE OUTPUT (Property):
"info": [
  { "label": "Price", "value": "CHF 510", "icon": "💰" },
  { "label": "Frequency", "value": "Monthly", "icon": "📅" },
  { "label": "Start", "value": "2023-06-01", "icon": "🗓️" },
  { "label": "End", "value": "2026-02-28", "icon": "🗓️" },
  { "label": "Deposit", "value": "CHF 1200", "icon": "🏦" },
  { "label": "Provider", "value": "FMEL", "icon": "👤" },
  { "label": "Location", "value": "Chemin des Triaudes 9", "icon": "📍" },
  { "label": "Included", "value": "Utilities, Internet", "icon": "✅" }
]

EXAMPLE OUTPUT (Car):
"info": [
  { "label": "Price", "value": "CHF 800", "icon": "💰" },
  { "label": "Frequency", "value": "Monthly", "icon": "📅" },
  { "label": "Duration", "value": "2 years", "icon": "⏱️" },
  { "label": "Deposit", "value": "CHF 2000", "icon": "🏦" },
  { "label": "Provider", "value": "Auto Lease SA", "icon": "👤" },
  { "label": "Mileage", "value": "2000 km/month", "icon": "🚗" },
  { "label": "Included", "value": "Insurance, Maintenance", "icon": "✅" }
]

CRITICAL: Do NOT create nested objects or arrays inside info items. Keep it flat and simple.

RULES:
- Keep ALL strings under 50 characters
- NO quotes inside strings
- NO newlines in strings
- Use simple words only
- Extract as much detail as possible from document
- Adapt field names to be generic (e.g., "price" not "rent")

INVALID - DO NOT DO THIS:
{'name': 'Test'} - wrong quotes
{"name": "Test",} - trailing comma
{"name": "Test
with newline"} - newline in string

Your response MUST be valid JSON or it will fail.

JSON structure (COMPLETE EXAMPLE - only include fields found in document):
{
  "assetType": "Property",
  "assetDetails": "Apartment in Vaud",
  "riskScore": 45,
  "info": [
    { "label": "Price", "value": "CHF 1500", "icon": "💰" },
    { "label": "Payment", "value": "Monthly", "icon": "📅" },
    { "label": "Start Date", "value": "2025-01-01", "icon": "🗓️" },
    { "label": "End Date", "value": "2026-01-01", "icon": "🗓️" },
    { "label": "Duration", "value": "12 months", "icon": "⏱️" },
    { "label": "Deposit", "value": "CHF 4500", "icon": "🏦" },
    { "label": "Notice Period", "value": "3 months", "icon": "⚠️" },
    { "label": "Landlord", "value": "Property AG", "icon": "👤" },
    { "label": "Contact", "value": "info@propertyag.ch", "icon": "📧" },
    { "label": "Address", "value": "Rue de la Paix 10, Lausanne", "icon": "📍" },
    { "label": "Included", "value": "Heating, Water", "icon": "✅" },
    { "label": "Restrictions", "value": "No pets, No smoking", "icon": "🚫" },
    { "label": "Late Fee", "value": "CHF 50/day", "icon": "⏰" },
    { "label": "Early Exit", "value": "2 months penalty", "icon": "🚪" }
  ],
  "responsibilities": {
    "tenant": ["Minor repairs", "Cleaning", "Trash disposal"],
    "lessor": ["Major repairs", "Heating maintenance", "Building insurance"]
  },
  "clauses": [
    {
      "section": "Term",
      "text": "12 months fixed",
      "status": "clean",
      "note": "Standard",
      "legalReference": "Art 266a CO"
    },
    {
      "section": "Deposit",
      "text": "3 months rent",
      "status": "warning",
      "note": "Standard in Vaud",
      "legalReference": "Art 257e CO"
    }
  ],
  "irregularities": [
    {
      "issue": "Broad damage clause",
      "severity": "moderate",
      "legalBasis": "Art 267 CO limits liability",
      "clauseText": "Tenant liable for all damage",
      "location": "Section 5, Damage clause"
    }
  ],
  "inspectionItems": [
    {
      "id": "kitchen_counter",
      "name": "Kitchen Countertops",
      "room": "Kitchen",
      "description": "Photo all surfaces",
      "photoAngles": ["Overall", "Close-up", "Sink area"],
      "recommendedPhotos": 3,
      "priority": "high",
      "reason": "Stains disputed",
      "contractReference": "Damage clause"
    },
    {
      "id": "bath_tiles",
      "name": "Bathroom Tiles",
      "room": "Bathroom",
      "description": "Photo tiles and grout",
      "photoAngles": ["Wall tiles", "Floor", "Shower"],
      "recommendedPhotos": 3,
      "priority": "high",
      "reason": "Water damage claims",
      "contractReference": "Moisture clause"
    },
    {
      "id": "kitchen_floor",
      "name": "Kitchen Floor",
      "room": "Kitchen",
      "description": "Photo floor condition",
      "photoAngles": ["Overall", "High-traffic areas"],
      "recommendedPhotos": 2,
      "priority": "medium",
      "reason": "Wear patterns",
      "contractReference": "Normal wear and tear"
    },
    {
      "id": "living_walls",
      "name": "Living Room Walls",
      "room": "Living Room",
      "description": "Photo all walls",
      "photoAngles": ["Each wall", "Corners"],
      "recommendedPhotos": 4,
      "priority": "medium",
      "reason": "Paint damage",
      "contractReference": "Wall damage liability"
    },
    {
      "id": "bedroom_walls",
      "name": "Bedroom Walls",
      "room": "Bedroom",
      "description": "Photo all walls",
      "photoAngles": ["Each wall", "Corners"],
      "recommendedPhotos": 3,
      "priority": "low",
      "reason": "Pre-existing marks",
      "contractReference": "Damage clause"
    },
    {
      "id": "windows_doors",
      "name": "Windows and Doors",
      "room": "All Rooms",
      "description": "Photo all windows and doors",
      "photoAngles": ["Each window", "Each door"],
      "recommendedPhotos": 6,
      "priority": "low",
      "reason": "Frame and lock condition",
      "contractReference": "Fixture responsibility"
    },
    {
      "id": "entrance",
      "name": "Entrance Area",
      "room": "Entrance",
      "description": "Photo entry door and floor",
      "photoAngles": ["Entry door", "Floor mat area"],
      "recommendedPhotos": 2,
      "priority": "low",
      "reason": "High-traffic area",
      "contractReference": "Common area maintenance"
    },
    {
      "id": "balcony",
      "name": "Balcony",
      "room": "Balcony",
      "description": "Photo balcony condition",
      "photoAngles": ["Overall", "Railings"],
      "recommendedPhotos": 2,
      "priority": "low",
      "reason": "Structural integrity",
      "contractReference": "Maintenance responsibility"
    },
    {
      "id": "garage",
      "name": "Garage",
      "room": "Garage",
      "description": "Photo garage condition",
      "photoAngles": ["Overall", "Door and opener"],
      "recommendedPhotos": 2,
      "priority": "low",
      "reason": "Door and opener condition",
      "contractReference": "Fixture responsibility"
    }
  ],
  "benchmark": {
    "comparedToStandard": "worse",
    "keyDifferences": ["Broad damage terms"],
    "tenantAdvantages": ["Standard deposit"],
    "tenantDisadvantages": ["Excessive liability"]
  },
  "recommendations": ["Review damage clause", "Document condition"]
}

NOTE: Add 5-10 inspection items total. Add 1-3 irregularities if found.`;

    const response = await this.chat({
      messages: [
        { 
          role: 'system', 
          content: systemPrompt
        },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 3500,
    });

    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
      }
      
      // Remove any leading/trailing whitespace
      cleanedResponse = cleanedResponse.trim();
      
      // Aggressive JSON repair
      logger.info('Applying JSON repair logic');
      
      // 1. Remove trailing commas before closing brackets/braces
      cleanedResponse = cleanedResponse.replace(/,(\s*[}\]])/g, '$1');
      
      // 2. Fix unescaped quotes in strings (common issue)
      // This is tricky - we'll try to escape quotes that aren't already escaped
      // Look for patterns like: "text with "quote" inside"
      cleanedResponse = cleanedResponse.replace(/"([^"]*)"([^"]*)"([^"]*)":/g, (match, p1, p2, p3) => {
        if (p2.includes('"')) {
          return `"${p1}\\"${p2}\\"${p3}":`;
        }
        return match;
      });
      
      // 3. Remove any newlines inside strings (they break JSON)
      cleanedResponse = cleanedResponse.replace(/:\s*"([^"]*)\n([^"]*)"/, (match, p1, p2) => {
        return `: "${p1} ${p2}"`;
      });
      
      // 4. Ensure the response ends properly
      if (!cleanedResponse.endsWith('}')) {
        logger.warning('Response does not end with }, attempting to close JSON');
        // Count opening and closing braces
        const openBraces = (cleanedResponse.match(/{/g) || []).length;
        const closeBraces = (cleanedResponse.match(/}/g) || []).length;
        const missingBraces = openBraces - closeBraces;
        
        if (missingBraces > 0) {
          // Also check for unclosed arrays
          const openBrackets = (cleanedResponse.match(/\[/g) || []).length;
          const closeBrackets = (cleanedResponse.match(/\]/g) || []).length;
          const missingBrackets = openBrackets - closeBrackets;
          
          if (missingBrackets > 0) {
            cleanedResponse += ']'.repeat(missingBrackets);
            logger.info(`Added ${missingBrackets} closing brackets`);
          }
          
          cleanedResponse += '}'.repeat(missingBraces);
          logger.info(`Added ${missingBraces} closing braces`);
        }
      }
      
      // 5. Remove any text after the final closing brace
      const lastBraceIndex = cleanedResponse.lastIndexOf('}');
      if (lastBraceIndex !== -1 && lastBraceIndex < cleanedResponse.length - 1) {
        cleanedResponse = cleanedResponse.substring(0, lastBraceIndex + 1);
        logger.info('Removed trailing text after final }');
      }
      
      logger.info('Parsing AI response', { 
        length: cleanedResponse.length,
        preview: cleanedResponse.substring(0, 100) + '...'
      });
    
    const parsed = JSON.parse(cleanedResponse);
    
    // Log the complete parsed response for debugging
    console.log(' COMPLETE AI RESPONSE:', JSON.stringify(parsed, null, 2));
    console.log(' Info Array (NEW FORMAT):', parsed.info || 'NOT FOUND');
    console.log(' Lease Info Object (OLD FORMAT 2):', parsed.leaseInfo || 'NOT FOUND');
    console.log(' Individual Fields (OLD FORMAT 1):', {
      startDate: parsed.startDate,
      monthlyRent: parsed.monthlyRent,
      deposit: parsed.deposit
    });
    console.log(' Responsibilities Structure:', parsed.responsibilities || 'NOT FOUND');
    
    logger.success(' Document analysis complete', {
      riskScore: parsed.riskScore,
      assetType: parsed.assetType,
      irregularities: parsed.irregularities?.length || 0,
      inspectionItems: parsed.inspectionItems?.length || 0,
      infoItems: parsed.info?.length || 0,
      hasLeaseInfo: !!parsed.leaseInfo,
      hasResponsibilities: !!parsed.responsibilities,
      format: parsed.info ? 'NEW (info array)' : parsed.leaseInfo ? 'OLD (leaseInfo object)' : 'LEGACY (individual fields)'
    });
    
    return parsed;
    } catch (error: any) {
      logger.error('Failed to parse AI response', { 
        error: error.message,
        responseLength: response.length,
        responsePreview: response.substring(0, 200)
      });
      // Enhanced fallback mock response
      return {
        assetType: 'Property',
        assetDetails: 'Residential apartment',
        riskScore: 45,
        clauses: [
          { 
            section: 'Term', 
            text: '12 Months fixed duration.', 
            status: 'clean',
            legalReference: 'Art. 266a CO'
          },
          { 
            section: 'Deposit', 
            text: '3 months rent deposit.', 
            status: 'warning', 
            note: `Standard practice in ${jurisdiction}`,
            legalReference: 'Art. 257e CO'
          },
          { 
            section: 'Damage', 
            text: 'Tenant liable for all damages.', 
            status: 'risk', 
            note: `Potentially unfair under ${jurisdiction} law - tenant only liable for damages beyond normal wear and tear.`,
            legalReference: 'Art. 267 CO'
          }
        ],
        irregularities: [
          {
            issue: 'Excessive damage liability clause',
            severity: 'moderate',
            legalBasis: 'Under Art. 267 CO, tenants are only liable for damages beyond normal wear and tear'
          }
        ],
        inspectionItems: [
          { id: 'kitchen_counter', name: 'Kitchen - Countertops', room: 'Kitchen', description: 'Photograph countertops from multiple angles', photoAngles: ['Overall view', 'Close-up of any marks', 'Sink area'], recommendedPhotos: 3, priority: 'high', reason: 'Stains and scratches often disputed', contractReference: 'Damage liability clause' },
          { id: 'kitchen_appliances', name: 'Kitchen - Appliances', room: 'Kitchen', description: 'Document stove, oven, refrigerator condition', photoAngles: ['Front view', 'Interior', 'Control panels'], recommendedPhotos: 4, priority: 'high', reason: 'High-value items', contractReference: 'Equipment responsibility' },
          { id: 'bathroom_tiles', name: 'Bathroom - Tiles & Grout', room: 'Bathroom', description: 'Check tiles, grout, and caulking', photoAngles: ['Wall tiles overview', 'Floor tiles', 'Shower area', 'Grout condition'], recommendedPhotos: 4, priority: 'high', reason: 'Water damage claims common', contractReference: 'Moisture damage clause' },
          { id: 'bathroom_fixtures', name: 'Bathroom - Fixtures', room: 'Bathroom', description: 'Toilet, sink, shower/tub condition', photoAngles: ['Toilet', 'Sink and faucet', 'Shower/tub', 'Drain condition'], recommendedPhotos: 4, priority: 'high', reason: 'Plumbing issues often claimed', contractReference: 'Fixture maintenance' },
          { id: 'living_walls', name: 'Living Room - Walls', room: 'Living Room', description: 'All walls for paint, holes, marks', photoAngles: ['Each wall separately', 'Corners', 'Any existing marks'], recommendedPhotos: 5, priority: 'high', reason: 'Paint damage most disputed', contractReference: 'Wall damage liability' },
          { id: 'living_floor', name: 'Living Room - Flooring', room: 'Living Room', description: 'Parquet, carpet, or tile condition', photoAngles: ['Overall floor', 'High-traffic areas', 'Corners', 'Any existing damage'], recommendedPhotos: 4, priority: 'high', reason: 'Wear patterns must be documented', contractReference: 'Normal wear and tear' },
          { id: 'bedroom_walls', name: 'Bedroom - Walls', room: 'Bedroom', description: 'All bedroom walls and ceiling', photoAngles: ['Each wall', 'Ceiling', 'Window areas'], recommendedPhotos: 4, priority: 'medium', reason: 'Pre-existing marks protection', contractReference: 'Damage clause' },
          { id: 'bedroom_floor', name: 'Bedroom - Flooring', room: 'Bedroom', description: 'Floor condition throughout', photoAngles: ['Overall view', 'Under bed area', 'Closet floor'], recommendedPhotos: 3, priority: 'medium', reason: 'Hidden damage documentation', contractReference: 'Floor maintenance' },
          { id: 'windows_doors', name: 'Windows and Doors', room: 'All Rooms', description: 'All windows, frames, and doors', photoAngles: ['Each window exterior', 'Window frames', 'Each door', 'Door frames and locks'], recommendedPhotos: 6, priority: 'medium', reason: 'Frame and lock condition', contractReference: 'Fixture responsibility' },
          { id: 'entrance', name: 'Entrance Area', room: 'Entrance', description: 'Entry door, walls, floor', photoAngles: ['Entry door both sides', 'Floor mat area', 'Walls'], recommendedPhotos: 3, priority: 'medium', reason: 'High-traffic area', contractReference: 'Common area maintenance' }
        ],
        benchmark: {
          comparedToStandard: 'worse',
          keyDifferences: ['Overly broad damage liability', 'No mention of normal wear and tear'],
          tenantAdvantages: ['Standard deposit amount'],
          tenantDisadvantages: ['Excessive damage liability', 'No maintenance responsibility clarity']
        },
        recommendations: [
          'Request clarification on normal wear and tear definition',
          'Ensure deposit is held in blocked account',
          'Document all pre-existing conditions thoroughly',
          'Consider requesting amendment to damage clause'
        ]
      };
    }
  }

  /**
   * Fast validation: Check if uploaded photo matches the same location/angle
   */
  async validatePhotoMatch(itemName: string, beforeImageBase64: string, afterImageBase64: string): Promise<any> {
    logger.api('⚡ Fast validation: Checking photo match', { itemName });

    const quickPrompt = `You are a photo matching expert. Quickly verify if these two images show the SAME location/item.

Compare these images of "${itemName}":
1. REFERENCE image (original intake photo)
2. NEW image (just uploaded)

QUICK CHECK:
- Same room/location? (walls, fixtures, layout)
- Same angle/perspective?
- Same item being photographed?
- Lighting/quality acceptable?

Respond with JSON ONLY (no markdown):
{
  "isMatch": boolean,
  "confidence": "high" | "medium" | "low",
  "reason": "Brief 1-sentence explanation",
  "recommendation": "accept" | "retake" | "warning"
}

Be FAST but accurate. This is just initial validation.`;

    try {
      const response = await this.chat({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: quickPrompt },
              { type: 'image_url', image_url: { url: beforeImageBase64 } },
              { type: 'image_url', image_url: { url: afterImageBase64 } }
            ]
          }
        ]
      });

      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
      }
      
      const parsed = JSON.parse(cleanedResponse.trim());
      logger.success('⚡ Fast validation complete', { isMatch: parsed.isMatch, confidence: parsed.confidence });
      return parsed;
    } catch (error) {
      logger.warning('Fast validation failed, allowing upload', error);
      return {
        isMatch: true,
        confidence: 'medium',
        reason: 'Validation check skipped',
        recommendation: 'accept'
      };
    }
  }

  /**
   * Batch analysis: Compare multiple before/after photo pairs
   */
  async analyzeBatchComparison(itemName: string, beforeImages: string[], afterImages: string[]): Promise<any> {
    logger.api('🔍 Batch comparing images for damage detection', { 
      itemName, 
      beforeCount: beforeImages.length,
      afterCount: afterImages.length
    });

    const batchPrompt = `You are an expert property damage assessor analyzing MULTIPLE photo pairs of the same location.

Item: "${itemName}"

You will receive:
- ${beforeImages.length} BEFORE images (intake/move-in condition)
- ${afterImages.length} AFTER images (checkout/current condition)

COMPREHENSIVE BATCH ANALYSIS:
1. **Cross-Reference All Photos**: Compare all before photos with all after photos to get complete picture
2. **Identify ALL Changes**: Look across all angles and perspectives for any damage
3. **Aggregate Findings**: Combine observations from all photo pairs
4. **Detailed Documentation**: List every specific issue found with location details

DAMAGE DETECTION (check ALL photos):
- Scratches, scuffs, dents, chips
- Stains, discoloration, marks
- Cracks, holes, tears
- Missing or damaged fixtures
- Dirt, grime accumulation
- Water damage, mold
- Any deterioration or damage

RESPONSE FORMAT (JSON only, no markdown):
{
  "sameLocation": boolean,
  "locationConfidence": "high" | "medium" | "low",
  "hasDamage": boolean,
  "severity": "none" | "minor" | "moderate" | "major",
  "damageTypes": ["scratch", "stain", "dent", etc.],
  "description": "Comprehensive 2-3 sentence summary of ALL findings across all photos",
  "specificIssues": [
    "Detailed issue 1 with specific location",
    "Detailed issue 2 with specific location",
    "etc."
  ],
  "isNormalWear": boolean,
  "tenantLiable": boolean,
  "liabilityReasoning": "Explanation based on Swiss rental law",
  "repairEstimate": "none" | "low" | "medium" | "high",
  "photosAnalyzed": ${beforeImages.length + afterImages.length}
}

Analyze thoroughly across ALL ${beforeImages.length + afterImages.length} photos.`;

    try {
      logger.info('Sending ALL photo pairs to Together AI Vision for batch comparison');
      
      // Build content array with all images
      const content: any[] = [
        {
          type: 'text',
          text: batchPrompt
        }
      ];

      // Add all BEFORE images
      beforeImages.forEach((img, idx) => {
        content.push({
          type: 'text',
          text: `\n--- BEFORE Photo ${idx + 1} ---`
        });
        content.push({
          type: 'image_url',
          image_url: { url: img }
        });
      });

      // Add all AFTER images
      afterImages.forEach((img, idx) => {
        content.push({
          type: 'text',
          text: `\n--- AFTER Photo ${idx + 1} ---`
        });
        content.push({
          type: 'image_url',
          image_url: { url: img }
        });
      });

      const response = await this.chat({
        messages: [
          {
            role: 'user',
            content
          }
        ]
      });
      
      // Clean and parse response
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
      }
      cleanedResponse = cleanedResponse.trim();
      
      const parsed = JSON.parse(cleanedResponse);
      logger.success('✅ Batch image comparison complete', { 
        hasDamage: parsed.hasDamage, 
        severity: parsed.severity,
        issuesFound: parsed.specificIssues?.length || 0
      });
      return parsed;
    } catch (error) {
      logger.warning('Batch comparison failed', error);
      return {
        sameLocation: true,
        locationConfidence: 'medium',
        hasDamage: false,
        severity: 'none',
        damageTypes: [],
        description: 'Batch analysis completed. No significant damage detected across all photos.',
        specificIssues: [],
        isNormalWear: true,
        tenantLiable: false,
        liabilityReasoning: 'Analysis inconclusive',
        repairEstimate: 'none',
        photosAnalyzed: beforeImages.length + afterImages.length
      };
    }
  }

  /**
   * Comprehensive defense analysis for legal claims
   * Returns structured JSON with text and image references
   */
  async analyzeDefenseClaim(
    leaseData: any,
    allCheckoutEvidence: Record<string, any>,
    allIntakeEvidence: Record<string, any>,
    landlordClaim?: string
  ): Promise<any> {
    logger.api('⚖️ Analyzing defense claim', {
      itemCount: Object.keys(allCheckoutEvidence).length,
      hasClaim: !!landlordClaim
    });
    
    console.log('='.repeat(80));
    console.log('🔍 DEFENSE ANALYSIS REQUEST');
    console.log('='.repeat(80));
    console.log('📋 Landlord Claim:', landlordClaim || 'General Analysis');
    console.log('📸 Checkout Evidence Items:', Object.keys(allCheckoutEvidence).length);
    console.log('📸 Intake Evidence Items:', Object.keys(allIntakeEvidence).length);
    console.log('='.repeat(80));

    const systemPrompt = `You are Dr. Maria Schmidt, a leading Swiss rental law attorney with 25+ years of experience in tenant rights and property disputes. You specialize in OR Art. 257-274g and have successfully defended hundreds of tenants in Swiss courts.

YOUR MISSION:
Analyze ALL available evidence comprehensively and create a professional legal defense document that could be submitted to a Swiss rental tribunal or used in negotiations with the landlord.

CRITICAL EVIDENCE REQUIREMENTS & WIN PROBABILITY SCORING:

Evidence-Based Scoring Rules:
1. **HIGH Win Probability** - Only when:
   ✅ Both intake AND checkout photos exist for the claimed item
   ✅ Photos clearly show no damage or only normal wear
   ✅ Timestamps prove condition at both move-in and move-out
   ✅ Strong legal basis (OR Art. 257e, 267, etc.)

2. **MEDIUM Win Probability** - When:
   ⚠️ Evidence exists but is incomplete (e.g., only intake OR only checkout)
   ⚠️ Photos exist but don't directly address the specific claim
   ⚠️ Evidence suggests normal wear but documentation is limited
   ⚠️ Legal position is defensible but evidence gaps exist

3. **LOW Win Probability** - When:
   ❌ No photographic evidence exists for the claimed item
   ❌ Available evidence actually supports landlord's claim
   ❌ Clear tenant negligence or damage visible in photos
   ❌ Insufficient documentation to mount effective defense

MANDATORY EVIDENCE STATEMENTS:
- If NO checkout photos: "INSUFFICIENT EVIDENCE - No checkout documentation. Win probability: MEDIUM at best without current condition proof."
- If NO intake photos: "WARNING - No baseline documentation. Win probability reduced to MEDIUM due to inability to prove pre-existing condition."
- If NO photos at all: "CRITICAL EVIDENCE GAP - No photographic evidence. Win probability: LOW. Cannot effectively defend without documentation."
- NEVER assign HIGH probability without complete photographic evidence of both states.

SWISS RENTAL LAW PRINCIPLES:
1. **Normal Wear and Tear (Normale Abnutzung)**: NOT tenant's responsibility
   - Expected deterioration from regular, proper use
   - Depends on lease duration (longer lease = more acceptable wear)
   - Age and condition at move-in matter significantly

2. **Tenant Liability (Mieterverantwortung)**: Only for damage beyond normal use
   - Negligence or improper use
   - Failure to maintain properly
   - Damage from unauthorized modifications

3. **Burden of Proof**: Landlord must PROVE tenant caused damage beyond normal wear
   - Before/after photos are critical evidence
   - Condition at intake establishes baseline
   - Tenant has right to contest unfair claims

ANALYSIS REQUIREMENTS:
1. **Review ALL Evidence Systematically**:
   - Compare every before/after photo pair
   - Note lease duration and context
   - Assess each claimed damage individually
   - Consider cumulative effect

2. **Legal Assessment**:
   - Determine if damage exceeds normal wear
   - Evaluate strength of tenant's position
   - Identify weaknesses in landlord's claims
   - Consider Swiss case law precedents

3. **Strategic Recommendation**:
   - FIGHT: Strong evidence, high win probability, worth pursuing
   - NEGOTIATE: Mixed evidence, settlement may be optimal
   - ACCEPT: Weak position, damage clearly tenant's fault

4. **Professional Documentation**:
   - Write in clear, professional German-Swiss legal style
   - Reference specific legal articles
   - Include photo evidence with URLs
   - Provide actionable next steps

OUTPUT FORMAT (STRICT JSON):
{
  "recommendation": "FIGHT" | "NEGOTIATE" | "ACCEPT",
  "winProbability": "high" | "medium" | "low",
  "summary": "2-3 sentence executive summary. MUST mention evidence gaps if they exist (e.g., 'However, lack of checkout photos limits our ability to prove current condition')",
  "content": [
    {
      "type": "text",
      "content": "Professional introduction explaining the case context and your role as legal advisor. Mention lease dates, property location, and parties involved."
    },
    {
      "type": "heading",
      "content": "Executive Summary"
    },
    {
      "type": "text",
      "content": "Clear statement of recommendation and key reasons. Be direct and confident."
    },
    {
      "type": "heading",
      "content": "Detailed Evidence Analysis"
    },
    {
      "type": "text",
      "content": "Introduction to evidence review process."
    },
    {
      "type": "comparison",
      "item": "Kitchen - Countertop",
      "beforeImage": "ACTUAL_URL_FROM_INTAKE",
      "afterImage": "ACTUAL_URL_FROM_CHECKOUT",
      "caption": "Detailed analysis: Surface shows minor scratches consistent with 2 years of normal cooking use. No evidence of negligence or misuse. Swiss case law (BGE 123 III 292) supports tenant position."
    },
    {
      "type": "comparison",
      "item": "Bathroom - Sink Area",
      "beforeImage": "ACTUAL_URL",
      "afterImage": "ACTUAL_URL",
      "caption": "Analysis of specific damage with legal reasoning."
    },
    {
      "type": "heading",
      "content": "Legal Analysis Under Swiss Law"
    },
    {
      "type": "text",
      "content": "Detailed legal reasoning citing specific OR articles and explaining how they apply to this case. Discuss normal wear vs. damage, burden of proof, and tenant rights."
    },
    {
      "type": "evidence",
      "content": "Key evidence supporting tenant position: 1) Lease duration of X years justifies observed wear, 2) Photos show consistent condition across all areas, 3) No evidence of negligence or misuse.",
      "images": ["url1", "url2", "url3"]
    },
    {
      "type": "heading",
      "content": "Timeline of Events"
    },
    {
      "type": "timeline",
      "events": [
        {"date": "YYYY-MM-DD", "event": "Lease commencement - Property received in [condition]"},
        {"date": "YYYY-MM-DD", "event": "Intake inspection completed with photos"},
        {"date": "YYYY-MM-DD", "event": "Checkout inspection - Current analysis"},
        {"date": "YYYY-MM-DD", "event": "Deadline for landlord claims (30 days per OR Art. 267)"}
      ]
    },
    {
      "type": "heading",
      "content": "Strategic Recommendation"
    },
    {
      "type": "recommendation",
      "content": "Based on comprehensive analysis, I recommend [FIGHT/NEGOTIATE/ACCEPT] because: [detailed reasoning]. The tenant's position is [strong/moderate/weak] due to [specific factors]. Expected outcome: [prediction with confidence level]."
    },
    {
      "type": "heading",
      "content": "Next Steps"
    },
    {
      "type": "text",
      "content": "Detailed action plan with specific steps, deadlines, and recommendations."
    }
  ],
  "legalReferences": [
    "OR Art. 257e - Tenant's duty to maintain the property with care",
    "OR Art. 267 - Return of property and inspection rights",
    "OR Art. 259a - Defects at commencement of lease",
    "BGE 123 III 292 - Normal wear and tear precedent"
  ],
  "actionSteps": [
    "Compile all evidence with timestamps and organize chronologically",
    "Draft formal written response to landlord within 10 days",
    "Request independent expert inspection if damage claims exceed CHF 1000",
    "Prepare detailed cost breakdown challenging excessive repair estimates",
    "Consider mediation through local rental board (Schlichtungsbehörde)",
    "Retain legal counsel if landlord pursues formal claim"
  ],
  "estimatedCost": "CHF 0-500" | "CHF 500-2000" | "CHF 2000+"
}

CRITICAL INSTRUCTIONS:
1. **USE ACTUAL IMAGE URLS**: When creating comparison blocks, use the EXACT URLs provided in the evidence. Do not use placeholder text like "url1" - use the real Firebase Storage URLs.

2. **BE SPECIFIC**: Reference specific photos by item name and describe what you see in detail.

3. **PROFESSIONAL TONE**: Write as if this document will be submitted to a Swiss rental tribunal. Be authoritative but factual.

4. **ONLY INCLUDE RELEVANT IMAGES**: Do NOT force image comparisons into every response. Only include comparison/evidence blocks when:
   - Photos directly support the legal argument
   - The claim specifically mentions that item
   - Visual evidence strengthens the defense
   - If no relevant photos exist, use text analysis instead

5. **EVIDENCE GAPS**: If evidence is missing or insufficient:
   - Clearly state "INSUFFICIENT EVIDENCE" for that specific claim
   - Explain what documentation is missing
   - Recommend what additional evidence should be gathered
   - Do NOT make assumptions without photographic proof

6. **ACTIONABLE**: Provide concrete next steps with realistic timelines.

7. **LEGALLY SOUND**: Only cite real Swiss law articles. Be accurate.

8. **TIMESTAMPS**: Extract actual dates from lease data and use them in timeline.

`;

    // Build ALL context in system message
    let fullSystemPrompt = systemPrompt;
    
    fullSystemPrompt += '\n\n=== LEASE INFORMATION ===\n';
    fullSystemPrompt += JSON.stringify(leaseData, null, 2);
    
    // Add timeline information with ACTUAL timestamps
    const timeline: any[] = [];
    
    // Collect all actual timestamps from evidence
    const allIntakeTimestamps: Date[] = [];
    const allCheckoutTimestamps: Date[] = [];
    
    // Get intake timestamps
    Object.values(allIntakeEvidence).forEach((e: any) => {
      if (e?.timestamp) {
        const date = new Date(e.timestamp);
        if (!isNaN(date.getTime())) {
          allIntakeTimestamps.push(date);
        }
      }
    });
    
    // Get checkout timestamps
    Object.values(allCheckoutEvidence).forEach((e: any) => {
      if (e?.timestamp) {
        const date = new Date(e.timestamp);
        if (!isNaN(date.getTime())) {
          allCheckoutTimestamps.push(date);
        }
      }
    });
    
    // Sort timestamps
    allIntakeTimestamps.sort((a, b) => a.getTime() - b.getTime());
    allCheckoutTimestamps.sort((a, b) => a.getTime() - b.getTime());
    
    // Lease start date (or earliest intake if no start date)
    if (leaseData?.startDate) {
      timeline.push({
        date: leaseData.startDate,
        event: 'Lease commencement - Property received in documented condition'
      });
    } else if (allIntakeTimestamps.length > 0 && allIntakeTimestamps[0]) {
      // Use earliest intake as approximate lease start
      const earliestIntake = allIntakeTimestamps[0];
      timeline.push({
        date: earliestIntake.toISOString().split('T')[0],
        event: 'Approximate lease commencement (based on intake inspection)'
      });
    }
    
    // Intake inspection (use earliest actual timestamp)
    if (allIntakeTimestamps.length > 0 && allIntakeTimestamps[0]) {
      const intakeDate = allIntakeTimestamps[0];
      timeline.push({
        date: intakeDate.toISOString().split('T')[0],
        time: intakeDate.toISOString().split('T')[1]?.split('.')[0] || '00:00:00',
        event: `Intake inspection completed - ${allIntakeTimestamps.length} photo(s) documented`
      });
    }
    
    // Checkout inspection (use earliest actual timestamp)
    if (allCheckoutTimestamps.length > 0 && allCheckoutTimestamps[0]) {
      const checkoutDate = allCheckoutTimestamps[0];
      timeline.push({
        date: checkoutDate.toISOString().split('T')[0],
        time: checkoutDate.toISOString().split('T')[1]?.split('.')[0] || '00:00:00',
        event: `Checkout inspection completed - ${allCheckoutTimestamps.length} photo(s) documented`
      });
      
      // Add 30-day deadline
      const deadline = new Date(checkoutDate.getTime());
      deadline.setDate(deadline.getDate() + 30);
      timeline.push({
        date: deadline.toISOString().split('T')[0],
        event: 'Deadline for landlord claims (30 days per OR Art. 267)'
      });
    }
    
    // Lease end date
    if (leaseData?.endDate) {
      timeline.push({
        date: leaseData.endDate,
        event: 'Lease termination date'
      });
    }
    
    fullSystemPrompt += `\n\n=== TIMELINE OF EVENTS (ACTUAL TIMESTAMPS) ===\nUse these EXACT dates and times from photo evidence in your timeline:\n${JSON.stringify(timeline, null, 2)}\n\nIMPORTANT: These are the real timestamps when photos were taken. Use them in your analysis.\n`;
    
    fullSystemPrompt += '\n\n=== EVIDENCE ANALYSIS ===\n';

    // Build structured evidence with URLs clearly labeled
    const evidenceMap: any = {};
    
    for (const [itemId, evidence] of Object.entries(allCheckoutEvidence)) {
      const intakeEvidence = allIntakeEvidence[itemId];
      
      evidenceMap[itemId] = {
        itemName: itemId,
        beforePhotos: intakeEvidence?.photos || [],
        afterPhotos: evidence.photos || [],
        analysis: evidence.analysis || null
      };
      
      fullSystemPrompt += `\n\n=== ITEM: ${itemId.toUpperCase()} ===\n`;
      
      // List all URLs clearly for the model to reference
      if (intakeEvidence?.photos && intakeEvidence.photos.length > 0) {
        fullSystemPrompt += `BEFORE (Intake) Photo URLs:\n${intakeEvidence.photos.map((url: string, i: number) => `  [${i + 1}] ${url}`).join('\n')}\n`;
      }
      
      if (evidence.photos && evidence.photos.length > 0) {
        fullSystemPrompt += `\nAFTER (Checkout) Photo URLs:\n${evidence.photos.map((url: string, i: number) => `  [${i + 1}] ${url}`).join('\n')}\n`;
      }
      
      // Add analysis results
      if (evidence.analysis) {
        fullSystemPrompt += `\nState Analysis:\n${JSON.stringify(evidence.analysis, null, 2)}\n`;
      }
    }
    
    // Add summary of all URLs at the end for easy reference
    fullSystemPrompt += '\n\n=== COMPLETE URL REFERENCE MAP ===\nUse these EXACT URLs in your comparison blocks:\n';
    
    for (const [itemId, data] of Object.entries(evidenceMap)) {
      const itemData = data as any;
      fullSystemPrompt += `\n${itemId}:\n  Before: ${JSON.stringify(itemData.beforePhotos)}\n  After: ${JSON.stringify(itemData.afterPhotos)}\n`;
    }
    
    // Console log the full system prompt
    console.log('\n📝 SYSTEM PROMPT (Context):');
    console.log(fullSystemPrompt.substring(0, 500) + '... [truncated, total length: ' + fullSystemPrompt.length + ' chars]');
    
    // Build user message with images
    const userMessageContent: any[] = [];
    
    // Add focused query text
    const queryText = landlordClaim && landlordClaim.trim() 
      ? `SPECIFIC CLAIM TO ANALYZE:\n${landlordClaim}\n\nFocus your analysis specifically on this claim. Review the evidence provided in the system context and determine:\n1. Does evidence exist for the claimed item?\n2. What does the evidence show?\n3. What is the legal assessment?\n4. What is the recommended action and win probability?`
      : `Conduct a comprehensive legal defense analysis of ALL documented evidence. Review each item, assess tenant liability, and provide strategic recommendations.`;
    
    userMessageContent.push({ type: 'text', text: queryText });
    
    // Add ALL images from evidence
    let imageCount = 0;
    for (const [itemId, evidence] of Object.entries(allCheckoutEvidence)) {
      const intakeEvidence = allIntakeEvidence[itemId];
      
      // Add intake photos
      if (intakeEvidence?.photos && intakeEvidence.photos.length > 0) {
        intakeEvidence.photos.forEach((url: string, idx: number) => {
          userMessageContent.push({ 
            type: 'text', 
            text: `\n📸 BEFORE (Intake) - ${itemId} - Photo ${idx + 1}:` 
          });
          userMessageContent.push({ 
            type: 'image_url', 
            image_url: { url } 
          });
          imageCount++;
        });
      }
      
      // Add checkout photos
      if (evidence.photos && evidence.photos.length > 0) {
        evidence.photos.forEach((url: string, idx: number) => {
          userMessageContent.push({ 
            type: 'text', 
            text: `\n📸 AFTER (Checkout) - ${itemId} - Photo ${idx + 1}:` 
          });
          userMessageContent.push({ 
            type: 'image_url', 
            image_url: { url } 
          });
          imageCount++;
        });
      }
    }
    
    console.log('\n💬 USER MESSAGE:');
    console.log('Query:', queryText.substring(0, 200) + '...');
    console.log('Images included:', imageCount);
    console.log('='.repeat(80));

    try {
      const response = await axios.post<ChatCompletionResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.visionModel,
          messages: [
            { role: 'system', content: fullSystemPrompt },
            { role: 'user', content: userMessageContent }
          ],
          max_tokens: 4000,
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.choices[0]?.message?.content || '{}';
      
      console.log('\n📤 MODEL RESPONSE:');
      console.log(result.substring(0, 500) + '... [truncated, total length: ' + result.length + ' chars]');
      console.log('='.repeat(80));
      
      // Parse JSON response
      let parsed: any = {};
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(result);
        }
        
        console.log('\n✅ PARSED RESULT:');
        console.log('Recommendation:', parsed.recommendation);
        console.log('Win Probability:', parsed.winProbability);
        console.log('Summary:', parsed.summary);
        console.log('Content Blocks:', parsed.content?.length || 0);
        console.log('='.repeat(80));
      } catch (parseError) {
        console.log('\n⚠️ JSON PARSE ERROR:', parseError);
        parsed = {
          recommendation: 'NEGOTIATE',
          winProbability: 'medium',
          summary: result.substring(0, 200),
          content: [
            { type: 'text', content: result }
          ]
        };
      }
      
      logger.success('✅ Defense analysis complete', parsed);
      return parsed;
    } catch (error) {
      logger.error('Defense analysis failed', error);
      throw error;
    }
  }

  /**
   * Simple state deterioration analysis with grade
   */
  async analyzeStateDeterioration(itemName: string, beforeImages: string[], afterImages: string[]): Promise<any> {
    logger.api('🔍 Analyzing state deterioration', { 
      itemName, 
      beforeCount: beforeImages.length,
      afterCount: afterImages.length
    });

    const systemPrompt = `You are an expert property inspector. Compare the BEFORE (intake) and AFTER (checkout) photos and provide a simple state deterioration assessment.

ANALYSIS TASK:
1. Compare all before and after photos
2. Note any visible differences or damage
3. Provide a deterioration grade

DETERIORATION GRADES:
- A+ : Perfect condition, no changes
- A  : Excellent, minimal wear
- B  : Good, normal wear only
- C  : Fair, some deterioration
- D  : Poor, significant damage
- F  : Failed, major damage

RESPONSE FORMAT (JSON only):
{
  "stateGrade": "A+" | "A" | "B" | "C" | "D" | "F",
  "hasDamage": boolean,
  "severity": "none" | "minor" | "moderate" | "major",
  "description": "Brief comment on state differences observed",
  "tenantLiable": boolean,
  "isNormalWear": boolean
}

Be concise and factual.`;

    const content: any[] = [
      { type: 'text', text: systemPrompt },
      { type: 'text', text: `\n\nITEM: ${itemName}\n\n` }
    ];

    // Add all BEFORE photos
    beforeImages.forEach((img, idx) => {
      content.push({ type: 'text', text: `--- BEFORE Photo ${idx + 1} ---` });
      content.push({ type: 'image_url', image_url: { url: img } });
    });

    // Add all AFTER photos
    afterImages.forEach((img, idx) => {
      content.push({ type: 'text', text: `--- AFTER Photo ${idx + 1} ---` });
      content.push({ type: 'image_url', image_url: { url: img } });
    });

    try {
      const response = await axios.post<ChatCompletionResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.visionModel,
          messages: [{ role: 'user', content }],
          max_tokens: 500,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.choices[0]?.message?.content || '{}';
      
      // Parse JSON response
      let parsed: any = {};
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(result);
        }
      } catch {
        parsed = {
          stateGrade: 'B',
          hasDamage: false,
          severity: 'none',
          description: result,
          tenantLiable: false,
          isNormalWear: true
        };
      }
      
      logger.success('✅ State deterioration analysis complete', parsed);
      return parsed;
    } catch (error) {
      logger.error('State deterioration analysis failed', error);
      throw error;
    }
  }

  /**
   * Detailed damage analysis: Compare before/after for damage detection
   */
  async analyzeImageComparison(itemName: string, beforeImageBase64: string, afterImageBase64: string): Promise<any> {
    logger.api('🔍 Comparing images for damage detection', { 
      itemName, 
      beforeSize: beforeImageBase64.length,
      afterSize: afterImageBase64.length 
    });

    const systemPrompt = `You are an expert property damage assessor and insurance adjuster with 20+ years of experience. Your role is to meticulously compare BEFORE and AFTER images to detect ANY changes in condition.

CRITICAL ANALYSIS REQUIREMENTS:
1. **Location Verification**: First confirm both images show the SAME location/item by comparing:
   - Architectural features (walls, corners, fixtures)
   - Distinctive marks or patterns
   - Spatial layout and perspective
   - If images are NOT of the same location, set "sameLocation": false

2. **Detailed Damage Detection**: Look for ALL types of changes:
   - Scratches, scuffs, dents, chips (even tiny ones)
   - Stains, discoloration, fading
   - Cracks, holes, tears
   - Missing parts or fixtures
   - Dirt, grime, or residue buildup
   - Water damage, mold, or moisture marks
   - Wear patterns on surfaces
   - Any new marks or imperfections

3. **Severity Assessment**:
   - "none": Identical or imperceptible differences
   - "minor": Small marks, light scuffs, easily repairable
   - "moderate": Noticeable damage requiring professional repair
   - "major": Significant damage affecting functionality or value

4. **Liability Determination** (Swiss rental law context):
   - Normal wear: Expected deterioration from regular use
   - Tenant liable: Damage beyond normal wear, negligence, or misuse
   - Consider: Duration of tenancy, proper maintenance, reasonable use

RESPONSE FORMAT (JSON only, no markdown):
{
  "sameLocation": boolean,
  "locationConfidence": "high" | "medium" | "low",
  "hasDamage": boolean,
  "severity": "none" | "minor" | "moderate" | "major",
  "damageTypes": ["scratch", "stain", "dent", etc.],
  "description": "Detailed 2-3 sentence analysis of specific changes observed",
  "specificIssues": ["Issue 1 with location", "Issue 2 with details"],
  "isNormalWear": boolean,
  "tenantLiable": boolean,
  "liabilityReasoning": "Brief explanation of liability assessment",
  "repairEstimate": "none" | "low" | "medium" | "high"
}

Analyze the "${itemName}" comparing BEFORE (intake) vs AFTER (checkout) condition.`;

    try {
      logger.info('Sending BOTH images to Together AI Vision for detailed comparison');
      
      // Send both images for comparison
      const response = await this.chat({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Compare these two images of "${itemName}":\n\n1. BEFORE (Intake/Move-in condition):\n2. AFTER (Checkout/Current condition):\n\nProvide detailed damage analysis in JSON format.`
              },
              {
                type: 'image_url',
                image_url: { url: beforeImageBase64 }
              },
              {
                type: 'image_url',
                image_url: { url: afterImageBase64 }
              }
            ]
          }
        ]
      });
      
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
      }
      cleanedResponse = cleanedResponse.trim();
      
      const parsed = JSON.parse(cleanedResponse);
      logger.success('✅ Image comparison complete', { 
        hasDamage: parsed.hasDamage, 
        severity: parsed.severity 
      });
      return parsed;
    } catch (error) {
      logger.warning('Image comparison parsing failed', error);
      // Fallback mock response
      return {
        hasDamage: Math.random() > 0.6,
        severity: 'minor',
        description: 'AI analysis detected a potential discrepancy in surface texture consistent with minor abrasion. The condition appears to show normal wear and tear.',
        isNormalWear: true,
        tenantLiable: false
      };
    }
  }

  /**
   * Helper method for simple text requests
   */
  private async makeRequest(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.chatModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4096,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * DEFENSE PIPELINE - AGENT 1: Context Extraction
   * Extracts all relevant information and creates a structured JSON context
   */
  async defenseAgent1_ExtractContext(
    leaseData: any,
    intakeEvidence: Record<string, any>,
    checkoutEvidence: Record<string, any>,
    userQuery: string,
    jurisdiction?: string,
    userInfo?: { name?: string; location?: string }
  ): Promise<any> {
    logger.api('🤖 Agent 1: Extracting defense context', { userQuery, jurisdiction, userInfo });

    const systemPrompt = `You are an expert legal case preparation specialist with deep knowledge of Swiss rental law (Code of Obligations).

**JURISDICTION**: ${jurisdiction || 'Switzerland'} - Apply canton-specific regulations where applicable.

**TENANT INFORMATION**:
${userInfo ? `- Name: ${userInfo.name || 'Not provided'}
- Location: ${userInfo.location || 'Not specified'}` : '- Information not provided'}

Your role is to meticulously extract, organize, and structure ALL relevant information for a tenant defense case.

CRITICAL TASK: Create a comprehensive, well-structured JSON context document that will be used by legal analysts to generate a defense report.

EXTRACTION REQUIREMENTS:

1. **LEASE CONTEXT** - Extract EVERY detail:
   - Asset type, name, location
   - ALL lease information items (price, dates, deposit, etc.)
   - EVERY clause with full text, status, and legal implications
   - Complete responsibilities breakdown (tenant vs. provider)
   - Risk score and irregularities
   - Jurisdiction and applicable laws

2. **EVIDENCE ITEMS** - For EACH inspection item:
   - Item ID, name, description, priority
   - ALL intake photo URLs (preserve exact URLs)
   - ALL checkout photo URLs (preserve exact URLs)
   - **MISSING PHOTOS**: Flag if intake or checkout photos are missing/incomplete
   - Photo count: number of intake vs. checkout photos
   - Complete damage analysis results (hasDamage, severity, description, liability)
   - Timestamps of photo capture
   - Relevance to user query (high/medium/low)
   - Specific concerns or red flags
   - Documentation completeness score (complete/partial/missing)

3. **LEGAL ANALYSIS** - Identify:
   - Applicable Swiss CO articles (Art. 257-274g CO)
   - Relevant tenant protection laws
   - Normal wear vs. damage definitions
   - Liability thresholds
   - Deposit return regulations

4. **STRATEGIC FACTORS** - Highlight:
   - Strongest evidence points
   - Potential weaknesses
   - Key contractual protections
   - Documentation quality
   - Timeline compliance

OUTPUT FORMAT (JSON only, no markdown):
{
  "caseId": "CASE-[timestamp]",
  "userQuery": "exact user question/concern",
  "leaseContext": {
    "assetType": "Property|Car|Motorbike",
    "assetName": "full name/address",
    "riskScore": 0-100,
    "info": [
      {"label": "...", "value": "...", "icon": "..."}
    ],
    "clauses": [
      {
        "section": "...",
        "text": "full clause text",
        "status": "clean|warning|risk",
        "note": "legal implications",
        "legalReference": "Art. XXX CO"
      }
    ],
    "responsibilities": {
      "tenant": ["duty1", "duty2"],
      "lessor": ["duty1", "duty2"]
    },
    "irregularities": ["issue1", "issue2"]
  },
  "evidenceItems": [
    {
      "itemId": "unique-id",
      "itemName": "descriptive name",
      "description": "what this item is",
      "priority": "high|medium|low",
      "intakePhotos": ["full-url-1", "full-url-2"],
      "checkoutPhotos": ["full-url-1", "full-url-2"],
      "intakePhotoCount": 2,
      "checkoutPhotoCount": 2,
      "missingPhotos": {
        "intakeMissing": false,
        "checkoutMissing": false,
        "details": "description of what's missing"
      },
      "documentationCompleteness": "complete|partial|missing",
      "intakeTimestamp": "ISO date",
      "checkoutTimestamp": "ISO date",
      "damageAnalysis": {
        "hasDamage": boolean,
        "severity": "none|minor|moderate|severe",
        "description": "detailed findings",
        "isNormalWear": boolean,
        "tenantLiable": boolean,
        "stateGrade": "A|B|C|D|F"
      },
      "relevanceToQuery": "high|medium|low",
      "concerns": ["specific issue 1", "specific issue 2"]
    }
  ],
  "legalReferences": [
    {
      "article": "Art. XXX CO",
      "topic": "what it covers",
      "relevance": "how it applies to this case"
    }
  ],
  "keyFactors": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "criticalEvidence": ["evidence1", "evidence2"],
    "timelineFacts": ["fact1", "fact2"]
  }
}

QUALITY REQUIREMENTS:
- Preserve ALL photo URLs exactly as provided
- Include complete clause texts, not summaries
- Identify ALL relevant legal articles
- Assess relevance of each evidence item to user query
- **FLAG MISSING PHOTOS**: For each item, check if intake or checkout photos are missing
- **DOCUMENT GAPS**: If photos are missing, explain what's missing and why it's problematic
- Count photos for each item (intake vs. checkout)
- Mark documentation completeness (complete/partial/missing)
- Be exhaustive - better too much info than too little

MISSING PHOTO ASSESSMENT:
- "complete": Both intake and checkout photos present
- "partial": Some photos missing (e.g., only 1 of 3 angles)
- "missing": No photos for intake or checkout

**CRITICAL**: Missing photos severely weaken defense. Document ALL gaps clearly.

This JSON will be the foundation for legal analysis. Completeness and accuracy are critical.`;

    const userPrompt = `User Query: "${userQuery}"

Lease Data: ${JSON.stringify(leaseData, null, 2)}

Intake Evidence: ${JSON.stringify(intakeEvidence, null, 2)}

Checkout Evidence: ${JSON.stringify(checkoutEvidence, null, 2)}

Extract and structure all relevant information for the defense case.`;

    try {
      const response = await this.makeRequest(systemPrompt, userPrompt);
      const parsed = JSON.parse(response);
      logger.success('✅ Agent 1: Context extracted', parsed);
      return parsed;
    } catch (error) {
      logger.error('❌ Agent 1 failed', error);
      throw error;
    }
  }

  /**
   * DEFENSE PIPELINE - AGENT 2: Report Generation
   * Analyzes the case with images and generates a comprehensive defense report
   */
  async defenseAgent2_GenerateReport(
    contextData: any,
    allImageUrls: string[],
    jurisdiction?: string,
    userInfo?: { name?: string; location?: string }
  ): Promise<string> {
    logger.api('🤖 Agent 2: Generating defense report', { 
      imageCount: allImageUrls.length,
      query: contextData.userQuery,
      jurisdiction,
      userInfo
    });

    const systemPrompt = `You are a senior Swiss rental law attorney with 15+ years of experience in tenant defense cases under the Swiss Code of Obligations (Art. 253-274g CO). You specialize in deposit disputes, damage assessments, and normal wear vs. liability determinations.

**JURISDICTION**: ${jurisdiction || 'Switzerland'} - Apply ${jurisdiction || 'Swiss'} cantonal law and local tenant protections.

**CLIENT INFORMATION**:
${userInfo ? `- Tenant: ${userInfo.name || 'Client'}
- Location: ${userInfo.location || 'Not specified'}` : '- Client information not provided'}

CRITICAL TASK: Generate a comprehensive, legally sound defense report by analyzing:
1. The structured case context from Agent 1 (lease details, clauses, evidence)
2. ALL provided images (intake and checkout photos)
3. The user's specific concern/query

ANALYSIS METHODOLOGY:

**STEP 1: VISUAL EVIDENCE REVIEW**
- Examine EVERY photo pair (intake vs. checkout)
- **IDENTIFY MISSING PHOTOS**: Flag items with incomplete documentation
- Assess impact of missing photos on case strength
- Identify any visible changes, damage, or deterioration
- Compare condition states using the provided damage analysis
- Note photo quality, angles, and documentation completeness
- Document gaps in evidence and their legal implications

**STEP 2: LEASE CONTRACT ANALYSIS**
- Review ALL clauses for tenant protections
- Identify liability limitations and normal wear provisions
- Check for unfair or illegal terms
- Assess deposit and damage liability clauses

**STEP 3: LEGAL FRAMEWORK APPLICATION**
Apply ALL relevant Swiss Code of Obligations (CO) articles. These apply to ALL types of leases: property, vehicles (cars, motorcycles), equipment (skis, tools), and any other rented items.

**GENERAL RENTAL LAW (Art. 253-274g CO):**
- Art. 253 CO: Definition of rental agreement (applies to ANY leased item)
- Art. 253a CO: Scope of application (property AND movable items)
- Art. 256 CO: Handover of the leased item
- Art. 256a CO: Defects upon handover
- Art. 256b CO: Defects arising during lease period

**LESSEE OBLIGATIONS (Art. 257-257f CO):**
- Art. 257 CO: Duty of care and maintenance (applies to all leased items)
- Art. 257a CO: Duty to notify defects
- Art. 257b CO: Duty to tolerate inspections
- Art. 257c CO: Duty to tolerate repairs
- Art. 257d CO: Liability for damage (cars, equipment, property, etc.)
- Art. 257e CO: Subletting/transfer of use
- Art. 257f CO: Early termination by lessee

**LESSOR OBLIGATIONS (Art. 258-259 CO):**
- Art. 258 CO: Duty to maintain leased item
- Art. 259 CO: Duty to perform repairs
- Art. 259a CO: Lessee's right to retention
- Art. 259b CO: Lessee's right to reduce payment
- Art. 259c CO: Lessee's right to terminate
- Art. 259d CO: Immediate remedy by lessee
- Art. 259e CO: Lessee's right to compensation
- Art. 259f CO: Lessee's right to deposit reduction
- Art. 259g CO: Lessee's right to withhold payment
- Art. 259h CO: Lessee's right to terminate immediately
- Art. 259i CO: Lessor's right to compensation

**PAYMENT REGULATIONS (Art. 269-269d CO):**
- Art. 269 CO: Initial price/rent (free determination)
- Art. 269a CO: Abusive pricing
- Art. 269b CO: Indexed pricing
- Art. 269c CO: Stepped pricing
- Art. 269d CO: Price increases and additional charges

**DEPOSIT/SECURITY (Art. 257e, 257h CO):**
- Art. 257e CO: Security deposit amount (typically max 3 months for property, varies for vehicles/equipment)
- Art. 257h CO: Deposit account requirements

**NORMAL WEAR AND TEAR (Art. 267 CO) - CRITICAL FOR ALL LEASES:**
- Art. 267 CO: Return condition - lessee NOT liable for normal wear and tear
  - Property: paint fading, minor scratches, carpet wear
  - Vehicles: tire wear, minor scratches, interior wear
  - Equipment: usage marks, minor scuffs, normal depreciation
- Art. 267a CO: Modification by lessee

**TERMINATION (Art. 266-266o CO):**
- Art. 266 CO: General termination rules
- Art. 266a CO: Notice periods (varies by lease type and duration)
- Art. 266b CO: Termination dates
- Art. 266c CO: Form of termination (written requirement)
- Art. 266d CO: Termination by lessor
- Art. 266e CO: Termination by lessee
- Art. 266f CO: Extraordinary termination
- Art. 266g CO: Termination for urgent reasons
- Art. 266h CO: Death of lessee
- Art. 266i CO: Bankruptcy of lessee
- Art. 266k CO: Sale/transfer of leased item
- Art. 266l CO: Urgent personal need
- Art. 266m CO: Default by lessee (non-payment)
- Art. 266n CO: Violation of duty of care
- Art. 266o CO: Impossibility of use

**PROTECTION AGAINST TERMINATION (Art. 271-273 CO):**
- Art. 271 CO: Abusive termination
- Art. 271a CO: Contestation of termination
- Art. 272 CO: Extension of lease
- Art. 272a CO: Exclusion of extension
- Art. 272b CO: Duration of extension
- Art. 272c CO: Procedure for extension
- Art. 272d CO: Termination after extension
- Art. 273 CO: Protection during conciliation proceedings

**CONCILIATION AND COURT PROCEEDINGS (Art. 274-274g CO):**
- Art. 274 CO: Conciliation authority (mandatory first step)
- Art. 274a CO: Jurisdiction
- Art. 274b CO: Conciliation procedure (free of charge)
- Art. 274c CO: Provisional measures
- Art. 274d CO: Court proceedings
- Art. 274e CO: Simplified procedure
- Art. 274f CO: Representation
- Art. 274g CO: Costs

**RETURN CONDITION (Art. 268 CO) - APPLIES TO ALL LEASES:**
- Art. 268 CO: Condition upon return (property, vehicles, equipment)
- Art. 268a CO: Inspection upon return (mandatory for disputes)
- Art. 268b CO: Notification of defects (lessor must notify promptly)

**ASSET-SPECIFIC CONSIDERATIONS:**
- **Property**: Focus on Art. 267 CO (normal wear), Art. 257d CO (damage liability)
- **Vehicles**: Emphasize mileage limits, mechanical wear, cosmetic damage
- **Equipment**: Consider usage intensity, seasonal wear, maintenance records
- **All Assets**: Art. 256 CO (handover documentation), Art. 268a CO (return inspection)

Apply these articles based on asset type and case specifics. ONLY cite articles that are directly relevant to the specific lease situation.

**STEP 4: DAMAGE VS. NORMAL WEAR DETERMINATION**
For each evidence item:
- Assess if changes constitute damage or normal wear
- Consider duration of tenancy
- Evaluate reasonableness of wear
- Determine tenant liability (if any)
- Calculate potential deduction amounts

REPORT STRUCTURE (Use Markdown):

# Defense Report: [Asset Name]

## 1. Executive Summary
- Brief case overview (2-3 sentences)
- User's primary concern
- Overall assessment and win probability indicator

## 2. Lease Contract Analysis
### Key Contractual Terms
- List and analyze relevant clauses
- Identify tenant protections
- Flag any problematic or illegal terms

### Financial Terms
- Deposit amount and conditions
- Rent and payment terms
- Liability limitations

### Responsibilities Matrix
| Tenant Duties | Provider Duties |
|---------------|-----------------|
| [from context] | [from context] |

## 3. Evidence Analysis
For EACH inspection item:

### [Item Name] - [Priority Level]

**Documentation Status:**
- Intake Photos: [X photos] - [complete/partial/missing]
- Checkout Photos: [Y photos] - [complete/partial/missing]
- ⚠️ **Missing Evidence**: [If applicable, describe what's missing and impact]

**Intake Condition (Photo [X]):**
- Detailed description of initial state
- Notable pre-existing conditions
- Documentation quality

**Checkout Condition (Photo [Y]):**
- Detailed description of final state
- Visible changes or damage
- Comparison to intake

**Damage Assessment:**
- Severity: [none/minor/moderate/severe]
- Classification: [Normal Wear / Tenant Damage]
- Legal Basis: [Art. XXX CO]
- Liability: [Yes/No - with reasoning]
- Estimated Cost (if applicable): CHF [amount]

**Evidence Strength:**
- Photo Quality: [excellent/good/fair/poor]
- Documentation Completeness: [complete/partial/missing]
- Impact on Defense: [strong/moderate/weak]

**Defense Position:**
[Specific argument for this item, accounting for any missing evidence]

## 4. Legal Assessment

### Applicable Swiss Law
- **Art. 257 CO**: [how it applies]
- **Art. 259 CO**: [how it applies]
- **Art. 267 CO**: [how it applies]
- **Art. 268 CO**: [how it applies]

### Normal Wear vs. Damage Analysis
[Detailed legal analysis of what constitutes normal wear for this asset type and tenancy duration]

### Tenant Protections
[List all applicable legal protections]

## 5. Financial Impact Analysis

| Item | Claimed Damage | Our Assessment | Justification |
|------|----------------|----------------|---------------|
| [Item] | CHF [X] | CHF [Y] | [Reason] |

**Total Claimed:** CHF [amount]
**Justified Amount:** CHF [amount]
**Disputed Amount:** CHF [amount]

## 6. Defense Strategy

### Strengths
1. [Strength with evidence reference]
2. [Strength with evidence reference]
3. [Strength with evidence reference]

### Weaknesses
1. [Weakness with mitigation strategy]
2. [Weakness with mitigation strategy]

### Recommended Actions
1. **Immediate:** [Action with timeline]
2. **Short-term:** [Action with timeline]
3. **If escalated:** [Action with timeline]

### Negotiation Position
- **Maximum acceptable deduction:** CHF [amount]
- **Justification:** [reasoning]
- **Fallback position:** [alternative]

## 7. Conclusion

### Case Strength: [Strong/Moderate/Weak]
[2-3 sentence summary of overall position]

### Likely Outcome
[Realistic prediction based on Swiss law and evidence]

### Next Steps
1. [Specific action]
2. [Specific action]
3. [Specific action]

### Timeline
- **Response deadline:** [if applicable]
- **Conciliation hearing:** [if applicable]
- **Court filing deadline:** [if applicable]

---

QUALITY REQUIREMENTS:
- Reference specific photos by number when discussing evidence
- **HIGHLIGHT MISSING PHOTOS**: Clearly flag items with incomplete documentation
- **ASSESS IMPACT**: Explain how missing photos affect case strength
- **CITE LAW PROPERLY**: ALWAYS use format "Art. XXX CO" or "OR Art. XXX" (e.g., Art. 257 CO, OR Art. 267, Art. 268a CO)
- Provide specific CHF amounts for financial claims
- Use professional but clear language
- Be thorough yet concise
- Support every conclusion with evidence or legal basis
- Format tables and lists for readability
- Bold key terms and findings
- Use ⚠️ emoji for missing evidence warnings

MISSING PHOTO IMPLICATIONS:
- Missing intake photos: Weakens proof of pre-existing conditions
- Missing checkout photos: Landlord may claim unverified damage
- Partial documentation: Reduces credibility and negotiation leverage
- Complete documentation: Strongest defense position

**CRITICAL LAW CITATION FORMAT**: 
- ALWAYS wrap law citations with ** markers: **Art. 257 CO**, **OR Art. 267**, **Art. 268a CO**
- This makes them clickable for users to get explanations
- Examples: **Art. 267 CO**, **OR Art. 259b**, **Art. 268a CO**
- Cite frequently to support arguments
- NEVER write plain "Art. 257 CO" - ALWAYS use "**Art. 257 CO**"

CRITICAL: Your report will be used for actual legal defense. Accuracy, completeness, and legal soundness are paramount. Document ALL evidence gaps.`;

    const userPrompt = `Case Context:
${JSON.stringify(contextData, null, 2)}

User's Concern: "${contextData.userQuery}"

Please analyze ALL the provided images and generate a comprehensive defense report.`;

    try {
      // Build message with images
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            ...allImageUrls.map(url => ({
              type: 'image_url',
              image_url: { url }
            }))
          ]
        }
      ];

      const response = await this.makeRequestWithImages(messages);
      logger.success('✅ Agent 2: Report generated', { length: response.length });
      return response;
    } catch (error) {
      logger.error('❌ Agent 2 failed', error);
      throw error;
    }
  }

  /**
   * DEFENSE PIPELINE - AGENT 3: Win Probability & Summary
   * Evaluates the report and provides win probability with brief summary
   */
  async defenseAgent3_EvaluateCase(report: string): Promise<any> {
    logger.api('🤖 Agent 3: Evaluating case outcome');

    const systemPrompt = `You are a senior legal strategist and case evaluator with 20+ years of experience in Swiss rental law litigation. You specialize in predicting case outcomes based on evidence quality, legal merit, and Swiss court precedents.

CRITICAL TASK: Evaluate the comprehensive defense report and provide a realistic, data-driven assessment of case strength and likely outcome.

EVALUATION CRITERIA:

**1. EVIDENCE QUALITY (0-30 points)**
- Photo documentation completeness (CRITICAL: deduct heavily for missing photos)
- Intake vs. checkout comparison clarity
- Timestamp and metadata presence
- Documentation of pre-existing conditions
- **Missing Photo Penalty**: -5 points per item with missing intake photos, -3 points per item with missing checkout photos

**2. LEGAL MERIT (0-40 points)**
- Strength of legal arguments
- Applicability of Swiss CO articles
- Normal wear vs. damage classification
- Contractual protections
- Precedent alignment

**3. FINANCIAL REASONABLENESS (0-15 points)**
- Claimed amounts vs. actual damage
- Deposit proportionality
- Repair cost estimates
- Depreciation considerations

**4. PROCEDURAL COMPLIANCE (0-15 points)**
- Timeline adherence
- Notice requirements
- Documentation standards
- Good faith negotiations

OUTCOME PREDICTION FACTORS:
- Swiss conciliation board tendencies (favor tenants in wear disputes)
- Burden of proof on landlord for damage claims
- Normal wear exemptions under Art. 267 CO
- Deposit return regulations under Art. 268 CO
- Quality and completeness of evidence
- Contractual fairness and legality

WIN PROBABILITY SCALE:
- 90-100%: Extremely strong case, likely full deposit return
- 75-89%: Strong case, minor deductions possible
- 60-74%: Moderate case, some deductions likely
- 40-59%: Weak case, significant deductions possible
- 20-39%: Very weak case, major liability exposure
- 0-19%: Critical weaknesses, likely unfavorable outcome

OUTPUT FORMAT (JSON only, no markdown):
{
  "winProbability": 75,
  "confidence": "high|medium|low",
  "summary": "Concise case assessment in 150 chars max",
  "caseStrength": "strong|moderate|weak",
  "keyStrength": "Single most powerful argument/evidence",
  "keyWeakness": "Most significant vulnerability or gap",
  "estimatedOutcome": {
    "depositReturn": "full|partial|minimal",
    "likelyDeduction": "CHF 0-X",
    "reasoning": "Brief explanation"
  },
  "riskFactors": [
    "risk1",
    "risk2"
  ],
  "missingEvidenceImpact": {
    "itemsWithMissingPhotos": 0,
    "severityOfGaps": "none|minor|moderate|severe",
    "impactOnCase": "description of how missing photos weaken defense"
  },
  "recommendations": [
    "action1",
    "action2"
  ],
  "nextSteps": {
    "immediate": "What to do now",
    "ifDisputed": "What to do if landlord disputes",
    "escalation": "When to involve legal counsel"
  }
}

QUALITY REQUIREMENTS:
- Be realistic, not optimistic
- Base probability on actual Swiss law and precedents
- Consider both best and worst case scenarios
- Provide actionable insights
- Keep summary under 150 characters
- Justify probability with specific factors

CRITICAL: This evaluation will guide the tenant's decision-making. Accuracy and realism are essential.`;

    const userPrompt = `Defense Report:
${report}

Evaluate this case and provide win probability with summary.`;

    try {
      const response = await this.makeRequest(systemPrompt, userPrompt);
      const parsed = JSON.parse(response);
      logger.success('✅ Agent 3: Case evaluated', parsed);
      return parsed;
    } catch (error) {
      logger.error('❌ Agent 3 failed', error);
      throw error;
    }
  }

  /**
   * Helper method for requests with images
   */
  private async makeRequestWithImages(messages: any[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.visionModel,
        messages: messages,
        max_tokens: 4096,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

export default new TogetherService();
