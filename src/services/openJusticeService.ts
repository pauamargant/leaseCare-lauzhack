import logger from '@/utils/logger';

const API_BASE_URL = 'https://api.staging.openjustice.ai';
const API_KEY = import.meta.env.VITE_OPENJUSTICE_API_KEY || '';
const DIALOG_FLOW_ID = 'o13pubarfej';

interface ConversationResponse {
  conversationId: string;
}

interface MessageResponse {
  success: boolean;
  conversationId: string;
}

class OpenJusticeService {
  private apiKey: string;
  private baseUrl: string;
  private dialogFlowId: string;

  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = API_BASE_URL;
    this.dialogFlowId = DIALOG_FLOW_ID;
  }

  /**
   * Create a new conversation
   */
  private async createConversation(name: string): Promise<string> {
    logger.api('📝 Creating OpenJustice conversation', { name });

    if (!this.apiKey) {
      throw new Error('OpenJustice API key not configured. Please add VITE_OPENJUSTICE_API_KEY to your .env file.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/conversation/create-new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          name,
          dialogFlowId: this.dialogFlowId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to create conversation', { status: response.status, error: errorText });
        throw new Error(`Failed to create conversation: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data: ConversationResponse = await response.json();
      logger.success('✅ Conversation created', { conversationId: data.conversationId });
      return data.conversationId;
    } catch (error: any) {
      logger.error('Network error creating conversation', error);
      throw new Error(`Network error: ${error.message}. Check your internet connection and API configuration.`);
    }
  }

  /**
   * Send a message to the conversation
   */
  private async sendMessage(conversationId: string, prompt: string): Promise<void> {
    logger.api('💬 Sending message to OpenJustice', { conversationId });

    const response = await fetch(`${this.baseUrl}/conversation/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        title: 'Swiss Law Explanation',
        prompt: 'You are a Swiss law expert specializing in rental law and the Swiss Code of Obligations.',
        conversationId,
        messages: [
          {
            model: 'gpt-4o-mini-2024-07-18',
            role: 'user',
            content: prompt,
            metadata: {}
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    logger.success('✅ Message sent');
  }

  /**
   * Stream the conversation response
   */
  private async streamConversation(conversationId: string): Promise<string> {
    logger.api('📡 Streaming conversation', { conversationId });

    const response = await fetch(`${this.baseUrl}/conversation/stream/${conversationId}`, {
      method: 'GET',
      headers: {
        'accept': 'text/event-stream',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to stream conversation: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder('utf-8');
    let responseText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.includes('data:')) {
          const parts = line.split('data:');
          const jsonString = parts[1]?.trim();
          if (!jsonString || jsonString === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonString);
            if (parsed.text) {
              responseText += parsed.text;
            }
          } catch (err) {
            // Ignore invalid JSON lines
          }
        }
      }
    }

    logger.success('✅ Stream complete', { length: responseText.length });
    return responseText;
  }

  /**
   * Explain a Swiss law article
   * @param article - The article reference (e.g., "Art. 257 CO", "Art. 267 CO")
   * @returns Explanation text
   */
  async explainLawArticle(article: string): Promise<string> {
    try {
      logger.info('🔍 Explaining law article', { article });

      // Create conversation
      const conversationId = await this.createConversation(`Explain ${article}`);

      // Send message asking for explanation with comprehensive legal context
      const prompt = `You are a Swiss rental law expert. Explain ${article} from the Swiss Code of Obligations in the context of rental agreements (property, vehicles, equipment).

CONTEXT: Swiss rental law (Art. 253-274g CO) governs all lease agreements. Key principles include:
- Tenant protection against unfair terms
- Normal wear and tear exemptions (Art. 267 CO)
- Deposit limits (Art. 257e CO - max 3 months)
- Mandatory conciliation before court (Art. 274 CO)
- Burden of proof on landlord for damage claims

Please provide a structured explanation with these sections:

1. **Summary of ${article}**: Brief overview of what this article states (2-3 sentences)

2. **Implications for Tenants**: How this article protects or obligates tenants/lessees in practical terms

3. **Practical Example**: Real-world scenario showing how this article applies (e.g., rent dispute, damage claim, termination)

4. **Key Protections/Obligations**: Specific rights or duties this article establishes

Format each section as: "1. **Title**: content"

Keep it concise (max 250 words total) but legally accurate. Reference related articles if relevant.`;

      await this.sendMessage(conversationId, prompt);

      // Stream the response
      const explanation = await this.streamConversation(conversationId);

      return explanation;
    } catch (error: any) {
      logger.error('❌ Failed to explain law article', error);
      throw error;
    }
  }

  /**
   * Get detailed explanation for a specific legal question
   */
  async askLegalQuestion(question: string): Promise<string> {
    try {
      logger.info('❓ Asking legal question', { question });

      const conversationId = await this.createConversation('Legal Question');
      await this.sendMessage(conversationId, question);
      const answer = await this.streamConversation(conversationId);

      return answer;
    } catch (error: any) {
      logger.error('❌ Failed to get legal answer', error);
      throw error;
    }
  }
}

export default new OpenJusticeService();
