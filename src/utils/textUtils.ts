// Utility functions for text manipulation and cursor positioning

export interface WordInfo {
  word: string;
  start: number;
  end: number;
  isComplete: boolean;
}

export interface CursorPosition {
  x: number;
  y: number;
}

/**
 * Get the current word being typed at the cursor position
 */
export const getCurrentWord = (element: HTMLElement): WordInfo | null => {
  const selection = window.getSelection();
  if (!selection || !selection.focusNode) return null;

  const range = selection.getRangeAt(0);
  const text = element.textContent || '';
  const cursorPosition = range.startOffset;

  // Find word boundaries
  let start = cursorPosition;
  let end = cursorPosition;

  // Move start backwards until we hit a word boundary
  while (start > 0 && /\w/.test(text[start - 1])) {
    start--;
  }

  // Move end forwards until we hit a word boundary
  while (end < text.length && /\w/.test(text[end])) {
    end++;
  }

  const word = text.slice(start, end);
  
  if (word.length === 0) return null;

  return {
    word,
    start,
    end,
    isComplete: end < text.length && !/\w/.test(text[end])
  };
};

/**
 * Get the cursor position relative to the viewport
 */
export const getCursorPosition = (element: HTMLElement): CursorPosition => {
  const selection = window.getSelection();
  if (!selection || !selection.focusNode) {
    const rect = element.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  return {
    x: rect.left,
    y: rect.bottom
  };
};

/**
 * Replace the current word with a new word
 */
export const replaceCurrentWord = (element: HTMLElement, newWord: string): boolean => {
  const selection = window.getSelection();
  if (!selection || !selection.focusNode) return false;

  const wordInfo = getCurrentWord(element);
  if (!wordInfo) return false;

  // Create a new range that encompasses the entire word
  const range = document.createRange();
  const textNode = selection.focusNode;
  
  // If the cursor is in a text node
  if (textNode.nodeType === Node.TEXT_NODE) {
    range.setStart(textNode, wordInfo.start);
    range.setEnd(textNode, wordInfo.end);
  } else {
    // If the cursor is in an element node, we need to find the text node
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentNode;
    let textOffset = 0;
    
    while (currentNode = walker.nextNode()) {
      const textLength = currentNode.textContent?.length || 0;
      if (textOffset + textLength >= wordInfo.start) {
        const startOffset = Math.max(0, wordInfo.start - textOffset);
        const endOffset = Math.min(textLength, wordInfo.end - textOffset);
        
        range.setStart(currentNode, startOffset);
        range.setEnd(currentNode, endOffset);
        break;
      }
      textOffset += textLength;
    }
  }

  // Replace the selected text
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Use execCommand to replace the text (maintains undo history)
  if (document.queryCommandSupported('insertText')) {
    document.execCommand('insertText', false, newWord);
  } else {
    // Fallback for browsers that don't support insertText
    range.deleteContents();
    range.insertNode(document.createTextNode(newWord));
  }

  // Position cursor at the end of the replaced word
  const newRange = document.createRange();
  const newTextNode = selection.focusNode;
  if (newTextNode) {
    newRange.setStartAfter(newTextNode);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  return true;
};

/**
 * Get surrounding context for contextual suggestions
 */
export const getSurroundingContext = (element: HTMLElement, maxWords: number = 20): string => {
  const text = element.textContent || '';
  const words = text.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length <= maxWords) return text;
  
  const selection = window.getSelection();
  if (!selection || !selection.focusNode) return text;

  // Get approximate cursor position in the text
  const range = selection.getRangeAt(0);
  const cursorPosition = range.startOffset;
  
  // Find the word index near the cursor
  let currentLength = 0;
  let wordIndex = 0;
  
  for (let i = 0; i < words.length; i++) {
    currentLength += words[i].length + 1; // +1 for space
    if (currentLength >= cursorPosition) {
      wordIndex = i;
      break;
    }
  }
  
  // Get surrounding words
  const start = Math.max(0, wordIndex - maxWords / 2);
  const end = Math.min(words.length, wordIndex + maxWords / 2);
  
  return words.slice(start, end).join(' ');
};

/**
 * Check if the cursor is at the end of a word
 */
export const isAtWordEnd = (element: HTMLElement): boolean => {
  const selection = window.getSelection();
  if (!selection || !selection.focusNode) return false;

  const range = selection.getRangeAt(0);
  const text = element.textContent || '';
  const cursorPosition = range.startOffset;

  // Check if we're at the end of text or next character is not a word character
  return cursorPosition >= text.length || !/\w/.test(text[cursorPosition]);
};