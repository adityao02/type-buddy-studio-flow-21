import React, { useState, useEffect } from 'react';
import { 
  Type, 
  Hash, 
  Quote, 
  List, 
  ListOrdered, 
  Code, 
  Columns2, 
  TextCursorInput, 
  Image, 
  Minus,
  Search
} from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDocuments, Block } from '../contexts/DocumentContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: Block['type'], options?: any) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  const commands = [
    {
      id: 'paragraph',
      type: 'paragraph' as Block['type'],
      title: 'Paragraph',
      description: 'Just start writing with plain text.',
      icon: Type,
      keywords: ['text', 'paragraph', 'p']
    },
    {
      id: 'heading1',
      type: 'heading' as Block['type'],
      title: 'Heading 1',
      description: 'Big section heading.',
      icon: Hash,
      keywords: ['heading', 'h1', 'title'],
      level: 1
    },
    {
      id: 'heading2',
      type: 'heading' as Block['type'],
      title: 'Heading 2',
      description: 'Medium section heading.',
      icon: Hash,
      keywords: ['heading', 'h2', 'subtitle'],
      level: 2
    },
    {
      id: 'heading3',
      type: 'heading' as Block['type'],
      title: 'Heading 3',
      description: 'Small section heading.',
      icon: Hash,
      keywords: ['heading', 'h3'],
      level: 3
    },
    {
      id: 'blockquote',
      type: 'quote' as Block['type'],
      title: 'Blockquote',
      description: 'Capture a quote.',
      icon: Quote,
      keywords: ['quote', 'blockquote', 'citation']
    },
    {
      id: 'bulletlist',
      type: 'list' as Block['type'],
      title: 'Bullet List',
      description: 'Create a simple bulleted list.',
      icon: List,
      keywords: ['list', 'bullet', 'ul'],
      listType: 'bullet'
    },
    {
      id: 'numberlist',
      type: 'list' as Block['type'],
      title: 'Number List',
      description: 'Create a numbered list.',
      icon: ListOrdered,
      keywords: ['list', 'number', 'ordered', 'ol'],
      listType: 'ordered'
    },
    {
      id: 'code',
      type: 'code' as Block['type'],
      title: 'Code',
      description: 'Capture a code snippet.',
      icon: Code,
      keywords: ['code', 'snippet', 'programming']
    },
    {
      id: 'columns',
      type: 'columns' as Block['type'],
      title: 'Columns',
      description: 'Create a two-column layout.',
      icon: Columns2,
      keywords: ['columns', 'layout', 'grid']
    },
    {
      id: 'textbox',
      type: 'textbox' as Block['type'],
      title: 'Text Box',
      description: 'Add a styled text container.',
      icon: TextCursorInput,
      keywords: ['textbox', 'container', 'box']
    }
  ];

  const handleSelect = (command: typeof commands[0]) => {
    const options: any = {};
    if (command.level) options.level = command.level;
    if (command.listType) options.listType = command.listType;
    
    onSelect(command.type, options);
    onClose();
    setSearch('');
  };

  const filteredCommands = commands.filter(command => {
    const searchLower = search.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchLower) ||
      command.description.toLowerCase().includes(searchLower) ||
      command.keywords.some(keyword => keyword.includes(searchLower))
    );
  });

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <Command>
        <CommandInput 
          placeholder="Search for elements..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No elements found.</CommandEmpty>
          <CommandGroup heading="Add Elements">
            {filteredCommands.map((command) => (
              <CommandItem
                key={command.id}
                onSelect={() => handleSelect(command)}
                className="flex items-center gap-3 p-3"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <command.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{command.title}</div>
                  <div className="text-sm text-gray-500">{command.description}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
};

export default CommandPalette;