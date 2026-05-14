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
// Source: Futsal x3 Liga de Primera (Chile) map - haxmaps_177782952888.hbs

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
    bCoef: 0.5,
  },
  
  // Ball physics (from authentic HaxBall map - disc with color FFE28E)
  ball: {
    radius: 6.25,      // Authentic HaxBall ball size
    invMass: 1.04,     // From map
    damping: 0.99,     // From map
    bCoef: 0.412,      // From map - authentic bounce
  },
  
  // Wall/Plane physics (from map traits)
  wall: {
    bCoef: 0.1,        // From map "line" trait
  },
  
  // Goal net physics
  goalNet: {
    bCoef: 0.1,        // From map "goalNet" trait
  },
  
  // Goal post physics
  post: {
    radius: 8,
    bCoef: 0.5,
  },
} as const;

// Game field configuration (from Futsal x3 Liga de Primera map)
// Map dimensions: width 620, height 300, bg 550x240
// Scaled up 1.4x for better web visibility
const SCALE = 1.4;

export const GAME_CONFIG = {
  width: Math.round(620 * SCALE),      // 868
  height: Math.round(300 * SCALE),     // 420
  fieldWidth: Math.round(550 * SCALE), // 770 - actual playing field
  fieldHeight: Math.round(240 * SCALE),// 336 - actual playing field
  // Goal dimensions (from map: y -80 to 80 = 160 height)
  goalWidth: Math.round(40 * SCALE),   // 56 - depth of goal
  goalHeight: Math.round(160 * SCALE), // 224 - height of goal opening
  // Legacy values for compatibility
  playerRadius: PHYSICS.player.radius,
  ballRadius: PHYSICS.ball.radius,
  playerSpeed: PHYSICS.player.acceleration,
  kickForce: PHYSICS.player.kickStrength,
  friction: PHYSICS.player.damping,
  ballFriction: PHYSICS.ball.damping,
  kickCooldown: 50, // ms between kicks
  gameDuration: 180, // 3 minutes
  tickRate: 60,
  // Spawn points (from map)
  redSpawnX: Math.round(-250 * SCALE),
  blueSpawnX: Math.round(250 * SCALE),
} as const;

export const FIELD_CONFIG = {
  padding: Math.round(35 * SCALE),     // Space around field
  lineWidth: 2,
  centerCircleRadius: Math.round(100 * SCALE), // kickOffRadius from map
  cornerRadius: 0,                     // From map bg
  goalAreaWidth: Math.round(50 * SCALE),
  goalAreaHeight: Math.round(100 * SCALE),
  // Colors from map
  bgColor: 0x5C5C66,    // From map bg color
  lineColor: 0xA8B0BC,  // From map vertex colors
  goalNetColor: 0x16163a, // From map goalNet color
} as const;
