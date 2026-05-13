import type * as Party from "partykit/server";
import {
  GameState,
  Player,
  Ball,
  PlayerInput,
  Team,
  GAME_CONFIG,
  GameMessage,
} from "../lib/game/types";
import {
  updateBallPhysics,
  updatePlayerPhysics,
  checkPlayerBallCollision,
  checkPlayerCollision,
  checkGoal,
  getInitialBallPosition,
  getPlayerSpawnPosition,
} from "../lib/game/physics";

interface PlayerConnection {
  id: string;
  name: string;
  team: Team;
  input: PlayerInput;
  lastKickTime: number;
}

export default class GameRoom implements Party.Server {
  private players: Map<string, PlayerConnection> = new Map();
  private gameState: GameState;
  private gameLoop: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {
    this.gameState = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      players: {},
      ball: getInitialBallPosition(),
      score: { red: 0, blue: 0 },
      timeRemaining: GAME_CONFIG.gameDuration,
      isPlaying: false,
      isPaused: false,
    };
  }

  private getTeamCounts(): { red: number; blue: number } {
    let red = 0;
    let blue = 0;
    for (const player of this.players.values()) {
      if (player.team === "red") red++;
      else blue++;
    }
    return { red, blue };
  }

  private assignTeam(): Team {
    const counts = this.getTeamCounts();
    return counts.red <= counts.blue ? "red" : "blue";
  }

  private getPlayerIndex(playerId: string, team: Team): number {
    let index = 0;
    for (const [id, player] of this.players) {
      if (player.team === team) {
        if (id === playerId) return index;
        index++;
      }
    }
    return 0;
  }

  private resetPositions() {
    this.gameState.ball = getInitialBallPosition();
    
    for (const [id, connection] of this.players) {
      const index = this.getPlayerIndex(id, connection.team);
      const pos = getPlayerSpawnPosition(connection.team, index);
      
      if (this.gameState.players[id]) {
        this.gameState.players[id].x = pos.x;
        this.gameState.players[id].y = pos.y;
        this.gameState.players[id].vx = 0;
        this.gameState.players[id].vy = 0;
      }
    }
  }

  private startGame() {
    if (this.gameLoop) return;
    
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    this.resetPositions();
    
    // Game physics loop (60 FPS)
    this.gameLoop = setInterval(() => {
      this.updateGame();
      this.broadcastState();
    }, 1000 / GAME_CONFIG.tickRate);
    
    // Countdown timer (1 second intervals)
    this.countdownTimer = setInterval(() => {
      if (this.gameState.isPlaying && !this.gameState.isPaused) {
        this.gameState.timeRemaining--;
        
        if (this.gameState.timeRemaining <= 0) {
          this.endGame();
        }
      }
    }, 1000);
  }

  private endGame() {
    this.gameState.isPlaying = false;
    
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    this.broadcastState();
    
    // Send game over message
    this.room.broadcast(JSON.stringify({
      type: "gameover",
      payload: {
        winner: this.gameState.score.red > this.gameState.score.blue
          ? "red"
          : this.gameState.score.red < this.gameState.score.blue
          ? "blue"
          : "tie",
        score: this.gameState.score,
      },
      timestamp: Date.now(),
    }));
  }

  private updateGame() {
    if (!this.gameState.isPlaying || this.gameState.isPaused) return;
    
    const now = Date.now();
    
    // Update player physics based on input
    for (const [id, connection] of this.players) {
      const player = this.gameState.players[id];
      if (!player) continue;
      
      const { input } = connection;
      const { playerSpeed, kickCooldown } = GAME_CONFIG;
      
      // Apply input to velocity
      if (input.up) player.vy -= playerSpeed * 0.3;
      if (input.down) player.vy += playerSpeed * 0.3;
      if (input.left) player.vx -= playerSpeed * 0.3;
      if (input.right) player.vx += playerSpeed * 0.3;
      
      // Limit speed
      const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
      if (speed > playerSpeed) {
        player.vx = (player.vx / speed) * playerSpeed;
        player.vy = (player.vy / speed) * playerSpeed;
      }
      
      // Handle kick
      player.isKicking = input.kick && (now - connection.lastKickTime > kickCooldown);
      if (player.isKicking) {
        connection.lastKickTime = now;
      }
      
      // Update physics
      const updatedPlayer = updatePlayerPhysics(player);
      this.gameState.players[id] = updatedPlayer;
    }
    
    // Player-player collisions
    const playerIds = Object.keys(this.gameState.players);
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        const p1 = this.gameState.players[playerIds[i]];
        const p2 = this.gameState.players[playerIds[j]];
        const result = checkPlayerCollision(p1, p2);
        if (result) {
          this.gameState.players[playerIds[i]] = result[0];
          this.gameState.players[playerIds[j]] = result[1];
        }
      }
    }
    
    // Player-ball collisions
    for (const player of Object.values(this.gameState.players)) {
      const result = checkPlayerBallCollision(player, this.gameState.ball);
      if (result) {
        this.gameState.ball = result;
      }
    }
    
    // Update ball physics
    this.gameState.ball = updateBallPhysics(this.gameState.ball);
    
    // Check for goals
    const goal = checkGoal(this.gameState.ball);
    if (goal) {
      this.gameState.score[goal]++;
      
      // Broadcast goal event
      this.room.broadcast(JSON.stringify({
        type: "goal",
        payload: { team: goal, score: this.gameState.score },
        timestamp: Date.now(),
      }));
      
      // Reset positions after short delay
      setTimeout(() => {
        this.resetPositions();
      }, 1000);
    }
  }

  private broadcastState() {
    this.room.broadcast(JSON.stringify({
      type: "state",
      payload: this.gameState,
      timestamp: Date.now(),
    }));
  }

  onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const name = url.searchParams.get("name") || `Player ${this.players.size + 1}`;
    const team = this.assignTeam();
    const index = this.getPlayerIndex(connection.id, team);
    const pos = getPlayerSpawnPosition(team, index);
    
    // Create player connection data
    const playerConnection: PlayerConnection = {
      id: connection.id,
      name,
      team,
      input: { up: false, down: false, left: false, right: false, kick: false },
      lastKickTime: 0,
    };
    this.players.set(connection.id, playerConnection);
    
    // Create player in game state
    this.gameState.players[connection.id] = {
      id: connection.id,
      name,
      team,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      isKicking: false,
    };
    
    // Send welcome message with player ID
    connection.send(JSON.stringify({
      type: "welcome",
      payload: {
        playerId: connection.id,
        team,
        gameState: this.gameState,
      },
      timestamp: Date.now(),
    }));
    
    // Broadcast join event
    this.room.broadcast(JSON.stringify({
      type: "join",
      payload: { playerId: connection.id, name, team },
      timestamp: Date.now(),
    }));
    
    // Auto-start game when 2+ players
    if (this.players.size >= 2 && !this.gameState.isPlaying) {
      setTimeout(() => this.startGame(), 2000);
    }
    
    this.broadcastState();
  }

  onClose(connection: Party.Connection) {
    const player = this.players.get(connection.id);
    if (player) {
      // Broadcast leave event
      this.room.broadcast(JSON.stringify({
        type: "leave",
        payload: { playerId: connection.id, name: player.name },
        timestamp: Date.now(),
      }));
    }
    
    this.players.delete(connection.id);
    delete this.gameState.players[connection.id];
    
    // Stop game if not enough players
    if (this.players.size < 2 && this.gameState.isPlaying) {
      this.gameState.isPaused = true;
    }
    
    this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message) as GameMessage;
      
      switch (data.type) {
        case "input": {
          const player = this.players.get(sender.id);
          if (player) {
            player.input = data.payload as PlayerInput;
          }
          break;
        }
        
        case "start": {
          if (!this.gameState.isPlaying && this.players.size >= 1) {
            this.gameState = this.createInitialState();
            // Re-add all players
            for (const [id, connection] of this.players) {
              const index = this.getPlayerIndex(id, connection.team);
              const pos = getPlayerSpawnPosition(connection.team, index);
              this.gameState.players[id] = {
                id,
                name: connection.name,
                team: connection.team,
                x: pos.x,
                y: pos.y,
                vx: 0,
                vy: 0,
                isKicking: false,
              };
            }
            this.startGame();
          }
          break;
        }
        
        case "reset": {
          this.endGame();
          this.gameState = this.createInitialState();
          // Re-add all players
          for (const [id, connection] of this.players) {
            const index = this.getPlayerIndex(id, connection.team);
            const pos = getPlayerSpawnPosition(connection.team, index);
            this.gameState.players[id] = {
              id,
              name: connection.name,
              team: connection.team,
              x: pos.x,
              y: pos.y,
              vx: 0,
              vy: 0,
              isKicking: false,
            };
          }
          this.broadcastState();
          break;
        }
        
        case "chat": {
          const player = this.players.get(sender.id);
          if (player) {
            this.room.broadcast(JSON.stringify({
              type: "chat",
              payload: {
                playerId: sender.id,
                name: player.name,
                message: data.payload as string,
              },
              timestamp: Date.now(),
            }));
          }
          break;
        }
      }
    } catch (e) {
      console.error("Failed to parse message:", e);
    }
  }
}
