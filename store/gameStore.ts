import { create } from 'zustand';

export interface HumanData {
  id: number;
  name: string;
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
  
  // Actions
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  addLog: (message: string) => void;
  tick: () => void; // Call this in the game loop
}

export const useGameStore = create<GameState>((set) => ({
  year: 0,
  population: 2,
  populationLabel: '(Adán y Eva)',
  weather: 'Soleado',
  isPlaying: false,
  speed: 1,
  logs: ['[Sistema] Mundo generado exitosamente.', '[Historia] La era de la humanidad comienza.'],
  
  // Inicializamos a Adán y Eva cerca del centro
  humans: [
    { id: 1, name: 'Adán', position: [-2, 0, 0] },
    { id: 2, name: 'Eva', position: [2, 0, 0] }
  ],

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setSpeed: (speed: number) => set({ speed }),
  
  addLog: (message: string) => set((state) => ({ 
    logs: [message, ...state.logs].slice(0, 50) // Keep last 50 logs
  })),

  tick: () => set((state) => ({
    year: state.year + 1
  })),
}));