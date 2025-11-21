import React, { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { animalPositions, useGameStore } from '../../store/gameStore';

interface AnimalProps {
  id: number;
  position: [number, number, number];
  type: 'rabbit' | 'chicken';
}

export const Animal: React.FC<AnimalProps> = ({ id, position, type }) => {
  const groupRef = useRef<Group>(null);
  const internalPos = useRef(new Vector3(position[0], position[1], position[2]));
  const jumpTime = useRef(Math.random() * 100);

  useLayoutEffect(() => {
    // Sincronizar posición inicial
    animalPositions.set(id, position);
  }, [id, position]);

  useFrame((state, delta) => {
      if (!groupRef.current) return;
      
      const isPlaying = useGameStore.getState().isPlaying;
      const gameSpeed = useGameStore.getState().speed;
      
      // Obtener posición objetivo del store (actualizada en el tick)
      const targetArr = animalPositions.get(id);
      if (targetArr && isPlaying) {
          const target = new Vector3(targetArr[0], 0, targetArr[2]);
          
          // Lerp suave hacia el objetivo
          internalPos.current.lerp(target, 0.05 * gameSpeed);
          
          // Mirar hacia donde va
          if (internalPos.current.distanceTo(target) > 0.1) {
            groupRef.current.lookAt(target.x, 0, target.z);
          }
          
          // Animación de salto al moverse
          const dist = internalPos.current.distanceTo(target);
          if (dist > 0.1) {
              jumpTime.current += delta * 10 * gameSpeed;
              groupRef.current.position.y = Math.abs(Math.sin(jumpTime.current)) * (type === 'rabbit' ? 0.5 : 0.2);
          } else {
              groupRef.current.position.y = 0;
          }
      }

      groupRef.current.position.x = internalPos.current.x;
      groupRef.current.position.z = internalPos.current.z;
  });

  return (
    <group ref={groupRef}>
      {type === 'rabbit' ? (
          <group scale={[0.4, 0.4, 0.4]}>
              {/* Cuerpo */}
              <mesh position={[0, 0.4, 0]} castShadow>
                  <boxGeometry args={[0.6, 0.5, 0.8]} />
                  <meshStandardMaterial color="#f1f5f9" />
              </mesh>
              {/* Orejas */}
              <mesh position={[0.2, 0.8, 0.3]}>
                  <boxGeometry args={[0.1, 0.6, 0.1]} />
                  <meshStandardMaterial color="#f1f5f9" />
              </mesh>
              <mesh position={[-0.2, 0.8, 0.3]}>
                  <boxGeometry args={[0.1, 0.6, 0.1]} />
                  <meshStandardMaterial color="#f1f5f9" />
              </mesh>
              {/* Cola */}
              <mesh position={[0, 0.3, -0.5]}>
                  <sphereGeometry args={[0.15]} />
                  <meshStandardMaterial color="#fff" />
              </mesh>
          </group>
      ) : (
          <group scale={[0.35, 0.35, 0.35]}>
              {/* Cuerpo Pollo */}
              <mesh position={[0, 0.4, 0]} castShadow>
                  <sphereGeometry args={[0.5, 8, 8]} />
                  <meshStandardMaterial color="#facc15" />
              </mesh>
              {/* Pico */}
              <mesh position={[0, 0.5, 0.4]}>
                  <coneGeometry args={[0.1, 0.2, 4]} rotation={[Math.PI/2, 0, 0]}/>
                  <meshStandardMaterial color="#ea580c" />
              </mesh>
              {/* Cresta */}
              <mesh position={[0, 0.9, 0]}>
                   <boxGeometry args={[0.1, 0.2, 0.3]} />
                   <meshStandardMaterial color="#dc2626" />
              </mesh>
          </group>
      )}
    </group>
  );
};