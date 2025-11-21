import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { World } from './World';
import { useGameStore } from '../../store/gameStore';

const GameLoop = () => {
  // Solo nos suscribimos a variables de control esenciales para montar/desmontar lógica
  const isPlaying = useGameStore(state => state.isPlaying);
  const speed = useGameStore(state => state.speed);
  const tick = useGameStore(state => state.tick);
  
  const timeRef = useRef(0);
  
  // Ejecutamos la lógica de juego a una tasa fija
  const TICK_RATE = 0.1; 

  useFrame((state, delta) => {
    if (!isPlaying) return;

    // Protección contra "Spiral of Death" (Espiral de la muerte)
    // Si el navegador se cuelga y delta es gigante (ej. 2 segundos),
    // no queremos ejecutar 200 ticks de golpe, o se colgará para siempre.
    const safeDelta = Math.min(delta, 0.25); 

    timeRef.current += safeDelta * speed;
    
    let ticksProcessed = 0;
    const MAX_TICKS_PER_FRAME = 10; // Límite duro para mantener FPS

    while (timeRef.current >= TICK_RATE && ticksProcessed < MAX_TICKS_PER_FRAME) {
      tick();
      timeRef.current -= TICK_RATE;
      ticksProcessed++;
    }
    
    // Si después del bucle todavía queda mucho tiempo acumulado (porque speed es x20 o lag),
    // descartamos el exceso para que la visualización alcance a la lógica.
    if (timeRef.current > TICK_RATE * 2) {
        timeRef.current = 0;
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
          maxDistance={80}
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