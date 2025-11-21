import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointLight } from 'three';

interface BonfireProps {
  position: [number, number, number];
}

export const Bonfire: React.FC<BonfireProps> = ({ position }) => {
  const lightRef = useRef<PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      // Efecto de parpadeo del fuego
      const noise = Math.sin(state.clock.elapsedTime * 10) * 0.1 + Math.cos(state.clock.elapsedTime * 25) * 0.1;
      lightRef.current.intensity = 1.5 + noise;
    }
  });

  return (
    <group position={position}>
      {/* Troncos cruzados */}
      <mesh position={[0, 0.1, 0]} rotation={[0, Math.PI / 4, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 5]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[0, -Math.PI / 4, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 5]} />
        <meshStandardMaterial color="#4e342e" />
      </mesh>

      {/* Centro 'brasa' */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.15, 4, 4]} />
        <meshBasicMaterial color="#ff5722" />
      </mesh>

      {/* Luz del fuego */}
      <pointLight
        ref={lightRef}
        position={[0, 0.5, 0]}
        distance={8}
        decay={2}
        color="#ff6d00"
      />
    </group>
  );
};