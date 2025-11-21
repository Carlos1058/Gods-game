import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';

interface FoodSourceProps {
  position: [number, number, number];
  type: 'wild' | 'farm';
  capacity: number;
}

export const FoodSource: React.FC<FoodSourceProps> = ({ position, type, capacity }) => {
  const groupRef = useRef<Group>(null);
  
  // Variación aleatoria para lo "orgánico"
  const randomScale = useMemo(() => 0.8 + Math.random() * 0.4, []);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Animación sutil
      if (type === 'wild') {
        groupRef.current.rotation.y += 0.01;
      } else {
        // Las granjas son estáticas pero tal vez "respiran" un poco al ser usadas
        // O simplemente se mantienen sólidas
      }
    }
  });

  if (type === 'farm') {
    return (
      <group ref={groupRef} position={position}>
        {/* Base de tierra arada */}
        <mesh position={[0, 0.1, 0]} receiveShadow>
           <boxGeometry args={[1.2, 0.2, 1.2]} />
           <meshStandardMaterial color="#5c4033" roughness={1} />
        </mesh>
        
        {/* Plantas/Cultivos (Representan capacidad) */}
        {Array.from({ length: Math.max(1, capacity) }).map((_, i) => {
            // Distribución circular de los cultivos
            const angle = (i / Math.max(1, capacity)) * Math.PI * 2;
            const r = 0.3;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            
            return (
                <group key={i} position={[x, 0.4, z]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.1, 0.1, 0.4, 6]} />
                        <meshStandardMaterial color="#65a30d" /> {/* Lime Green */}
                    </mesh>
                    <mesh position={[0, 0.25, 0]}>
                        <sphereGeometry args={[0.15, 6, 6]} />
                        <meshStandardMaterial color="#fbbf24" /> {/* Fruta dorada/trigo */}
                    </mesh>
                </group>
            );
        })}
      </group>
    );
  }

  // Renderizado por defecto: Arbusto Salvaje
  return (
    <group ref={groupRef} position={position}>
      {/* Arbusto (Cubo low poly verde oscuro) */}
      <mesh position={[0, 0.4, 0]} scale={[randomScale, randomScale, randomScale]} castShadow>
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