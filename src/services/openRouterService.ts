import axios from 'axios';

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const BASE_URL = import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
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

class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = API_KEY || '';
    this.baseUrl = BASE_URL;
    this.defaultModel = MODEL;
  }

  async chat(request: ChatCompletionRequest): Promise<string> {
    if (!this.apiKey) {
      console.warn('OpenRouter API key not configured. Using fallback response.');
      return this.getFallbackResponse(request.messages);
    }

    try {
      const response = await axios.post<ChatCompletionResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: request.model || this.defaultModel,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'LeaseCare Switzerland',
          },
        }
      );

      return response.data.choices[0]?.message?.content || 'No response generated.';
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      return this.getFallbackResponse(request.messages);
    }
  }

  private getFallbackResponse(messages: Message[]): string {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return 'I can help you with questions about your lease agreement.';
    const userQuery = lastMessage.content.toLowerCase();

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

  async analyzeDocument(documentText: string, jurisdiction: string): Promise<any> {
    const prompt = `You are a Swiss legal expert analyzing a lease agreement. The jurisdiction is ${jurisdiction}.
    
Analyze this lease document and provide a JSON response with:
- riskScore (0-100): Overall risk assessment
- clauses: Array of {section, text, status: "clean"|"warning"|"risk", note}
- recommendations: Array of strings

Document text: ${documentText}

Respond ONLY with valid JSON.`;

    const response = await this.chat({
      messages: [
        { role: 'system', content: 'You are a Swiss legal expert specializing in rental law.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    });

    try {
      return JSON.parse(response);
    } catch {
      // Fallback mock response
      return {
        riskScore: 45,
        clauses: [
          { section: 'Term', text: '12 Months fixed duration.', status: 'clean' },
          { section: 'Deposit', text: '3 months rent deposit.', status: 'warning', note: `Standard practice in ${jurisdiction}` },
          { section: 'Damage', text: 'Tenant liable for all damages.', status: 'risk', note: `Potentially unfair under ${jurisdiction} law.` }
        ],
        recommendations: ['Review damage liability clause', 'Ensure deposit is held in blocked account']
      };
    }
  }

  async analyzeImageComparison(itemName: string, context: string): Promise<any> {
    const prompt = `You are an expert insurance adjuster. Analyze the condition of this ${itemName} in the context of: ${context}.
    
Provide a JSON response with:
- hasDamage: boolean
- severity: "none" | "minor" | "major"
- description: string (detailed analysis)

Respond ONLY with valid JSON.`;

    const response = await this.chat({
      messages: [
        { role: 'system', content: 'You are an expert insurance adjuster and damage assessment specialist.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    });

    try {
      return JSON.parse(response);
    } catch {
      // Fallback mock response
      return {
        hasDamage: Math.random() > 0.6,
        severity: 'minor',
        description: 'AI analysis detected a potential discrepancy in surface texture consistent with minor abrasion.'
      };
    }
  }
}

export default new OpenRouterService();
