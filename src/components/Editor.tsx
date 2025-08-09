import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuments, Block } from '../contexts/DocumentContext';
import EditorSidebar from './EditorSidebar';
import BlockEditor from './BlockEditor';
import CommandPalette from './CommandPalette';
import WelcomeModal from './WelcomeModal';
import { toast } from '@/hooks/use-toast';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { documents, currentDocument, setCurrentDocument, createDocument, updateDocument } = useDocuments();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);

  // Check if it's first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedEditor');
    if (!hasVisited) {
      setIsWelcomeModalOpen(true);
    }
  }, []);

  const handleWelcomeClose = () => {
    setIsWelcomeModalOpen(false);
    localStorage.setItem('hasVisitedEditor', 'true');
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('KeyDown event:', {
        key: e.key,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        currentMoveMode: isMoveMode
      });

      // Ctrl+K for command palette
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        console.log('Opening command palette');
        setIsCommandPaletteOpen(true);
      }
      
      // Alt key hold for move mode
      if (e.altKey && !isMoveMode) {
        console.log('Entering move mode');
        setIsMoveMode(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      console.log('KeyUp event:', {
        key: e.key,
        altKey: e.altKey,
        currentMoveMode: isMoveMode
      });

      // Exit move mode when Alt key is released
      if (!e.altKey && isMoveMode) {
        console.log('Exiting move mode');
        setIsMoveMode(false);
      }
    };

    console.log('Adding keyboard event listeners');
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      console.log('Removing keyboard event listeners');
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMoveMode]);

  // Handle adding new blocks from command palette
  const handleCommandSelect = (type: Block['type'], options: any = {}) => {
    if (!currentDocument) return;

    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      content: '',
      ...options,
    };

    // Special handling for columns
    if (type === 'columns') {
      newBlock.columns = [
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
      ];
    }

    const newBlocks = [...currentDocument.blocks, newBlock];
    updateDocument(currentDocument.id, { blocks: newBlocks });
  };

  useEffect(() => {
    if (id) {
      const doc = documents.find(d => d.id === id);
      if (doc) {
        setCurrentDocument(doc);
      } else {
        // Document not found, redirect to dashboard
        navigate('/');
        toast({
          title: "Document not found",
          description: "The requested document could not be found.",
          variant: "destructive",
        });
      }
    } else {
      // Create new document if no ID provided
      const newDoc = createDocument();
      setCurrentDocument(newDoc);
      navigate(`/editor/${newDoc.id}`, { replace: true });
    }
  }, [id, documents, setCurrentDocument, navigate, createDocument]);

  if (!currentDocument) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Floating Icons */}
      <EditorSidebar 
        document={currentDocument}
      />

      {/* Main Editor Area - Full width since no traditional sidebar */}
      <div className="flex-1">
        <BlockEditor document={currentDocument} isMoveMode={isMoveMode} />
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelect={handleCommandSelect}
      />

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={handleWelcomeClose}
      />
    </div>
  );
};

export default Editor;
