"use client";

import { useEffect, useRef, useCallback } from "react";
import Phaser from "phaser";
import { PumpballScene } from "@/lib/game/PumpballScene";
import { GameState, PlayerInput, GAME_CONFIG } from "@/lib/game/types";

interface GameCanvasProps {
  gameState: GameState | null;
  localPlayerId: string | null;
  onInput: (input: PlayerInput) => void;
}

export function GameCanvas({ gameState, localPlayerId, onInput }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<PumpballScene | null>(null);

  const handleInput = useCallback((input: PlayerInput) => {
    onInput(input);
  }, [onInput]);

  useEffect(() => {
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
      sceneRef.current = gameRef.current?.scene.getScene("PumpballScene") as PumpballScene;
      if (sceneRef.current) {
        sceneRef.current.setInputCallback(handleInput);
      }
    });

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
    <div 
      ref={containerRef} 
      id="game-container"
      className="w-full max-w-[900px] aspect-[9/5] bg-secondary rounded-lg overflow-hidden shadow-2xl"
    />
  );
}
