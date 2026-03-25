'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, RotateCcw } from 'lucide-react';
import { Button } from './button';

export function CatRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Game constants and refs
  const frameRef = useRef<number>(0);
  const gameData = useRef({
    cat: { x: 50, y: 150, width: 40, height: 40, dy: 0, jumpForce: -12, gravity: 0.6, isJumping: false },
    obstacles: [] as { x: number, width: number, height: number }[],
    speed: 5,
    lastObstacleTime: 0,
    frames: 0
  });

  const resetGame = () => {
    gameData.current = {
      cat: { x: 50, y: 150, width: 40, height: 40, dy: 0, jumpForce: -12, gravity: 0.6, isJumping: false },
      obstacles: [],
      speed: 5,
      lastObstacleTime: 0,
      frames: 0
    };
    setScore(0);
  };

  const jump = () => {
    if (gameState !== 'playing') return;
    if (!gameData.current.cat.isJumping) {
      gameData.current.cat.dy = gameData.current.cat.jumpForce;
      gameData.current.cat.isJumping = true;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'playing') jump();
        else if (gameState === 'idle' || gameState === 'gameover') startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const startGame = () => {
    resetGame();
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = () => {
      const { cat, obstacles } = gameData.current;
      
      // Update score
      gameData.current.frames++;
      if (gameData.current.frames % 10 === 0) {
          setScore(s => s + 1);
          // Increase speed
          if (gameData.current.frames % 500 === 0) gameData.current.speed += 0.5;
      }

      // Cat physics
      cat.dy += cat.gravity;
      cat.y += cat.dy;
      
      if (cat.y > 150) {
        cat.y = 150;
        cat.dy = 0;
        cat.isJumping = false;
      }

      // Obstacles
      if (Date.now() - gameData.current.lastObstacleTime > 1500 / (gameData.current.speed / 5)) {
        obstacles.push({
          x: canvas.width,
          width: 20 + Math.random() * 20,
          height: 30 + Math.random() * 30
        });
        gameData.current.lastObstacleTime = Date.now();
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameData.current.speed;
        
        // Collision
        if (
          cat.x < obstacles[i].x + obstacles[i].width &&
          cat.x + cat.width > obstacles[i].x &&
          cat.y < 150 + cat.height && // Ground level
          cat.y + cat.height > 190 - obstacles[i].height
        ) {
          setGameState('gameover');
          cancelAnimationFrame(frameRef.current);
          return;
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
          obstacles.splice(i, 1);
        }
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Ground
      ctx.strokeStyle = '#888';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, 190);
      ctx.lineTo(canvas.width, 190);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cat (Simple emoji/rect for now)
      ctx.font = '32px Arial';
      ctx.fillText('🐱', cat.x, cat.y + 35);
      
      // Obstacles
      ctx.fillStyle = '#ef4444';
      obstacles.forEach(obs => {
        ctx.fillRect(obs.x, 190 - obs.height, obs.width, obs.height);
      });

      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameState]);

  useEffect(() => {
     if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  return (
    <div className="relative flex flex-col items-center bg-primary/5 rounded-[2rem] p-8 border-2 border-primary/10 shadow-inner overflow-hidden max-w-xl mx-auto">
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">High Score: {highScore}</span>
        </div>
        <div className="text-2xl font-black text-primary italic tracking-tighter">
            SCORE: {score}
        </div>
      </div>

      <div className="relative border-b-2 border-primary/20 w-full max-w-[500px] h-[200px] bg-background/50 rounded-xl overflow-hidden cursor-pointer" onClick={jump}>
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={200}
          className="w-full h-full"
        />
        
        <AnimatePresence>
            {gameState === 'idle' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
                >
                    <div className="text-4xl animate-bounce">🐱</div>
                    <div className="text-center">
                        <h4 className="font-black uppercase tracking-widest text-sm text-primary mb-1 italic">Estuclub MiniGame</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Presiona Espacio para Saltar</p>
                    </div>
                    <Button onClick={startGame} className="rounded-full gap-2 px-6">
                        <Play className="h-4 w-4" /> Empezar
                    </Button>
                </motion.div>
            )}

            {gameState === 'gameover' && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-red-500/20 backdrop-blur-md flex flex-col items-center justify-center gap-4"
                >
                    <div className="text-center">
                        <h4 className="text-3xl font-black uppercase tracking-tighter text-red-600 mb-1 italic">GAME OVER</h4>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">¡Buen intento!</p>
                    </div>
                    <Button onClick={startGame} variant="outline" className="rounded-full gap-2 px-6 bg-white border-red-500 text-red-500 hover:bg-red-50">
                        <RotateCcw className="h-4 w-4" /> Reintentar
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      
      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
        Usa [Espacio] o [Click] para esquivar los obstáculos
      </p>
    </div>
  );
}
