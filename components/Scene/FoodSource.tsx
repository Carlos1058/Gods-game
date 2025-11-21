import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Mesh } from 'three';

interface FoodSourceProps {
  position: [number, number, number];
}

export const FoodSource: React.FC<FoodSourceProps> = ({ position }) => {
  const meshRef = useRef<Mesh>(null);
  
  // Variación aleatoria ligera en tamaño y posición Y para naturalidad
  const scale = useMemo(() => 0.8 + Math.random() * 0.4, []);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Pequeña animación de flotación o viento
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      {/* Arbusto (Cubo low poly verde oscuro) */}
      <mesh ref={meshRef} position={[0, 0.4, 0]} scale={[scale, scale, scale]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.9} /> {/* Azul oscuro/Morado como bayas */}
      </mesh>
      {/* Tallo pequeño */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4]} />
        <meshStandardMaterial color="#3f2e00" />
      </mesh>
    </group>
  );
};