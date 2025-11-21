import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';

interface ResourceNodeProps {
  type: 'rock' | 'iron';
  position: [number, number, number];
  durability: number;
}

export const ResourceNode: React.FC<ResourceNodeProps> = ({ type, position, durability }) => {
  const meshRef = useRef<Mesh>(null);
  const [originalY] = useState(position[1] + (type === 'rock' ? 0.4 : 0.3));
  
  // Escala basada en la durabilidad restante
  const scale = Math.max(0.3, 0.5 * (durability / (type === 'rock' ? 20 : 30)) + 0.3);

  useFrame((state) => {
    if (meshRef.current) {
      // Animación de "flotar" muy sutil o vibración si hay actividad cercana (simulado)
      // O simplemente rotación lenta para el hierro para que brille
      if (type === 'iron') {
        meshRef.current.rotation.y += 0.005;
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      } else {
        // Roca estática, quizás un poco de wobble aleatorio
      }
    }
  });

  return (
    <group position={position}>
      {type === 'rock' ? (
        <mesh ref={meshRef} position={[0, 0.4, 0]} castShadow receiveShadow scale={[scale, scale, scale]}>
          <dodecahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.9} />
        </mesh>
      ) : (
        <mesh ref={meshRef} position={[0, 0.3, 0]} castShadow receiveShadow scale={[scale, scale, scale]}>
          <icosahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} emissive="#1e293b" emissiveIntensity={0.2} />
          {/* Detalles brillantes */}
          <mesh position={[0.4, 0.2, 0]}>
             <boxGeometry args={[0.2, 0.2, 0.2]} />
             <meshStandardMaterial color="#fca5a5" emissive="#ef4444" emissiveIntensity={0.5} />
          </mesh>
        </mesh>
      )}
    </group>
  );
};