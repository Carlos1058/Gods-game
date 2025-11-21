import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { useGameStore } from '../../store/gameStore';
import { Text } from '@react-three/drei';

interface HumanProps {
  id: number;
  position: [number, number, number];
  name: string;
  hunger: number;
}

// Configuración de comportamiento
const MOVE_SPEED_BASE = 2;
const MAP_LIMIT = 20;
const IDLE_TIME_MIN = 1;
const IDLE_TIME_MAX = 2;
const HUNGER_THRESHOLD = 50; // A partir de aquí busca comida
const EATING_DISTANCE = 0.8; // Distancia para comer

export const Human: React.FC<HumanProps> = ({ id, position, name, hunger }) => {
  const groupRef = useRef<Group>(null);
  
  // Acceso al store
  const isPlaying = useGameStore(state => state.isPlaying);
  const speed = useGameStore(state => state.speed);
  const foods = useGameStore(state => state.foods);
  const eatFood = useGameStore(state => state.eatFood);
  
  // Estado interno para movimiento y lógica (ref para performance en loop)
  const internalState = useRef({
    target: new Vector3(position[0], position[1], position[2]),
    isMoving: false,
    idleTimer: 0,
    timeToWait: 0,
    state: 'IDLE' as 'IDLE' | 'SEEKING_FOOD'
  });

  // Color aleatorio ropa
  const clothingColor = useMemo(() => {
    const colors = ['#e2e8f0', '#cbd5e1', '#94a3b8']; 
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // Color indicador de hambre
  const statusColor = useMemo(() => {
    if (hunger > 50) return '#4ade80'; // Verde
    if (hunger > 20) return '#facc15'; // Amarillo
    return '#ef4444'; // Rojo
  }, [hunger]);

  const pickRandomTarget = (currentPos: Vector3) => {
    const range = 8;
    let x = currentPos.x + (Math.random() - 0.5) * range * 2;
    let z = currentPos.z + (Math.random() - 0.5) * range * 2;
    x = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, x));
    z = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, z));
    return new Vector3(x, 0, z);
  };

  useFrame((_, delta) => {
    if (!isPlaying || !groupRef.current) return;

    const s = internalState.current;
    const currentPos = groupRef.current.position;
    
    // --- LÓGICA DE IA: Decidir objetivo ---
    
    // Si tiene hambre, intentar buscar comida
    if (hunger < HUNGER_THRESHOLD) {
      // Buscar comida más cercana
      let closestFood = null;
      let minDist = Infinity;

      for (const food of foods) {
        const dist = Math.sqrt(
          Math.pow(food.position[0] - currentPos.x, 2) + 
          Math.pow(food.position[2] - currentPos.z, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestFood = food;
        }
      }

      if (closestFood) {
        // Cambiar objetivo a la comida
        s.state = 'SEEKING_FOOD';
        s.target.set(closestFood.position[0], 0, closestFood.position[2]);
        s.isMoving = true;

        // Verificar si llegó a la comida para comer
        if (minDist < EATING_DISTANCE) {
          eatFood(id, closestFood.id);
          // Reiniciar comportamiento
          s.state = 'IDLE';
          s.isMoving = false;
          s.timeToWait = 1; 
        }
      } else {
        // No hay comida, seguir vagando con desesperación
        if (s.state !== 'IDLE' && !s.isMoving) {
            s.state = 'IDLE'; // Fallback
        }
      }
    } else {
        // No tiene hambre, comportamiento normal
        s.state = 'IDLE';
    }

    // --- LÓGICA DE MOVIMIENTO ---

    if (s.isMoving) {
      const direction = new Vector3().subVectors(s.target, currentPos);
      const distance = direction.length();
      // Si tiene mucha hambre corre un poco más rápido (opcional, visual detail)
      const hungerBoost = hunger < 20 ? 1.5 : 1;
      const step = MOVE_SPEED_BASE * speed * hungerBoost * delta;

      if (distance < step) {
        currentPos.copy(s.target);
        s.isMoving = false;
        s.idleTimer = 0;
        s.timeToWait = (IDLE_TIME_MIN + Math.random() * (IDLE_TIME_MAX - IDLE_TIME_MIN));
      } else {
        direction.normalize().multiplyScalar(step);
        currentPos.add(direction);
        groupRef.current.lookAt(s.target.x, currentPos.y, s.target.z);
      }
    } else {
      // IDLE Wait
      if (s.state === 'IDLE') {
        s.idleTimer += delta * speed;
        if (s.idleTimer >= s.timeToWait) {
          s.target = pickRandomTarget(currentPos);
          s.isMoving = true;
        }
      } else if (s.state === 'SEEKING_FOOD') {
         // Si estaba buscando comida pero dejó de moverse (llegó a destino y la comida desapareció justo antes),
         // forzar nueva búsqueda
         s.isMoving = true; 
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Etiqueta Debug / Nombre */}
      <Text 
        position={[0, 2.2, 0]} 
        fontSize={0.3} 
        color="white" 
        anchorX="center" 
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {name} ({Math.floor(hunger)}%)
      </Text>

      {/* Indicador de Estado */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Cuerpo */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.3, 0.9, 4, 8]} />
        <meshStandardMaterial color={clothingColor} roughness={0.5} />
      </mesh>
    </group>
  );
};