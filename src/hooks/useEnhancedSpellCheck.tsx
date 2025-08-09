import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { isValidWord, findSimilarWords } from '@/utils/wordDataset';

interface SpellCheckError {
  word: string;
  suggestions: string[];
  startIndex: number;
  endIndex: number;
  type: 'spelling' | 'grammar' | 'context';
  description: string;
}

interface EnhancedSpellCheckResult {
  errors: SpellCheckError[];
  correctedText?: string;
}

// Enhanced spell check service using Google 20k words dataset
const enhancedSpellCheckService = async (text: string): Promise<EnhancedSpellCheckResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const errors: SpellCheckError[] = [];
  const words = text.split(/\s+/);
  let currentIndex = 0;
  
  // Common grammar and context errors (keep existing rules)
  const grammarRules = [
    { pattern: /\bhe go\b/gi, correction: 'he goes', type: 'grammar' as const, description: 'Subject-verb agreement error' },
    { pattern: /\btheir\b(?=\s+(is|are|going|coming))/gi, correction: 'they\'re', type: 'context' as const, description: 'Use "they\'re" (they are) instead of "their"' },
    { pattern: /\bthere\b(?=\s+(car|house|dog|friend))/gi, correction: 'their', type: 'context' as const, description: 'Use "their" (possessive) instead of "there"' },
    { pattern: /\byour\b(?=\s+(welcome|right|correct))/gi, correction: 'you\'re', type: 'context' as const, description: 'Use "you\'re" (you are) instead of "your"' },
    { pattern: /\bits\b(?=\s+(raining|cold|hot))/gi, correction: 'it\'s', type: 'context' as const, description: 'Use "it\'s" (it is) instead of "its"' },
    { pattern: /\bto\b(?=\s+(much|many))/gi, correction: 'too', type: 'context' as const, description: 'Use "too" (excessive) instead of "to"' },
  ];
  
  // Check for grammar and context errors first
  grammarRules.forEach(rule => {
    let match;
    while ((match = rule.pattern.exec(text)) !== null) {
      errors.push({
        word: match[0],
        suggestions: [rule.correction],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        type: rule.type,
        description: rule.description
      });
    }
  });
  
  // Check each word against the dataset for spelling errors
  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, ''); // Remove punctuation
    const wordStart = text.indexOf(word, currentIndex);
    
    if (cleanWord.length > 1 && /^[a-zA-Z]+$/.test(cleanWord)) {
      // Skip if already flagged by grammar rules
      const alreadyFlagged = errors.some(error => 
        error.startIndex <= wordStart && error.endIndex >= wordStart + word.length
      );
      
      if (!alreadyFlagged && !isValidWord(cleanWord)) {
        const suggestions = findSimilarWords(cleanWord, 5);
        
        if (suggestions.length > 0) {
          errors.push({
            word: cleanWord,
            suggestions,
            startIndex: wordStart,
            endIndex: wordStart + word.length,
            type: 'spelling',
            description: `"${cleanWord}" may be misspelled`
          });
        }
      }
    }
    
    currentIndex = wordStart + word.length;
  }
  
  return { errors };
};

export const useEnhancedSpellCheck = () => {
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem('accessibility-enhanced-spell-check');
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  const [errors, setErrors] = useState<SpellCheckError[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  
  // Listen for changes to the setting from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('accessibility-enhanced-spell-check');
      setIsEnabled(saved !== null ? JSON.parse(saved) : false);
    };

    // Listen for storage events from other tabs/components
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events within the same tab
    window.addEventListener('spell-check-toggle', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('spell-check-toggle', handleStorageChange);
    };
  }, []);
  
  const checkText = useCallback(async (text: string) => {
    if (!isEnabled || !text.trim()) {
      setErrors([]);
      return;
    }
    
    setIsChecking(true);
    
    try {
      const result = await enhancedSpellCheckService(text);
      setErrors(result.errors);
    } catch (error) {
      console.error('Spell check failed:', error);
      toast({
        title: "Spell Check Error",
        description: "Failed to connect to spell check service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  }, [isEnabled]);
  
  const getErrorsForRange = useCallback((startIndex: number, endIndex: number) => {
    return errors.filter(error => 
      error.startIndex >= startIndex && error.endIndex <= endIndex
    );
  }, [errors]);
  
  const applySuggestion = useCallback((error: SpellCheckError, suggestion: string, text: string) => {
    const before = text.substring(0, error.startIndex);
    const after = text.substring(error.endIndex);
    return before + suggestion + after;
  }, []);
  
  const createSpellCheckMarkup = useCallback((text: string) => {
    if (!isEnabled || errors.length === 0) {
      return text;
    }
    
    // Sort errors by start index (reverse order for correct replacement)
    const sortedErrors = [...errors].sort((a, b) => b.startIndex - a.startIndex);
    
    let markedText = text;
    sortedErrors.forEach(error => {
      const errorText = text.substring(error.startIndex, error.endIndex);
      const className = error.type === 'spelling' ? 'spell-error' : 
                      error.type === 'grammar' ? 'grammar-error' : 
                      'context-error';
      
      const replacement = `<span class="${className}" data-error='${JSON.stringify(error)}'>${errorText}</span>`;
      markedText = markedText.substring(0, error.startIndex) + replacement + markedText.substring(error.endIndex);
    });
    
    return markedText;
  }, [isEnabled, errors]);
  
  return {
    isEnabled,
    errors,
    isChecking,
    checkText,
    getErrorsForRange,
    applySuggestion,
    createSpellCheckMarkup
  };
};