'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Clock, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';

// --- CONFIGURA LA FECHA AQUÍ ---
// Formato: Año, Mes (0-11, osea que Enero es 0 y Diciembre es 11), Día, Hora, Minuto, Segundo
// Ejemplo para 15 de Mayo de 2026 a las 19:00:00:
const TARGET_DATE = new Date(2026, 4, 15, 19, 0, 0).getTime();

export default function ComingSoonPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isMounted, setIsMounted] = useState(false);
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('estuclub_tester_unlocked') === 'true') {
      router.push('/login');
      return;
    }
    setIsMounted(true);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = TARGET_DATE - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden text-white font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#cb465a]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse delay-1000" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
        
        {/* Floating Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
        >
          <Sparkles className="w-4 h-4 text-[#cb465a]" />
          <span className="text-sm font-medium tracking-wide text-slate-300">ESTAMOS PREPARANDO ALGO INCREÍBLE</span>
        </motion.div>

        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <Image src="/logo-white.svg" alt="Estuclub" width={180} height={60} className="mx-auto mb-6" /> 
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Muy Pronto
            </span>
          </h1>
          <p className="text-xl md:text-3xl font-light text-slate-300 max-w-2xl leading-relaxed">
            la solución integral que <strong className="text-[#cb465a] font-bold">Alem</strong> necesitaba!
          </p>
        </motion.div>

        {/* Countdown Timer */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-12 w-full max-w-3xl"
        >
          <TimeBlock value={timeLeft.days} label="DÍAS" />
          <TimeBlock value={timeLeft.hours} label="HORAS" />
          <TimeBlock value={timeLeft.minutes} label="MINUTOS" />
          <TimeBlock value={timeLeft.seconds} label="SEGUNDOS" />
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 flex flex-col items-center gap-6"
        >
          <div className="flex gap-4">
            <Link href="/login" className="px-8 py-3 rounded-full bg-[#cb465a] hover:bg-[#b03d4e] text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(203,70,90,0.4)]">
              Iniciar Sesión
            </Link>
            <Link href="/signup" className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/10">
              Registrarse
            </Link>
          </div>
          
          <div className="flex items-center gap-3 text-slate-400 text-sm mt-4">
            <Clock className="w-4 h-4" />
            <span>Falta muy poco para el gran lanzamiento</span>
            <Rocket className="w-4 h-4 ml-1 text-[#cb465a]" />
          </div>
        </motion.div>

      </div>

      {/* Secret Cat */}
      <motion.div 
        className="absolute bottom-4 right-4 z-50 cursor-pointer opacity-40 hover:opacity-100 transition-opacity text-4xl"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        onClick={() => setShowSecretInput(true)}
      >
        🐈
      </motion.div>

      <AnimatePresence>
        {showSecretInput && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSecretInput(false);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={isError ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm bg-white/5 border border-[#cb465a]/50 p-6 rounded-3xl shadow-[0_0_30px_rgba(203,70,90,0.2)] text-center"
            >
              <h3 className="text-xl font-black mb-4 text-[#cb465a] uppercase tracking-widest">Acceso Secreto</h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (secretPassword === 'Mismuki') {
                    localStorage.setItem('estuclub_tester_unlocked', 'true');
                    router.push('/login');
                  } else {
                    setIsError(true);
                    setTimeout(() => setIsError(false), 500);
                  }
                }}
                className="w-full"
              >
                <input 
                  type="password" 
                  placeholder="Contraseña"
                  value={secretPassword}
                  onChange={(e) => setSecretPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-[#cb465a] transition-colors mb-4"
                  autoFocus
                  autoComplete="new-password"
                />
              </form>
              {isError && <p className="text-[#cb465a] text-sm font-bold animate-pulse">Acceso denegado 🐾</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="text-4xl md:text-6xl font-black text-white mb-2 tabular-nums tracking-tighter">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs md:text-sm font-medium tracking-[0.2em] text-[#cb465a]">
        {label}
      </div>
    </div>
  );
}
