"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Users, Zap, Trophy } from "lucide-react";

interface LobbyProps {
  onJoinGame: (name: string, roomId: string) => void;
}

export function Lobby({ onJoinGame }: LobbyProps) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleQuickPlay = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    // Generate random room ID for quick play
    const quickRoomId = `quick-${Math.random().toString(36).substring(2, 8)}`;
    onJoinGame(name.trim(), quickRoomId);
  };

  const handleCreateRoom = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    setIsCreating(true);
  };

  const handleJoinRoom = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!roomId.trim()) {
      alert("Please enter a room code");
      return;
    }
    onJoinGame(name.trim(), roomId.trim().toUpperCase());
  };

  const handleStartWithRoom = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    onJoinGame(name.trim(), roomId);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Logo and Title */}
      <div className="text-center mb-12">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
            <Trophy className="w-12 h-12 text-background" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-team-red animate-bounce" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-team-blue animate-bounce delay-100" />
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-2">
          PUMP<span className="text-primary">BALL</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Fast-paced multiplayer soccer
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl">
        {/* Name Input */}
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Your Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={15}
            className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {!isCreating ? (
          <>
            {/* Quick Play Button */}
            <button
              onClick={handleQuickPlay}
              className="w-full mb-4 px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/30"
            >
              <Zap className="w-5 h-5" />
              Quick Play
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Room Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCreateRoom}
                className="px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-medium rounded-lg flex items-center justify-center gap-2 transition-all border border-border hover:border-primary"
              >
                <Users className="w-4 h-4" />
                Create Room
              </button>
              <div className="relative">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Room Code"
                  maxLength={8}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-center font-mono uppercase"
                />
              </div>
            </div>

            {roomId && !isCreating && (
              <button
                onClick={handleJoinRoom}
                className="w-full mt-3 px-4 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-medium rounded-lg transition-all"
              >
                Join Room {roomId}
              </button>
            )}
          </>
        ) : (
          /* Room Created State */
          <div className="text-center">
            <div className="mb-4 p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Share this code with friends:</p>
              <p className="text-3xl font-mono font-bold text-primary tracking-wider">{roomId}</p>
            </div>
            <button
              onClick={handleStartWithRoom}
              className="w-full px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-5 h-5" />
              Start Game
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="w-full mt-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Use WASD or Arrow Keys to move, Space or X to kick</p>
      </div>
    </div>
  );
}
