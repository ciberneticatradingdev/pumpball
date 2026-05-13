"use client";

import { useState } from "react";
import { Lobby } from "@/components/Lobby";
import { GameRoom } from "@/components/GameRoom";

export default function Home() {
  const [gameInfo, setGameInfo] = useState<{ name: string; roomId: string } | null>(null);

  const handleJoinGame = (name: string, roomId: string) => {
    setGameInfo({ name, roomId });
  };

  const handleLeaveGame = () => {
    setGameInfo(null);
  };

  if (gameInfo) {
    return (
      <GameRoom 
        playerName={gameInfo.name} 
        roomId={gameInfo.roomId} 
        onLeave={handleLeaveGame}
      />
    );
  }

  return <Lobby onJoinGame={handleJoinGame} />;
}
