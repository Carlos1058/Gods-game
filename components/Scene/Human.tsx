import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Mesh, MeshStandardMaterial } from 'three';
import { useGameStore, humanPositions, animalPositions } from '../../store/gameStore';
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

const MOVE_SPEED_BASE = 3.5;
const MAP_LIMIT = 75;
const HUNGER_THRESHOLD = 40; 
const LOVE_THRESHOLD = 60;   
const MATURITY_AGE = 18;     
const ACTION_DISTANCE = 1.5;

export const Human: React.FC<HumanProps> = ({ id, position, name, hunger, age, reproductionCooldown, xp, houseId }) => {
  const groupRef = useRef<Group>(null);
  const bodyMeshRef = useRef<Mesh>(null);
  
  const internalState = useRef({
    target: new Vector3(position[0], position[1], position[2]),
    isMoving: false,
    idleTimer: 0,
    timeToWait: 0,
    lastCooldown: 0,
    currentVelocity: new Vector3(),
    actionTimer: 0 
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
    let intendedTarget: Vector3 | null = null;
    let mode: 'IDLE' | 'SEEKING_FOOD' | 'HUNTING' | 'SEEKING_MATE' | 'GOING_HOME' | 'BUILDING' | 'MINING' | 'LUMBERJACK' = 'IDLE';
    let stopMovingThreshold = 0.2;

    let myHousePos: Vector3 | undefined = undefined;
    if (houseId) {
        const house = state.houses.find(h => h.id === houseId);
        if (house) myHousePos = new Vector3(house.position[0], 0, house.position[2]);
    }

    // 1. SUPERVIVENCIA (COMIDA)
    const shouldSeekFood = hunger < HUNGER_THRESHOLD || (!houseId && hunger < 70);
    
    if (shouldSeekFood) {
        // A) CAZAR (Prioridad si hay animales y tengo hambre fuerte, da mucha comida)
        let closestAnimal = null;
        let minAnimalDistSq = Infinity;

        // Buscar animales cercanos
        state.animals.forEach(animal => {
            const aPos = animalPositions.get(animal.id);
            if (!aPos) return;
            const distSq = (aPos[0] - currentPos.x)**2 + (aPos[2] - currentPos.z)**2;
            if (distSq < 60*60 && distSq < minAnimalDistSq) { // 60 unidades de rango de visión
                minAnimalDistSq = distSq;
                closestAnimal = animal;
            }
        });

        // Si encontré un animal cerca, voy a por él (Caza)
        if (closestAnimal) {
            const aPos = animalPositions.get(closestAnimal.id)!;
            mode = 'HUNTING';
            intendedTarget = new Vector3(aPos[0], 0, aPos[2]);
            stopMovingThreshold = ACTION_DISTANCE;
            
            if (Math.sqrt(minAnimalDistSq) < ACTION_DISTANCE) {
                s.isMoving = false;
                // Intentar cazar (Probabilidad basada en XP)
                if (Math.random() < 0.1 + (xp * 0.02)) {
                    state.huntAnimal(id, closestAnimal.id);
                }
            }
        } 
        // B) RECOLECTAR (Si no hay animales o prefiero bayas)
        else {
            mode = 'SEEKING_FOOD';
            let closestFood = null;
            let minDistSq = Infinity;

            for (const food of state.foods) {
                const distSq = (food.position[0] - currentPos.x)**2 + (food.position[2] - currentPos.z)**2;
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
                stopMovingThreshold = 1.2;
                if (Math.sqrt(minDistSq) < 1.2) {
                    state.eatFood(id, closestFood.id);
                    s.isMoving = false;
                }
            } else if (myHousePos && hunger < 20) {
                myHousePos = undefined; // Desesperación
            }
        }
    }

    // 2. VIVIENDA
    if (!intendedTarget && !houseId) {
        const emptyHouse = state.houses.find(h => h.ownerId === null);
        if (emptyHouse) {
             const distSq = (emptyHouse.position[0] - currentPos.x)**2 + (emptyHouse.position[2] - currentPos.z)**2;
             if (distSq < 120*120) { 
                 intendedTarget = new Vector3(emptyHouse.position[0], 0, emptyHouse.position[2]);
                 stopMovingThreshold = 1.5;
                 if (distSq < 2.5) state.claimHouse(id, emptyHouse.id);
             }
        }

        if (!intendedTarget && hunger > 60 && state.inventory.wood >= 10) {
            if (Math.random() < 0.05) { 
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

    // 3. REPRODUCCIÓN
    if (!intendedTarget && hunger > LOVE_THRESHOLD && age > MATURITY_AGE && reproductionCooldown === 0 && houseId) {
      mode = 'SEEKING_MATE';
      let closestMateId = -1;
      let minDistSq = Infinity;
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
        stopMovingThreshold = 1.8;
        if (Math.sqrt(minDistSq) < 1.8 && Math.random() < 0.05) { 
             state.attemptReproduction(id, closestMateId, [currentPos.x, 0, currentPos.z]);
        }
      }
    }

    // 4. TRABAJO (Minería o Tala)
    if (!intendedTarget && hunger > 65) {
        // Decidir qué trabajar basado en inventario
        // Si hay poca madera (< 20), priorizar TALAR. Si hay mucha, MINAR.
        const needWood = state.inventory.wood < 20;
        
        // A) TALA DE ÁRBOLES (Lumberjack)
        if (needWood && state.trees.length > 0) {
             let closestTree = null;
             let minTreeDist = Infinity;
             for (const tree of state.trees) {
                 if (tree.stage < 2) continue; // Solo árboles adultos
                 const distSq = (tree.position[0] - currentPos.x)**2 + (tree.position[2] - currentPos.z)**2;
                 if (myHousePos) {
                    const distToHouse = (tree.position[0] - myHousePos.x)**2 + (tree.position[2] - myHousePos.z)**2;
                    if (distToHouse > 50*50) continue;
                 }
                 if (distSq < minTreeDist) {
                     minTreeDist = distSq;
                     closestTree = tree;
                 }
             }

             if (closestTree) {
                 mode = 'LUMBERJACK';
                 intendedTarget = new Vector3(closestTree.position[0], 0, closestTree.position[2]);
                 stopMovingThreshold = ACTION_DISTANCE;
                 if (Math.sqrt(minTreeDist) < ACTION_DISTANCE) {
                     s.isMoving = false;
                     if (Math.random() < 0.05 * currentSpeed) {
                         state.chopTree(id, closestTree.id);
                     }
                 }
             }
        }

        // B) MINERÍA (Si no estamos talando)
        if (mode === 'IDLE' && state.resources.length > 0) {
             let closestRes = null;
             let minResDistSq = Infinity;
             for (const res of state.resources) {
                const distSq = (res.position[0] - currentPos.x)**2 + (res.position[2] - currentPos.z)**2;
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
                stopMovingThreshold = ACTION_DISTANCE;
                if (Math.sqrt(minResDistSq) < ACTION_DISTANCE) {
                    s.isMoving = false;
                    const mineChance = 0.05 + (xp * 0.01);
                    if (Math.random() < mineChance * currentSpeed) { 
                        state.mineResource(id, closestRes.id);
                    }
                }
            }
        }
    }

    // 5. IR A CASA
    if (!intendedTarget && houseId && myHousePos && mode !== 'MINING' && mode !== 'LUMBERJACK') {
        const distToHome = currentPos.distanceTo(myHousePos);
        if (distToHome > 2) {
             mode = 'GOING_HOME';
             intendedTarget = myHousePos;
             stopMovingThreshold = 2.0; 
        }
    }

    // Visuals
    if (bodyMeshRef.current) {
        const mat = bodyMeshRef.current.material as MeshStandardMaterial;
        if (mode === 'SEEKING_FOOD') mat.color.set('#ff5722'); 
        else if (mode === 'HUNTING') mat.color.set('#dc2626'); // Rojo Intenso (Caza)
        else if (mode === 'SEEKING_MATE') mat.color.set('#ff69b4'); 
        else if (mode === 'GOING_HOME') mat.color.set('#8d6e63'); 
        else if (mode === 'MINING') mat.color.set('#64748b'); 
        else if (mode === 'LUMBERJACK') mat.color.set('#166534'); // Verde oscuro (Leñador)
        else if (mode === 'BUILDING') mat.color.set('#fbbf24'); 
        else mat.color.set('white');

        // Animación de Acción (Minar/Talar/Cazar)
        if ((mode === 'MINING' || mode === 'LUMBERJACK' || mode === 'HUNTING') && !s.isMoving) {
            s.actionTimer += delta * 15;
            // Movimiento de "golpe"
            bodyMeshRef.current.rotation.x = Math.sin(s.actionTimer) * 0.5;
        } else {
            bodyMeshRef.current.rotation.x = 0;
            s.actionTimer = 0;
        }
    }

    // Movement Logic
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
            if (mode === 'SEEKING_MATE' || mode === 'HUNTING') moveSpeed *= 1.3; 
            finalMove.add(direction.multiplyScalar(moveSpeed));
        }
    }

    // Separación
    const separation = new Vector3();
    let count = 0;
    humanPositions.forEach((pos, otherId) => {
        if (otherId === id) return;
        const dx = currentPos.x - pos[0];
        const dz = currentPos.z - pos[2];
        const distSq = dx*dx + dz*dz;
        if (distSq < 1.0) {
            const dist = Math.sqrt(distSq);
            const force = (1.0 - dist) / 1.0;
            separation.x += (dx / (dist || 0.01)) * force;
            separation.z += (dz / (dist || 0.01)) * force;
            count++;
        }
    });
    
    if (count > 0) finalMove.add(separation.multiplyScalar(4.0 * currentSpeed));

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
      <Text position={[0, 2.5, 0]} fontSize={0.4} color="white" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000">
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