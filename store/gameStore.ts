import { create } from 'zustand';

export interface HumanData {
  id: number;
  name: string;
  position: [number, number, number];
  hunger: number;
  age: number;
  reproductionCooldown: number;
  xp: number; // Nuevo sistema de experiencia
}

export interface FoodData {
  id: number;
  position: [number, number, number];
  type: 'wild' | 'farm'; // Diferenciación visual y lógica
  capacity: number; // Usos restantes
}

export interface GameState {
  year: number;
  population: number;
  populationLabel: string;
  weather: string;
  isPlaying: boolean;
  speed: number;
  logs: string[];
  humans: HumanData[];
  foods: FoodData[];
  
  // Actions
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  addLog: (message: string) => void;
  tick: () => void;
  eatFood: (humanId: number, foodId: number) => void;
  attemptReproduction: (parent1Id: number, parent2Id: number, location: [number, number, number]) => void;
}

export const humanPositions = new Map<number, [number, number, number]>();

const NAMES = ['Adán', 'Eva', 'Caín', 'Abel', 'Set', 'Nora', 'Ava', 'Leo', 'Zoe', 'Max', 'Iris', 'Noa', 'Lía', 'Hugo', 'Alma', 'Río', 'Sol', 'Luna', 'Kai', 'Mía'];

const getRandomName = () => NAMES[Math.floor(Math.random() * NAMES.length)];

const generateRandomPosition = (): [number, number, number] => [
  (Math.random() - 0.5) * 35,
  0,
  (Math.random() - 0.5) * 35
];

// Generar comida inicial (Salvaje, Capacidad 1)
const INITIAL_FOODS: FoodData[] = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  position: generateRandomPosition(),
  type: 'wild',
  capacity: 1
}));

// Inicializar posiciones de Adán y Eva
humanPositions.set(1, [-2, 0, 0]);
humanPositions.set(2, [2, 0, 0]);

export const useGameStore = create<GameState>((set, get) => ({
  year: 0,
  population: 2,
  populationLabel: '(Adán y Eva)',
  weather: 'Soleado',
  isPlaying: false,
  speed: 1,
  logs: ['[Sistema] Mundo generado exitosamente.', '[Historia] La era de la humanidad comienza.'],
  foods: INITIAL_FOODS,

  humans: [
    { id: 1, name: 'Adán', position: [-2, 0, 0], hunger: 100, age: 20, reproductionCooldown: 0, xp: 2 },
    { id: 2, name: 'Eva', position: [2, 0, 0], hunger: 100, age: 20, reproductionCooldown: 0, xp: 2 }
  ],

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setSpeed: (speed: number) => set({ speed }),
  
  addLog: (message: string) => set((state) => ({ 
    logs: [message, ...state.logs].slice(0, 50)
  })),

  eatFood: (humanId, foodId) => {
    set((state) => {
      const foodIndex = state.foods.findIndex(f => f.id === foodId);
      const humanIndex = state.humans.findIndex(h => h.id === humanId);
      
      if (foodIndex === -1 || humanIndex === -1) return state;

      const human = state.humans[humanIndex];
      const food = state.foods[foodIndex];
      let newFoods = [...state.foods];
      let newLogs = state.logs;

      // --- Lógica de Agricultura (BALANCEADA) ---
      let isFarmCreated = false;

      // REQUISITOS REDUCIDOS: XP > 4 y 50% de probabilidad
      if (human.xp > 4 && food.type === 'wild' && Math.random() < 0.5) {
        // Convertir a Granja
        const newFarm: FoodData = {
          ...food,
          type: 'farm',
          capacity: 5 // Capacidad inicial de un huerto
        };
        newFoods[foodIndex] = newFarm;
        newLogs = [`[Avance] ¡${human.name} ha inventado la Agricultura y creado un Huerto!`, ...state.logs].slice(0, 50);
        isFarmCreated = true;
      }

      // Consumir una porción (sea granja o salvaje)
      // Nota: Si acabamos de crear la granja, NO reducimos su capacidad inmediatamente en el turno de creación
      // para "premiar" al creador, o podemos reducirla. Vamos a reducirla para simplificar lógica.
      
      const currentFood = newFoods[foodIndex]; 
      const updatedCapacity = currentFood.capacity - 1;

      if (updatedCapacity <= 0) {
        // Se acabó la comida
        newFoods = newFoods.filter(f => f.id !== foodId);
      } else {
        newFoods[foodIndex] = { ...currentFood, capacity: updatedCapacity };
      }

      // Actualizar Humano (Hambre + XP)
      const newHumans = [...state.humans];
      newHumans[humanIndex] = {
        ...human,
        hunger: 100,
        xp: human.xp + 1 // Ganar experiencia al comer
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
        xp: 0 // Bebés nacen sin experiencia
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
        logs: [`[Nacimiento] ¡${h1.name} y ${h2.name} han tenido a ${babyName}!`, ...state.logs].slice(0, 50)
      };
    });
  },

  tick: () => set((state) => {
    const HUNGER_DECAY = 0.15; 
    const MAX_FOOD = 80; 
    const FOOD_SPAWN_RATE = 0.1; 

    let deathOccurred = false;
    let newLogs = [...state.logs];
    
    // 1. Gestión de Humanos
    let survivingHumans = state.humans.map(h => ({
      ...h,
      hunger: h.hunger - HUNGER_DECAY,
      age: h.age + 0.05, 
      reproductionCooldown: Math.max(0, h.reproductionCooldown - 1)
    })).filter(h => {
      if (h.hunger <= 0) {
        deathOccurred = true;
        newLogs.unshift(`[Muerte] ${h.name} ha muerto de hambre (XP: ${h.xp}).`);
        humanPositions.delete(h.id);
        return false;
      }
      return true;
    });

    // 2. Regeneración de Comida (Solo salvaje)
    let currentFoods = [...state.foods];
    if (currentFoods.length < MAX_FOOD && Math.random() < FOOD_SPAWN_RATE) {
       currentFoods.push({
         id: Date.now() + Math.random(),
         position: generateRandomPosition(),
         type: 'wild',
         capacity: 1
       });
    }

    if (deathOccurred) {
        if (newLogs.length > 50) newLogs = newLogs.slice(0, 50);
    }

    return {
      year: state.year + 0.02,
      humans: survivingHumans,
      foods: currentFoods,
      population: survivingHumans.length,
      logs: deathOccurred ? newLogs : state.logs
    };
  }),
}));