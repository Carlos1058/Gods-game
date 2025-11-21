import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { World } from './World';
import { useGameStore } from '../../store/gameStore';

const GameLoop = () => {
  const { isPlaying, speed, tick } = useGameStore();
  const timeRef = useRef(0);
  
  // Ejecutamos la lógica de juego 10 veces por segundo de "tiempo de juego"
  // Si speed es 1, son 10 ticks por segundo real.
  // Si speed es 5, son 50 ticks por segundo real.
  const TICK_RATE = 0.1; 

  useFrame((state, delta) => {
    if (!isPlaying) return;

    timeRef.current += delta * speed;
    
    // While loop para catch-up si el frame time es largo, 
    // pero limitado para evitar espiral de la muerte en lag.
    let ticksProcessed = 0;
    while (timeRef.current >= TICK_RATE && ticksProcessed < 5) {
      tick();
      timeRef.current -= TICK_RATE;
      ticksProcessed++;
    }
  });

  return null;
};

export const GameScene: React.FC = () => {
  return (
    <div className="w-full h-full absolute inset-0 -z-10 bg-blue-300">
      <Canvas shadows dpr={[1, 2]}>
        {/* Configuración de Cámara */}
        <PerspectiveCamera makeDefault position={[0, 15, 20]} fov={50} />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true} 
          maxPolarAngle={Math.PI / 2 - 0.1} 
          minDistance={5}
          maxDistance={40}
        />

        {/* Fondo Azul Cielo */}
        <color attach="background" args={['#87CEEB']} />

        {/* Iluminación */}
        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight 
          position={[50, 50, 25]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
        />

        {/* Objetos del Mundo */}
        <World />

        {/* Lógica del Loop de Juego */}
        <GameLoop />
      </Canvas>
    </div>
  );
};