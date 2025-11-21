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
  
  inventory: {
    stone: number;
    iron: number;
  };
  
  // Actions
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  addLog: (message: string) => void;
  tick: () => void;
  eatFood: (humanId: number, foodId: number) => void;
  attemptReproduction: (parent1Id: number, parent2Id: number, location: [number, number, number]) => void;
  buildHouse: (humanId: number, position: [number, number, number]) => void;
  claimHouse: (humanId: number, houseId: number) => void;
  buildBonfire: (position: [number, number, number]) => void;
  mineResource: (humanId: number, resourceId: number) => void;
}

export const humanPositions = new Map<number, [number, number, number]>();

const NAMES = ['Adán', 'Eva', 'Caín', 'Abel', 'Set', 'Nora', 'Ava', 'Leo', 'Zoe', 'Max', 'Iris', 'Noa', 'Lía', 'Hugo', 'Alma', 'Río', 'Sol', 'Luna', 'Kai', 'Mía'];

const getRandomName = () => NAMES[Math.floor(Math.random() * NAMES.length)];

const generateRandomPosition = (): [number, number, number] => [
  (Math.random() - 0.5) * 140,
  0,
  (Math.random() - 0.5) * 140
];

// Generar comida inicial
const INITIAL_FOODS: FoodData[] = Array.from({ length: 100 }).map((_, i) => ({
  id: i,
  position: generateRandomPosition(),
  type: 'wild',
  capacity: 1
}));

// Generar Recursos Iniciales (Piedra y Hierro)
const generateInitialResources = (): ResourceData[] => {
  const resources: ResourceData[] = [];
  
  // 40 Rocas
  for (let i = 0; i < 40; i++) {
    resources.push({
      id: 1000 + i,
      position: generateRandomPosition(),
      type: 'rock',
      durability: 20
    });
  }
  
  // 20 Vetas de Hierro
  for (let i = 0; i < 20; i++) {
    resources.push({
      id: 2000 + i,
      position: generateRandomPosition(),
      type: 'iron',
      durability: 30
    });
  }
  return resources;
};

const INITIAL_RESOURCES = generateInitialResources();

