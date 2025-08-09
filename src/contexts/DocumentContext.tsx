
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

export interface Block {
  id: string;
  type: 'heading' | 'paragraph' | 'quote' | 'list' | 'code' | 'columns' | 'textbox';
  content: string;
  level?: number; // for headings
  listType?: 'bullet' | 'ordered'; // for lists
  columns?: Block[]; // for columns layout
  style?: {
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontFamily?: string;
  };
}

export interface Document {
  id: string;
  title: string;
  blocks: Block[];
  createdAt: Date;
  updatedAt: Date;
  globalStyles?: {
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    maxWidth?: number;
  };
}

interface DocumentContextType {
  documents: Document[];
  currentDocument: Document | null;
  createDocument: () => Document;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  setCurrentDocument: (doc: Document | null) => void;
  duplicateDocument: (id: string) => Document | null;
  exportDocument: (id: string, format: 'json' | 'markdown' | 'html' | 'image' | 'text' | 'pdf') => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

const createEmptyDocument = (): Document => ({
  id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  title: 'Untitled',
  blocks: [{
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'paragraph',
    content: '',
  }],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

  // Load documents from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('wrdo_documents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const docs = parsed.map((doc: any) => ({
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        }));
        setDocuments(docs);
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    } else {
      // Create initial document if none exist
      const initialDoc = createEmptyDocument();
      setDocuments([initialDoc]);
    }
  }, []);

  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('wrdo_documents', JSON.stringify(documents));
    }
  }, [documents]);

  const createDocument = (): Document => {
    const newDoc = createEmptyDocument();
    setDocuments(prev => [newDoc, ...prev]);
    return newDoc;
  };

  const updateDocument = (id: string, updates: Partial<Document>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id 
        ? { ...doc, ...updates, updatedAt: new Date() }
        : doc
    ));
    
    if (currentDocument?.id === id) {
      setCurrentDocument(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    if (currentDocument?.id === id) {
      setCurrentDocument(null);
    }
    toast({
      title: "Document deleted",
      description: "The document has been permanently removed.",
    });
  };

  const duplicateDocument = (id: string): Document | null => {
    const original = documents.find(doc => doc.id === id);
    if (!original) return null;

    const duplicate: Document = {
      ...original,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${original.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      blocks: original.blocks.map(block => ({
        ...block,
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })),
    };

    setDocuments(prev => [duplicate, ...prev]);
    toast({
      title: "Document duplicated",
      description: `Created a copy of "${original.title}".`,
    });
    return duplicate;
  };

  const exportDocument = (id: string, format: 'json' | 'markdown' | 'html' | 'image' | 'text' | 'pdf') => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    if (format === 'image' || format === 'pdf') {
      // More comprehensive content targeting
      const contentSelectors = [
        '[data-document-content]',
        '.prose.prose-lg.max-w-4xl.mx-auto',
        '.prose.max-w-4xl.mx-auto',
        '.prose.prose-lg',
        '.prose',
        '.max-w-4xl.mx-auto',
        '.editor-content',
        '[role="textbox"]',
        '.ProseMirror'
      ];
      
      let contentElement: HTMLElement | null = null;
      
      console.log('Looking for document content...');
      
      for (const selector of contentSelectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`Selector "${selector}" found ${elements.length} elements`);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i] as HTMLElement;
          if (element && element.offsetHeight > 100 && element.offsetWidth > 200) {
            console.log(`Found suitable content element with selector: ${selector}`, element);
            contentElement = element;
            break;
          }
        }
        
        if (contentElement) break;
      }

      // Fallback: try to find any element with significant text content
      if (!contentElement) {
        console.log('No content found with selectors, trying fallback...');
        const allElements = document.querySelectorAll('div, article, section, main');
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i] as HTMLElement;
          const textContent = element.textContent?.trim() || '';
          if (textContent.length > 50 && element.offsetHeight > 100 && element.offsetWidth > 200) {
            // Make sure it's not the sidebar or other UI elements
            if (!element.closest('.fixed') && !element.closest('[data-sidebar]') && !element.closest('.z-50')) {
              console.log('Found fallback content element:', element);
              contentElement = element;
              break;
            }
          }
        }
      }

      if (contentElement) {
        console.log('Capturing element:', contentElement);
        
        toast({
          title: format === 'pdf' ? "Exporting PDF..." : "Exporting image...",
          description: "Please wait while we generate your file.",
        });

        // Store reference to custom cursor element
        const customCursor = document.querySelector('.cursor-circle');
        
        // Temporarily hide UI elements that might interfere, but preserve cursor functionality
        const elementsToHide = document.querySelectorAll('.fixed:not(.cursor-circle), [data-sidebar], .floating-toolbar, .z-50:not(.cursor-circle), [role="tooltip"]');
        const originalStyles: { element: HTMLElement; display: string }[] = [];
        
        elementsToHide.forEach(el => {
          const htmlEl = el as HTMLElement;
          originalStyles.push({ element: htmlEl, display: htmlEl.style.display });
          htmlEl.style.display = 'none';
        });

        html2canvas(contentElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          width: contentElement.scrollWidth,
          height: contentElement.scrollHeight,
          onclone: (clonedDoc) => {
            // Remove any remaining UI elements from the cloned document, but not cursor-related elements
            const uiElements = clonedDoc.querySelectorAll('.fixed:not(.cursor-circle), [data-sidebar], .floating-toolbar, .z-50:not(.cursor-circle), [role="tooltip"]');
            uiElements.forEach(el => el.remove());
          }
        }).then(canvas => {
          // Restore hidden elements immediately
          originalStyles.forEach(({ element, display }) => {
            element.style.display = display;
          });

          if (format === 'pdf') {
            // For PDF, convert canvas to image and open print dialog
            const imgData = canvas.toDataURL('image/png');
            
            // Create a new window with just the content for printing
            const pdfWindow = window.open('', '_blank');
            if (pdfWindow) {
              pdfWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>${doc.title}</title>
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                      margin: 0; 
                      padding: 0; 
                      background: white;
                    }
                    img { 
                      width: 100%; 
                      height: auto; 
                      display: block;
                    }
                    @media print {
                      @page { 
                        margin: 0.5in; 
                        size: A4;
                      }
                      body { margin: 0; padding: 0; }
                      img { 
                        width: 100%; 
                        height: auto; 
                        page-break-inside: avoid; 
                      }
                    }
                    @media screen {
                      body {
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                        min-height: 100vh;
                        padding: 20px;
                      }
                      img {
                        max-width: 800px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                      }
                    }
                  </style>
                </head>
                <body>
                  <img src="${imgData}" alt="${doc.title}" />
                  <script>
                    window.onload = function() {
                      setTimeout(() => {
                        window.print();
                        // Close the window after a delay to ensure print dialog completes
                        setTimeout(() => {
                          window.close();
                          // Focus back to the main window to ensure cursor functionality
                          if (window.opener) {
                            window.opener.focus();
                          }
                        }, 2000);
                      }, 500);
                    };
                    
                    // Handle when user cancels print or completes it
                    window.addEventListener('afterprint', function() {
                      setTimeout(() => {
                        window.close();
                        if (window.opener) {
                          window.opener.focus();
                        }
                      }, 500);
                    });
                  </script>
                </body>
                </html>
              `);
              pdfWindow.document.close();
              
              // Ensure main window remains focused and cursor is active
              setTimeout(() => {
                window.focus();
                // Force a mousemove event to reactivate the custom cursor
                const mouseMoveEvent = new MouseEvent('mousemove', {
                  bubbles: true,
                  cancelable: true,
                  clientX: 0,
                  clientY: 0
                });
                document.dispatchEvent(mouseMoveEvent);
              }, 1000);
            }
          } else {
            // Image export
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = `${doc.title}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          
          toast({
            title: "Document exported",
            description: `Saved as ${doc.title}.${format === 'pdf' ? 'pdf' : 'png'}`,
          });
        }).catch(error => {
          // Restore hidden elements on error
          originalStyles.forEach(({ element, display }) => {
            element.style.display = display;
          });
          
          console.error('Error capturing content:', error);
          toast({
            title: "Export Error",
            description: `Failed to export as ${format}. Please try again.`,
            variant: "destructive"
          });
        });
      } else {
        console.log('No suitable content element found');
        toast({
          title: "Export Error",
          description: "Could not find document content to export.",
          variant: "destructive"
        });
      }
      return;
    }

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(doc, null, 2);
        filename = `${doc.title}.wrdo.json`;
        mimeType = 'application/json';
        break;
      case 'markdown':
        content = doc.blocks.map(block => {
          switch (block.type) {
            case 'heading':
              return `${'#'.repeat(block.level || 1)} ${block.content}`;
            case 'quote':
              return `> ${block.content}`;
            case 'code':
              return `\`\`\`\n${block.content}\n\`\`\``;
            case 'list':
              return `- ${block.content}`;
            default:
              return block.content;
          }
        }).join('\n\n');
        filename = `${doc.title}.md`;
        mimeType = 'text/markdown';
        break;
      case 'text':
        content = doc.blocks.map(block => block.content).join('\n\n');
        filename = `${doc.title}.txt`;
        mimeType = 'text/plain';
        break;
      case 'html':
        content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1, h2, h3, h4, h5, h6 { margin-top: 2rem; margin-bottom: 1rem; }
    blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; margin: 1rem 0; color: #6b7280; }
    code { background: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; }
    pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${doc.title}</h1>
  ${doc.blocks.map(block => {
    switch (block.type) {
      case 'heading':
        return `<h${block.level || 1}>${block.content}</h${block.level || 1}>`;
      case 'quote':
        return `<blockquote>${block.content}</blockquote>`;
      case 'code':
        return `<pre><code>${block.content}</code></pre>`;
      case 'list':
        return `<li>${block.content}</li>`;
      default:
        return `<p>${block.content}</p>`;
    }
  }).join('\n')}
</body>
</html>`;
        filename = `${doc.title}.html`;
        mimeType = 'text/html';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Document exported",
      description: `Saved as ${filename}`,
    });
  };

  return (
    <DocumentContext.Provider value={{
      documents,
      currentDocument,
      createDocument,
      updateDocument,
      deleteDocument,
      setCurrentDocument,
      duplicateDocument,
      exportDocument,
    }}>
      {children}
    </DocumentContext.Provider>
  );
};
