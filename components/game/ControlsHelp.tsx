"use client";

import { Keyboard, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space } from "lucide-react";

export function ControlsHelp() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Keyboard className="w-4 h-4" />
        <span>Controls:</span>
      </div>
      
      <div className="flex items-center gap-1">
        <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">W</kbd>
        <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">A</kbd>
        <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">S</kbd>
        <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">D</kbd>
        <span className="ml-1">or</span>
        <ArrowUp className="w-4 h-4" />
        <ArrowLeft className="w-4 h-4" />
        <ArrowDown className="w-4 h-4" />
        <ArrowRight className="w-4 h-4" />
        <span className="ml-1">Move</span>
      </div>
      
      <div className="flex items-center gap-1">
        <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">
          <Space className="w-4 h-4 inline" /> Space
        </kbd>
        <span className="ml-1">or</span>
        <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">X</kbd>
        <span className="ml-1">Kick</span>
      </div>
    </div>
  );
}
