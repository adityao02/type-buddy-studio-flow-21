
import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { VolumeX, Mic, Play, Pause, SkipBack, SkipForward, List, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccessibilityPanelProps {
  document: any;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ document }) => {
  const [enhancedSpellCheck, setEnhancedSpellCheck] = useState(() => {
    const saved = localStorage.getItem('accessibility-enhanced-spell-check');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [predictiveText, setPredictiveText] = useState(() => {
    const saved = localStorage.getItem('accessibility-predictive-text');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState([1.0]);
  const [isDictating, setIsDictating] = useState(false);
  const { toast } = useToast();

  // Save toggle states to localStorage when they change and dispatch events
  useEffect(() => {
    localStorage.setItem('accessibility-enhanced-spell-check', JSON.stringify(enhancedSpellCheck));
    // Dispatch custom event for same-tab communication
    window.dispatchEvent(new CustomEvent('spell-check-toggle'));
  }, [enhancedSpellCheck]);

  useEffect(() => {
    localStorage.setItem('accessibility-predictive-text', JSON.stringify(predictiveText));
    // Dispatch custom event for same-tab communication
    window.dispatchEvent(new CustomEvent('predictive-text-toggle'));
  }, [predictiveText]);

  const handleReadAloud = () => {
    console.log('handleReadAloud called');
    console.log('speechSynthesis available:', 'speechSynthesis' in window);
    console.log('current document:', document);
    
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Text-to-Speech Not Available", 
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive"
      });
      return;
    }

    if (isReading && !isPaused) {
      console.log('Pausing speech');
      speechSynthesis.pause();
      setIsPaused(true);
      toast({
        title: "Reading Paused",
        description: "Press Alt+R to resume or Escape to stop."
      });
    } else if (isReading && isPaused) {
      console.log('Resuming speech');
      speechSynthesis.resume();
      setIsPaused(false);
      toast({
        title: "Reading Resumed"
      });
    } else {
      console.log('Starting to read');
      
      // Get text content from document blocks
      let textContent = '';
      if (document && document.blocks && Array.isArray(document.blocks)) {
        textContent = document.blocks
          .map((block: any) => {
            if (block && typeof block.content === 'string' && block.content.trim()) {
              return block.content.trim();
            }
            return '';
          })
          .filter(content => content.length > 0)
          .join('. ');
      }
      
      // If no content from blocks, try document title
      if (!textContent && document && document.title && document.title.trim()) {
        textContent = `Document title: ${document.title}`;
      }
      
      // Fallback text for empty documents
      if (!textContent) {
        textContent = "This document appears to be empty. Try adding some text content first, then use the read aloud feature.";
      }
      
      console.log('Text content to read:', textContent);
      
      const utterance = new SpeechSynthesisUtterance(textContent);
      utterance.rate = readingSpeed[0];
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        console.log('Speech started');
        setIsReading(true);
        setIsPaused(false);
        toast({
          title: "Reading Started",
          description: "Press Alt+R to pause or Escape to stop."
        });
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
        setIsReading(false);
        setIsPaused(false);
        toast({
          title: "Reading Complete"
        });
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsReading(false);
        setIsPaused(false);
        toast({
          title: "Reading Error",
          description: "There was an error with text-to-speech.",
          variant: "destructive"
        });
      };
      
      try {
        console.log('About to call speechSynthesis.speak');
        console.log('speechSynthesis:', speechSynthesis);
        console.log('utterance:', utterance);
        
        // Check if speech synthesis is ready
        if (speechSynthesis.paused) {
          speechSynthesis.resume();
        }
        
        // Clear any existing speech
        speechSynthesis.cancel();
        
        // Wait a bit then speak
        setTimeout(() => {
          console.log('Calling speechSynthesis.speak now');
          speechSynthesis.speak(utterance);
          
          // Additional check after a short delay
          setTimeout(() => {
            console.log('Speaking status:', speechSynthesis.speaking);
            console.log('Pending status:', speechSynthesis.pending);
            if (!speechSynthesis.speaking && !speechSynthesis.pending) {
              console.log('Speech failed to start, trying again...');
              speechSynthesis.speak(utterance);
            }
          }, 100);
        }, 100);
        
      } catch (error) {
        console.error('Error starting speech synthesis:', error);
        toast({
          title: "Speech Error",
          description: "Could not start text-to-speech.",
          variant: "destructive"
        });
      }
    }
  };

  const handleStopReading = () => {
    console.log('handleStopReading called');
    speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    toast({
      title: "Reading Stopped"
    });
  };

  const handleSpeedChange = (value: number[]) => {
    setReadingSpeed(value);
    if (isReading) {
      speechSynthesis.cancel();
      setTimeout(() => handleReadAloud(), 100);
    }
  };

  const handleDictate = () => {
    console.log('handleDictate called');
    console.log('Speech recognition available:', 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }

    if (isDictating) {
      setIsDictating(false);
      toast({
        title: "Dictation Stopped"
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Capture document reference for use in callbacks
    const doc = document;
    const win = window;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsDictating(true);
      toast({
        title: "Dictation Started",
        description: "Speak now... Press Alt+D to stop.",
      });
    };
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        console.log('Dictation result:', finalTranscript);
        
        // Find the focused contentEditable element (active block)
        const focusedElement = doc.querySelector('[contenteditable="true"]:focus') as HTMLElement;
        
        if (!focusedElement) {
          // Try to find any contentEditable element with active styling
          const activeBlock = doc.querySelector('.block-content.ring-2') as HTMLElement;
          if (activeBlock) {
            activeBlock.focus();
            setTimeout(() => {
              insertTextIntoElement(activeBlock, finalTranscript, doc, win);
            }, 50);
          } else {
            // Fallback: find the first contentEditable element
            const firstBlock = doc.querySelector('[contenteditable="true"]') as HTMLElement;
            if (firstBlock) {
              firstBlock.focus();
              setTimeout(() => {
                insertTextIntoElement(firstBlock, finalTranscript, doc, win);
              }, 50);
            } else {
              toast({
                title: "No Editor Found",
                description: "Please click in the text editor first, then try dictation.",
              });
              return;
            }
          }
        } else {
          insertTextIntoElement(focusedElement, finalTranscript, doc, win);
        }
        
        toast({
          title: "Text Inserted",
          description: `"${finalTranscript.slice(0, 30)}${finalTranscript.length > 30 ? '...' : ''}" added to editor`,
        });
      }
    };
    
    // Helper function to insert text into an element
    const insertTextIntoElement = (element: HTMLElement, text: string, doc: Document, win: Window) => {
      const selection = win.getSelection();
      const range = doc.createRange();
      
      // If element is empty, just set the text
      if (!element.textContent || element.textContent.trim() === '') {
        element.textContent = text;
      } else {
        // Append text with a space
        element.textContent = element.textContent + ' ' + text;
      }
      
      // Set cursor to end
      range.selectNodeContents(element);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Trigger input event to update the block
      const inputEvent = new Event('input', { bubbles: true });
      element.dispatchEvent(inputEvent);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event);
      setIsDictating(false);
      toast({
        title: "Dictation Error",
        description: "There was an error with speech recognition.",
        variant: "destructive"
      });
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsDictating(false);
    };
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsDictating(false);
      toast({
        title: "Dictation Error",
        description: "Could not start speech recognition.",
        variant: "destructive"
      });
    }
  };

  // Enhanced spell check functionality
  useEffect(() => {
    const applySpellCheck = () => {
      const editableElements = window.document.querySelectorAll('[contenteditable="true"], textarea, input[type="text"]');
      editableElements.forEach((element: any) => {
        if (enhancedSpellCheck) {
          element.setAttribute('spellcheck', 'true');
          element.style.textDecoration = 'underline wavy red';
          element.style.textDecorationSkipInk = 'none';
        } else {
          element.setAttribute('spellcheck', 'false');
          element.style.textDecoration = '';
        }
      });
    };

    // Apply immediately and also after a short delay to catch dynamically added elements
    applySpellCheck();
    const timeoutId = setTimeout(applySpellCheck, 500);
    
    return () => clearTimeout(timeoutId);
  }, [enhancedSpellCheck]);

  // Predictive text functionality - handled by usePredictiveText hook in BlockEditor
  // No additional logic needed here, just the toggle state

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('Key pressed:', event.key, 'Alt:', event.altKey, 'Ctrl:', event.ctrlKey);
      
      // Alt + R for Read Aloud
      if (event.altKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        console.log('Read Aloud shortcut triggered');
        handleReadAloud();
      }
      // Alt + D for Dictate
      if (event.altKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        console.log('Dictate shortcut triggered');
        handleDictate();
      }
      // Escape to stop reading
      if (event.key === 'Escape' && isReading) {
        event.preventDefault();
        console.log('Stop reading shortcut triggered');
        handleStopReading();
      }
    };

    window.document.addEventListener('keydown', handleKeyDown);
    console.log('Keyboard shortcuts added');
    
    return () => {
      window.document.removeEventListener('keydown', handleKeyDown);
      console.log('Keyboard shortcuts removed');
    };
  }, [isReading, isDictating]);


  return (
    <div className="p-2 space-y-4">
      <div className="space-y-2 px-2 pt-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Accessibility
        </h3>
      </div>

      <Separator />

      <div className="space-y-4 px-3 pb-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Actions
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <VolumeX className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-700">Read Aloud</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Alt + R
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReadAloud}
                className="h-8 px-3 text-xs"
              >
                {isReading ? (isPaused ? "Resume" : "Pause") : "Start"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mic className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-700">Dictate</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Alt + D
              </span>
              <Button
                variant={isDictating ? "default" : "outline"}
                size="sm"
                onClick={handleDictate}
                className="h-8 px-3 text-xs"
              >
                {isDictating ? "Stop" : "Start"}
              </Button>
            </div>
          </div>
        </div>

        {/* Reading Interface */}
        {isReading && (
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Reading Controls</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStopReading}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Target className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-1 text-xs bg-white px-2 py-1 rounded border">
                <span>{readingSpeed[0].toFixed(1)}</span>
              </div>
              
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={handleReadAloud}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <List className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Mic className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Speed</span>
                <span>{readingSpeed[0].toFixed(1)}x</span>
              </div>
              <Slider
                value={readingSpeed}
                onValueChange={handleSpeedChange}
                max={3}
                min={0.5}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        )}

        <Separator />

        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Language
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Enhanced spell check</span>
            <Switch
              checked={enhancedSpellCheck}
              onCheckedChange={setEnhancedSpellCheck}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Predictive text</span>
            <Switch
              checked={predictiveText}
              onCheckedChange={setPredictiveText}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;
