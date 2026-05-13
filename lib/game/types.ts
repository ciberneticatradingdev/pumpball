export type Team = "red" | "blue";

export interface Player {
  id: string;
  name: string;
  team: Team;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isKicking: boolean;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameState {
  players: Record<string, Player>;
  ball: Ball;
  score: {
    red: number;
    blue: number;
  };
  timeRemaining: number;
  isPlaying: boolean;
  isPaused: boolean;
}

export interface RoomState {
  id: string;
  name: string;
  players: Record<string, Player>;
  gameState: GameState | null;
  maxPlayers: number;
  isGameStarted: boolean;
}

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  kick: boolean;
}

export type MessageType =
  | "join"
  | "leave"
  | "input"
  | "state"
  | "goal"
  | "start"
  | "reset"
  | "chat"
  | "welcome"
  | "gameover";

export interface GameMessage {
  type: MessageType;
  payload: unknown;
  timestamp: number;
}

// Game constants
export const GAME_CONFIG = {
  width: 900,
  height: 500,
  playerRadius: 20,
  ballRadius: 12,
  goalWidth: 10,
  goalHeight: 140,
  playerSpeed: 5,
  kickForce: 15,
  friction: 0.98,
  ballFriction: 0.995,
  kickCooldown: 500,
  gameDuration: 180, // 3 minutes
  tickRate: 60,
} as const;

export const FIELD_CONFIG = {
  padding: 30,
  lineWidth: 3,
  centerCircleRadius: 70,
  cornerRadius: 20,
  goalAreaWidth: 60,
  goalAreaHeight: 180,
} as const;
