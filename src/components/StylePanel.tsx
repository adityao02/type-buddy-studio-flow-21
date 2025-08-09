import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDocuments, Document } from '../contexts/DocumentContext';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";

// Define a more complete style type to avoid TypeScript errors,
// since we cannot modify the original type in DocumentContext.
interface BlockStyle {
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: "center" | "left" | "right" | "justify";
  fontFamily?: string;
  fontStyle?: "italic" | "normal";
  textDecoration?: string;
}

interface StylePanelProps {
  document: Document;
}

const StylePanel: React.FC<StylePanelProps> = ({ document }) => {
  const { updateDocument } = useDocuments();
  const [selectedElement, setSelectedElement] = useState<string>('page');

  const selectedBlock = selectedElement !== 'page' 
    ? document.blocks.find(block => block.id === selectedElement)
    : null;

  const updateGlobalStyle = (key: string, value: any) => {
    const newGlobalStyles = {
      ...document.globalStyles,
      [key]: value,
    };
    updateDocument(document.id, { globalStyles: newGlobalStyles });
  };

  const updateBlockStyle = (blockId: string, styleKey: string, value: any) => {
    const newBlocks = document.blocks.map(block => 
      block.id === blockId 
        ? {
            ...block,
            style: {
              ...block.style,
              [styleKey]: value,
            }
          }
        : block
    );
    updateDocument(document.id, { blocks: newBlocks });
  };

  const fontFamilies = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  ];

  return (
    <div className="p-2 space-y-4">
      {/* Elements */}
      <div className="space-y-2 px-2 pt-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Elements
        </h3>
        <div className="p-1 bg-slate-100 rounded-lg">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1">
            <Button
              size="sm"
              onClick={() => setSelectedElement('page')}
              className={`flex-1 justify-center text-slate-700 h-8 min-w-max px-3 transition-colors ${selectedElement === 'page' ? 'bg-white shadow-sm hover:bg-white' : 'bg-transparent hover:bg-slate-200'}`}
            >
              Page
            </Button>
            {document.blocks.map((block, index) => (
              <Button
                key={block.id}
                size="sm"
                onClick={() => setSelectedElement(block.id)}
                className={`flex-1 justify-center text-slate-700 h-8 min-w-max px-3 transition-colors ${selectedElement === block.id ? 'bg-white shadow-sm hover:bg-white' : 'bg-transparent hover:bg-slate-200'}`}
              >
                {block.type === 'heading' ? `H${block.level || 1}` : 
                block.type.charAt(0).toUpperCase() + block.type.slice(1)} {index + 1}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {selectedBlock ? (
        /* Block-specific styles */
        <div className="space-y-4 px-3 pb-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Font
          </h3>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Font Size</span>
            <span className="text-slate-800 font-medium">{selectedBlock.style?.fontSize || '16'}px</span>
          </div>
          <Slider
              value={[selectedBlock.style?.fontSize || 16]}
              onValueChange={([value]) => updateBlockStyle(selectedBlock.id, 'fontSize', value)}
              max={48} min={12} step={1}
          />
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Typeface</span>
            <Select
              value={selectedBlock.style?.fontFamily || 'Inter'}
              onValueChange={(value) => updateBlockStyle(selectedBlock.id, 'fontFamily', value)}
            >
              <SelectTrigger className="w-[150px] h-8 text-sm focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Weight</span>
            <span className="text-slate-800 font-medium">{selectedBlock.style?.fontWeight || '400'}</span>
          </div>
          <Slider
            value={[selectedBlock.style?.fontWeight || 400]}
            onValueChange={([value]) => updateBlockStyle(selectedBlock.id, 'fontWeight', value)}
            max={900} min={100} step={100}
          />
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-600">Color</label>
            <div className="w-24 h-8 rounded-md border border-slate-200 overflow-hidden">
              <input
                type="color"
                value={selectedBlock.style?.color || '#000000'}
                onChange={(e) => updateBlockStyle(selectedBlock.id, 'color', e.target.value)}
                className="w-full h-full border-none cursor-pointer bg-transparent p-0"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 border-t pt-4 mt-4">
            <ToggleGroup type="single" size="sm" value={(selectedBlock.style as BlockStyle)?.fontStyle === 'italic' ? 'italic' : ''} onValueChange={(v) => updateBlockStyle(selectedBlock.id, 'fontStyle', v === 'italic' ? 'italic' : 'normal')}>
              <ToggleGroupItem value="italic" aria-label="Toggle italic"><Italic className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="multiple" size="sm" value={(selectedBlock.style as BlockStyle)?.textDecoration?.split(' ').filter(Boolean) || []} onValueChange={(v) => updateBlockStyle(selectedBlock.id, 'textDecoration', v.join(' '))}>
              <ToggleGroupItem value="underline" aria-label="Toggle underline"><Underline className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="line-through" aria-label="Toggle strikethrough"><Strikethrough className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
            <Separator orientation="vertical" className="h-6" />
            <ToggleGroup type="single" size="sm" defaultValue={selectedBlock.style?.textAlign || 'left'} onValueChange={(v) => v && updateBlockStyle(selectedBlock.id, 'textAlign', v)}>
              <ToggleGroupItem value="left" aria-label="Left aligned"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Center aligned"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Right aligned"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="justify" aria-label="Justify aligned"><AlignJustify className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      ) : (
        /* Global document styles */
        <div className="space-y-4 px-3 pb-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Display</h3>
          <ToggleGroup type="single" defaultValue={document.globalStyles?.maxWidth > 800 ? 'fill' : 'page'} className="grid grid-cols-2 gap-2" onValueChange={(v) => v && updateGlobalStyle('maxWidth', v === 'fill' ? 1200 : 800)}>
            <ToggleGroupItem value="page" aria-label="Page width" className="h-auto flex-col p-2 space-y-1 data-[state=on]:border-primary data-[state=on]:bg-primary/10">
              <div className="w-16 h-12 border-2 border-current rounded"></div>
              <span className="text-xs font-medium">Page Width</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="fill" aria-label="Fill width" className="h-auto flex-col p-2 space-y-1 data-[state=on]:border-primary data-[state=on]:bg-primary/10">
              <div className="w-16 h-12 border-2 border-current border-dashed rounded"></div>
              <span className="text-xs font-medium">Fill Width</span>
            </ToggleGroupItem>
          </ToggleGroup>
          <Separator />
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Spacing</h3>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Line Height</span>
            <span className="text-slate-800 font-medium">{document.globalStyles?.lineHeight || '1.6'}</span>
          </div>
          <Slider value={[document.globalStyles?.lineHeight || 1.6]} onValueChange={([v]) => updateGlobalStyle('lineHeight', v)} max={3} min={1} step={0.1} />
        </div>
      )}
    </div>
  );
};

export default StylePanel;
