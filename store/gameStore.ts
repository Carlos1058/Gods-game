import { create } from 'zustand';

export interface HumanData {
  id: number;
  name: string;
  position: [number, number, number];
  hunger: number; // 0 - 100
}

export interface FoodData {
  id: number;
  position: [number, number, number];
}

export interface GameState {
  year: number;
  population: number;
  populationLabel: string;
  weather: string;
  isPlaying: boolean;
  speed: number; // 1x, 2x, 3x
  logs: string[];
  humans: HumanData[];
  foods: FoodData[];
  
  // Actions
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  addLog: (message: string) => void;
  tick: () => void;
  eatFood: (humanId: number, foodId: number) => void;
}

const NAMES = ['Adán', 'Eva', 'Caín', 'Abel', 'Set', 'Nora', 'Ava', 'Leo', 'Zoe', 'Max'];
const generateRandomPosition = (): [number, number, number] => [
  (Math.random() - 0.5) * 35,
  0,
  (Math.random() - 0.5) * 35
];

// Generar comida inicial
const INITIAL_FOODS = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  position: generateRandomPosition()
}));

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
    { id: 1, name: 'Adán', position: [-2, 0, 0], hunger: 100 },
    { id: 2, name: 'Eva', position: [2, 0, 0], hunger: 100 }
  ],

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setSpeed: (speed: number) => set({ speed }),
  
  addLog: (message: string) => set((state) => ({ 
    logs: [message, ...state.logs].slice(0, 50)
  })),

  eatFood: (humanId, foodId) => {
    set((state) => {
      // Verificar si la comida aún existe
      const foodExists = state.foods.find(f => f.id === foodId);
      if (!foodExists) return state;

      // Recuperar hambre del humano
      const newHumans = state.humans.map(h => 
        h.id === humanId ? { ...h, hunger: 100 } : h
      );

      // Eliminar comida
      const newFoods = state.foods.filter(f => f.id !== foodId);

      // Log opcional (para no spamear, solo logueamos si hay poca comida o es crítico, por ahora lo omitimos para limpieza)
      
      return {
        humans: newHumans,
        foods: newFoods
      };
    });
  },

  tick: () => set((state) => {
    // Decremento de hambre (Ajustado para el tick rate)
    const HUNGER_DECAY = 0.3; 

    let deathOccurred = false;
    let newLogs = [...state.logs];

    // Actualizar Humanos
    const survivingHumans = state.humans.map(h => ({
      ...h,
      hunger: h.hunger - HUNGER_DECAY
    })).filter(h => {
      if (h.hunger <= 0) {
        deathOccurred = true;
        newLogs.unshift(`[Muerte] ${h.name} ha muerto de hambre.`);
        return false;
      }
      return true;
    });

    if (deathOccurred && newLogs.length > 50) {
        newLogs = newLogs.slice(0, 50);
    }

    return {
      year: state.year + 0.01, // El año avanza más lento relativo a los ticks
      humans: survivingHumans,
      population: survivingHumans.length,
      logs: deathOccurred ? newLogs : state.logs
    };
  }),
}));