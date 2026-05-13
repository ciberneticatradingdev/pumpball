"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import PartySocket from "partysocket";
import { GameCanvas } from "./game/GameCanvas";
import { GameHUD } from "./game/GameHUD";
import { ControlsHelp } from "./game/ControlsHelp";
import { GameState, PlayerInput, GameMessage } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { LogOut, Play, RotateCcw, Trophy, Copy, Check } from "lucide-react";

interface GameRoomProps {
  playerName: string;
  roomId: string;
  onLeave: () => void;
}

// Use environment variable for PartyKit host, fallback to local dev
const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";

export function GameRoom({ playerName, roomId, onLeave }: GameRoomProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showGoal, setShowGoal] = useState<"red" | "blue" | null>(null);
  const [showGameOver, setShowGameOver] = useState<{ winner: "red" | "blue" | "tie"; score: { red: number; blue: number } } | null>(null);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomId,
      query: { name: playerName },
    });

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setIsConnected(true);
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as GameMessage & { payload: unknown };

        switch (message.type) {
          case "welcome": {
            const payload = message.payload as { playerId: string; gameState: GameState };
            setPlayerId(payload.playerId);
            setGameState(payload.gameState);
            break;
          }
          case "state": {
            setGameState(message.payload as GameState);
            break;
          }
          case "goal": {
            const payload = message.payload as { team: "red" | "blue" };
            setShowGoal(payload.team);
            setTimeout(() => setShowGoal(null), 2000);
            break;
          }
          case "gameover": {
            const payload = message.payload as { winner: "red" | "blue" | "tie"; score: { red: number; blue: number } };
            setShowGameOver(payload);
            break;
          }
        }
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomId, playerName]);

  const handleInput = useCallback((input: PlayerInput) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "input",
        payload: input,
        timestamp: Date.now(),
      }));
    }
  }, []);

  const handleStartGame = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "start",
        payload: null,
        timestamp: Date.now(),
      }));
    }
  };

  const handleResetGame = () => {
    setShowGameOver(null);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "reset",
        payload: null,
        timestamp: Date.now(),
      }));
    }
  };

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">
            PUMP<span className="text-primary">BALL</span>
          </h1>
          <button
            onClick={handleCopyRoomCode}
            className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-mono transition-colors"
          >
            Room: {roomId}
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-primary animate-pulse" : "bg-destructive"
          )} />
        </div>
        <button
          onClick={onLeave}
          className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Leave
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        <GameHUD gameState={gameState} localPlayerId={playerId} />
        
        <div className="relative">
          <GameCanvas 
            gameState={gameState} 
            localPlayerId={playerId}
            onInput={handleInput}
          />
          
          {/* Goal Overlay */}
          {showGoal && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg animate-pulse">
              <div className={cn(
                "text-6xl font-bold tracking-wider",
                showGoal === "red" ? "text-team-red" : "text-team-blue"
              )}>
                GOAL!
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {showGameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
              <div className="text-center p-8 bg-card rounded-xl border border-border shadow-2xl">
                <Trophy className={cn(
                  "w-16 h-16 mx-auto mb-4",
                  showGameOver.winner === "red" ? "text-team-red" : 
                  showGameOver.winner === "blue" ? "text-team-blue" : 
                  "text-accent"
                )} />
                <h2 className="text-3xl font-bold mb-2">
                  {showGameOver.winner === "tie" 
                    ? "It&apos;s a Tie!" 
                    : `${showGameOver.winner.toUpperCase()} Team Wins!`}
                </h2>
                <p className="text-xl text-muted-foreground mb-6">
                  Final Score: {showGameOver.score.red} - {showGameOver.score.blue}
                </p>
                <button
                  onClick={handleResetGame}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center gap-2 mx-auto transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <ControlsHelp />
          
          {gameState && !gameState.isPlaying && !showGameOver && (
            <button
              onClick={handleStartGame}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <Play className="w-5 h-5" />
              Start Game
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
