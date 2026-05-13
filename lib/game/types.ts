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

// HaxBall authentic physics constants (60 ticks per second)
// Source: https://github.com/haxball/haxball-issues/wiki/Stadium-(.hbs)-File

export const PHYSICS = {
  // Player physics (authentic HaxBall values)
  player: {
    radius: 15,
    invMass: 0.5,
    damping: 0.96,
    kickingDamping: 0.96,
    acceleration: 0.1,
    kickingAcceleration: 0.07,
    kickStrength: 5,
    kickback: 0,
    bCoef: 0.5, // bounce coefficient
  },
  
  // Ball physics (authentic HaxBall values)
  ball: {
    radius: 10,
    invMass: 1,
    damping: 0.99,
    bCoef: 0.5,
  },
  
  // Wall physics
  wall: {
    bCoef: 0.5,
  },
  
  // Goal post physics
  post: {
    radius: 8,
    bCoef: 0.5,
  },
} as const;

// Game field configuration (scaled for web)
export const GAME_CONFIG = {
  width: 840,
  height: 400,
  // Legacy values for compatibility
  playerRadius: PHYSICS.player.radius,
  ballRadius: PHYSICS.ball.radius,
  goalWidth: 30, // depth of goal
  goalHeight: 120,
  playerSpeed: PHYSICS.player.acceleration,
  kickForce: PHYSICS.player.kickStrength,
  friction: PHYSICS.player.damping,
  ballFriction: PHYSICS.ball.damping,
  kickCooldown: 100, // ms between kicks
  gameDuration: 180, // 3 minutes
  tickRate: 60,
} as const;

export const FIELD_CONFIG = {
  padding: 40,
  lineWidth: 2,
  centerCircleRadius: 60,
  cornerRadius: 0,
  goalAreaWidth: 50,
  goalAreaHeight: 100,
} as const;
