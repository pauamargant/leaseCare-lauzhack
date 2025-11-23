import { ref } from 'vue';

/**
 * Composable to handle clickable law citations
 * Makes all Swiss CO article references clickable with explanations
 */
export function useLawCitations() {
  const showModal = ref(false);
  const selectedArticle = ref('');

  /**
   * Convert text with law citations to HTML with clickable links
   * Matches patterns like: 
   * - Art. 257 CO, Art. 267a CO, Art 259 CO (Swiss Code of Obligations)
   * - OR Art. 267, OR Art 259b (Obligationenrecht - German)
   * - Art. 257 OR, Art 267a OR (Alternative format)
   * - **Art. 257 CO** (marked by AI)
   */
  const makeClickable = (text: string): string => {
    if (!text) return '';

    // First, handle marked citations with ** or __ (from AI)
    let processed = text.replace(/\*\*((?:OR\s+)?Art\.?\s*\d+[a-z]?(?:\s+(?:CO|OR))?)\*\*/gi, (match, article) => {
      return `<span class="law-citation" data-article="${article.trim()}">${article.trim()}</span>`;
    });

    // Then handle unmarked citations
    // Regex to match Swiss law articles in multiple formats:
    // 1. Art. 257 CO / Art 267a CO
    // 2. OR Art. 267 / OR Art 259b
    // 3. Art. 257 OR / Art 267a OR
    const articleRegex = /\b((?:OR\s+)?Art\.?\s*\d+[a-z]?(?:\s+(?:CO|OR))?)\b/gi;

    processed = processed.replace(articleRegex, (match) => {
      // Skip if already wrapped (contains 'law-citation')
      if (match.includes('law-citation')) return match;
      
      // Normalize the article reference for display
      const normalized = match.trim();
      return `<span class="law-citation" data-article="${normalized}">${normalized}</span>`;
    });

    return processed;
  };

  /**
   * Handle click on law citation
   */
  const handleCitationClick = (article: string) => {
    selectedArticle.value = article;
    showModal.value = true;
  };

  /**
   * Close the modal
   */
  const closeModal = () => {
    showModal.value = false;
    selectedArticle.value = '';
  };

  /**
   * Setup click listeners for law citations in a container
   */
  const setupClickListeners = (container: HTMLElement) => {
    const citations = container.querySelectorAll('.law-citation');
    citations.forEach((citation) => {
      citation.addEventListener('click', () => {
        const article = citation.getAttribute('data-article');
        if (article) {
          handleCitationClick(article);
        }
      });
    });
  };

  return {
    showModal,
    selectedArticle,
    makeClickable,
    handleCitationClick,
    closeModal,
    setupClickListeners
  };
}
