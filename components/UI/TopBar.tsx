import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { GlassPanel } from './GlassPanel';

export const TopBar: React.FC = () => {
  const { year, population, populationLabel, weather } = useGameStore();

  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-center pointer-events-none z-10">
      <GlassPanel className="flex items-center space-x-8 px-8 py-3">
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-300 uppercase tracking-widest font-bold">Año</span>
          <span className="text-xl font-mono font-bold text-sky-300">{Math.floor(year)}</span>
        </div>
        
        <div className="w-px h-8 bg-white/20" />
        
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-300 uppercase tracking-widest font-bold">Población</span>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold">{population}</span>
            <span className="text-xs text-emerald-400">{populationLabel}</span>
          </div>
        </div>

        <div className="w-px h-8 bg-white/20" />

        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-300 uppercase tracking-widest font-bold">Clima</span>
          <span className="text-xl text-yellow-300">{weather} ☀️</span>
        </div>
      </GlassPanel>
    </div>
  );
};