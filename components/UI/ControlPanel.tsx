import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { GlassPanel } from './GlassPanel';

export const ControlPanel: React.FC = () => {
  const { isPlaying, speed, togglePlay, setSpeed } = useGameStore();

  const ButtonClass = (active: boolean) => `
    p-3 rounded-xl flex items-center justify-center transition-all duration-200
    ${active 
      ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)] scale-105' 
      : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'}
  `;

  return (
    <div className="absolute bottom-8 left-0 w-full flex justify-center pointer-events-none z-10">
      <GlassPanel className="flex items-center space-x-4">
        
        <button 
          onClick={togglePlay}
          className={ButtonClass(isPlaying)}
          aria-label={isPlaying ? "Pausar" : "Jugar"}
        >
          {isPlaying ? (
            <span className="font-bold text-lg">❚❚ PAUSA</span>
          ) : (
            <span className="font-bold text-lg">▶ JUGAR</span>
          )}
        </button>

        <div className="w-px h-8 bg-white/20 mx-2" />

        <div className="flex space-x-2 bg-black/20 p-1 rounded-lg">
          <button 
            onClick={() => setSpeed(1)}
            className={`px-3 py-1 rounded-md text-sm font-bold transition-colors ${speed === 1 ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            1x
          </button>
          <button 
             onClick={() => setSpeed(5)}
            className={`px-3 py-1 rounded-md text-sm font-bold transition-colors ${speed === 5 ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            5x
          </button>
          <button 
             onClick={() => setSpeed(20)}
            className={`px-3 py-1 rounded-md text-sm font-bold transition-colors ${speed === 20 ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            20x
          </button>
        </div>

      </GlassPanel>
    </div>
  );
};