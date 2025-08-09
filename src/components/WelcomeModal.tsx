import React, { useState, useEffect } from 'react';
import { 
  Hand, 
  Type, 
  Hash, 
  List, 
  Code, 
  Columns2, 
  Paintbrush, 
  Rocket, 
  Command, 
  Move, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 w-full">
        <div className="bg-background rounded-xl shadow-strong border animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="text-3xl">
                <Hand className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Let's Take a Quick Tour</h1>
                <p className="text-muted-foreground">Discover the powerful features of your document editor</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-8">
            {/* Welcome Message */}
            <Card className="border-primary/20 bg-secondary/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs">⚠️</span>
                  </div>
                  <span className="text-sm font-medium">Welcome to your Document Editor!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This is a powerful block-based editor. Get started with the features below and back up your docs frequently.
                </p>
              </CardContent>
            </Card>

            {/* Build Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <Type className="w-6 h-6" />
                Build
              </h2>
              <p className="text-foreground leading-relaxed">
                Unlike traditional word processors, documents are built by combining different content blocks.
              </p>
              <p className="text-foreground leading-relaxed">
                Blocks can be added by dragging them in from the{' '}
                <span className="font-semibold">Toolbar</span> at the bottom of the screen
                or by using the{' '}
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Ctrl</kbd>{' '}
                <span className="font-semibold">+</span>{' '}
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">K</kbd>{' '}
                keyboard shortcut.
              </p>
              <p className="text-foreground leading-relaxed">
                Blocks can be rearranged by entering Move Mode through the{' '}
                <span className="font-semibold">Move Button</span> next to the toolbar or by holding down the{' '}
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Alt Key</kbd>.
              </p>
              
              {/* Block Types */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Type className="w-5 h-5 text-primary" />
                  <span className="text-sm">Paragraphs</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Hash className="w-5 h-5 text-primary" />
                  <span className="text-sm">Headings</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <List className="w-5 h-5 text-primary" />
                  <span className="text-sm">Lists</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Code className="w-5 h-5 text-primary" />
                  <span className="text-sm">Code</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Columns2 className="w-5 h-5 text-primary" />
                  <span className="text-sm">Columns</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Command className="w-5 h-5 text-primary" />
                  <span className="text-sm">Command</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Move className="w-5 h-5 text-primary" />
                  <span className="text-sm">Move Mode</span>
                </div>
              </div>
            </div>

            {/* Style Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <Paintbrush className="w-6 h-6" />
                Style
              </h2>
              <p className="text-foreground leading-relaxed">
                Your editor provides a powerful Style Editor to change how a document looks and feels.
                Styles can apply to part of a block of text, the whole block, or (by clicking the{' '}
                <span className="font-semibold">Tick</span>) every block of the same type.
              </p>
              <p className="text-foreground leading-relaxed">
                The Style Editor can be opened by clicking the{' '}
                <span className="font-semibold">Paint Brush</span> in the sidebar on the left.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary">Quick Actions</h2>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <kbd className="px-2 py-1 bg-background border rounded text-sm font-mono">Ctrl + K</kbd>
                  <span className="text-sm">Open command palette to add blocks</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <kbd className="px-2 py-1 bg-background border rounded text-sm font-mono">Alt + Hold</kbd>
                  <span className="text-sm">Enter move mode to rearrange blocks</span>
                </div>
              </div>
            </div>

            {/* Get Started Button */}
            <div className="flex justify-center pt-4">
              <Button onClick={onClose} size="lg" className="px-8">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;