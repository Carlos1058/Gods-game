import React from 'react';
import { GameScene } from './components/Scene/GameScene';
import { TopBar } from './components/UI/TopBar';
import { ControlPanel } from './components/UI/ControlPanel';
import { EventLog } from './components/UI/EventLog';

const App: React.FC = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans select-none">
      {/* Capa 3D (Fondo) */}
      <GameScene />

      {/* Capa Interfaz (UI Superpuesta) */}
      <TopBar />
      <EventLog />
      <ControlPanel />

      {/* Overlay sutil para viñeta (opcional, mejora estética) */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]" />
    </div>
  );
};

export default App;