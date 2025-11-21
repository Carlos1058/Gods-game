import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Mesh, MeshStandardMaterial } from 'three';
import { useGameStore, humanPositions } from '../../store/gameStore';
import { Text } from '@react-three/drei';

interface HumanProps {
  id: number;
  position: [number, number, number];
  name: string;
  hunger: number;
  age: number;
  reproductionCooldown: number;
  xp: number;
}

// Configuración de comportamiento
const MOVE_SPEED_BASE = 3.5;
const MAP_LIMIT = 22;
const HUNGER_THRESHOLD = 40; 
const LOVE_THRESHOLD = 60;   
const MATURITY_AGE = 18;     
const EATING_DISTANCE = 1.2; 
const LOVING_DISTANCE = 1.8; 
const PERSONAL_SPACE = 1.0;  

export const Human: React.FC<HumanProps> = ({ id, position, name, hunger, age, reproductionCooldown, xp }) => {
  const groupRef = useRef<Group>(null);
  const bodyMeshRef = useRef<Mesh>(null);
  
  // Estado interno para IA y movimiento suave
  const internalState = useRef({
    target: new Vector3(position[0], position[1], position[2]),
    isMoving: false,
    idleTimer: 0,
    timeToWait: 0,
    lastCooldown: 0,
    currentVelocity: new Vector3()
  });

  // VISUALES: Usamos useMemo para calcular colores solo cuando cambian las props críticas.
  // Esto es ligero y correcto para React.
  const statusColor = useMemo(() => {
    if (hunger > 60) return '#4ade80'; // Verde
    if (hunger > 30) return '#facc15'; // Amarillo
    return '#ef4444'; // Rojo
  }, [hunger]);

  const scale = useMemo(() => {
    if (age === undefined) return 1;
    return Math.min(1, 0.3 + (age / MATURITY_AGE) * 0.7);
  }, [age]);

  // Inicialización de posición
  useLayoutEffect(() => {
    if (groupRef.current) {
      const tracked = humanPositions.get(id);
      if (tracked) {
          groupRef.current.position.set(tracked[0], tracked[1], tracked[2]);
      } else {
          groupRef.current.position.set(position[0], position[1], position[2]);
          humanPositions.set(id, position);
      }
    }
  }, [id]);

  const pickRandomTarget = (currentPos: Vector3, range: number = 10) => {
    let x = currentPos.x + (Math.random() - 0.5) * range * 2;
    let z = currentPos.z + (Math.random() - 0.5) * range * 2;
    x = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, x));
    z = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, z));
    return new Vector3(x, 0, z);
  };

  // LÓGICA IMPERATIVA: Todo el cálculo pesado va aquí dentro sin suscripciones de React
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // 1. ACCESO DIRECTO AL STORE
    // Leemos el estado actual directamente para evitar re-renders masivos.
    const state = useGameStore.getState();
    
    // Pausa estricta e inmediata
    if (!state.isPlaying) return;

    // Cap Delta: Evita que un lag spike cause teletransportación (El bug de velocidad 20x en 1x)
    // Si el frame tardó más de 0.1s, lo tratamos como 0.1s
    const safeDelta = Math.min(delta, 0.1);
    const currentSpeed = state.speed;

    const s = internalState.current;
    const currentPos = groupRef.current.position;
    
    // Actualizar mapa global de posiciones
    humanPositions.set(id, [currentPos.x, currentPos.y, currentPos.z]);
    
    // Detector de paternidad (Huida post-parto)
    if (s.lastCooldown === 0 && reproductionCooldown > 10) {
        s.target = pickRandomTarget(currentPos, 20);
        s.isMoving = true;
        s.timeToWait = 0;
    }
    s.lastCooldown = reproductionCooldown;

    // --- LÓGICA DE DECISIÓN (IA) ---
    
    let intendedTarget: Vector3 | null = null;
    let mode: 'IDLE' | 'SEEKING_FOOD' | 'SEEKING_MATE' = 'IDLE';
    let stopMovingThreshold = 0.2;

    // Prioridad 1: Comida
    if (hunger < HUNGER_THRESHOLD) {
      mode = 'SEEKING_FOOD';
      
      let closestFood = null;
      let minDistSq = Infinity;

      // Iteramos sobre el array crudo del store (rápido)
      for (const food of state.foods) {
        const distSq = (food.position[0] - currentPos.x)**2 + (food.position[2] - currentPos.z)**2;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestFood = food;
        }
      }

      if (closestFood) {
        intendedTarget = new Vector3(closestFood.position[0], 0, closestFood.position[2]);
        stopMovingThreshold = EATING_DISTANCE;
        
        if (Math.sqrt(minDistSq) < EATING_DISTANCE) {
          state.eatFood(id, closestFood.id);
          s.isMoving = false;
        }
      }
    }
    // Prioridad 2: Reproducción
    else if (hunger > LOVE_THRESHOLD && age > MATURITY_AGE && reproductionCooldown === 0) {
      mode = 'SEEKING_MATE';
      let closestMateId = -1;
      let minDistSq = Infinity;

      // Usamos humanPositions para distancia rápida, y state.humans solo para verificar edad
      // Esto es una optimización crítica O(N)
      for (const other of state.humans) {
        if (other.id === id) continue;
        if (other.age < MATURITY_AGE) continue; 

        const realPos = humanPositions.get(other.id);
        if (!realPos) continue;

        const distSq = (realPos[0] - currentPos.x)**2 + (realPos[2] - currentPos.z)**2;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestMateId = other.id;
        }
      }

      if (closestMateId !== -1) {
        const matePos = humanPositions.get(closestMateId)!;
        intendedTarget = new Vector3(matePos[0], 0, matePos[2]);
        stopMovingThreshold = LOVING_DISTANCE;

        if (Math.sqrt(minDistSq) < LOVING_DISTANCE) {
             if (Math.random() < 0.05) { // Probabilidad baja por frame para no spamear
                 state.attemptReproduction(id, closestMateId, [currentPos.x, 0, currentPos.z]);
             }
        }
      }
    }

    // Visual Debugging (Colores)
    if (bodyMeshRef.current) {
        const mat = bodyMeshRef.current.material as MeshStandardMaterial;
        if (mode === 'SEEKING_FOOD') mat.color.set('#ff5722');
        else if (mode === 'SEEKING_MATE') mat.color.set('#ff69b4');
        else mat.color.set('white');
    }

    // --- MOVIMIENTO FÍSICO ---

    if (intendedTarget) {
        s.target.copy(intendedTarget);
        const distToTarget = currentPos.distanceTo(s.target);
        s.isMoving = distToTarget > stopMovingThreshold;
    }

    // Idle Wandering
    if (mode === 'IDLE') {
       if (!s.isMoving) {
          s.idleTimer += safeDelta * currentSpeed;
          if (s.idleTimer >= s.timeToWait) {
            s.target = pickRandomTarget(currentPos);
            s.isMoving = true;
            s.idleTimer = 0;
          }
       } else if (currentPos.distanceTo(s.target) < 0.5) {
             s.isMoving = false;
             s.timeToWait = 1 + Math.random() * 2;
       }
    }

    // Cálculo de Vectores
    const finalMove = new Vector3(0, 0, 0);

    // 1. Fuerza de Voluntad
    if (s.isMoving) {
        const direction = new Vector3().subVectors(s.target, currentPos);
        direction.y = 0;
        if (direction.lengthSq() > 0.01) {
            direction.normalize();
            let moveSpeed = MOVE_SPEED_BASE * currentSpeed;
            if (mode === 'SEEKING_MATE') moveSpeed *= 1.2;
            finalMove.add(direction.multiplyScalar(moveSpeed));
        }
    }

    // 2. Fuerza de Separación (Evitar superposición)
    const separation = new Vector3();
    let count = 0;
    humanPositions.forEach((pos, otherId) => {
        if (otherId === id) return;
        const dx = currentPos.x - pos[0];
        const dz = currentPos.z - pos[2];
        const distSq = dx*dx + dz*dz;
        if (distSq < PERSONAL_SPACE * PERSONAL_SPACE) {
            const dist = Math.sqrt(distSq);
            const force = (PERSONAL_SPACE - dist) / PERSONAL_SPACE;
            separation.x += (dx / (dist || 0.01)) * force;
            separation.z += (dz / (dist || 0.01)) * force;
            count++;
        }
    });
    
    if (count > 0) {
        // Multiplicamos por speed para que la física escale con el tiempo del juego
        finalMove.add(separation.multiplyScalar(4.0 * currentSpeed));
    }

    // Aplicar movimiento
    if (finalMove.lengthSq() > 0.001) {
        // Interpolación simple para suavizar
        s.currentVelocity.lerp(finalMove, 0.2); // Inercia suave
        
        // Paso final: Velocidad * Tiempo
        const step = s.currentVelocity.clone().multiplyScalar(safeDelta);
        
        const newPos = currentPos.clone().add(step);
        
        // Clamping al mapa
        newPos.x = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, newPos.x));
        newPos.z = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, newPos.z));

        // Rotación suave
        if (step.lengthSq() > 0.01) {
            const lookTarget = currentPos.clone().add(step);
            groupRef.current.lookAt(lookTarget.x, currentPos.y, lookTarget.z);
        }

        groupRef.current.position.copy(newPos);
    }
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <Text 
        position={[0, 2.5, 0]} 
        fontSize={0.4} 
        color="white" 
        anchorX="center" 
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000000"
      >
        {name} (Lvl {Math.floor(xp / 5)})
      </Text>

      <mesh position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      <group position={[0, 0.9, 0]}>
          <mesh ref={bodyMeshRef} castShadow receiveShadow>
            <capsuleGeometry args={[0.35, 1.0, 4, 8]} />
            <meshStandardMaterial color="white" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color="#ffccaa" /> 
          </mesh>
      </group>
    </group>
  );
};