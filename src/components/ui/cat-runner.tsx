'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, RotateCcw, Zap } from 'lucide-react';
import { Button } from './button';
import { haptic } from '@/lib/haptics';
import Image from 'next/image';

export function CatRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const [catImage, setCatImage] = useState<HTMLImageElement | null>(null);
  
  // Game constants and refs
  const frameRef = useRef<number>(0);
  const gameData = useRef({
    cat: { x: 60, y: 170, width: 45, height: 45, dy: 0, jumpForce: -13, gravity: 0.8, isJumping: false },
    obstacles: [] as { x: number, width: number, height: number, passed: boolean }[],
    speed: 7, 
    lastObstacleTime: 0,
    frames: 0
  });

  useEffect(() => {
    const img = new window.Image();
    img.src = '/images/game/cat.png';
    img.onload = () => setCatImage(img);
  }, []);

  const resetGame = () => {
    gameData.current = {
      cat: { x: 60, y: 170, width: 45, height: 45, dy: 0, jumpForce: -13, gravity: 0.8, isJumping: false },
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
      
    const groundY = 220; // Lowered further to prevent clipping
    if (cat.y + cat.height > groundY) {
        cat.y = groundY - cat.height;
        cat.dy = 0;
        cat.isJumping = false;
    }

      // Dynamic Speed Increase
      if (gameData.current.frames % 500 === 0) {
          gameData.current.speed += 0.3;
      }

      // Obstacles generation
      const minGap = 1000 / (gameData.current.speed / 5);
      if (Date.now() - gameData.current.lastObstacleTime > minGap + Math.random() * 400) {
        obstacles.push({
          x: canvas.width,
          width: 25,
          height: 30 + Math.random() * 30,
          passed: false
        });
        gameData.current.lastObstacleTime = Date.now();
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameData.current.speed;
        
        if (!obstacles[i].passed && obstacles[i].x < cat.x) {
            obstacles[i].passed = true;
            setScore(s => s + 1);
            haptic.vibrateSubtle();
        }

        const catRect = { left: cat.x + 8, right: cat.x + cat.width - 8, top: cat.y + 8, bottom: cat.y + cat.height - 2 };
        const obsRect = { left: obstacles[i].x, right: obstacles[i].x + obstacles[i].width, top: groundY - obstacles[i].height, bottom: groundY };

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

        if (obstacles[i].x + obstacles[i].width < -50) {
          obstacles.splice(i, 1);
        }
      }

      // Drawing - ULTRA PREMIUM CYBERPUNK
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Stars/Distant Grid
      ctx.fillStyle = 'rgba(236, 72, 153, 0.1)';
      for(let j=0; j<20; j++) {
          const sx = (j * 100 - (gameData.current.frames * 0.5)) % canvas.width;
          ctx.beginPath();
          ctx.arc(sx < 0 ? sx + canvas.width : sx, 20 + (j*7)%80, 1, 0, Math.PI*2);
          ctx.fill();
      }

      // Distant mountains/buildings
      ctx.fillStyle = '#1a1a24';
      ctx.beginPath();
      for(let x=0; x<=canvas.width; x+=50) {
          const h = 40 + Math.sin((x + gameData.current.frames*0.2)/100) * 20;
          ctx.lineTo(x, groundY - h);
      }
      ctx.lineTo(canvas.width, groundY);
      ctx.lineTo(0, groundY);
      ctx.fill();

      // Floor Grid
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.08)';
      ctx.lineWidth = 1;
      const gridScroll = (gameData.current.frames * gameData.current.speed) % 40;
      for(let i=0; i<canvas.width + 40; i+=40) {
          ctx.beginPath();
          ctx.moveTo(i - gridScroll, groundY);
          ctx.lineTo(i - gridScroll - 50, canvas.height);
          ctx.stroke();
      }
      
      // Horizontal grid lines
      for(let h=groundY; h<canvas.height; h+=15) {
          ctx.beginPath();
          ctx.moveTo(0, h);
          ctx.lineTo(canvas.width, h);
          ctx.stroke();
      }

      // Neon Floor Line
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ec4899';
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Cat
      if (catImage) {
          // Trail
          if (cat.isJumping) {
              ctx.globalAlpha = 0.2;
              ctx.drawImage(catImage, cat.x - 15, cat.y + 5, cat.width, cat.height);
              ctx.globalAlpha = 1.0;
          }
          ctx.drawImage(catImage, cat.x, cat.y, cat.width, cat.height);
      }
      
      // Obstacles - Glowing Pillars
      obstacles.forEach(obs => {
        const obsGrad = ctx.createLinearGradient(obs.x, groundY - obs.height, obs.x, groundY);
        obsGrad.addColorStop(0, '#8b5cf6');
        obsGrad.addColorStop(1, '#6366f1');
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#8b5cf6';
        ctx.fillStyle = obsGrad;
        ctx.beginPath();
        ctx.roundRect(obs.x, groundY - obs.height, obs.width, obs.height, 4);
        ctx.fill();
        
        // Inner detail line
        ctx.strokeStyle = '#white';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameState, catImage]);

  useEffect(() => {
     if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  return (
    <div className="relative flex flex-col items-center bg-[#0a0a0c] rounded-[2.5rem] p-4 sm:p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden max-w-full sm:max-w-xl mx-auto transition-all">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-pink-500/10 blur-[100px] rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full" />

      <div className="w-full flex justify-between items-center mb-6 px-4 relative z-10">
        <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 opacity-60 mb-0.5">RÉCORD</span>
            <div className="flex items-center gap-2">
                <Trophy className="h-3 w-3 text-emerald-400" />
                <span className="text-xl font-black text-white">{highScore}</span>
            </div>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500 opacity-60 mb-0.5">PUNTOS</span>
            <div className="text-5xl font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                {score.toString().padStart(4, '0')}
            </div>
        </div>
      </div>

      <div 
        className="relative border border-white/5 w-full aspect-[16/9] sm:h-[280px] bg-[#0d0d12] rounded-[2rem] overflow-hidden cursor-pointer group shadow-inner" 
        onClick={jump}
      >
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={280}
          className="w-full h-full object-cover transition-opacity"
        />
        
        {/* Glow Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-pink-500/5 to-transparent" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,12,0.4)_100%)]" />

        <AnimatePresence>
            {gameState === 'idle' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6 z-30"
                >
                    <motion.div 
                        animate={{ 
                            y: [0, -10, 0],
                            scale: [1, 1.05, 1],
                            rotate: [0, 2, -2, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-20 h-20 relative drop-shadow-[0_0_30px_rgba(236,72,153,0.4)] mt-12"
                    >
                        {catImage ? (
                            <Image src="/images/game/cat.png" alt="Cat" fill className="object-contain" priority />
                        ) : (
                            <span className="text-6xl">🐈</span>
                        )}
                    </motion.div>
                    
                    <div className="text-center px-4">
                        <h4 className="font-black uppercase tracking-[0.5em] text-lg text-white mb-3 italic">
                             MISMUKi <span className="text-pink-500">:</span> JUEGO
                        </h4>
                        <div className="flex items-center justify-center gap-3 text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">
                            <span className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">ESPACIO PARA SALTAR</span>
                            <span className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">ESQUIVAR</span>
                        </div>
                    </div>

                    <Button onClick={startGame} className="rounded-2xl gap-3 px-12 h-14 bg-white text-black hover:bg-neutral-200 border-none shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all hover:scale-105 active:scale-95 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Play className="h-4 w-4 fill-black relative z-10" /> 
                        <span className="font-black uppercase tracking-widest text-xs relative z-10">JUGAR AHORA</span>
                    </Button>
                </motion.div>
            )}

            {gameState === 'gameover' && (
                <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-red-950/60 flex flex-col items-center justify-center gap-6 z-30"
                >
                    <div className="text-center relative">
                        <motion.h4 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-6xl font-black uppercase tracking-tighter text-white mb-2 italic drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]"
                        >
                            PERDISTE
                        </motion.h4>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.5em] opacity-80">¡OTRA OPORTUNIDAD!</p>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <Button onClick={startGame} className="rounded-2xl gap-4 px-14 h-14 bg-white text-black hover:bg-neutral-200 font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <RotateCcw className="h-4 w-4" /> REINTENTAR
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-4 w-full border-t border-white/5 pt-6 relative z-10">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">DIFICULTAD</p>
            <p className="text-xs font-black uppercase text-pink-500 tracking-wider">DINÁMICA</p>
        </div>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">RECOMPENSA</p>
            <p className="text-xs font-black uppercase text-violet-400 tracking-wider">+1 PUNTO / SALTO</p>
        </div>
      </div>
    </div>
  );
}
