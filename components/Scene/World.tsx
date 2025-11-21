import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Human } from './Human';
import { FoodSource } from './FoodSource';
import { House } from './House';
import { Bonfire } from './Bonfire';
import { ResourceNode } from './ResourceNode';
import { Tree } from './Tree';
import { Animal } from './Animal';

export const World: React.FC = () => {
  const humans = useGameStore((state) => state.humans);
  const foods = useGameStore((state) => state.foods);
  const houses = useGameStore((state) => state.houses);
  const bonfires = useGameStore((state) => state.bonfires);
  const resources = useGameStore((state) => state.resources);
  const trees = useGameStore((state) => state.trees);
  const animals = useGameStore((state) => state.animals);

  const ISLAND_SIZE = 160; 

  return (
    <group>
      {/* --- OCEANO (Base de Agua) --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#1e40af" roughness={0.2} metalness={0.1} /> 
      </mesh>

      {/* --- CONTINENTE / ISLA (Tierra Firme) --- */}
      <mesh position={[0, -0.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[ISLAND_SIZE, 1, ISLAND_SIZE]} />
        <meshStandardMaterial color="#5da662" roughness={1} />
      </mesh>
      
      <mesh position={[0, -0.8, 0]} receiveShadow>
         <boxGeometry args={[ISLAND_SIZE + 5, 1, ISLAND_SIZE + 5]} />
         <meshStandardMaterial color="#eab308" roughness={1} />
      </mesh>

      <gridHelper args={[ISLAND_SIZE, 40, 0xffffff, 0x334433]} position={[0, 0.01, 0]} />

      {/* Objetos del juego */}
      {trees.map(tree => (
          <Tree key={tree.id} position={tree.position} stage={tree.stage} />
      ))}

      {bonfires.map((bonfire) => (
        <Bonfire key={bonfire.id} position={bonfire.position} />
      ))}

      {resources.map((res) => (
        <ResourceNode 
            key={res.id} 
            type={res.type} 
            position={res.position} 
            durability={res.durability} 
        />
      ))}

      {houses.map((house) => (
        <House
          key={house.id}
          position={house.position}
          isOccupied={house.ownerId !== null}
          level={house.level}
        />
      ))}

      {foods.map((food) => (
        <FoodSource 
            key={food.id} 
            position={food.position} 
            type={food.type}
            capacity={food.capacity}
        />
      ))}
      
      {animals.map(animal => (
          <Animal key={animal.id} id={animal.id} position={animal.position} type={animal.type} />
      ))}

      {humans.map((human) => (
        <Human 
          key={human.id} 
          id={human.id}
          position={human.position} 
          name={human.name}
          hunger={human.hunger}
          age={human.age}
          reproductionCooldown={human.reproductionCooldown}
          xp={human.xp}
          houseId={human.houseId}
        />
      ))}
    </group>
  );
};