import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Lightbulb, Type, Target } from 'lucide-react';

interface Suggestion {
  text: string;
  score: number;
  type: 'completion' | 'contextual';
}

interface PredictiveTextDropdownProps {
  suggestions: Suggestion[];
  position: { x: number; y: number };
  selectedIndex: number;
  onSelect: (suggestion: Suggestion) => void;
  onClose: () => void;
}

const PredictiveTextDropdown: React.FC<PredictiveTextDropdownProps> = ({
  suggestions,
  position,
  selectedIndex,
  onSelect,
  onClose
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'completion':
        return <Target className="w-3 h-3 text-blue-500" />;
      case 'contextual':
        return <Lightbulb className="w-3 h-3 text-amber-500" />;
      default:
        return <Target className="w-3 h-3 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'completion':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Complete</Badge>;
      case 'contextual':
        return <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Smart</Badge>;
      default:
        return null;
    }
  };

  if (suggestions.length === 0) return null;

  // Calculate position to avoid viewport overflow
  const dropdownStyle = {
    position: 'fixed' as const,
    left: Math.min(position.x, window.innerWidth - 300),
    top: Math.min(position.y + 25, window.innerHeight - 200),
    zIndex: 1000,
    minWidth: '280px',
    maxWidth: '320px'
  };

  return (
    <Card className="shadow-lg border-2 border-primary/20" style={dropdownStyle} ref={dropdownRef}>
      <CardContent className="p-2">
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-between p-2 rounded-md cursor-pointer transition-all duration-150
                ${index === selectedIndex 
                  ? 'bg-primary/10 border border-primary/30 shadow-sm' 
                  : 'hover:bg-muted/50 border border-transparent'
                }
              `}
              onClick={() => onSelect(suggestion)}
            >
              <div className="flex items-center gap-2 flex-1">
                {getTypeIcon(suggestion.type)}
                <span className="text-sm font-medium text-foreground">
                  {suggestion.text}
                </span>
                {index === selectedIndex && (
                  <Check className="w-3 h-3 text-primary ml-auto" />
                )}
              </div>
              <div className="flex items-center gap-1">
                {getTypeBadge(suggestion.type)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-2 pt-2 border-t border-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press ↑↓ to navigate</span>
            <span>Enter to select</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictiveTextDropdown;