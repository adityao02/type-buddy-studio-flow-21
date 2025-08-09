
import React from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingToolbarProps {
  position: { x: number; y: number };
  onFormat: (command: string, value?: string) => void;
  onClose: () => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ position, onFormat, onClose }) => {
  return (
    <div
      className="fixed z-50 bg-orange-500 text-white rounded-full shadow-strong border border-orange-300 p-2 flex items-center gap-1 animate-scale-in floating-toolbar"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onFormat('bold')}
        className="text-white hover:bg-orange-600 h-8 w-8 rounded-full"
      >
        <Bold className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onFormat('italic')}
        className="text-white hover:bg-orange-600 h-8 w-8 rounded-full"
      >
        <Italic className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onFormat('underline')}
        className="text-white hover:bg-orange-600 h-8 w-8 rounded-full"
      >
        <Underline className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default FloatingToolbar;
