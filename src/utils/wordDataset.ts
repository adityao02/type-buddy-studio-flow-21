// Utility for loading and managing the Google 20k English words dataset
import wordsData from '../data/common-words.txt?raw';

let wordsSet: Set<string> | null = null;
let wordsArray: string[] | null = null;
let wordsWithFrequency: { word: string; frequency: number }[] | null = null;

// Initialize word dataset
export const initializeWordDataset = () => {
  if (wordsSet && wordsArray && wordsWithFrequency) {
    return { wordsSet, wordsArray, wordsWithFrequency };
  }

  // Parse the words from the text file
  const words = wordsData
    .split('\n')
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0 && /^[a-z]+$/.test(word)) // Only alphabetic words
    .slice(0, 20000); // Ensure we don't exceed 20k words

  wordsSet = new Set(words);
  wordsArray = [...words];
  
  // Create frequency data (higher index = lower frequency)
  wordsWithFrequency = words.map((word, index) => ({
    word,
    frequency: Math.max(1, 20000 - index) // Higher score for more common words
  }));

  return { wordsSet, wordsArray, wordsWithFrequency };
};

// Check if a word exists in the dataset
export const isValidWord = (word: string): boolean => {
  const { wordsSet } = initializeWordDataset();
  return wordsSet.has(word.toLowerCase());
};

// Get word frequency score (higher = more common)
export const getWordFrequency = (word: string): number => {
  const { wordsWithFrequency } = initializeWordDataset();
  const wordData = wordsWithFrequency.find(w => w.word === word.toLowerCase());
  return wordData ? wordData.frequency : 0;
};

// Find similar words for spell checking
export const findSimilarWords = (word: string, maxSuggestions: number = 5): string[] => {
  const { wordsArray } = initializeWordDataset();
  const targetWord = word.toLowerCase();
  
  if (targetWord.length < 2) return [];

  const suggestions: { word: string; score: number; distance: number }[] = [];
  
  // Calculate Levenshtein distance for each word
  wordsArray.forEach((dictWord, index) => {
    const distance = levenshteinDistance(targetWord, dictWord);
    const frequency = Math.max(1, 20000 - index);
    
    // Score based on edit distance and frequency
    if (distance <= Math.max(2, Math.floor(targetWord.length * 0.4))) {
      const score = frequency / (distance + 1);
      suggestions.push({ word: dictWord, score, distance });
    }
  });

  // Sort by score (best suggestions first) and return top results
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map(s => s.word);
};

// Find word completions for predictive text
export const findWordCompletions = (prefix: string, maxSuggestions: number = 8): string[] => {
  const { wordsWithFrequency } = initializeWordDataset();
  const targetPrefix = prefix.toLowerCase();
  
  if (targetPrefix.length < 1) return [];

  return wordsWithFrequency
    .filter(({ word }) => word.startsWith(targetPrefix) && word !== targetPrefix)
    .slice(0, maxSuggestions * 2) // Get more candidates
    .sort((a, b) => {
      // Prioritize shorter words and higher frequency
      const lengthDiff = a.word.length - b.word.length;
      if (Math.abs(lengthDiff) <= 2) {
        return b.frequency - a.frequency; // Higher frequency first
      }
      return lengthDiff; // Shorter words first
    })
    .slice(0, maxSuggestions)
    .map(({ word }) => word);
};

// Find contextual word suggestions
export const findContextualWords = (
  previousWords: string[], 
  currentPrefix: string = '', 
  maxSuggestions: number = 5
): string[] => {
  const { wordsWithFrequency } = initializeWordDataset();
  
  // Simple contextual matching based on common word patterns
  const context = previousWords.slice(-2).join(' ').toLowerCase();
  const suggestions: string[] = [];
  
  // Common word patterns and associations
  const contextPatterns: { [key: string]: string[] } = {
    'the': ['most', 'best', 'first', 'last', 'only', 'same', 'other', 'new', 'old', 'next'],
    'a': ['new', 'good', 'great', 'little', 'big', 'long', 'short', 'nice', 'bad', 'few'],
    'is': ['a', 'the', 'not', 'very', 'also', 'still', 'now', 'here', 'there', 'always'],
    'to': ['be', 'do', 'go', 'see', 'get', 'make', 'take', 'come', 'work', 'help'],
    'and': ['the', 'a', 'i', 'you', 'we', 'they', 'it', 'he', 'she', 'other'],
    'in': ['the', 'a', 'order', 'fact', 'general', 'particular', 'addition', 'conclusion'],
    'of': ['the', 'a', 'course', 'all', 'them', 'us', 'these', 'those', 'many'],
    'for': ['the', 'a', 'you', 'me', 'us', 'them', 'example', 'instance', 'free'],
    'will': ['be', 'have', 'not', 'also', 'probably', 'likely', 'certainly', 'always'],
    'have': ['a', 'the', 'to', 'been', 'not', 'also', 'already', 'never', 'always'],
    'very': ['good', 'bad', 'nice', 'important', 'interesting', 'difficult', 'easy', 'helpful'],
    'more': ['than', 'information', 'details', 'time', 'money', 'people', 'work', 'important'],
  };
  
  // Check for patterns in the last word
  const lastWord = previousWords[previousWords.length - 1]?.toLowerCase();
  if (lastWord && contextPatterns[lastWord]) {
    const patternSuggestions = contextPatterns[lastWord]
      .filter(word => !currentPrefix || word.startsWith(currentPrefix.toLowerCase()))
      .slice(0, maxSuggestions);
    suggestions.push(...patternSuggestions);
  }
  
  // Fill remaining slots with high-frequency words matching the prefix
  if (suggestions.length < maxSuggestions && currentPrefix) {
    const completions = findWordCompletions(currentPrefix, maxSuggestions - suggestions.length);
    suggestions.push(...completions.filter(word => !suggestions.includes(word)));
  }
  
  return suggestions.slice(0, maxSuggestions);
};

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
}