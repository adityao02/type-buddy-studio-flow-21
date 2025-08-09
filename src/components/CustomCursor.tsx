
import React from 'react';
import { useCustomCursor } from '../hooks/useCustomCursor';

const CustomCursor = () => {
  const mousePosition = useCustomCursor();

  return (
    <div
      className="cursor-circle fixed pointer-events-none z-[9999] w-6 h-6 rounded-full"
      style={{
        left: mousePosition.x - 12,
        top: mousePosition.y - 12,
        background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
        boxShadow: '0 2px 8px rgba(251, 146, 60, 0.4), 0 0 20px rgba(251, 146, 60, 0.3)',
        animation: 'cursorPulse 2s ease-in-out infinite',
      }}
    />
  );
};

export default CustomCursor;
