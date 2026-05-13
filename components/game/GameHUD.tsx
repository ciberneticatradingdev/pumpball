"use client";

import { GameState } from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface GameHUDProps {
  gameState: GameState | null;
  localPlayerId: string | null;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function GameHUD({ gameState, localPlayerId }: GameHUDProps) {
  if (!gameState) {
    return (
      <div className="flex items-center justify-center gap-8 py-4">
        <div className="text-muted-foreground">Waiting for game state...</div>
      </div>
    );
  }

  const localPlayer = localPlayerId ? gameState.players[localPlayerId] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Score and Timer */}
      <div className="flex items-center justify-center gap-4">
        {/* Red Team Score */}
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-team-red shadow-lg shadow-red-500/30" />
          <span className="text-4xl font-mono font-bold text-team-red">
            {gameState.score.red}
          </span>
        </div>

        {/* Timer */}
        <div className={cn(
          "px-6 py-2 rounded-lg bg-card border border-border",
          gameState.timeRemaining <= 30 && "animate-pulse border-destructive"
        )}>
          <span className={cn(
            "text-2xl font-mono font-bold",
            gameState.timeRemaining <= 30 ? "text-destructive" : "text-foreground"
          )}>
            {formatTime(gameState.timeRemaining)}
          </span>
        </div>

        {/* Blue Team Score */}
        <div className="flex items-center gap-3">
          <span className="text-4xl font-mono font-bold text-team-blue">
            {gameState.score.blue}
          </span>
          <div className="w-4 h-4 rounded-full bg-team-blue shadow-lg shadow-blue-500/30" />
        </div>
      </div>

      {/* Game Status */}
      <div className="flex items-center justify-center gap-4 text-sm">
        {!gameState.isPlaying && gameState.timeRemaining === 180 && (
          <div className="px-3 py-1 rounded-full bg-accent text-accent-foreground font-medium">
            Waiting to start...
          </div>
        )}
        {!gameState.isPlaying && gameState.timeRemaining < 180 && (
          <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-medium">
            Game Over
          </div>
        )}
        {gameState.isPaused && (
          <div className="px-3 py-1 rounded-full bg-destructive text-destructive-foreground font-medium">
            Paused - Need more players
          </div>
        )}
        {localPlayer && (
          <div className={cn(
            "px-3 py-1 rounded-full font-medium",
            localPlayer.team === "red" 
              ? "bg-team-red/20 text-team-red border border-team-red/30" 
              : "bg-team-blue/20 text-team-blue border border-team-blue/30"
          )}>
            You: {localPlayer.name} ({localPlayer.team.toUpperCase()})
          </div>
        )}
      </div>

      {/* Player List */}
      <div className="flex justify-center gap-8 text-xs">
        <div className="flex flex-col items-end gap-1">
          <span className="text-team-red font-semibold mb-1">RED TEAM</span>
          {Object.values(gameState.players)
            .filter(p => p.team === "red")
            .map(p => (
              <span 
                key={p.id} 
                className={cn(
                  "text-muted-foreground",
                  p.id === localPlayerId && "text-accent font-bold"
                )}
              >
                {p.name}
              </span>
            ))}
        </div>
        <div className="w-px bg-border" />
        <div className="flex flex-col items-start gap-1">
          <span className="text-team-blue font-semibold mb-1">BLUE TEAM</span>
          {Object.values(gameState.players)
            .filter(p => p.team === "blue")
            .map(p => (
              <span 
                key={p.id} 
                className={cn(
                  "text-muted-foreground",
                  p.id === localPlayerId && "text-accent font-bold"
                )}
              >
                {p.name}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
