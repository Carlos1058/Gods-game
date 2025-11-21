import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`
        bg-slate-900/40 
        backdrop-blur-md 
        border border-white/10 
        shadow-lg 
        rounded-2xl 
        p-4 
        text-white
        pointer-events-auto
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
};