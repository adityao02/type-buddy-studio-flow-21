import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SpellCheck2, AlertTriangle, Info } from 'lucide-react';

interface SpellCheckError {
  word: string;
  suggestions: string[];
  startIndex: number;
  endIndex: number;
  type: 'spelling' | 'grammar' | 'context';
  description: string;
}

interface SpellCheckContextMenuProps {
  error: SpellCheckError;
  position: { x: number; y: number };
  onSuggestionClick: (suggestion: string) => void;
  onIgnore: () => void;
  onClose: () => void;
}

const SpellCheckContextMenu: React.FC<SpellCheckContextMenuProps> = ({
  error,
  position,
  onSuggestionClick,
  onIgnore,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getErrorIcon = () => {
    switch (error.type) {
      case 'spelling':
        return <SpellCheck2 className="w-4 h-4 text-red-500" />;
      case 'grammar':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'context':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <SpellCheck2 className="w-4 h-4 text-red-500" />;
    }
  };

  const getErrorBadgeColor = () => {
    switch (error.type) {
      case 'spelling':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'grammar':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'context':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  // Calculate menu position to avoid viewport overflow
  const menuStyle = {
    position: 'fixed' as const,
    left: Math.min(position.x, window.innerWidth - 250),
    top: Math.min(position.y, window.innerHeight - 200),
    zIndex: 1000,
    maxWidth: '240px',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'opacity 0.2s ease, transform 0.2s ease'
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[999]"
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <Card className="shadow-lg border-2" style={menuStyle}>
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            {getErrorIcon()}
            <Badge variant="outline" className={getErrorBadgeColor()}>
              {error.type}
            </Badge>
          </div>
          
          {/* Error word */}
          <div className="mb-2">
            <span className="font-medium text-sm text-gray-700">
              "{error.word}"
            </span>
          </div>
          
          {/* Description */}
          <p className="text-xs text-gray-600 mb-3">
            {error.description}
          </p>
          
          <Separator className="mb-3" />
          
          {/* Suggestions */}
          {error.suggestions.length > 0 && (
            <div className="space-y-1 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">
                Suggestions:
              </p>
              {error.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-auto p-2 font-normal text-left hover:bg-blue-50"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  <span className="text-sm">{suggestion}</span>
                </Button>
              ))}
            </div>
          )}
          
          <Separator className="mb-3" />
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onIgnore}
              className="flex-1 text-xs"
            >
              Ignore
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 text-xs"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SpellCheckContextMenu;