import { create } from 'zustand';

export interface HumanData {
  id: number;
  name: string;
  position: [number, number, number];
  hunger: number;
  age: number;
  reproductionCooldown: number;
  xp: number;
  houseId: number | null; 
}

export interface FoodData {
  id: number;
  position: [number, number, number];
  type: 'wild' | 'farm';
  capacity: number;
}

export interface HouseData {
  id: number;
  position: [number, number, number];
  ownerId: number | null;
  level: number; // 1: Madera, 2: Piedra, 3: Hierro
}

export interface BonfireData {
  id: number;
  position: [number, number, number];
}

export interface ResourceData {
  id: number;
  position: [number, number, number];
  type: 'rock' | 'iron';
  durability: number;
}

export interface TreeData {
    id: number;
    position: [number, number, number];
    stage: 0 | 1 | 2; // 0: Brote, 1: Joven, 2: Adulto (Talable)
    growthProgress: number;
}

export interface AnimalData {
    id: number;
    position: [number, number, number];
    type: 'rabbit' | 'chicken';
    age: number;
    health: number;
    reproductionCooldown: number;
}

export interface GameState {
  year: number;
  timeOfDay: number; // 0.0 a 24.0
  population: number;
  populationLabel: string;
  weather: string;
  isPlaying: boolean;
  speed: number;
  logs: string[];
  
  humans: HumanData[];
  foods: FoodData[];
  houses: HouseData[];
  bonfires: BonfireData[];
  resources: ResourceData[];
  trees: TreeData[];
  animals: AnimalData[];
  
  inventory: {
    wood: number;
    stone: number;
    iron: number;
  };
  
  // Actions
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  addLog: (message: string) => void;
  tick: () => void;
  eatFood: (humanId: number, foodId: number) => void;
  huntAnimal: (humanId: number, animalId: number) => void;
  attemptReproduction: (parent1Id: number, parent2Id: number, location: [number, number, number]) => void;
  buildHouse: (humanId: number, position: [number, number, number]) => void;
  claimHouse: (humanId: number, houseId: number) => void;
  buildBonfire: (position: [number, number, number]) => void;
  mineResource: (humanId: number, resourceId: number) => void;
  chopTree: (humanId: number, treeId: number) => void;
}

export const humanPositions = new Map<number, [number, number, number]>();
export const animalPositions = new Map<number, [number, number, number]>();

const NAMES = ['Adán', 'Eva', 'Caín', 'Abel', 'Set', 'Nora', 'Ava', 'Leo', 'Zoe', 'Max', 'Iris', 'Noa', 'Lía', 'Hugo', 'Alma', 'Río', 'Sol', 'Luna', 'Kai', 'Mía'];

const getRandomName = () => NAMES[Math.floor(Math.random() * NAMES.length)];

const generateRandomPosition = (range = 140): [number, number, number] => [
  (Math.random() - 0.5) * range,
  0,
  (Math.random() - 0.5) * range
];

// Generar comida inicial
const INITIAL_FOODS: FoodData[] = Array.from({ length: 60 }).map((_, i) => ({
  id: i,
  position: generateRandomPosition(),
  type: 'wild',
  capacity: 1
}));

const generateInitialResources = (): ResourceData[] => {
  const resources: ResourceData[] = [];
  for (let i = 0; i < 30; i++) {
    resources.push({ id: 1000 + i, position: generateRandomPosition(), type: 'rock', durability: 20 });
  }
  for (let i = 0; i < 15; i++) {
    resources.push({ id: 2000 + i, position: generateRandomPosition(), type: 'iron', durability: 30 });
  }
  return resources;
};

const generateInitialTrees = (): TreeData[] => {
    const trees: TreeData[] = [];
    for (let i = 0; i < 100; i++) {
        trees.push({
            id: 3000 + i,
            position: generateRandomPosition(150),
            stage: Math.random() > 0.3 ? 2 : 1,
            growthProgress: 0
        });
    }
    return trees;
};

const generateInitialAnimals = (): AnimalData[] => {
    const animals: AnimalData[] = [];
    for(let i=0; i < 20; i++) {
        animals.push({
            id: 4000 + i,
            position: generateRandomPosition(),
            type: Math.random() > 0.5 ? 'rabbit' : 'chicken',
            age: Math.random() * 5,
            health: 20,
            reproductionCooldown: 0
        });
    }
    return animals;
};

