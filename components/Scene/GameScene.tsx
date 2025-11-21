import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { World } from './World';
import { useGameStore } from '../../store/gameStore';
import { Color, DirectionalLight, AmbientLight } from 'three';

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
    const safeDelta = Math.min(delta, 0.25); 

    timeRef.current += safeDelta * speed;
    
    let ticksProcessed = 0;
    const MAX_TICKS_PER_FRAME = 10; // Límite duro para mantener FPS

    while (timeRef.current >= TICK_RATE && ticksProcessed < MAX_TICKS_PER_FRAME) {
      tick();
      timeRef.current -= TICK_RATE;
      ticksProcessed++;
    }
    
    if (timeRef.current > TICK_RATE * 2) {
        timeRef.current = 0;
    }
  });

  return null;
};

const DayNightCycle = () => {
    const { scene } = useThree();
    const dirLightRef = useRef<DirectionalLight>(null);
    const ambLightRef = useRef<AmbientLight>(null);
    
    const timeOfDay = useGameStore(state => state.timeOfDay);

    useFrame(() => {
        // Calcular intensidad y color basado en la hora (0-24)
        // Mediodía es 12, Medianoche es 0/24
        
        // Mapear hora a valor cíclico: 1.0 al mediodía, 0.0 a medianoche
        // Usamos función coseno para transición suave
        // (time - 12) / 12 * PI.  
        // 12h -> cos(0) = 1. 
        // 0h -> cos(-PI) = -1.
        // 24h -> cos(PI) = -1.
        
        const normalizedTime = (timeOfDay - 12) / 12; // -1 a 1
        const sunFactor = Math.max(0, Math.cos(normalizedTime * Math.PI)); // 0 noche, 1 día
        
        // Colores
        const dayColor = new Color('#87CEEB'); // Azul cielo
        const nightColor = new Color('#0f172a'); // Azul marino oscuro noche
        const currentColor = new Color().lerpColors(nightColor, dayColor, sunFactor);
        
        scene.background = currentColor;

        // Luces
        if (dirLightRef.current) {
            dirLightRef.current.intensity = Math.max(0.1, sunFactor * 1.5);
            const sunColor = new Color().lerpColors(new Color('#ffaa00'), new Color('#ffffff'), sunFactor);
            dirLightRef.current.color = sunColor;
            
            // Mover el sol ligeramente para sombras dinámicas
            const sunAngle = (timeOfDay / 24) * Math.PI * 2;
            // Sol más alto y lejano para el mapa grande
            dirLightRef.current.position.x = Math.sin(sunAngle) * 100;
            dirLightRef.current.position.y = Math.max(10, Math.cos(normalizedTime * Math.PI) * 100);
            dirLightRef.current.position.z = 50;
        }
        
        if (ambLightRef.current) {
            ambLightRef.current.intensity = Math.max(0.1, sunFactor * 0.6);
        }
    });

    return (
        <>
            <ambientLight ref={ambLightRef} intensity={0.6} color="#ffffff" />
            <directionalLight 
              ref={dirLightRef}
              position={[100, 100, 50]} 
              intensity={1.5} 
              castShadow 
              shadow-mapSize-width={2048} 
              shadow-mapSize-height={2048}
              shadow-camera-left={-100}
              shadow-camera-right={100}
              shadow-camera-top={100}
              shadow-camera-bottom={-100}
            />
        </>
    );
}

export const GameScene: React.FC = () => {
  return (
    <div className="w-full h-full absolute inset-0 -z-10 bg-blue-300">
      <Canvas shadows dpr={[1, 2]}>
        {/* Configuración de Cámara: Posición más alejada por defecto */}
        <PerspectiveCamera makeDefault position={[0, 40, 60]} fov={50} />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true} 
          maxPolarAngle={Math.PI / 2 - 0.1} 
          minDistance={5}
          maxDistance={200} 
        />

        {/* Ciclo Día Noche maneja el fondo y las luces */}
        <DayNightCycle />

        {/* Objetos del Mundo */}
        <World />

        {/* Lógica del Loop de Juego */}
        <GameLoop />
      </Canvas>
    </div>
  );
};