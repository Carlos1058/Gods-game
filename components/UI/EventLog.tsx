import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { GlassPanel } from './GlassPanel';

export const EventLog: React.FC = () => {
  const logs = useGameStore((state) => state.logs);

  return (
    <div className="absolute top-0 left-0 h-full flex flex-col justify-center p-4 pointer-events-none z-10 w-80">
      <GlassPanel className="max-h-[60%] flex flex-col overflow-hidden">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-white/10 pb-2">
          Log de Eventos
        </h3>
        <div className="overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent h-full">
          {logs.map((log, index) => (
            <div key={index} className="text-sm text-slate-200 animate-fadeIn">
              <span className="text-sky-400 font-mono mr-2">▸</span>
              {log}
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
};