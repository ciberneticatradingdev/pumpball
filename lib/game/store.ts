import { create } from "zustand";
import { GameState, Player, Ball, PlayerInput, GAME_CONFIG } from "./types";
import { getInitialBallPosition } from "./physics";

interface GameStore {
  // Connection state
  playerId: string | null;
  playerName: string;
  roomId: string | null;
  isConnected: boolean;
  
  // Game state (synced from server)
  gameState: GameState | null;
  
  // Local input state
  input: PlayerInput;
  
  // UI state
  showChat: boolean;
  chatMessages: Array<{ id: string; name: string; message: string; timestamp: number }>;
  
  // Actions
  setPlayerId: (id: string | null) => void;
  setPlayerName: (name: string) => void;
  setRoomId: (id: string | null) => void;
  setConnected: (connected: boolean) => void;
  setGameState: (state: GameState | null) => void;
  setInput: (input: Partial<PlayerInput>) => void;
  toggleChat: () => void;
  addChatMessage: (id: string, name: string, message: string) => void;
  reset: () => void;
}

const initialInput: PlayerInput = {
  up: false,
  down: false,
  left: false,
  right: false,
  kick: false,
};

export const useGameStore = create<GameStore>((set) => ({
  playerId: null,
  playerName: "",
  roomId: null,
  isConnected: false,
  gameState: null,
  input: initialInput,
  showChat: false,
  chatMessages: [],
  
  setPlayerId: (id) => set({ playerId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  setRoomId: (id) => set({ roomId: id }),
  setConnected: (connected) => set({ isConnected: connected }),
  setGameState: (state) => set({ gameState: state }),
  setInput: (input) => set((s) => ({ input: { ...s.input, ...input } })),
  toggleChat: () => set((s) => ({ showChat: !s.showChat })),
  addChatMessage: (id, name, message) =>
    set((s) => ({
      chatMessages: [
        ...s.chatMessages.slice(-50),
        { id, name, message, timestamp: Date.now() },
      ],
    })),
  reset: () =>
    set({
      playerId: null,
      roomId: null,
      isConnected: false,
      gameState: null,
      input: initialInput,
      chatMessages: [],
    }),
}));

// Create initial game state for a new game
export function createInitialGameState(): GameState {
  return {
    players: {},
    ball: getInitialBallPosition(),
    score: { red: 0, blue: 0 },
    timeRemaining: GAME_CONFIG.gameDuration,
    isPlaying: false,
    isPaused: false,
  };
}
