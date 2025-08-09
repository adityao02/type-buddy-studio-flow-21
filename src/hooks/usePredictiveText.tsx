import { useState, useEffect, useRef, useCallback } from 'react';
import { findWordCompletions, findContextualWords, getWordFrequency } from '@/utils/wordDataset';

interface Suggestion {
  text: string;
  score: number;
  type: 'completion' | 'contextual';
}

interface UserPattern {
  input: string;
  selected: string;
  timestamp: number;
  context: string;
}

interface PredictiveTextState {
  suggestions: Suggestion[];
  currentWord: string;
  cursorPosition: { x: number; y: number };
  selectedIndex: number;
  isVisible: boolean;
}

export const usePredictiveText = () => {
  const [state, setState] = useState<PredictiveTextState>({
    suggestions: [],
    currentWord: '',
    cursorPosition: { x: 0, y: 0 },
    selectedIndex: 0,
    isVisible: false
  });

  const userPatternsRef = useRef<UserPattern[]>([]);
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem('accessibility-predictive-text');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Load user patterns from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('predictive-text-patterns');
    if (saved) {
      try {
        userPatternsRef.current = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load user patterns:', e);
      }
    }
  }, []);

  // Listen for predictive text toggle changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('accessibility-predictive-text');
      setIsEnabled(saved !== null ? JSON.parse(saved) : false);
    };

    // Listen for storage events from other tabs/components
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events within the same tab
    window.addEventListener('predictive-text-toggle', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('predictive-text-toggle', handleStorageChange);
    };
  }, []);

  // Save user patterns to localStorage
  const saveUserPatterns = useCallback(() => {
    localStorage.setItem('predictive-text-patterns', JSON.stringify(userPatternsRef.current));
  }, []);


  // Generate suggestions based on input
  const generateSuggestions = useCallback((input: string, context: string): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const normalizedInput = input.toLowerCase().replace(/[^a-z]/g, '');
    
    if (normalizedInput.length < 1) return [];

    // Check user patterns first (highest priority)
    const userPatterns = userPatternsRef.current
      .filter(pattern => pattern.input.toLowerCase().startsWith(normalizedInput))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);

    userPatterns.forEach(pattern => {
      suggestions.push({
        text: pattern.selected,
        score: 1000 + (Date.now() - pattern.timestamp) / 1000000, // Recent patterns score higher
        type: 'contextual'
      });
    });

    // Get word completions using the Google 20k dataset
    const completions = findWordCompletions(normalizedInput, 6);
    completions.forEach(word => {
      const frequency = getWordFrequency(word);
      suggestions.push({
        text: word,
        score: 800 + frequency / 100, // Higher score for more frequent words
        type: 'completion'
      });
    });

    // Get contextual suggestions
    const contextWords = context.split(/\s+/).filter(w => w.length > 0);
    const contextualSuggestions = findContextualWords(contextWords, normalizedInput, 4);
    contextualSuggestions.forEach(word => {
      if (!suggestions.some(s => s.text.toLowerCase() === word.toLowerCase())) {
        const frequency = getWordFrequency(word);
        suggestions.push({
          text: word,
          score: 600 + frequency / 100,
          type: 'contextual'
        });
      }
    });


    // Sort by score and return top 8
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .filter(s => s.text.toLowerCase() !== normalizedInput);
  }, []);

  // Update suggestions based on current input
  const updateSuggestions = useCallback((word: string, context: string, position: { x: number; y: number }) => {
    // Only generate suggestions if predictive text is enabled
    if (!isEnabled) {
      setState(prev => ({
        ...prev,
        suggestions: [],
        currentWord: '',
        isVisible: false
      }));
      return;
    }

    const suggestions = generateSuggestions(word, context);
    
    setState(prev => ({
      ...prev,
      suggestions,
      currentWord: word,
      cursorPosition: position,
      selectedIndex: 0,
      isVisible: suggestions.length > 0
    }));
  }, [generateSuggestions, isEnabled]);

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: Suggestion) => {
    // Record user pattern
    const pattern: UserPattern = {
      input: state.currentWord,
      selected: suggestion.text,
      timestamp: Date.now(),
      context: ''
    };

    userPatternsRef.current.push(pattern);
    
    // Keep only recent 1000 patterns
    if (userPatternsRef.current.length > 1000) {
      userPatternsRef.current = userPatternsRef.current.slice(-1000);
    }
    
    saveUserPatterns();

    setState(prev => ({
      ...prev,
      isVisible: false,
      selectedIndex: 0,
      suggestions: []
    }));

    return suggestion.text;
  }, [state.currentWord, saveUserPatterns]);

  // Navigate through suggestions
  const navigateSuggestions = useCallback((direction: 'up' | 'down') => {
    setState(prev => {
      const newIndex = direction === 'up' 
        ? Math.max(0, prev.selectedIndex - 1)
        : Math.min(prev.suggestions.length - 1, prev.selectedIndex + 1);
      
      return {
        ...prev,
        selectedIndex: newIndex
      };
    });
  }, []);

  // Hide suggestions
  const hideSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false,
      suggestions: []
    }));
  }, []);

  // Get currently selected suggestion
  const getSelectedSuggestion = useCallback(() => {
    return state.suggestions[state.selectedIndex];
  }, [state.suggestions, state.selectedIndex]);

  return {
    state,
    updateSuggestions,
    selectSuggestion,
    navigateSuggestions,
    hideSuggestions,
    getSelectedSuggestion
  };
};
