import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';

interface HouseProps {
  position: [number, number, number];
  isOccupied: boolean;
  level: number; // 1, 2, 3
}

export const House: React.FC<HouseProps> = ({ position, isOccupied, level }) => {
  
  const materialProps = useMemo(() => {
      switch(level) {
          case 2: // Piedra
              return { color: '#94a3b8', roof: '#475569', scale: 1.1 };
          case 3: // Hierro
              return { color: '#1e293b', roof: '#0f172a', scale: 1.2 };
          default: // Madera
              return { color: isOccupied ? "#d4a373" : "#a3a3a3", roof: "#8d6e63", scale: 1 };
      }
  }, [level, isOccupied]);

  return (
    <group position={position} scale={[materialProps.scale, materialProps.scale, materialProps.scale]}>
      {/* Base / Paredes */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color={materialProps.color} roughness={level > 2 ? 0.3 : 0.8} metalness={level > 2 ? 0.6 : 0} /> 
      </mesh>

      {/* Decoración de Fortaleza (Nivel 3) */}
      {level === 3 && (
          <>
            <mesh position={[0.7, 1.5, 0.7]}>
                <boxGeometry args={[0.2, 0.5, 0.2]} />
                <meshStandardMaterial color="#000" />
            </mesh>
            <mesh position={[-0.7, 1.5, 0.7]}>
                <boxGeometry args={[0.2, 0.5, 0.2]} />
                <meshStandardMaterial color="#000" />
            </mesh>
          </>
      )}

      {/* Puerta */}
      <mesh position={[0, 0.6, 0.76]}>
        <planeGeometry args={[0.5, 1]} />
        <meshStandardMaterial color={level === 3 ? "#7f1d1d" : "#3e2723"} />
      </mesh>

      {/* Techo Triangular */}
      <mesh position={[0, 1.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[0, 1.1, 1, 4]} />
        <meshStandardMaterial color={materialProps.roof} roughness={1} />
      </mesh>

      {/* Indicador de estado */}
      {!isOccupied && (
        <Text 
            position={[0, 3, 0]} 
            fontSize={0.5} 
            color="#fbbf24" 
            outlineWidth={0.05} 
            outlineColor="#000"
        >
            EN VENTA
        </Text>
      )}
    </group>
  );
};