// Inicializar posiciones
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
  logs: ['[Sistema] Continente generado.', '[Historia] Comienza la Edad de Hierro.'],
  
  foods: INITIAL_FOODS,
  houses: [],
  bonfires: [],
  resources: INITIAL_RESOURCES,
  
  humans: [
    { id: 1, name: 'Adán', position: [-5, 0, 0], hunger: 100, age: 20, reproductionCooldown: 0, xp: 2, houseId: null },
    { id: 2, name: 'Eva', position: [5, 0, 0], hunger: 100, age: 20, reproductionCooldown: 0, xp: 2, houseId: null }
  ],

  inventory: {
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
      const human = state.humans[humanIndex];

      // Validación de colisiones con todo tipo de objetos
      const MIN_DIST = 2.5;
      const collision = [...state.foods, ...state.houses, ...state.bonfires, ...state.resources].some(obj => {
        const dx = obj.position[0] - position[0];
        const dz = obj.position[2] - position[2];
        return (dx*dx + dz*dz) < MIN_DIST * MIN_DIST;
      });

      if (collision) return state;

      const newHouse: HouseData = {
        id: Date.now() + Math.random(),
        position: [position[0], 0, position[2]],
        ownerId: humanId,
        level: 1 // Nivel inicial: Madera
      };

      const newHumans = [...state.humans];
      newHumans[humanIndex] = { ...human, hunger: human.hunger - 30, houseId: newHouse.id };

      return {
        houses: [...state.houses, newHouse],
        humans: newHumans,
        logs: [`[Construcción] ¡${human.name} ha fundado un hogar!`, ...state.logs].slice(0, 50)
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

      return {
        humans: newHumans,
        houses: newHouses
      };
    });
  },

  buildBonfire: (position) => {
      set(state => {
          const newBonfire: BonfireData = {
              id: Date.now() + Math.random(),
              position: position
          };
          return {
              bonfires: [...state.bonfires, newBonfire],
              logs: [`[Tecnología] ¡Se ha encendido una Hoguera!`, ...state.logs].slice(0, 50)
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
      
      // Probabilidad de éxito basada en XP? Por ahora siempre pica 1
      const newResources = [...state.resources];
      const newResource = { ...resource, durability: resource.durability - 1 };
      
      let newInventory = { ...state.inventory };
      let logs = state.logs;

      // Recolectar material
      if (resource.type === 'rock') newInventory.stone += 1;
      if (resource.type === 'iron') newInventory.iron += 1;

      if (newResource.durability <= 0) {
        newResources.splice(rIndex, 1); // Eliminar recurso agotado
        logs = [`[Minería] Veta de ${resource.type === 'rock' ? 'Piedra' : 'Hierro'} agotada.`, ...state.logs].slice(0, 50);
      } else {
        newResources[rIndex] = newResource;
      }

      // Costo de energía para el humano y ganancia de XP
      const newHumans = [...state.humans];
      newHumans[hIndex] = { 
          ...human, 
          hunger: human.hunger - 1, // Minar cansa
          xp: human.xp + 0.2
      };

      return {
        resources: newResources,
        inventory: newInventory,
        humans: newHumans,
        logs: logs
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
      newHumans[humanIndex] = {
        ...human,
        hunger: 100,
        xp: human.xp + 1
      };

      return {
        humans: newHumans,
        foods: newFoods,
        logs: newLogs
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
    const HUNGER_DECAY_BASE = 0.15; 
    const RESTING_BONUS = 0.10; 
    const COLD_DAMAGE_MULTIPLIER = 2.0; 
    const MAX_FOOD = 200; 
    const FOOD_SPAWN_RATE = 0.2; 

    let newTime = state.timeOfDay + 0.1;
    if (newTime >= 24) newTime = 0;
    const isNight = newTime > 19 || newTime < 6;

    let deathOccurred = false;
    let newLogs = [...state.logs];
    let newHouses = state.houses;
    let newBonfires = state.bonfires;
    let newInventory = { ...state.inventory };
    
    // --- Lógica de Mejora de Casas (Evolución) ---
    // Intentamos mejorar una casa por tick si hay recursos
    // Costo Lvl 2: 10 Piedra. Costo Lvl 3: 10 Hierro.
    const houseToUpgrade = newHouses.find(h => 
        (h.level === 1 && newInventory.stone >= 10) || 
        (h.level === 2 && newInventory.iron >= 10)
    );

    let housesUpdated = false;
    if (houseToUpgrade && Math.random() < 0.1) { // 10% chance per tick to upgrade to avoid instant drain
        if (houseToUpgrade.level === 1 && newInventory.stone >= 10) {
            newInventory.stone -= 10;
            newHouses = newHouses.map(h => h.id === houseToUpgrade.id ? { ...h, level: 2 } : h);
            newLogs.unshift(`[Evolución] ¡Una casa ha sido mejorada a PIEDRA!`);
            housesUpdated = true;
        } else if (houseToUpgrade.level === 2 && newInventory.iron >= 10) {
            newInventory.iron -= 10;
            newHouses = newHouses.map(h => h.id === houseToUpgrade.id ? { ...h, level: 3 } : h);
            newLogs.unshift(`[Evolución] ¡Una casa ha sido mejorada a FORTALEZA DE HIERRO!`);
            housesUpdated = true;
        }
    }

    // 1. Gestión de Humanos
    let survivingHumans = state.humans.map(h => {
      let currentDecay = HUNGER_DECAY_BASE;
      let isProtected = false;
      const myPos = humanPositions.get(h.id);

      if (myPos) {
          // Verificar cercanía a CASA y su NIVEL
          if (h.houseId) {
              const myHouse = newHouses.find(house => house.id === h.houseId);
              if (myHouse) {
                  const distSq = (myPos[0] - myHouse.position[0])**2 + (myPos[2] - myHouse.position[2])**2;
                  if (distSq < 9) {
                      isProtected = true;
                      // Bonificación por nivel de casa
                      let bonus = RESTING_BONUS;
                      if (myHouse.level === 2) bonus = 0.12; // Piedra protege más
                      if (myHouse.level === 3) bonus = 0.15; // Hierro protege mucho más
                      currentDecay -= bonus;
                  }
              }
          }

          if (!isProtected) {
             const nearBonfire = state.bonfires.some(b => 
                 (myPos[0] - b.position[0])**2 + (myPos[2] - b.position[2])**2 < 16
             );
             if (nearBonfire) isProtected = true;
          }

          if (isNight && !isProtected) {
              currentDecay *= COLD_DAMAGE_MULTIPLIER;
              // Invención de Hogueras
              if (h.xp > 8 && Math.random() < 0.02) {
                   const alreadyHasBonfire = state.bonfires.some(b => 
                       (myPos[0] - b.position[0])**2 + (myPos[2] - b.position[2])**2 < 100
                   );
                   if (!alreadyHasBonfire) {
                       const bonfirePos: [number, number, number] = [myPos[0], 0, myPos[2]];
                       newBonfires = [...newBonfires, { id: Date.now() + Math.random(), position: bonfirePos }];
                       newLogs.unshift(`[Tecnología] ¡${h.name} ha creado una Hoguera!`);
                   }
              }
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
        newLogs.unshift(`[Muerte] ${h.name} ha muerto. XP: ${h.xp.toFixed(1)}`);
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

    let currentFoods = [...state.foods];
    if (currentFoods.length < MAX_FOOD && Math.random() < FOOD_SPAWN_RATE) {
       currentFoods.push({
         id: Date.now() + Math.random(),
         position: generateRandomPosition(),
         type: 'wild',
         capacity: 1
       });
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
      resources: state.resources, // Los recursos se actualizan en mineResource
      inventory: housesUpdated ? newInventory : state.inventory,
      population: survivingHumans.length,
      logs: (deathOccurred || housesUpdated || newBonfires.length !== state.bonfires.length) ? newLogs : state.logs
    };
  }),
}));