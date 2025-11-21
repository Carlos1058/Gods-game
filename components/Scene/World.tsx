import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Human } from './Human';
import { FoodSource } from './FoodSource';

export const World: React.FC = () => {
  const humans = useGameStore((state) => state.humans);
  const foods = useGameStore((state) => state.foods);

  return (
    <group>
      {/* Suelo plano simple (Low Poly Style) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#5da662" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Grid Helper para referencia visual */}
      <gridHelper args={[50, 50, 0xffffff, 0x334433]} position={[0, 0.01, 0]} />

      {/* Recursos (Comida) */}
      {foods.map((food) => (
        <FoodSource key={food.id} position={food.position} />
      ))}

      {/* Renderizado de Agentes (Humanos) */}
      {humans.map((human) => (
        <Human 
          key={human.id} 
          id={human.id}
          position={human.position} 
          name={human.name}
          hunger={human.hunger}
        />
      ))}
    </group>
  );
};