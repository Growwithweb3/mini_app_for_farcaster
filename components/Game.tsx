// Main Game component - manages game state and controls

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine } from '@/lib/game/GameEngine';
import { GameCanvas } from './GameCanvas';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const Game: React.FC = () => {
  const [gameEngine] = useState(() => new GameEngine(CANVAS_WIDTH, CANVAS_HEIGHT));
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const gameEngineRef = useRef(gameEngine);

  // Update ref when game engine changes
  useEffect(() => {
    gameEngineRef.current = gameEngine;
  }, [gameEngine]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setKeys((prev) => new Set(prev).add(e.key));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setKeys((prev) => {
          const newKeys = new Set(prev);
          newKeys.delete(e.key);
          return newKeys;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle player movement and shooting
  useEffect(() => {
    const interval = setInterval(() => {
      const engine = gameEngineRef.current;
      if (engine.gameState.isGameOver || engine.gameState.isPaused) {
        return;
      }

      // Movement
      if (keys.has('ArrowUp')) {
        engine.base.moveUp(CANVAS_HEIGHT);
      }
      if (keys.has('ArrowDown')) {
        engine.base.moveDown(CANVAS_HEIGHT);
      }

      // Shooting (handled separately to avoid rapid fire)
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [keys]);

  // Handle shooting with ArrowRight - reduced fire rate
  useEffect(() => {
    let shootInterval: NodeJS.Timeout;
    
    if (keys.has('ArrowRight')) {
      const engine = gameEngineRef.current;
      if (!engine.gameState.isGameOver && !engine.gameState.isPaused) {
        engine.shoot();
        // Allow shooting every 350ms (reduced from 200ms for better balance)
        shootInterval = setInterval(() => {
          if (keys.has('ArrowRight') && !engine.gameState.isGameOver && !engine.gameState.isPaused) {
            engine.shoot();
          }
        }, 350);
      }
    }

    return () => {
      if (shootInterval) {
        clearInterval(shootInterval);
      }
    };
  }, [keys]);

  // Mobile controls
  const handleMoveUp = useCallback(() => {
    gameEngine.base.moveUp(CANVAS_HEIGHT);
  }, []);

  const handleMoveDown = useCallback(() => {
    gameEngine.base.moveDown(CANVAS_HEIGHT);
  }, []);

  const lastShootTimeRef = useRef<number>(0);
  const SHOOT_COOLDOWN = 350; // Same cooldown as keyboard (350ms)

  const handleShoot = useCallback(() => {
    const now = Date.now();
    if (
      !gameEngine.gameState.isGameOver && 
      !gameEngine.gameState.isPaused &&
      now - lastShootTimeRef.current >= SHOOT_COOLDOWN
    ) {
      lastShootTimeRef.current = now;
      gameEngine.shoot();
    }
  }, [gameEngine]);

  const handleReset = useCallback(() => {
    gameEngine.reset();
  }, [gameEngine]);

  const handlePause = useCallback(() => {
    gameEngine.gameState.isPaused = !gameEngine.gameState.isPaused;
    // Force re-render
    setKeys((prev) => new Set(prev));
  }, [gameEngine]);

  // Calculate health percentage
  const healthPercent = (gameEngine.gameState.playerHealth / gameEngine.gameState.maxPlayerHealth) * 100;
  const levelTimeRemaining = Math.max(
    0,
    Math.ceil((gameEngine.gameState.levelDuration - (Date.now() - gameEngine.gameState.levelStartTime)) / 1000)
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      {/* Game Info Bar */}
      <div className="w-full max-w-4xl mb-4 bg-gray-800 rounded-lg p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm text-gray-400">Score: </span>
              <span className="text-xl font-bold">{gameEngine.gameState.score}</span>
            </div>
            <div>
              <span className="text-sm text-gray-400">Level: </span>
              <span className="text-xl font-bold">{gameEngine.gameState.level}</span>
            </div>
            <div>
              <span className="text-sm text-gray-400">Time: </span>
              <span className="text-xl font-bold">{levelTimeRemaining}s</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Health: </span>
              <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    healthPercent > 50 ? 'bg-green-500' : healthPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
              <span className="text-sm">{gameEngine.gameState.playerHealth}/{gameEngine.gameState.maxPlayerHealth}</span>
            </div>
            <button
              onClick={handlePause}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {gameEngine.gameState.isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative">
        <GameCanvas
          gameEngine={gameEngine}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />

        {/* Game Over Overlay */}
        {gameEngine.gameState.isGameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
              <p className="text-2xl mb-4">Final Score: {gameEngine.gameState.score}</p>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-bold transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {gameEngine.gameState.isPaused && !gameEngine.gameState.isGameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Paused</h2>
              <button
                onClick={handlePause}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-bold transition-colors"
              >
                Resume
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="md:hidden mt-4 w-full max-w-4xl">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-center items-center gap-4">
            <button
              onTouchStart={handleMoveUp}
              onMouseDown={handleMoveUp}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg text-white font-bold text-xl transition-colors"
            >
              ↑ Up
            </button>
            <button
              onTouchStart={handleShoot}
              onMouseDown={handleShoot}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg text-white font-bold text-xl transition-colors"
            >
              🔫 Shoot
            </button>
            <button
              onTouchStart={handleMoveDown}
              onMouseDown={handleMoveDown}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg text-white font-bold text-xl transition-colors"
            >
              ↓ Down
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Controls Info */}
      <div className="hidden md:block mt-4 text-white text-center">
        <p className="text-sm text-gray-400">
          Controls: ↑ ↓ Arrow Keys to Move | → Arrow Key to Shoot
        </p>
      </div>
    </div>
  );
};

