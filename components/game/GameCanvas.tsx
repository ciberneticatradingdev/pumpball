"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { GameState, PlayerInput, GAME_CONFIG } from "@/lib/game/types";
import type { PumpballScene } from "@/lib/game/createPumpballScene";

interface GameCanvasProps {
  gameState: GameState | null;
  localPlayerId: string | null;
  onInput: (input: PlayerInput) => void;
}

export function GameCanvas({ gameState, localPlayerId, onInput }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<PumpballScene | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleInput = useCallback((input: PlayerInput) => {
    onInput(input);
  }, [onInput]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Dynamic import of Phaser to avoid SSR issues
    const initGame = async () => {
      const Phaser = await import("phaser");
      const { PumpballScene } = await import("@/lib/game/createPumpballScene");

      if (!containerRef.current || gameRef.current) return;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: GAME_CONFIG.width,
        height: GAME_CONFIG.height,
        parent: containerRef.current,
        backgroundColor: "#2d5a27",
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: PumpballScene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      };

      gameRef.current = new Phaser.Game(config);

      gameRef.current.events.once("ready", () => {
        const loadedScene = gameRef.current?.scene.getScene("PumpballScene") as unknown as PumpballScene | null;
        sceneRef.current = loadedScene;
        if (loadedScene) {
          loadedScene.setInputCallback(handleInput);
        }
        setIsLoaded(true);
      });
    };

    initGame();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, [handleInput]);

  // Update game state
  useEffect(() => {
    if (sceneRef.current && gameState) {
      sceneRef.current.setGameState(gameState);
    }
  }, [gameState]);

  // Update local player ID
  useEffect(() => {
    if (sceneRef.current && localPlayerId) {
      sceneRef.current.setLocalPlayerId(localPlayerId);
    }
  }, [localPlayerId]);

  return (
    <div className="relative">
      <div 
        ref={containerRef} 
        id="game-container"
        className="w-full max-w-[900px] aspect-[9/5] bg-secondary rounded-lg overflow-hidden shadow-2xl"
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary rounded-lg">
          <div className="text-muted-foreground animate-pulse">Loading game...</div>
        </div>
      )}
    </div>
  );
}
