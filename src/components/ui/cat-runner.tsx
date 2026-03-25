'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, RotateCcw, Zap } from 'lucide-react';
import { Button } from './button';
import { haptic } from '@/lib/haptics';

export function CatRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Game constants and refs
  const frameRef = useRef<number>(0);
  const gameData = useRef({
    cat: { x: 60, y: 140, width: 35, height: 35, dy: 0, jumpForce: -13, gravity: 0.8, isJumping: false },
    obstacles: [] as { x: number, width: number, height: number, passed: boolean }[],
    speed: 7, // Faster base speed
    lastObstacleTime: 0,
    frames: 0
  });

  const resetGame = () => {
    gameData.current = {
      cat: { x: 60, y: 140, width: 35, height: 35, dy: 0, jumpForce: -13, gravity: 0.8, isJumping: false },
      obstacles: [],
      speed: 7,
      lastObstacleTime: Date.now(),
      frames: 0
    };
    setScore(0);
  };

  const jump = () => {
    if (gameState !== 'playing') return;
    if (!gameData.current.cat.isJumping) {
      haptic.vibrateSubtle();
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
      
      gameData.current.frames++;
      
      // Cat physics
      cat.dy += cat.gravity;
      cat.y += cat.dy;
      
      if (cat.y > 145) {
        cat.y = 145;
        cat.dy = 0;
        cat.isJumping = false;
      }

      // Dynamic Speed Increase (Makes it harder)
      if (gameData.current.frames % 1000 === 0) {
          gameData.current.speed += 0.8;
      }

      // Obstacles generation
      const minGap = 1200 / (gameData.current.speed / 5);
      if (Date.now() - gameData.current.lastObstacleTime > minGap + Math.random() * 500) {
        obstacles.push({
          x: canvas.width,
          width: 15 + Math.random() * 25,
          height: 25 + Math.random() * 45,
          passed: false
        });
        gameData.current.lastObstacleTime = Date.now();
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameData.current.speed;
        
        // Scoring logic: Points per obstacle jumped
        if (!obstacles[i].passed && obstacles[i].x < cat.x) {
            obstacles[i].passed = true;
            setScore(s => s + 10);
            haptic.vibrateSubtle();
        }

        // Precise Collision detection
        const catRect = { left: cat.x + 5, right: cat.x + cat.width - 5, top: cat.y + 5, bottom: cat.y + cat.height };
        const obsRect = { left: obstacles[i].x, right: obstacles[i].x + obstacles[i].width, top: 190 - obstacles[i].height, bottom: 190 };

        if (
          catRect.right > obsRect.left &&
          catRect.left < obsRect.right &&
          catRect.bottom > obsRect.top
        ) {
          setGameState('gameover');
          haptic.vibrateError();
          haptic.vibrateImpact();
          cancelAnimationFrame(frameRef.current);
          return;
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
          obstacles.splice(i, 1);
        }
      }

      // DRAWING - PREMIUM CYBERPUNK AESTHETIC
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Grid lines background
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.05)';
      ctx.lineWidth = 1;
      for(let x=0; x<canvas.width; x+=40) {
          ctx.beginPath();
          ctx.moveTo(x - (gameData.current.frames % 40), 0);
          ctx.lineTo(x - (gameData.current.frames % 40), canvas.height);
          ctx.stroke();
      }

      // Ground (Neon Line)
      const gradient = ctx.createLinearGradient(0, 190, canvas.width, 190);
      gradient.addColorStop(0, '#ec4899');
      gradient.addColorStop(1, '#8b5cf6');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 190);
      ctx.lineTo(canvas.width, 190);
      ctx.stroke();
      
      // Neon Glow for ground
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ec4899';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Cat - Mismuki Persona
      ctx.font = '36px Arial';
      // Drawing a little trail if jumping
      if (cat.isJumping) {
          ctx.globalAlpha = 0.3;
          ctx.fillText('🐈', cat.x - 10, cat.y + 25);
          ctx.globalAlpha = 1.0;
      }
      ctx.fillText('🐈', cat.x, cat.y + 35);
      
      // Obstacles (Cyberpunk Spikes/Crates)
      obstacles.forEach(obs => {
        // Shadow for obstacle
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(obs.x, 190 - obs.height, obs.width, obs.height, 4);
        ctx.fill();
        
        // Inner detail
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
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
    <div className="relative flex flex-col items-center bg-[#0a0a0c] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl overflow-hidden max-w-xl mx-auto">
      {/* HUD Backdrop */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none" />

      <div className="w-full flex justify-between items-center mb-6 px-4 relative z-10">
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <Trophy className="h-4 w-4 text-emerald-400 drop-shadow-glow" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">BEST: {highScore}</span>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500 opacity-80 mb-1">SCORE</span>
            <div className="text-4xl font-black text-white italic tracking-tighter drop-shadow-glow">
                {score.toString().padStart(4, '0')}
            </div>
        </div>
      </div>

      <div 
        className="relative border border-white/5 w-full max-w-[500px] h-[200px] bg-[#0d0d12] rounded-[2rem] overflow-hidden cursor-pointer group" 
        onClick={jump}
      >
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={200}
          className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
        />
        
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,.03),rgba(0,255,0,.01),rgba(0,0,255,.03))] z-20 bg-[length:100%_2px,3px_100%]" />

        <AnimatePresence>
            {gameState === 'idle' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-30"
                >
                    <motion.div 
                        animate={{ 
                            y: [0, -15, 0],
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="text-6xl drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]"
                    >
                        🐈
                    </motion.div>
                    
                    <div className="text-center px-4">
                        <h4 className="font-black uppercase tracking-[0.4em] text-base text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 mb-2 italic">
                            Mismuki The Game
                        </h4>
                        <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 py-2 px-6 rounded-full border border-white/10">
                            <span>SPACE TO JUMP</span>
                            <div className="h-1 w-1 rounded-full bg-white/20" />
                            <span>AVOID OBSTACLES</span>
                        </div>
                    </div>

                    <Button onClick={startGame} className="rounded-2xl gap-3 px-10 h-14 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 border-none shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all hover:scale-105 active:scale-95 group">
                        <Play className="h-5 w-5 fill-white group-hover:scale-110 transition-transform" /> 
                        <span className="font-black uppercase tracking-widest text-sm">Play Now</span>
                    </Button>
                </motion.div>
            )}

            {gameState === 'gameover' && (
                <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-red-950/40 flex flex-col items-center justify-center gap-6 z-30"
                >
                    <div className="text-center relative">
                        <motion.h4 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-5xl font-black uppercase tracking-tighter text-white mb-2 italic drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]"
                        >
                            WASTED
                        </motion.h4>
                        <p className="text-[10px] font-black text-pink-400 uppercase tracking-[0.5em] opacity-80">Better luck next time</p>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <Button onClick={startGame} className="rounded-2xl gap-3 px-12 h-14 bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95">
                            <RotateCcw className="h-4 w-4" /> Restart
                        </Button>
                        <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-widest">
                            <Zap className="h-3 w-3" /> Get ready for speed
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      
      <div className="mt-8 flex justify-center items-center gap-8 w-full border-t border-white/5 pt-6">
        <div className="text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Dificultad</p>
            <p className="text-[10px] font-black uppercase text-pink-500">HARDCORE+</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Mecánica</p>
            <p className="text-[10px] font-black uppercase text-violet-400">+10 PTS / JUMP</p>
        </div>
      </div>
    </div>
  );
}