const INITIAL_RESOURCES = generateInitialResources();
const INITIAL_TREES = generateInitialTrees();
const INITIAL_ANIMALS = generateInitialAnimals();

humanPositions.set(1, [-5, 0, 0]);
humanPositions.set(2, [5, 0, 0]);

export const useGameStore = create<GameState>((set, get) => ({
  year: 0,
  timeOfDay: 12, 
  population: 2,
  populationLabel: '(Adán y Eva)',
  weather: 'Soleado',
  isPlaying: false,
  speed: 1,
  logs: ['[Sistema] Ecosistema generado.', '[Naturaleza] Los animales pueblan la tierra.'],
  
  foods: INITIAL_FOODS,
  houses: [],
  bonfires: [],
  resources: INITIAL_RESOURCES,
  trees: INITIAL_TREES,
  animals: INITIAL_ANIMALS,
  
  humans: [
    { id: 1, name: 'Adán', position: [-5, 0, 0], hunger: 100, age: 20, reproductionCooldown: 0, xp: 2, houseId: null },
    { id: 2, name: 'Eva', position: [5, 0, 0], hunger: 100, age: 20, reproductionCooldown: 0, xp: 2, houseId: null }
  ],

  inventory: {
    wood: 50, // Madera inicial para primeras casas
    stone: 0,
    iron: 0
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setSpeed: (speed: number) => set({ speed }),
  
  addLog: (message: string) => set((state) => ({ 
    logs: [message, ...state.logs].slice(0, 50)
  })),

  buildHouse: (humanId, position) => {
    set((state) => {
      const humanIndex = state.humans.findIndex(h => h.id === humanId);
      if (humanIndex === -1) return state;
      
      // Costo de construcción
      if (state.inventory.wood < 10) return state;

      const human = state.humans[humanIndex];

      const MIN_DIST = 3.0;
      const collision = [...state.foods, ...state.houses, ...state.bonfires, ...state.resources, ...state.trees].some(obj => {
        const dx = obj.position[0] - position[0];
        const dz = obj.position[2] - position[2];
        return (dx*dx + dz*dz) < MIN_DIST * MIN_DIST;
      });

      if (collision) return state;

      const newHouse: HouseData = {
        id: Date.now() + Math.random(),
        position: [position[0], 0, position[2]],
        ownerId: humanId,
        level: 1 
      };

      const newHumans = [...state.humans];
      newHumans[humanIndex] = { ...human, hunger: human.hunger - 30, houseId: newHouse.id };

      return {
        houses: [...state.houses, newHouse],
        humans: newHumans,
        inventory: { ...state.inventory, wood: state.inventory.wood - 10 },
        logs: [`[Construcción] ¡${human.name} usó 10 Madera para construir una casa!`, ...state.logs].slice(0, 50)
      };
    });
  },

  claimHouse: (humanId, houseId) => {
    set((state) => {
      const hIndex = state.humans.findIndex(h => h.id === humanId);
      const houseIndex = state.houses.findIndex(h => h.id === houseId);
      
      if (hIndex === -1 || houseIndex === -1) return state;
      if (state.houses[houseIndex].ownerId !== null) return state; 

      const newHumans = [...state.humans];
      newHumans[hIndex] = { ...state.humans[hIndex], houseId: houseId };

      const newHouses = [...state.houses];
      newHouses[houseIndex] = { ...state.houses[houseIndex], ownerId: humanId };

      return { humans: newHumans, houses: newHouses };
    });
  },

  buildBonfire: (position) => {
      set(state => {
          if (state.inventory.wood < 5) return state;
          
          const newBonfire: BonfireData = {
              id: Date.now() + Math.random(),
              position: position
          };
          return {
              bonfires: [...state.bonfires, newBonfire],
              inventory: { ...state.inventory, wood: state.inventory.wood - 5 },
              logs: [`[Tecnología] ¡Se ha encendido una Hoguera! (-5 Madera)`, ...state.logs].slice(0, 50)
          };
      })
  },

  mineResource: (humanId, resourceId) => {
    set((state) => {
      const hIndex = state.humans.findIndex(h => h.id === humanId);
      const rIndex = state.resources.findIndex(r => r.id === resourceId);

      if (hIndex === -1 || rIndex === -1) return state;

      const human = state.humans[hIndex];
      const resource = state.resources[rIndex];
      
      const newResources = [...state.resources];
      const newResource = { ...resource, durability: resource.durability - 1 };
      
      let newInventory = { ...state.inventory };
      let logs = state.logs;

      if (resource.type === 'rock') newInventory.stone += 1;
      if (resource.type === 'iron') newInventory.iron += 1;

      if (newResource.durability <= 0) {
        newResources.splice(rIndex, 1);
        logs = [`[Minería] Veta de ${resource.type === 'rock' ? 'Piedra' : 'Hierro'} agotada.`, ...state.logs].slice(0, 50);
      } else {
        newResources[rIndex] = newResource;
      }

      const newHumans = [...state.humans];
      newHumans[hIndex] = { ...human, hunger: human.hunger - 1, xp: human.xp + 0.2 };

      return { resources: newResources, inventory: newInventory, humans: newHumans, logs: logs };
    });
  },

  chopTree: (humanId, treeId) => {
      set(state => {
          const hIndex = state.humans.findIndex(h => h.id === humanId);
          const tIndex = state.trees.findIndex(t => t.id === treeId);
          
          if (hIndex === -1 || tIndex === -1) return state;
          
          const tree = state.trees[tIndex];
          // Solo se pueden talar árboles adultos (stage 2)
          if (tree.stage < 2) return state;

          const newTrees = [...state.trees];
          newTrees.splice(tIndex, 1); // Árbol talado instantáneo por ahora para simplificar

          const newInventory = { ...state.inventory, wood: state.inventory.wood + 5 };
          const newHumans = [...state.humans];
          newHumans[hIndex] = { ...newHumans[hIndex], hunger: newHumans[hIndex].hunger - 2, xp: newHumans[hIndex].xp + 0.5 };

          return {
              trees: newTrees,
              inventory: newInventory,
              humans: newHumans,
              logs: [`[Leñador] Árbol talado (+5 Madera)`, ...state.logs].slice(0, 50)
          };
      });
  },

  eatFood: (humanId, foodId) => {
    set((state) => {
      const foodIndex = state.foods.findIndex(f => f.id === foodId);
      const humanIndex = state.humans.findIndex(h => h.id === humanId);
      
      if (foodIndex === -1 || humanIndex === -1) return state;

      const human = state.humans[humanIndex];
      const food = state.foods[foodIndex];
      let newFoods = [...state.foods];
      let newLogs = state.logs;

      // Agricultura
      if (human.xp > 4 && food.type === 'wild' && Math.random() < 0.5) {
        const newFarm: FoodData = { ...food, type: 'farm', capacity: 5 };
        newFoods[foodIndex] = newFarm;
        newLogs = [`[Avance] ¡${human.name} ha creado un Huerto!`, ...state.logs].slice(0, 50);
      }

      const currentFood = newFoods[foodIndex]; 
      const updatedCapacity = currentFood.capacity - 1;

      if (updatedCapacity <= 0) {
        newFoods = newFoods.filter(f => f.id !== foodId);
      } else {
        newFoods[foodIndex] = { ...currentFood, capacity: updatedCapacity };
      }

      const newHumans = [...state.humans];
      newHumans[humanIndex] = { ...human, hunger: 100, xp: human.xp + 1 };

      return { humans: newHumans, foods: newFoods, logs: newLogs };
    });
  },

  huntAnimal: (humanId, animalId) => {
      set(state => {
          const hIndex = state.humans.findIndex(h => h.id === humanId);
          const aIndex = state.animals.findIndex(a => a.id === animalId);
          if (hIndex === -1 || aIndex === -1) return state;

          const animal = state.animals[aIndex];
          const newAnimals = [...state.animals];
          newAnimals.splice(aIndex, 1);

          const newHumans = [...state.humans];
          newHumans[hIndex] = { 
              ...newHumans[hIndex], 
              hunger: 100, // Llena completamente
              xp: newHumans[hIndex].xp + 2 
          };

          return {
              animals: newAnimals,
              humans: newHumans,
              logs: [`[Caza] ¡${newHumans[hIndex].name} cazó un ${animal.type}! (Carne fresca)`, ...state.logs].slice(0, 50)
          };
      });
  },

  attemptReproduction: (parent1Id, parent2Id, location) => {
    set((state) => {
      const h1 = state.humans.find(h => h.id === parent1Id);
      const h2 = state.humans.find(h => h.id === parent2Id);

      if (!h1 || !h2) return state;
      if (h1.reproductionCooldown > 0 || h2.reproductionCooldown > 0) return state;
      if (h1.hunger < 30 || h2.hunger < 30) return state;

      const REPRODUCTION_COOLDOWN = 40;
      const babyName = getRandomName();
      const babyId = Date.now() + Math.random();
      const babyPos: [number, number, number] = [
        location[0] + (Math.random() - 0.5) * 2,
        0,
        location[2] + (Math.random() - 0.5) * 2
      ];

      humanPositions.set(babyId, babyPos);

      const newBaby: HumanData = {
        id: babyId,
        name: babyName,
        position: babyPos,
        hunger: 100,
        age: 0,
        reproductionCooldown: REPRODUCTION_COOLDOWN + 20,
        xp: 0, 
        houseId: null
      };

      const newHumans = state.humans.map(h => {
        if (h.id === parent1Id || h.id === parent2Id) {
          return { ...h, reproductionCooldown: REPRODUCTION_COOLDOWN, hunger: h.hunger - 20 };
        }
        return h;
      });

      return {
        humans: [...newHumans, newBaby],
        population: newHumans.length + 1,
        logs: [`[Nacimiento] ¡${babyName} ha nacido!`, ...state.logs].slice(0, 50)
      };
    });
  },

  tick: () => set((state) => {
    const MAX_ENTITIES = 200;
    let newTime = state.timeOfDay + 0.1;
    if (newTime >= 24) newTime = 0;
    const isNight = newTime > 19 || newTime < 6;

    let deathOccurred = false;
    let newLogs = [...state.logs];
    let newHouses = state.houses;
    let newBonfires = state.bonfires;
    let newInventory = { ...state.inventory };
    let newTrees = [...state.trees];
    let newAnimals = [...state.animals];

    // --- EVOLUCIÓN DE FLORA (ÁRBOLES) ---
    // Crecimiento y expansión
    if (Math.random() < 0.3) { // 30% chance per tick update some tree
        const treeIndex = Math.floor(Math.random() * newTrees.length);
        if (newTrees[treeIndex]) {
            const t = newTrees[treeIndex];
            if (t.stage < 2) {
                // Crecer
                t.growthProgress += 0.05;
                if (t.growthProgress >= 1) {
                    t.stage += 1;
                    t.growthProgress = 0;
                }
            } else if (t.stage === 2 && newTrees.length < MAX_ENTITIES) {
                // Reproducir (Soltar semilla)
                if (Math.random() < 0.01) { // Baja probabilidad
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 3 + Math.random() * 5;
                    const seedPos: [number, number, number] = [
                        t.position[0] + Math.cos(angle) * dist,
                        0,
                        t.position[2] + Math.sin(angle) * dist
                    ];
                    newTrees.push({
                        id: Date.now() + Math.random(),
                        position: seedPos,
                        stage: 0,
                        growthProgress: 0
                    });
                }
            }
        }
    }

    // --- EVOLUCIÓN DE FAUNA (ANIMALES) ---
    // Movimiento simulado (actualizamos posiciones en el store cada X ticks para lógica, 
    // aunque visualmente se interpolen en el componente)
    newAnimals = newAnimals.map(a => {
        // Movimiento aleatorio browniano simple
        if (Math.random() < 0.1) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 0.5;
            let nx = a.position[0] + Math.cos(angle) * dist;
            let nz = a.position[2] + Math.sin(angle) * dist;
            // Limites del mapa
            nx = Math.max(-75, Math.min(75, nx));
            nz = Math.max(-75, Math.min(75, nz));
            
            const newPos: [number, number, number] = [nx, 0, nz];
            animalPositions.set(a.id, newPos);
            return { ...a, position: newPos, reproductionCooldown: Math.max(0, a.reproductionCooldown - 1) };
        }
        return { ...a, reproductionCooldown: Math.max(0, a.reproductionCooldown - 1) };
    });

    // Reproducción Animal
    if (newAnimals.length < 50 && Math.random() < 0.05) {
         const parent = newAnimals[Math.floor(Math.random() * newAnimals.length)];
         if (parent && parent.reproductionCooldown === 0) {
             // Busca pareja cerca
             const mate = newAnimals.find(other => 
                 other.id !== parent.id && 
                 other.type === parent.type && 
                 other.reproductionCooldown === 0 &&
                 (other.position[0]-parent.position[0])**2 + (other.position[2]-parent.position[2])**2 < 25
             );
             
             if (mate) {
                 newAnimals.push({
                     id: Date.now() + Math.random(),
                     position: [parent.position[0], 0, parent.position[2]],
                     type: parent.type,
                     age: 0,
                     health: 10,
                     reproductionCooldown: 100
                 });
                 parent.reproductionCooldown = 100;
                 mate.reproductionCooldown = 100;
             }
         }
    }

    // --- Lógica de Mejora de Casas ---
    const houseToUpgrade = newHouses.find(h => 
        (h.level === 1 && newInventory.stone >= 10) || 
        (h.level === 2 && newInventory.iron >= 10)
    );

    let housesUpdated = false;
    if (houseToUpgrade && Math.random() < 0.1) { 
        if (houseToUpgrade.level === 1 && newInventory.stone >= 10) {
            newInventory.stone -= 10;
            newHouses = newHouses.map(h => h.id === houseToUpgrade.id ? { ...h, level: 2 } : h);
            newLogs.unshift(`[Evolución] ¡Casa mejorada a PIEDRA!`);
            housesUpdated = true;
        } else if (houseToUpgrade.level === 2 && newInventory.iron >= 10) {
            newInventory.iron -= 10;
            newHouses = newHouses.map(h => h.id === houseToUpgrade.id ? { ...h, level: 3 } : h);
            newLogs.unshift(`[Evolución] ¡Casa mejorada a FORTALEZA DE HIERRO!`);
            housesUpdated = true;
        }
    }

    // --- Gestión de Humanos ---
    let survivingHumans = state.humans.map(h => {
      let currentDecay = 0.15;
      let isProtected = false;
      const myPos = humanPositions.get(h.id);

      if (myPos) {
          if (h.houseId) {
              const myHouse = newHouses.find(house => house.id === h.houseId);
              if (myHouse) {
                  const distSq = (myPos[0] - myHouse.position[0])**2 + (myPos[2] - myHouse.position[2])**2;
                  if (distSq < 9) {
                      isProtected = true;
                      if (myHouse.level === 2) currentDecay -= 0.12; 
                      if (myHouse.level === 3) currentDecay -= 0.15; 
                  }
              }
          }

          if (!isProtected && isNight) {
              const nearBonfire = state.bonfires.some(b => 
                  (myPos[0] - b.position[0])**2 + (myPos[2] - b.position[2])**2 < 16
              );
              if (nearBonfire) isProtected = true;
              else currentDecay *= 2.0;
          }

          // Invención de Hogueras (requiere madera)
          if (isNight && !isProtected && h.xp > 5 && newInventory.wood >= 5 && Math.random() < 0.05) {
                const bonfirePos: [number, number, number] = [myPos[0], 0, myPos[2]];
                newBonfires = [...newBonfires, { id: Date.now() + Math.random(), position: bonfirePos }];
                newInventory.wood -= 5;
                newLogs.unshift(`[Tecnología] ¡${h.name} ha creado una Hoguera!`);
          }
      }

      return {
        ...h,
        hunger: h.hunger - currentDecay,
        age: h.age + 0.05, 
        reproductionCooldown: Math.max(0, h.reproductionCooldown - 1)
      };
    }).filter(h => {
      if (h.hunger <= 0) {
        deathOccurred = true;
        newLogs.unshift(`[Muerte] ${h.name} ha muerto.`);
        humanPositions.delete(h.id);
        if (h.houseId) {
          newHouses = newHouses.map(house => 
            house.id === h.houseId ? { ...house, ownerId: null } : house
          );
        }
        return false;
      }
      return true;
    });

    // Reaparición de comida básica (arbustos) si es muy baja
    let currentFoods = [...state.foods];
    if (currentFoods.length < 40 && Math.random() < 0.2) {
       currentFoods.push({ id: Date.now() + Math.random(), position: generateRandomPosition(), type: 'wild', capacity: 1 });
    }

    if (deathOccurred || housesUpdated) {
        if (newLogs.length > 50) newLogs = newLogs.slice(0, 50);
    }

    return {
      year: state.year + 0.02,
      timeOfDay: newTime,
      humans: survivingHumans,
      foods: currentFoods,
      houses: housesUpdated || deathOccurred ? newHouses : state.houses,
      bonfires: newBonfires,
      resources: state.resources,
      trees: newTrees,
      animals: newAnimals,
      inventory: housesUpdated || newBonfires.length !== state.bonfires.length ? newInventory : state.inventory,
      population: survivingHumans.length,
      logs: (deathOccurred || housesUpdated || newBonfires.length !== state.bonfires.length) ? newLogs : state.logs
    };
  }),
}));