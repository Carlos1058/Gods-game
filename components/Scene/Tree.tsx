import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

interface TreeProps {
  position: [number, number, number];
  stage: 0 | 1 | 2;
}

export const Tree: React.FC<TreeProps> = ({ position, stage }) => {
  const groupRef = useRef<Group>(null);
  
  // Variación visual aleatoria
  const randomOffset = useMemo(() => Math.random(), []);
  const leavesColor = useMemo(() => {
      const colors = ['#15803d', '#166534', '#14532d'];
      return colors[Math.floor(randomOffset * colors.length)];
  }, [randomOffset]);

  useFrame((state) => {
      if (groupRef.current && stage > 0) {
          // Viento suave
          const time = state.clock.elapsedTime;
          groupRef.current.rotation.x = Math.sin(time + position[0]) * 0.02;
          groupRef.current.rotation.z = Math.cos(time + position[2]) * 0.02;
      }
  });

  // Stage 0: Brote (Sapling)
  if (stage === 0) {
      return (
          <group position={position}>
              <mesh position={[0, 0.2, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.4]} />
                  <meshStandardMaterial color="#4d7c0f" />
              </mesh>
              <mesh position={[0, 0.4, 0]}>
                  <sphereGeometry args={[0.15, 4, 4]} />
                  <meshStandardMaterial color="#84cc16" />
              </mesh>
          </group>
      )
  }

  // Stage 1: Árbol Joven
  if (stage === 1) {
    return (
        <group ref={groupRef} position={position}>
            <mesh position={[0, 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.2, 1]} />
                <meshStandardMaterial color="#573c27" />
            </mesh>
            <mesh position={[0, 1.2, 0]} castShadow>
                <coneGeometry args={[0.8, 1.5, 7]} />
                <meshStandardMaterial color={leavesColor} />
            </mesh>
        </group>
    )
  }

  // Stage 2: Árbol Adulto (Talable)
  return (
    <group ref={groupRef} position={position}>
        {/* Tronco */}
        <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 1.6]} />
            <meshStandardMaterial color="#3f2718" roughness={0.9} />
        </mesh>
        {/* Copas (Clusters de hojas) */}
        <mesh position={[0, 2, 0]} castShadow>
             <dodecahedronGeometry args={[1.2, 0]} />
             <meshStandardMaterial color={leavesColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.5, 2.5, 0.2]} castShadow>
             <dodecahedronGeometry args={[0.8, 0]} />
             <meshStandardMaterial color={leavesColor} roughness={0.8} />
        </mesh>
        <mesh position={[-0.4, 2.2, -0.4]} castShadow>
             <dodecahedronGeometry args={[0.9, 0]} />
             <meshStandardMaterial color={leavesColor} roughness={0.8} />
        </mesh>
    </group>
  );
};