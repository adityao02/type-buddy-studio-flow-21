
import { useEffect, useState } from 'react';

export const useCustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let lastEvent: MouseEvent | null = null;

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      lastEvent = e;
    };

    // Re-attach event listener and dispatch mousemove to trigger cursor after print or focus
    const refreshCursor = (source: string) => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.addEventListener('mousemove', updateMousePosition, { passive: true });
      // Use last event position if possible, else center
      const syntheticEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: lastEvent ? lastEvent.clientX : window.innerWidth / 2,
        clientY: lastEvent ? lastEvent.clientY : window.innerHeight / 2,
      });
      document.dispatchEvent(syntheticEvent);
      // Debug log:
      console.log(`[CustomCursor] Refreshed cursor listeners after '${source}'. Position:`, {
        x: syntheticEvent.clientX, y: syntheticEvent.clientY
      });
    };

    // Store function references for proper cleanup
    const handleFocus = () => refreshCursor('focus');
    const handleAfterPrint = () => refreshCursor('afterprint');

    window.addEventListener('mousemove', updateMousePosition, { passive: true });
    window.addEventListener('focus', handleFocus);
    window.addEventListener('afterprint', handleAfterPrint);

    // Initial synthetic event in case cursor is not visible on mount
    setTimeout(() => refreshCursor('mount'), 300);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  return mousePosition;
};
