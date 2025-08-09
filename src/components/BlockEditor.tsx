import React, { useState, useRef, useEffect } from 'react';
import { useDocuments, Document, Block } from '../contexts/DocumentContext';
import FloatingToolbar from './FloatingToolbar';
import SlashCommand from './SlashCommand';
import FloatingStyleToolbar from './FloatingStyleToolbar';
import SpellCheckContextMenu from './SpellCheckContextMenu';
import PredictiveTextDropdown from './PredictiveTextDropdown';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useEnhancedSpellCheck } from '../hooks/useEnhancedSpellCheck';
import { usePredictiveText } from '../hooks/usePredictiveText';
import { getCurrentWord, getCursorPosition, replaceCurrentWord, getSurroundingContext, isAtWordEnd } from '../utils/textUtils';

interface BlockEditorProps {
  document: Document;
  isMoveMode?: boolean;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ document, isMoveMode = false }) => {
  console.log('BlockEditor render - isMoveMode:', isMoveMode);
  const { updateDocument } = useDocuments();
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ x: 0, y: 0 });
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [dragOverBlock, setDragOverBlock] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<{ [key: string]: HTMLElement }>({});
  
  // Enhanced spell check
  const { isEnabled: isSpellCheckEnabled, checkText, applySuggestion } = useEnhancedSpellCheck();
  const [spellCheckContextMenu, setSpellCheckContextMenu] = useState<{
    error: any;
    position: { x: number; y: number };
    blockId: string;
  } | null>(null);
  
  // Predictive text
  const {
    state: predictiveState,
    updateSuggestions,
    selectSuggestion,
    navigateSuggestions,
    hideSuggestions,
    getSelectedSuggestion
  } = usePredictiveText();
  
  // Debounced spell check
  const spellCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    const newBlocks = document.blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, ...updates };
      }
      // Check if it's a column within a columns block
      if (block.type === 'columns' && block.columns) {
        const updatedColumns = block.columns.map(col => 
          col.id === blockId ? { ...col, ...updates } : col
        );
        return { ...block, columns: updatedColumns };
      }
      return block;
    });
    updateDocument(document.id, { blocks: newBlocks });
  };

  const addBlock = (afterBlockId: string, type: Block['type'] = 'paragraph') => {
    const afterIndex = document.blocks.findIndex(b => b.id === afterBlockId);
    if (afterIndex === -1) return '';

    const afterBlock = document.blocks[afterIndex];

    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: '',
      level: type === 'heading' ? 1 : undefined,
      listType: type === 'list' ? afterBlock.listType : undefined,
    };

    const newBlocks = [
      ...document.blocks.slice(0, afterIndex + 1),
      newBlock,
      ...document.blocks.slice(afterIndex + 1),
    ];

    updateDocument(document.id, { blocks: newBlocks });
    return newBlock.id;
  };

  const deleteBlock = (blockId: string) => {
    // First, try to find and delete as a top-level block
    const isTopLevelBlock = document.blocks.some(b => b.id === blockId);
    if (isTopLevelBlock) {
      if (document.blocks.length > 1) {
        const newBlocks = document.blocks.filter(b => b.id !== blockId);
        updateDocument(document.id, { blocks: newBlocks });
        setActiveBlockId(null);
      }
      return;
    }

    // If not a top-level block, it might be a column.
    // Let's find the parent 'columns' block and update it.
    let wasColumnDeleted = false;
    const newBlocks = document.blocks.flatMap(block => {
      if (block.type === 'columns' && block.columns) {
        const originalColumnCount = block.columns.length;
        const updatedColumns = block.columns.filter(col => col.id !== blockId);
        
        if (updatedColumns.length < originalColumnCount) {
          wasColumnDeleted = true;

          // If all columns are deleted, remove the parent 'columns' block
          if (updatedColumns.length === 0) {
            return []; // flatMap will remove this block
          }

          // If one column is left, unwrap it. Replace 'columns' block with the remaining column.
          if (updatedColumns.length === 1) {
            return [updatedColumns[0]]; // return the single column as a top-level block
          }

          // Otherwise, update the columns block with the remaining columns
          return [{ ...block, columns: updatedColumns }];
        }
      }
      return [block]; // keep block as is
    });

    if (wasColumnDeleted) {
      // If we're left with no blocks at all after deletion, re-add an empty paragraph
      if (newBlocks.length === 0) {
        const newBlock: Block = {
          id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'paragraph',
          content: '',
        };
        updateDocument(document.id, { blocks: [newBlock] });
      } else {
        updateDocument(document.id, { blocks: newBlocks });
      }
      setActiveBlockId(null);
    }
  };

  const focusBlock = (blockId: string, atEnd = false) => {
    setTimeout(() => {
      const element = blockRefs.current[blockId];
      if (element) {
        element.focus();
        if (atEnd) {
          // Move cursor to end
          const selection = window.getSelection();
          if (selection) {
            selection.selectAllChildren(element);
            selection.collapseToEnd();
          }
        }
      }
    }, 0);
  };

  const preserveCursorPosition = (element: HTMLElement, callback: () => void) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      callback();
      return;
    }

    // Save cursor position
    const range = selection.getRangeAt(0);
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;

    callback();

    // Restore cursor position
    setTimeout(() => {
      try {
        const newRange = window.document.createRange();
        newRange.setStart(startContainer, Math.min(startOffset, startContainer.textContent?.length || 0));
        newRange.setEnd(endContainer, Math.min(endOffset, endContainer.textContent?.length || 0));
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (e) {
        // If we can't restore the exact position, just focus the element
        element.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    const block = document.blocks.find(b => b.id === blockId);
    if (!block) return;

    // Handle predictive text navigation
    if (predictiveState.isVisible) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateSuggestions('up');
        return;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSuggestions('down');
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selectedSuggestion = getSelectedSuggestion();
        if (selectedSuggestion) {
          const element = blockRefs.current[blockId];
          if (element && replaceCurrentWord(element, selectedSuggestion.text)) {
            selectSuggestion(selectedSuggestion);
            // Update block content after replacement
            const newContent = element.textContent || '';
            updateBlock(blockId, { content: newContent });
          }
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        hideSuggestions();
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      hideSuggestions(); // Hide suggestions when creating new block
      if (block.type === 'list') {
        if (block.content === '') {
          // Convert empty list item to paragraph on Enter
          updateBlock(blockId, { type: 'paragraph', listType: undefined });
          focusBlock(blockId);
        } else {
          // Create a new list item
          const newBlockId = addBlock(blockId, 'list');
          focusBlock(newBlockId);
        }
      } else {
        const newBlockId = addBlock(blockId, 'paragraph');
        focusBlock(newBlockId);
      }
    } else if (e.key === 'Backspace' && block.content === '') {
      e.preventDefault();
      hideSuggestions();
      deleteBlock(blockId);
      // Focus previous block
      const currentIndex = document.blocks.findIndex(b => b.id === blockId);
      if (currentIndex > 0) {
        const prevBlock = document.blocks[currentIndex - 1];
        focusBlock(prevBlock.id, true);
      }
    } else if (e.key === '/' && block.content === '') {
      e.preventDefault();
      hideSuggestions();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setSlashPosition({ x: rect.left, y: rect.bottom + 5 });
      setShowSlashCommand(true);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLElement>, blockId: string) => {
    const content = e.currentTarget.textContent || '';
    const element = e.currentTarget;
    
    preserveCursorPosition(element, () => {
      updateBlock(blockId, { content });
    });
    
    // Predictive text suggestions
    const currentWord = getCurrentWord(element);
    if (currentWord && currentWord.word.length >= 2 && isAtWordEnd(element)) {
      const position = getCursorPosition(element);
      const context = getSurroundingContext(element);
      updateSuggestions(currentWord.word, context, position);
    } else {
      hideSuggestions();
    }
    
    // Enhanced spell check with debouncing
    if (isSpellCheckEnabled && content.trim()) {
      if (spellCheckTimeoutRef.current) {
        clearTimeout(spellCheckTimeoutRef.current);
      }
      
      spellCheckTimeoutRef.current = setTimeout(() => {
        checkText(content);
      }, 500); // Debounce spell check by 500ms
    }
  };

  const handleSlashCommand = (type: Block['type']) => {
    if (activeBlockId) {
      updateBlock(activeBlockId, { type, level: type === 'heading' ? 1 : undefined });
    }
    setShowSlashCommand(false);
  };

  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Calculate toolbar dimensions (approximate)
      const toolbarHeight = 50;
      const spacing = 10;
      
      // Check if there's enough space above the selection
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let toolbarY;
      if (spaceAbove >= toolbarHeight + spacing) {
        // Position above with spacing
        toolbarY = rect.top - toolbarHeight - spacing;
      } else {
        // Position below with spacing
        toolbarY = rect.bottom + spacing;
      }
      
      setToolbarPosition({ 
        x: rect.left + rect.width / 2, 
        y: toolbarY
      });
      setShowFloatingToolbar(true);
    } else {
      setShowFloatingToolbar(false);
    }
  };

  // Handle selection changes globally
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setShowFloatingToolbar(false);
      }
    };

    window.document.addEventListener('selectionchange', handleSelectionChange);
    return () => window.document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const formatText = (command: string, value?: string) => {
    window.document.execCommand(command, false, value);
    handleTextSelect(); // Update toolbar position
  };

  // Enhanced spell check context menu handlers
  const handleSpellCheckContextMenu = (e: React.MouseEvent, blockId: string) => {
    if (!isSpellCheckEnabled) return;
    
    const target = e.target as HTMLElement;
    const errorSpan = target.closest('.spell-error, .grammar-error, .context-error');
    
    if (errorSpan) {
      e.preventDefault();
      
      try {
        const errorData = JSON.parse(errorSpan.getAttribute('data-error') || '{}');
        setSpellCheckContextMenu({
          error: errorData,
          position: { x: e.clientX, y: e.clientY },
          blockId
        });
      } catch (error) {
        console.error('Error parsing spell check data:', error);
      }
    }
  };

  const handleSpellCheckSuggestion = (suggestion: string) => {
    if (!spellCheckContextMenu) return;
    
    const { error, blockId } = spellCheckContextMenu;
    const block = document.blocks.find(b => b.id === blockId) || 
                  document.blocks.flatMap(b => b.columns || []).find(c => c.id === blockId);
    
    if (block) {
      const newContent = applySuggestion(error, suggestion, block.content);
      updateBlock(blockId, { content: newContent });
    }
    
    setSpellCheckContextMenu(null);
  };

  const handleSpellCheckIgnore = () => {
    setSpellCheckContextMenu(null);
  };

  const handleSpellCheckClose = () => {
    setSpellCheckContextMenu(null);
  };

  // Drag and drop functions for move mode
  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newBlocks = [...document.blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    
    updateDocument(document.id, { blocks: newBlocks });
  };

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    if (!isMoveMode) {
      e.preventDefault();
      return;
    }
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);
  };

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    if (!isMoveMode || !draggedBlock) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverBlock(blockId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isMoveMode) return;
    setDragOverBlock(null);
  };

  const handleDrop = (e: React.DragEvent, targetBlockId: string) => {
    if (!isMoveMode || !draggedBlock) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    
    const fromIndex = document.blocks.findIndex(b => b.id === draggedBlock);
    const toIndex = document.blocks.findIndex(b => b.id === targetBlockId);
    
    if (fromIndex !== -1 && toIndex !== -1) {
      moveBlock(fromIndex, toIndex);
    }
    
    setDraggedBlock(null);
    setDragOverBlock(null);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
    setDragOverBlock(null);
  };

  const getBlockContainerClass = (type: Block['type']) => {
    switch (type) {
      case 'heading':
        return 'bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 rounded-lg p-4 mb-4 shadow-sm';
      case 'quote':
        return 'bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 shadow-sm';
      case 'code':
        return 'bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4 shadow-sm';
      case 'list':
        return 'bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 shadow-sm ml-4';
      case 'columns':
        return 'bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-lg p-4 mb-4 shadow-sm';
      case 'textbox':
        return 'bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-4 mb-4 shadow-sm';
      default: // paragraph
        return 'bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow';
    }
  };

  const renderColumnContent = (column: Block) => {
    const isActive = activeBlockId === column.id;
    const isEmpty = !column.content || column.content.trim() === '';
    
    const commonProps = {
      'data-block-id': column.id,
      ref: (el: HTMLElement | null) => {
        if (el) {
          blockRefs.current[column.id] = el;
        }
      },
      contentEditable: true,
      suppressContentEditableWarning: true,
      onFocus: () => setActiveBlockId(column.id),
      onBlur: () => setActiveBlockId(null),
      onInput: (e: React.FormEvent<HTMLElement>) => handleInput(e, column.id),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, column.id),
      onMouseUp: handleTextSelect,
      onKeyUp: handleTextSelect,
      onContextMenu: (e: React.MouseEvent) => handleSpellCheckContextMenu(e, column.id),
      className: `block-content outline-none ${isActive ? 'ring-2 ring-orange-300' : ''}`,
      style: {
        fontFamily: column.style?.fontFamily || document.globalStyles?.fontFamily || 'Inter',
        fontSize: `${column.style?.fontSize || document.globalStyles?.fontSize || 16}px`,
        fontWeight: column.style?.fontWeight || 400,
        color: column.style?.color || '#000000',
        textAlign: column.style?.textAlign || 'left',
        lineHeight: document.globalStyles?.lineHeight || 1.6,
        minHeight: '3em',
      },
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 min-h-[100px]">
        <p
          {...commonProps}
          data-placeholder={isEmpty ? 'Type in this column...' : undefined}
        >
          {column.content}
        </p>
      </div>
    );
  };

  const renderBlock = (block: Block) => {
    const isActive = activeBlockId === block.id;
    const isEmpty = !block.content || block.content.trim() === '';
    
    const commonProps = {
      'data-block-id': block.id,
      ref: (el: HTMLElement | null) => {
        if (el) {
          blockRefs.current[block.id] = el;
        }
      },
      contentEditable: true,
      suppressContentEditableWarning: true,
      onFocus: () => setActiveBlockId(block.id),
      onBlur: () => setActiveBlockId(null),
      onInput: (e: React.FormEvent<HTMLElement>) => handleInput(e, block.id),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id),
      onMouseUp: handleTextSelect,
      onKeyUp: handleTextSelect,
      onContextMenu: (e: React.MouseEvent) => handleSpellCheckContextMenu(e, block.id),
      className: `block-content outline-none ${isActive ? 'ring-2 ring-orange-300' : ''}`,
      style: {
        fontFamily: block.style?.fontFamily || document.globalStyles?.fontFamily || 'Inter',
        fontSize: `${block.style?.fontSize || document.globalStyles?.fontSize || 16}px`,
        fontWeight: block.style?.fontWeight || 400,
        color: block.style?.color || '#000000',
        textAlign: block.style?.textAlign || 'left',
        lineHeight: document.globalStyles?.lineHeight || 1.6,
        minHeight: '1.5em',
      },
    };

    const placeholder = block.type === 'paragraph' ? 'Type something...' : 
                      block.type === 'heading' ? 'Heading...' :
                      block.type === 'quote' ? 'Quote...' :
                      block.type === 'code' ? 'Code...' :
                      block.type === 'list' ? 'List item...' :
                      block.type === 'textbox' ? 'Text box content...' : '';

    const containerClass = getBlockContainerClass(block.type);
    
    // Drag and drop props for move mode
    const dragProps = isMoveMode ? {
      draggable: true,
      onDragStart: (e: React.DragEvent) => handleDragStart(e, block.id),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, block.id),
      onDragLeave: handleDragLeave,
      onDrop: (e: React.DragEvent) => handleDrop(e, block.id),
      onDragEnd: handleDragEnd,
    } : {};

    // Visual feedback for drag and drop
    const isDragging = draggedBlock === block.id;
    const isDragOver = dragOverBlock === block.id;
    const moveClassNames = isMoveMode ? 
      `transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : ''} ${isDragOver ? 'border-primary border-2 transform scale-105' : ''}` 
      : '';

    if (block.type === 'columns' && block.columns) {
      return (
        <div 
          key={block.id} 
          className={`${containerClass} ${moveClassNames}`}
          {...dragProps}
        >
          <ResizablePanelGroup direction="horizontal" className="min-h-[150px]">
            {block.columns.map((column, index) => (
              <React.Fragment key={column.id}>
                <ResizablePanel defaultSize={50}>
                  {renderColumnContent(column)}
                </ResizablePanel>
                {index < block.columns!.length - 1 && (
                  <ResizableHandle withHandle />
                )}
              </React.Fragment>
            ))}
          </ResizablePanelGroup>
        </div>
      );
    }

    if (block.type === 'textbox') {
      return (
        <div 
          key={block.id} 
          className={`${containerClass} ${moveClassNames}`}
          {...dragProps}
        >
          <div className="bg-white border border-purple-300 rounded-lg p-4 shadow-inner">
            <p
              {...commonProps}
              data-placeholder={isEmpty ? placeholder : undefined}
            >
              {block.content}
            </p>
          </div>
        </div>
      );
    }

    switch (block.type) {
      case 'heading':
        const level = block.level || 1;
        const headingClassName = `${commonProps.className} font-bold ${
          level === 1 ? 'text-2xl' :
          level === 2 ? 'text-3xl' :
          level === 3 ? 'text-4xl' :
          'text-lg'
        }`;

        // Create a separate props object for headings to override font size and weight from global styles
        const { style: commonStyle, ...restCommonProps } = commonProps;
        const { fontSize, fontWeight, ...headingStyle } = commonStyle || {};
        const headingProps = { ...restCommonProps, style: headingStyle };

        return (
          <div 
            key={block.id} 
            className={`${containerClass} ${moveClassNames}`}
            {...dragProps}
          >
            {level === 1 && (
              <h1
                {...headingProps}
                className={headingClassName}
                data-placeholder={isEmpty ? placeholder : undefined}
              >
                {block.content}
              </h1>
            )}
            {level === 2 && (
              <h2
                {...headingProps}
                className={headingClassName}
                data-placeholder={isEmpty ? placeholder : undefined}
              >
                {block.content}
              </h2>
            )}
            {level === 3 && (
              <h3
                {...headingProps}
                className={headingClassName}
                data-placeholder={isEmpty ? placeholder : undefined}
              >
                {block.content}
              </h3>
            )}
            {level === 4 && (
              <h4
                {...headingProps}
                className={headingClassName}
                data-placeholder={isEmpty ? placeholder : undefined}
              >
                {block.content}
              </h4>
            )}
            {level === 5 && (
              <h5
                {...headingProps}
                className={headingClassName}
                data-placeholder={isEmpty ? placeholder : undefined}
              >
                {block.content}
              </h5>
            )}
            {level === 6 && (
              <h6
                {...headingProps}
                className={headingClassName}
                data-placeholder={isEmpty ? placeholder : undefined}
              >
                {block.content}
              </h6>
            )}
          </div>
        );
      
      case 'quote':
        return (
          <div 
            key={block.id} 
            className={`${containerClass} ${moveClassNames}`}
            {...dragProps}
          >
            <blockquote
              {...commonProps}
              className={`${commonProps.className} border-l-4 border-slate-400 pl-4 italic text-slate-700`}
              data-placeholder={isEmpty ? placeholder : undefined}
            >
              {block.content}
            </blockquote>
          </div>
        );
      
      case 'code':
        return (
          <div 
            key={block.id} 
            className={`${containerClass} ${moveClassNames}`}
            {...dragProps}
          >
            <pre
              {...commonProps}
              className={`${commonProps.className} font-mono text-sm text-green-400 overflow-x-auto`}
              style={{ ...commonProps.style, color: '#4ade80' }}
              data-placeholder={isEmpty ? placeholder : undefined}
            >
              {block.content}
            </pre>
          </div>
        );
      
      case 'list':
        const listClassName = block.listType === 'ordered'
          ? `${commonProps.className} list-decimal ml-4`
          : `${commonProps.className} list-disc ml-4`;
        
        return (
          <li
            key={block.id}
            {...commonProps}
            className={commonProps.className}
            data-placeholder={isEmpty ? placeholder : undefined}
          >
            {block.content}
          </li>
        );
      
      default: // paragraph
        return (
          <div 
            key={block.id} 
            className={`${containerClass} ${moveClassNames}`}
            {...dragProps}
          >
            <p
              {...commonProps}
              data-placeholder={isEmpty ? placeholder : undefined}
            >
              {block.content}
            </p>
          </div>
        );
    }
  };

  // Apply global styles to the editor container
  const editorStyle = {
    maxWidth: `${document.globalStyles?.maxWidth || 800}px`,
    fontFamily: document.globalStyles?.fontFamily || 'Inter',
    fontSize: `${document.globalStyles?.fontSize || 16}px`,
    lineHeight: document.globalStyles?.lineHeight || 1.6,
  };

  const handleDeleteActiveBlock = () => {
    if (activeBlockId) {
      deleteBlock(activeBlockId);
    }
  };

  const isColumnSelected = activeBlockId ? document.blocks.some(b => b.type === 'columns' && b.columns?.some(c => c.id === activeBlockId)) : false;

  const canDelete = !!activeBlockId && (isColumnSelected || document.blocks.length > 1);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 to-white ${isMoveMode ? 'cursor-move' : ''}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 pb-40 sm:pb-32" data-document-content>
        <div
          ref={editorRef}
          className="prose prose-lg max-w-none"
          style={editorStyle}
          onClick={(e) => {
            // Clear selection when clicking outside blocks
            if (e.target === e.currentTarget) {
              setShowFloatingToolbar(false);
            }
          }}
        >
          <style>
            {`
              [contenteditable][data-placeholder]:empty::before {
                content: attr(data-placeholder);
                color: #94a3b8;
                font-style: italic;
              }
              [contenteditable]:focus[data-placeholder]:empty::before {
                content: attr(data-placeholder);
                color: #cbd5e1;
              }
            `}
          </style>
          {(() => {
            const output = [];
            let i = 0;
            while (i < document.blocks.length) {
              const currentBlock = document.blocks[i];
              if (currentBlock.type === 'list') {
                const listGroup = [];
                const listType = currentBlock.listType;
                const firstListBlockId = currentBlock.id;

                while (
                  i < document.blocks.length &&
                  document.blocks[i].type === 'list' &&
                  document.blocks[i].listType === listType
                ) {
                  listGroup.push(document.blocks[i]);
                  i++;
                }

                const ListTag = listType === 'ordered' ? 'ol' : 'ul';
                const containerClass = getBlockContainerClass('list');
                const listClassName = listType === 'ordered' ? 'list-decimal ml-5' : 'list-disc ml-5';
                
                // Drag and drop props for list groups
                const listDragProps = isMoveMode ? {
                  draggable: true,
                  onDragStart: (e: React.DragEvent) => handleDragStart(e, firstListBlockId),
                  onDragOver: (e: React.DragEvent) => handleDragOver(e, firstListBlockId),
                  onDragLeave: handleDragLeave,
                  onDrop: (e: React.DragEvent) => handleDrop(e, firstListBlockId),
                  onDragEnd: handleDragEnd,
                } : {};

                // Visual feedback for list group drag and drop
                const isListDragging = draggedBlock === firstListBlockId;
                const isListDragOver = dragOverBlock === firstListBlockId;
                const listMoveClassNames = isMoveMode ? 
                  `transition-all duration-200 ${isListDragging ? 'opacity-50 scale-95' : ''} ${isListDragOver ? 'border-primary border-2 transform scale-105' : ''}` 
                  : '';

                output.push(
                  <div 
                    key={`list-group-${firstListBlockId}`} 
                    className={`${containerClass} ${listMoveClassNames}`}
                    {...listDragProps}
                  >
                    <ListTag className={listClassName}>
                      {listGroup.map(block => renderBlock(block))}
                    </ListTag>
                  </div>
                );
              } else {
                output.push(renderBlock(currentBlock));
                i++;
              }
            }
            return output;
          })()}
        </div>
      </div>

      {/* Floating Toolbar */}
      {showFloatingToolbar && (
        <FloatingToolbar
          position={toolbarPosition}
          onFormat={formatText}
          onClose={() => setShowFloatingToolbar(false)}
        />
      )}

      {/* Slash Command Menu */}
      {showSlashCommand && (
        <SlashCommand
          position={slashPosition}
          onSelect={handleSlashCommand}
          onClose={() => setShowSlashCommand(false)}
        />
      )}

      {/* Floating Style Toolbar */}
      <FloatingStyleToolbar
        document={document}
        onDelete={handleDeleteActiveBlock}
        canDelete={canDelete}
      />

      {/* Spell Check Context Menu */}
      {spellCheckContextMenu && (
        <SpellCheckContextMenu
          error={spellCheckContextMenu.error}
          position={spellCheckContextMenu.position}
          onSuggestionClick={handleSpellCheckSuggestion}
          onIgnore={handleSpellCheckIgnore}
          onClose={handleSpellCheckClose}
        />
      )}

      {/* Predictive Text Dropdown */}
      {predictiveState.isVisible && (
        <PredictiveTextDropdown
          suggestions={predictiveState.suggestions}
          position={predictiveState.cursorPosition}
          selectedIndex={predictiveState.selectedIndex}
          onSelect={(suggestion) => {
            if (activeBlockId) {
              const element = blockRefs.current[activeBlockId];
              if (element && replaceCurrentWord(element, suggestion.text)) {
                selectSuggestion(suggestion);
                // Update block content after replacement
                const newContent = element.textContent || '';
                updateBlock(activeBlockId, { content: newContent });
              }
            }
          }}
          onClose={hideSuggestions}
        />
      )}
    </div>
  );
};

export default BlockEditor;
