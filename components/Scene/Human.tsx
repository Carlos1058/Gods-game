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
  houseId: number | null;
}

// Configuración de comportamiento
const MOVE_SPEED_BASE = 3.5;
const MAP_LIMIT = 75;
const HUNGER_THRESHOLD = 40; 
const LOVE_THRESHOLD = 60;   
const MATURITY_AGE = 18;     
const EATING_DISTANCE = 1.2; 
const LOVING_DISTANCE = 1.8; 
const PERSONAL_SPACE = 1.0;  
const MINING_DISTANCE = 1.5;

export const Human: React.FC<HumanProps> = ({ id, position, name, hunger, age, reproductionCooldown, xp, houseId }) => {
  const groupRef = useRef<Group>(null);
  const bodyMeshRef = useRef<Mesh>(null);
  
  // Estado interno para IA y movimiento suave
  const internalState = useRef({
    target: new Vector3(position[0], position[1], position[2]),
    isMoving: false,
    idleTimer: 0,
    timeToWait: 0,
    lastCooldown: 0,
    currentVelocity: new Vector3(),
    miningTimer: 0 // Para animación de picar
  });

  const statusColor = useMemo(() => {
    if (hunger > 60) return '#4ade80'; // Verde
    if (hunger > 30) return '#facc15'; // Amarillo
    return '#ef4444'; // Rojo
  }, [hunger]);

  const scale = useMemo(() => {
    if (age === undefined) return 1;
    return Math.min(1, 0.3 + (age / MATURITY_AGE) * 0.7);
  }, [age]);

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

  const pickRandomTarget = (currentPos: Vector3, housePos?: Vector3) => {
    const range = housePos ? 15 : 25; 
    const center = housePos ? housePos : currentPos;

    let x = center.x + (Math.random() - 0.5) * range * 2;
    let z = center.z + (Math.random() - 0.5) * range * 2;
    
    x = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, x));
    z = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, z));
    return new Vector3(x, 0, z);
  };

  useFrame((stateContext, delta) => {
    if (!groupRef.current) return;

    const state = useGameStore.getState();
    
    if (!state.isPlaying) return;

    const safeDelta = Math.min(delta, 0.1);
    const currentSpeed = state.speed;

    const s = internalState.current;
    const currentPos = groupRef.current.position;
    
    humanPositions.set(id, [currentPos.x, currentPos.y, currentPos.z]);
    
    if (s.lastCooldown === 0 && reproductionCooldown > 10) {
        s.target = pickRandomTarget(currentPos); 
        s.isMoving = true;
        s.timeToWait = 0;
    }
    s.lastCooldown = reproductionCooldown;

    // --- LÓGICA DE DECISIÓN (IA) ---
    // Prioridad: Comida > Casa > Reproducción > Trabajo (Minería) > Ir a Casa
    
    let intendedTarget: Vector3 | null = null;
    let mode: 'IDLE' | 'SEEKING_FOOD' | 'SEEKING_MATE' | 'GOING_HOME' | 'BUILDING' | 'MINING' = 'IDLE';
    let stopMovingThreshold = 0.2;

    let myHousePos: Vector3 | undefined = undefined;
    if (houseId) {
        const house = state.houses.find(h => h.id === houseId);
        if (house) myHousePos = new Vector3(house.position[0], 0, house.position[2]);
    }

    // 1. PRIORIDAD ABSOLUTA: COMIDA (Supervivencia)
    const shouldSeekFood = hunger < HUNGER_THRESHOLD || (!houseId && hunger < 70);
    
    if (shouldSeekFood) {
      mode = 'SEEKING_FOOD';
      let closestFood = null;
      let minDistSq = Infinity;

      for (const food of state.foods) {
        const distSq = (food.position[0] - currentPos.x)**2 + (food.position[2] - currentPos.z)**2;
        
        // Si tengo casa, prefiero comida cerca, pero si muero de hambre voy a donde sea
        if (myHousePos && hunger > 20) {
            const distToHouse = (food.position[0] - myHousePos.x)**2 + (food.position[2] - myHousePos.z)**2;
            if (distToHouse > 30*30) continue; 
        }
        
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
      } else if (myHousePos && hunger < 20) {
          // Si tengo mucha hambre y no hay comida cerca de casa, olvido mi casa para sobrevivir
          myHousePos = undefined; 
      }
    }

    // 2. PRIORIDAD ALTA: VIVIENDA (Refugio)
    // Si no tengo casa, mi objetivo principal tras comer es conseguir una.
    if (!intendedTarget && !houseId) {
        // A) Buscar casa vacía
        const emptyHouse = state.houses.find(h => h.ownerId === null);
        if (emptyHouse) {
             const distSq = (emptyHouse.position[0] - currentPos.x)**2 + (emptyHouse.position[2] - currentPos.z)**2;
             // Solo voy si está razonablemente cerca para no cruzar el mapa entero a lo loco
             if (distSq < 120*120) { 
                 intendedTarget = new Vector3(emptyHouse.position[0], 0, emptyHouse.position[2]);
                 stopMovingThreshold = 1.5;
                 if (distSq < 2.5) {
                     state.claimHouse(id, emptyHouse.id);
                 }
             }
        }

        // B) Construir casa (Si tengo suficiente energía y recursos cercanos)
        // Aumentada la probabilidad de construcción
        if (!intendedTarget && hunger > 60) {
            // Intenta construir cerca de recursos o comida
            if (Math.random() < 0.02) { 
                 const buildPos: [number, number, number] = [
                     currentPos.x + (Math.random() - 0.5) * 4,
                     0,
                     currentPos.z + (Math.random() - 0.5) * 4
                 ];
                 state.buildHouse(id, buildPos);
                 mode = 'BUILDING';
            }
        }
    }

    // 3. PRIORIDAD MEDIA: REPRODUCCIÓN (Familia)
    // Solo si tengo casa (o soy nomada feliz) y estoy bien alimentado
    if (!intendedTarget && hunger > LOVE_THRESHOLD && age > MATURITY_AGE && reproductionCooldown === 0) {
      mode = 'SEEKING_MATE';
      let closestMateId = -1;
      let minDistSq = Infinity;

      for (const other of state.humans) {
        if (other.id === id) continue;
        if (other.age < MATURITY_AGE) continue; 
        // Evitar incesto directo simple (opcional, no implementado estrictamente por ID)

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
             // Probabilidad de éxito en el encuentro
             if (Math.random() < 0.05) { 
                 state.attemptReproduction(id, closestMateId, [currentPos.x, 0, currentPos.z]);
             }
        }
      }
    }

    // 4. PRIORIDAD BAJA: TRABAJO (Minería)
    // Si tengo mis necesidades básicas cubiertas y no estoy en cooldown reproductivo (o estoy esperando), trabajo.
    if (!intendedTarget && hunger > 65 && state.resources.length > 0) {
        let closestRes = null;
        let minResDistSq = Infinity;

        for (const res of state.resources) {
            const distSq = (res.position[0] - currentPos.x)**2 + (res.position[2] - currentPos.z)**2;
            
            // Si tengo casa, prefiero trabajar "cerca" (radio amplio)
            if (myHousePos) {
                const distToHouse = (res.position[0] - myHousePos.x)**2 + (res.position[2] - myHousePos.z)**2;
                if (distToHouse > 40*40) continue; 
            }

            if (distSq < minResDistSq) {
                minResDistSq = distSq;
                closestRes = res;
            }
        }

        if (closestRes) {
            mode = 'MINING';
            intendedTarget = new Vector3(closestRes.position[0], 0, closestRes.position[2]);
            stopMovingThreshold = MINING_DISTANCE;
            
            if (Math.sqrt(minResDistSq) < MINING_DISTANCE) {
                s.isMoving = false;
                // Velocidad de minado depende del XP
                const mineChance = 0.05 + (xp * 0.01);
                if (Math.random() < mineChance * currentSpeed) { 
                    state.mineResource(id, closestRes.id);
                }
            }
        }
    }

    // 5. PRIORIDAD FINAL: IR A CASA (Descanso)
    // Si no tengo nada más que hacer y tengo casa, voy a ella.
    if (!intendedTarget && houseId && myHousePos && mode !== 'MINING') {
        const distToHome = currentPos.distanceTo(myHousePos);
        if (distToHome > 2) { // Si estoy lejos
             mode = 'GOING_HOME';
             intendedTarget = myHousePos;
             stopMovingThreshold = 2.0; 
        }
    }

    // Animaciones Visuales (Colores de depuración visual)
    if (bodyMeshRef.current) {
        const mat = bodyMeshRef.current.material as MeshStandardMaterial;
        if (mode === 'SEEKING_FOOD') mat.color.set('#ff5722'); // Naranja
        else if (mode === 'SEEKING_MATE') mat.color.set('#ff69b4'); // Rosa
        else if (mode === 'GOING_HOME') mat.color.set('#8d6e63'); // Marrón
        else if (mode === 'MINING') mat.color.set('#64748b'); // Gris
        else if (mode === 'BUILDING') mat.color.set('#fbbf24'); // Amarillo
        else mat.color.set('white');

        // Animación de Minería (Saltitos)
        if (mode === 'MINING' && !s.isMoving) {
            s.miningTimer += delta * 10;
            bodyMeshRef.current.position.y = Math.abs(Math.sin(s.miningTimer)) * 0.3;
        } else {
            bodyMeshRef.current.position.y = 0;
            s.miningTimer = 0;
        }
    }

    // --- MOVIMIENTO FÍSICO ---
    if (intendedTarget) {
        s.target.copy(intendedTarget);
        const distToTarget = currentPos.distanceTo(s.target);
        s.isMoving = distToTarget > stopMovingThreshold;
    }

    if (mode === 'IDLE') {
       if (!s.isMoving) {
          s.idleTimer += safeDelta * currentSpeed;
          if (s.idleTimer >= s.timeToWait) {
            s.target = pickRandomTarget(currentPos, myHousePos);
            s.isMoving = true;
            s.idleTimer = 0;
          }
       } else if (currentPos.distanceTo(s.target) < 0.5) {
             s.isMoving = false;
             s.timeToWait = 1 + Math.random() * 2;
       }
    }

    const finalMove = new Vector3(0, 0, 0);

    if (s.isMoving) {
        const direction = new Vector3().subVectors(s.target, currentPos);
        direction.y = 0;
        if (direction.lengthSq() > 0.01) {
            direction.normalize();
            let moveSpeed = MOVE_SPEED_BASE * currentSpeed;
            if (mode === 'SEEKING_MATE') moveSpeed *= 1.2; // Corren por amor
            finalMove.add(direction.multiplyScalar(moveSpeed));
        }
    }

    // Separación básica (boids separation)
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
    
    // Evitar chocar con casas
    state.houses.forEach(house => {
        const dx = currentPos.x - house.position[0];
        const dz = currentPos.z - house.position[2];
        const distSq = dx*dx + dz*dz;
        if (distSq < 2.0 * 2.0) {
             const dist = Math.sqrt(distSq);
             const force = (2.5 - dist) / 2.5;
             separation.x += (dx / (dist || 0.01)) * force * 5; // Fuera fuerza repulsiva
             separation.z += (dz / (dist || 0.01)) * force * 5;
             count++;
        }
    });
    
    if (count > 0) {
        finalMove.add(separation.multiplyScalar(4.0 * currentSpeed));
    }

    if (finalMove.lengthSq() > 0.001) {
        s.currentVelocity.lerp(finalMove, 0.2);
        
        const step = s.currentVelocity.clone().multiplyScalar(safeDelta);
        const newPos = currentPos.clone().add(step);
        
        newPos.x = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, newPos.x));
        newPos.z = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, newPos.z));

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
        {name}
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