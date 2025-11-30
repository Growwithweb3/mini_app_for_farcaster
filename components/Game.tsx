// Main Game component - manages game state and controls

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine } from '@/lib/game/GameEngine';
import { GameCanvas } from './GameCanvas';
import { WelcomeScreen } from './WelcomeScreen';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const Game: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameEngine] = useState(() => new GameEngine(CANVAS_WIDTH, CANVAS_HEIGHT));
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const gameEngineRef = useRef(gameEngine);
  
  // Track Level 3 completion state
  const [level3Completed, setLevel3Completed] = useState(false);
  const [mintingState, setMintingState] = useState<{
    isLoading: boolean;
    success: boolean;
    error: string | null;
    txHash: string | null;
  }>({
    isLoading: false,
    success: false,
    error: null,
    txHash: null,
  });

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
        }, 1500);
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
  const SHOOT_COOLDOWN = 1500; 

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

  const [resetKey, setResetKey] = useState(0);
  
  const handleReset = useCallback(() => {
    gameEngine.reset();
    // Reset Level 3 completion state
    setLevel3Completed(false);
    setMintingState({
      isLoading: false,
      success: false,
      error: null,
      txHash: null,
    });
    // Force re-render by updating key
    setResetKey(prev => prev + 1);
    // Force keys state update to trigger re-render
    setKeys(new Set());
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

  // Check for Level 3 completion
  useEffect(() => {
    // Level 3 is completed when:
    // 1. Game is over (isGameOver = true)
    // 2. Current level is 3
    // 3. Level 3 time duration has elapsed
    if (
      gameEngine.gameState.isGameOver &&
      gameEngine.gameState.level === 3 &&
      !level3Completed
    ) {
      setLevel3Completed(true);
    }
  }, [gameEngine.gameState.isGameOver, gameEngine.gameState.level, level3Completed]);

  // Reset Level 3 completion when game resets
  useEffect(() => {
    if (gameEngine.gameState.level === 1 && level3Completed) {
      setLevel3Completed(false);
      setMintingState({
        isLoading: false,
        success: false,
        error: null,
        txHash: null,
      });
    }
  }, [gameEngine.gameState.level, level3Completed]);

  // Handle SBT minting
  const handleMintSBT = async () => {
    if (!walletAddress) {
      setMintingState({
        isLoading: false,
        success: false,
        error: 'Wallet address not found',
        txHash: null,
      });
      return;
    }

    setMintingState({
      isLoading: true,
      success: false,
      error: null,
      txHash: null,
    });

    try {
      const response = await fetch('/api/mint-sbt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: walletAddress,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMintingState({
          isLoading: false,
          success: true,
          error: null,
          txHash: data.txHash || null,
        });
      } else {
        setMintingState({
          isLoading: false,
          success: false,
          error: data.error || 'Failed to mint SBT',
          txHash: null,
        });
      }
    } catch (error: any) {
      setMintingState({
        isLoading: false,
        success: false,
        error: error.message || 'Network error occurred',
        txHash: null,
      });
    }
  };

  // Show welcome screen first
  if (showWelcome) {
    return (
      <WelcomeScreen
        onPlayGame={(address) => {
          setWalletAddress(address);
          setShowWelcome(false);
        }}
      />
    );
  }

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
      <div className="relative" key={resetKey}>
        <GameCanvas
          gameEngine={gameEngine}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />

        {/* Game Over Overlay */}
        {gameEngine.gameState.isGameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center text-white max-w-md px-6">
              <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
              <p className="text-2xl mb-4">Final Score: {gameEngine.gameState.score}</p>
              
              {/* Level 3 Completion - Mint SBT Section */}
              {level3Completed && gameEngine.gameState.level === 3 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/80 to-blue-900/80 rounded-lg border-2 border-purple-500">
                  <h3 className="text-2xl font-bold mb-2 text-yellow-300">🎉 Level 3 Completed!</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    You've proven you support base! Mint your SBT to commemorate this achievement.
                  </p>
                  
                  {/* Mint Button */}
                  {!mintingState.success ? (
                    <button
                      onClick={handleMintSBT}
                      disabled={mintingState.isLoading}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition-all transform hover:scale-105 disabled:transform-none shadow-lg mb-2"
                    >
                      {mintingState.isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Minting SBT...
                        </span>
                      ) : (
                        '🎁 Mint SBT'
                      )}
                    </button>
                  ) : (
                    <div className="bg-green-900/50 border border-green-500 rounded-lg p-3 mb-2">
                      <p className="text-green-200 font-bold mb-1">✓ SBT Minted Successfully!</p>
                      {mintingState.txHash && (
                        <a
                          href={`https://basescan.org/tx/${mintingState.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 text-sm underline"
                        >
                          View on BaseScan
                        </a>
                      )}
                    </div>
                  )}
                  
                  {/* Error Message */}
                  {mintingState.error && !mintingState.isLoading && (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                      {mintingState.error}
                    </div>
                  )}
                </div>
              )}
              
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

