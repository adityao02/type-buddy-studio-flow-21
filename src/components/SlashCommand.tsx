
import React from 'react';
import { Type, Quote, Code, List, Hash } from 'lucide-react';
import { Block } from '../contexts/DocumentContext';

interface SlashCommandProps {
  position: { x: number; y: number };
  onSelect: (type: Block['type']) => void;
  onClose: () => void;
}

const SlashCommand: React.FC<SlashCommandProps> = ({ position, onSelect, onClose }) => {
  const commands = [
    { type: 'paragraph' as Block['type'], label: 'Paragraph', icon: Type, description: 'Just start writing with plain text.' },
    { type: 'heading' as Block['type'], label: 'Heading', icon: Hash, description: 'Big section heading.' },
    { type: 'quote' as Block['type'], label: 'Quote', icon: Quote, description: 'Capture a quote.' },
    { type: 'list' as Block['type'], label: 'Bulleted list', icon: List, description: 'Create a simple bulleted list.' },
    { type: 'code' as Block['type'], label: 'Code', icon: Code, description: 'Capture a code snippet.' },
  ];

  React.useEffect(() => {
    const handleClickOutside = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-strong border border-slate-200 py-2 w-80 animate-scale-in"
      style={{
        left: position.x,
        top: position.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {commands.map((command) => (
        <button
          key={command.type}
          onClick={() => onSelect(command.type)}
          className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-start gap-3"
        >
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mt-0.5">
            <command.icon className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-slate-900">{command.label}</div>
            <div className="text-sm text-slate-500">{command.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SlashCommand;
