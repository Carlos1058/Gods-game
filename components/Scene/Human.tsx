import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { useGameStore } from '../../store/gameStore';
import { Text } from '@react-three/drei';

interface HumanProps {
  position: [number, number, number];
  name: string;
}

// Configuración de comportamiento
const MOVE_SPEED_BASE = 2;
const MAP_LIMIT = 20; // Límites del mapa (-20 a 20)
const IDLE_TIME_MIN = 1;
const IDLE_TIME_MAX = 2;

export const Human: React.FC<HumanProps> = ({ position, name }) => {
  const groupRef = useRef<Group>(null);
  const { isPlaying, speed } = useGameStore();
  
  // Estado interno para la lógica de movimiento (no usa React State para evitar re-renders en cada frame)
  const internalState = useRef({
    target: new Vector3(position[0], position[1], position[2]),
    isMoving: false,
    idleTimer: 0,
    timeToWait: 0
  });

  // Color aleatorio sutil para la ropa para diferenciarlos un poco
  const clothingColor = useMemo(() => {
    const colors = ['#e2e8f0', '#cbd5e1', '#94a3b8']; 
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // Función para elegir un punto aleatorio cercano dentro de los límites
  const pickRandomTarget = (currentPos: Vector3) => {
    const range = 8; // Rango de movimiento en un solo viaje
    
    let x = currentPos.x + (Math.random() - 0.5) * range * 2;
    let z = currentPos.z + (Math.random() - 0.5) * range * 2;

    // Clamp (mantener dentro del mapa)
    x = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, x));
    z = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, z));

    return new Vector3(x, 0, z);
  };

  useFrame((state, delta) => {
    if (!isPlaying || !groupRef.current) return;

    const s = internalState.current;
    const currentPos = groupRef.current.position;

    // Lógica de Estado: IDLE vs MOVING
    if (s.isMoving) {
      // Calcular dirección y distancia
      const direction = new Vector3().subVectors(s.target, currentPos);
      const distance = direction.length();
      
      // Velocidad ajustada por el multiplicador de velocidad del juego
      const step = MOVE_SPEED_BASE * speed * delta;

      if (distance < step) {
        // Ha llegado al destino
        currentPos.copy(s.target);
        s.isMoving = false;
        s.idleTimer = 0;
        // Decidir cuánto tiempo esperar (1 a 2 segundos reales, afectados por speed)
        s.timeToWait = (IDLE_TIME_MIN + Math.random() * (IDLE_TIME_MAX - IDLE_TIME_MIN));
      } else {
        // Moverse hacia el objetivo
        direction.normalize().multiplyScalar(step);
        currentPos.add(direction);
        
        // Opcional: Mirar hacia donde camina
        groupRef.current.lookAt(s.target.x, currentPos.y, s.target.z);
      }
    } else {
      // Está esperando (IDLE)
      s.idleTimer += delta * speed; // El tiempo pasa más rápido si speed es mayor

      if (s.idleTimer >= s.timeToWait) {
        // Elegir nuevo destino
        s.target = pickRandomTarget(currentPos);
        s.isMoving = true;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Etiqueta de Nombre (visible solo al estar cerca o simple debug) */}
      <Text 
        position={[0, 2.2, 0]} 
        fontSize={0.3} 
        color="white" 
        anchorX="center" 
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {name}
      </Text>

      {/* Indicador de Estado (Esfera flotante) */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#4ade80" /> {/* Verde (Bien) */}
      </mesh>

      {/* Cuerpo (Cilindro/Cápsula Minimalista) */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.3, 0.9, 4, 8]} />
        <meshStandardMaterial color={clothingColor} roughness={0.5} />
      </mesh>
    </group>
  );
};