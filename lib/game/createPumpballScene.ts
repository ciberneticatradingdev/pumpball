import * as Phaser from "phaser";
import { GameState, Player, GAME_CONFIG, FIELD_CONFIG, PHYSICS, PlayerInput } from "./types";

type InputCallback = (input: PlayerInput) => void;

export class PumpballScene extends Phaser.Scene {
  private playerSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private ballSprite: Phaser.GameObjects.Container | null = null;
  private fieldGraphics: Phaser.GameObjects.Graphics | null = null;
  private goalGraphics: Phaser.GameObjects.Graphics | null = null;
  
  private currentState: GameState | null = null;
  private localPlayerId: string | null = null;
  private inputCallback: InputCallback | null = null;
  
  private keys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    kick: Phaser.Input.Keyboard.Key;
    kickAlt: Phaser.Input.Keyboard.Key;
  } | null = null;
  
  private lastInput: PlayerInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    kick: false,
  };

  constructor() {
    super({ key: "PumpballScene" });
  }

  create() {
    this.drawField();
    this.drawGoals();
    this.createBall();
    this.setupInput();
  }

  private drawField() {
    const { width, height } = GAME_CONFIG;
    const { padding, lineWidth, centerCircleRadius, goalAreaWidth, goalAreaHeight } = FIELD_CONFIG;
    
    this.fieldGraphics = this.add.graphics();
    const g = this.fieldGraphics;
    
    // Field background (green)
    g.fillStyle(0x2d5a27, 1);
    g.fillRect(0, 0, width, height);
    
    // Darker grass pattern
    g.fillStyle(0x265222, 0.3);
    for (let i = 0; i < width; i += 40) {
      g.fillRect(i, 0, 20, height);
    }
    
    // Field outline
    g.lineStyle(lineWidth, 0xffffff, 0.8);
    g.strokeRect(padding, padding, width - padding * 2, height - padding * 2);
    
    // Center line
    g.lineBetween(width / 2, padding, width / 2, height - padding);
    
    // Center circle
    g.strokeCircle(width / 2, height / 2, centerCircleRadius);
    
    // Center dot
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(width / 2, height / 2, 5);
    
    // Goal areas
    const goalAreaTop = (height - goalAreaHeight) / 2;
    
    // Left goal area
    g.strokeRect(padding, goalAreaTop, goalAreaWidth, goalAreaHeight);
    
    // Right goal area
    g.strokeRect(width - padding - goalAreaWidth, goalAreaTop, goalAreaWidth, goalAreaHeight);
    
    // Corner arcs
    const cornerRadius = 15;
    g.beginPath();
    g.arc(padding, padding, cornerRadius, 0, Math.PI / 2);
    g.strokePath();
    
    g.beginPath();
    g.arc(width - padding, padding, cornerRadius, Math.PI / 2, Math.PI);
    g.strokePath();
    
    g.beginPath();
    g.arc(padding, height - padding, cornerRadius, -Math.PI / 2, 0);
    g.strokePath();
    
    g.beginPath();
    g.arc(width - padding, height - padding, cornerRadius, Math.PI, Math.PI * 1.5);
    g.strokePath();
  }

  private drawGoals() {
    const { width, height, goalWidth, goalHeight } = GAME_CONFIG;
    const { padding } = FIELD_CONFIG;
    const postRadius = PHYSICS.post.radius;
    
    this.goalGraphics = this.add.graphics();
    const g = this.goalGraphics;
    
    const goalTop = (height - goalHeight) / 2;
    const goalBottom = (height + goalHeight) / 2;
    
    // Left goal (red team defends)
    g.lineStyle(4, 0xef4444, 1);
    g.lineBetween(padding - goalWidth, goalTop, padding - goalWidth, goalBottom);
    g.lineBetween(padding - goalWidth, goalTop, padding, goalTop);
    g.lineBetween(padding - goalWidth, goalBottom, padding, goalBottom);
    
    // Left goal net
    g.fillStyle(0xef4444, 0.2);
    g.fillRect(padding - goalWidth, goalTop, goalWidth, goalHeight);
    
    // Left goal posts
    g.fillStyle(0xffffff, 1);
    g.fillCircle(padding, goalTop, postRadius);
    g.fillCircle(padding, goalBottom, postRadius);
    
    // Right goal (blue team defends)
    g.lineStyle(4, 0x3b82f6, 1);
    g.lineBetween(width - padding + goalWidth, goalTop, width - padding + goalWidth, goalBottom);
    g.lineBetween(width - padding, goalTop, width - padding + goalWidth, goalTop);
    g.lineBetween(width - padding, goalBottom, width - padding + goalWidth, goalBottom);
    
    // Right goal net
    g.fillStyle(0x3b82f6, 0.2);
    g.fillRect(width - padding, goalTop, goalWidth, goalHeight);
    
    // Right goal posts
    g.fillStyle(0xffffff, 1);
    g.fillCircle(width - padding, goalTop, postRadius);
    g.fillCircle(width - padding, goalBottom, postRadius);
  }

  private createBall() {
    const { width, height } = GAME_CONFIG;
    const ballRadius = PHYSICS.ball.radius;
    
    const container = this.add.container(width / 2, height / 2);
    
    // Ball shadow
    const shadow = this.add.circle(2, 2, ballRadius, 0x000000, 0.3);
    container.add(shadow);
    
    // Ball body
    const ball = this.add.circle(0, 0, ballRadius, 0xffffff, 1);
    ball.setStrokeStyle(2, 0x333333);
    container.add(ball);
    
    // Ball pattern (pentagon pattern like real soccer ball)
    const pattern = this.add.graphics();
    pattern.fillStyle(0x333333, 1);
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * (ballRadius * 0.5);
      const y = Math.sin(angle) * (ballRadius * 0.5);
      pattern.fillCircle(x, y, 2);
    }
    container.add(pattern);
    
    this.ballSprite = container;
    container.setDepth(10);
  }

  private createPlayer(id: string, player: Player): Phaser.GameObjects.Container {
    const playerRadius = PHYSICS.player.radius;
    const isLocal = id === this.localPlayerId;
    
    const container = this.add.container(player.x, player.y);
    
    // Player shadow
    const shadow = this.add.ellipse(3, 5, playerRadius * 2, playerRadius, 0x000000, 0.3);
    container.add(shadow);
    
    // Team color
    const teamColor = player.team === "red" ? 0xef4444 : 0x3b82f6;
    const teamColorLight = player.team === "red" ? 0xfca5a5 : 0x93c5fd;
    
    // Player body
    const body = this.add.circle(0, 0, playerRadius, teamColor, 1);
    body.setStrokeStyle(3, isLocal ? 0xfbbf24 : teamColorLight);
    container.add(body);
    
    // Player inner circle (shirt)
    const inner = this.add.circle(0, 0, playerRadius * 0.6, teamColorLight, 0.3);
    container.add(inner);
    
    // Direction indicator
    const indicator = this.add.triangle(playerRadius * 0.7, 0, 0, -5, 0, 5, 8, 0, 0xffffff, 0.8);
    container.add(indicator);
    
    // Player name
    const nameText = this.add.text(0, -playerRadius - 12, player.name, {
      fontSize: "12px",
      fontFamily: "system-ui, sans-serif",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    });
    nameText.setOrigin(0.5, 0.5);
    container.add(nameText);
    
    // Local player indicator
    if (isLocal) {
      const arrow = this.add.triangle(0, -playerRadius - 25, -6, 0, 6, 0, 0, 8, 0xfbbf24, 1);
      container.add(arrow);
    }
    
    container.setDepth(5);
    container.setData("indicator", indicator);
    container.setData("body", body);
    
    return container;
  }

  private setupInput() {
    if (!this.input.keyboard) return;
    
    this.keys = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      kick: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      kickAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
    };
    
    // Also support arrow keys
    const arrowUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const arrowDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const arrowLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    const arrowRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    
    this.keys.up.on("down", () => this.updateInput());
    this.keys.up.on("up", () => this.updateInput());
    this.keys.down.on("down", () => this.updateInput());
    this.keys.down.on("up", () => this.updateInput());
    this.keys.left.on("down", () => this.updateInput());
    this.keys.left.on("up", () => this.updateInput());
    this.keys.right.on("down", () => this.updateInput());
    this.keys.right.on("up", () => this.updateInput());
    this.keys.kick.on("down", () => this.updateInput());
    this.keys.kick.on("up", () => this.updateInput());
    this.keys.kickAlt.on("down", () => this.updateInput());
    this.keys.kickAlt.on("up", () => this.updateInput());
    
    arrowUp.on("down", () => this.updateInput());
    arrowUp.on("up", () => this.updateInput());
    arrowDown.on("down", () => this.updateInput());
    arrowDown.on("up", () => this.updateInput());
    arrowLeft.on("down", () => this.updateInput());
    arrowLeft.on("up", () => this.updateInput());
    arrowRight.on("down", () => this.updateInput());
    arrowRight.on("up", () => this.updateInput());
  }

  private updateInput() {
    if (!this.keys || !this.input.keyboard) return;
    
    const arrowUp = this.input.keyboard.keys[Phaser.Input.Keyboard.KeyCodes.UP];
    const arrowDown = this.input.keyboard.keys[Phaser.Input.Keyboard.KeyCodes.DOWN];
    const arrowLeft = this.input.keyboard.keys[Phaser.Input.Keyboard.KeyCodes.LEFT];
    const arrowRight = this.input.keyboard.keys[Phaser.Input.Keyboard.KeyCodes.RIGHT];
    
    const input: PlayerInput = {
      up: this.keys.up.isDown || arrowUp?.isDown || false,
      down: this.keys.down.isDown || arrowDown?.isDown || false,
      left: this.keys.left.isDown || arrowLeft?.isDown || false,
      right: this.keys.right.isDown || arrowRight?.isDown || false,
      kick: this.keys.kick.isDown || this.keys.kickAlt.isDown,
    };
    
    // Only send if input changed
    if (
      input.up !== this.lastInput.up ||
      input.down !== this.lastInput.down ||
      input.left !== this.lastInput.left ||
      input.right !== this.lastInput.right ||
      input.kick !== this.lastInput.kick
    ) {
      this.lastInput = input;
      this.inputCallback?.(input);
    }
  }

  update() {
    if (!this.currentState) return;
    
    // Update ball position
    if (this.ballSprite) {
      this.ballSprite.setPosition(this.currentState.ball.x, this.currentState.ball.y);
      
      // Rotate ball based on velocity
      const speed = Math.sqrt(
        this.currentState.ball.vx ** 2 + this.currentState.ball.vy ** 2
      );
      if (speed > 0.1) {
        this.ballSprite.rotation += speed * 0.02;
      }
    }
    
    // Update player positions
    const currentPlayerIds = new Set(Object.keys(this.currentState.players));
    
    // Remove players that left
    for (const [id, sprite] of this.playerSprites) {
      if (!currentPlayerIds.has(id)) {
        sprite.destroy();
        this.playerSprites.delete(id);
      }
    }
    
    // Update or create players
    for (const [id, player] of Object.entries(this.currentState.players)) {
      let sprite = this.playerSprites.get(id);
      
      if (!sprite) {
        sprite = this.createPlayer(id, player);
        this.playerSprites.set(id, sprite);
      }
      
      // Smooth position update
      const lerpFactor = 0.3;
      sprite.x += (player.x - sprite.x) * lerpFactor;
      sprite.y += (player.y - sprite.y) * lerpFactor;
      
      // Update direction indicator
      const indicator = sprite.getData("indicator") as Phaser.GameObjects.Triangle;
      if (indicator && (player.vx !== 0 || player.vy !== 0)) {
        const angle = Math.atan2(player.vy, player.vx);
        indicator.rotation = angle;
      }
      
      // Show kick effect
      const body = sprite.getData("body") as Phaser.GameObjects.Arc;
      if (body) {
        const baseColor = player.team === "red" ? 0xef4444 : 0x3b82f6;
        const kickColor = 0xfbbf24;
        body.fillColor = player.isKicking ? kickColor : baseColor;
      }
    }
  }

  // Public methods for external control
  setGameState(state: GameState) {
    this.currentState = state;
  }

  setLocalPlayerId(id: string) {
    this.localPlayerId = id;
    
    // Recreate all player sprites to update local indicator
    for (const [playerId, sprite] of this.playerSprites) {
      const player = this.currentState?.players[playerId];
      if (player) {
        sprite.destroy();
        const newSprite = this.createPlayer(playerId, player);
        this.playerSprites.set(playerId, newSprite);
      }
    }
  }

  setInputCallback(callback: InputCallback) {
    this.inputCallback = callback;
  }
}
