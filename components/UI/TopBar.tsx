import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { GlassPanel } from './GlassPanel';

export const TopBar: React.FC = () => {
  const { year, population, populationLabel, weather, timeOfDay, inventory } = useGameStore();

  // Formato de hora HH:00
  const formattedTime = `${Math.floor(timeOfDay).toString().padStart(2, '0')}:00`;

  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-center pointer-events-none z-10">
      <GlassPanel className="flex items-center space-x-6 px-6 py-3">
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-300 uppercase tracking-widest font-bold">Año</span>
          <span className="text-xl font-mono font-bold text-sky-300">{Math.floor(year)}</span>
        </div>

        <div className="w-px h-8 bg-white/20" />

        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-300 uppercase tracking-widest font-bold">Hora</span>
          <span className="text-xl font-mono font-bold text-amber-300">{formattedTime}</span>
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

        <div className="flex space-x-6">
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Madera</span>
                <span className="text-lg font-bold text-amber-700">🌲 {inventory.wood}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Piedra</span>
                <span className="text-lg font-bold text-slate-300">🪨 {inventory.stone}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Hierro</span>
                <span className="text-lg font-bold text-slate-200">⛏️ {inventory.iron}</span>
            </div>
        </div>
      </GlassPanel>
    </div>
  );
};