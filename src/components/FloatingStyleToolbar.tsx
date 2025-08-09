import React, { useState, useRef } from 'react';
import { Type, Layout, List, Columns2, Text, Quote, Trash, Pilcrow, ListOrdered, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDocuments, Document, Block } from '../contexts/DocumentContext';

interface FloatingStyleToolbarProps {
  document: Document;
  onDelete: () => void;
  canDelete: boolean;
}

const FloatingStyleToolbar: React.FC<FloatingStyleToolbarProps> = ({ document, onDelete, canDelete }) => {
  const { updateDocument } = useDocuments();
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Track if mouse is over the trigger or popover content
  const [triggerHover, setTriggerHover] = useState<string | null>(null);
  const [popoverHover, setPopoverHover] = useState<string | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textOptions = [
    { type: 'paragraph' as Block['type'], label: 'Paragraph', icon: <Pilcrow className="w-4 h-4" /> },
    { type: 'heading' as Block['type'], label: 'Heading 1', icon: 'H1', level: 1 },
    { type: 'heading' as Block['type'], label: 'Heading 2', icon: 'H2', level: 2 },
    { type: 'heading' as Block['type'], label: 'Heading 3', icon: 'H3', level: 3 },
  ];

  const layoutOptions = [
    { type: 'columns' as Block['type'], label: 'Columns', icon: Columns2 },
    { type: 'textbox' as Block['type'], label: 'Text Box', icon: Text },
    { type: 'quote' as Block['type'], label: 'Blockquote', icon: Quote },
  ];

  const listOptions = [
    { type: 'list' as Block['type'], label: 'Bullet List', icon: List, listType: 'bullet' as const },
    { type: 'list' as Block['type'], label: 'Number List', icon: ListOrdered, listType: 'ordered' as const },
  ];

  const styleOptions = [
    { icon: Type, label: 'Text', id: 'text' },
    { icon: Layout, label: 'Layout', id: 'layout' },
    { icon: List, label: 'Lists', id: 'lists' },
  ];

  const handleTextOptionSelect = (type: Block['type'], level?: number) => {
    if (!document) return;

    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      content: '',
      ...(level !== undefined && { level }),
    };
    
    const newBlocks = [...document.blocks, newBlock];
    updateDocument(document.id, { blocks: newBlocks });
    setOpenPopover(null);
  };

  const handleLayoutOptionSelect = (type: Block['type']) => {
    if (!document) return;

    let newBlock: Block;

    if (type === 'columns') {
      newBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'columns',
        content: '',
        columns: [
          {
            id: `col_${Date.now()}_1_${Math.random().toString(36).substr(2, 9)}`,
            type: 'paragraph',
            content: '',
          },
          {
            id: `col_${Date.now()}_2_${Math.random().toString(36).substr(2, 9)}`,
            type: 'paragraph',
            content: '',
          }
        ]
      };
    } else {
      newBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type,
        content: '',
      };
    }
    
    const newBlocks = [...document.blocks, newBlock];
    updateDocument(document.id, { blocks: newBlocks });
    setOpenPopover(null);
  };

  const handleListOptionSelect = (type: Block['type'], listType: 'bullet' | 'ordered') => {
    if (!document) return;

    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      content: '',
      listType,
    };
    
    const newBlocks = [...document.blocks, newBlock];
    updateDocument(document.id, { blocks: newBlocks });
    setOpenPopover(null);
  };

  const handleTriggerEnter = (id: string) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpenPopover(id);
    setTriggerHover(id);
  };
  const handleTriggerLeave = (id: string) => {
    setTriggerHover(null);
    closeTimeout.current = setTimeout(() => {
      // Only close if not hovering popover
      if (popoverHover !== id) setOpenPopover(null);
    }, 170);
  };
  const handlePopoverEnter = (id: string) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setPopoverHover(id);
    setOpenPopover(id);
  };
  const handlePopoverLeave = (id: string) => {
    setPopoverHover(null);
    closeTimeout.current = setTimeout(() => {
      // Only close if not hovering trigger
      if (triggerHover !== id) setOpenPopover(null);
    }, 170);
  };

  return (
    <div className="fixed bottom-8 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-4 sm:px-0">
      <div className="bg-white dark:bg-neutral-800 rounded-full shadow-2xl border border-gray-200 dark:border-neutral-700 px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-2 backdrop-blur-sm max-w-[calc(100vw-2rem)] overflow-x-auto">
        
        {/* Grid Icon for Minimize/Maximize */}
        <div className="relative group flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-12 w-12 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <ChevronRight className="w-5 h-5 sm:w-5 sm:h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5" />
            )}
          </Button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {isMinimized ? 'Expand' : 'Collapse'}
          </div>
        </div>

        {/* Style Options - Show/Hide based on minimized state */}
        {!isMinimized && (
          <div className="flex items-center gap-2 sm:gap-2">
            {styleOptions.map((option) => (
              <div key={option.id} className="relative">
                <Popover open={openPopover === option.id} onOpenChange={() => {}}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-12 w-12 sm:h-12 sm:w-12 rounded-full flex flex-col items-center justify-center gap-1 sm:gap-1 text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                      onMouseEnter={() => handleTriggerEnter(option.id)}
                      onMouseLeave={() => handleTriggerLeave(option.id)}
                    >
                      <option.icon className="w-5 sm:w-5 h-5 sm:h-5" />
                      <span className="text-xs font-medium hidden sm:block">{option.label}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    side="top" 
                    className="w-auto p-2 mb-4 sm:mb-4 z-50 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-xl"
                    onMouseEnter={() => handlePopoverEnter(option.id)}
                    onMouseLeave={() => handlePopoverLeave(option.id)}
                    sideOffset={20}
                  >
                    <div className="flex gap-2 flex-wrap justify-center max-w-xs sm:max-w-none">
                      {option.id === 'text' && textOptions.map((textOption) => (
                        <Button
                          key={`${textOption.type}-${textOption.level || 'default'}`}
                          variant="ghost"
                          size="sm"
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full flex flex-col items-center justify-center gap-1 sm:gap-1 hover:bg-blue-50 dark:hover:bg-neutral-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                          onClick={() => handleTextOptionSelect(textOption.type, textOption.level)}
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              {textOption.icon}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:block">
                            {textOption.label}
                          </span>
                        </Button>
                      ))}
                      {option.id === 'layout' && layoutOptions.map((layoutOption) => (
                        <Button
                          key={layoutOption.type}
                          variant="ghost"
                          size="sm"
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full flex flex-col items-center justify-center gap-1 sm:gap-1 hover:bg-green-50 dark:hover:bg-neutral-700 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200"
                          onClick={() => handleLayoutOptionSelect(layoutOption.type)}
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                            <layoutOption.icon className="w-4 h-4 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:block">
                            {layoutOption.label}
                          </span>
                        </Button>
                      ))}
                      {option.id === 'lists' && listOptions.map((listOption) => (
                        <Button
                          key={`${listOption.type}-${listOption.listType}`}
                          variant="ghost"
                          size="sm"
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full flex flex-col items-center justify-center gap-1 sm:gap-1 hover:bg-yellow-50 dark:hover:bg-neutral-700 hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-200"
                          onClick={() => handleListOptionSelect(listOption.type, listOption.listType)}
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-100 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                            <listOption.icon className="w-4 h-4 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:block">
                            {listOption.label}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ))}
          </div>
        )}
      </div>
       <div className="relative group flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 sm:h-12 sm:w-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-500 shadow-2xl border border-blue-200 hover:bg-blue-100 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 backdrop-blur-sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onDelete}
          disabled={!canDelete}
        >
          <Trash className="w-6 h-6 sm:w-6 sm:h-6" />
        </Button>
         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          Delete
        </div>
      </div>
    </div>
  );
};

export default FloatingStyleToolbar;
