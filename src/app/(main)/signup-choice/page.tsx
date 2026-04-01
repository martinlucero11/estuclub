'use client';

import Link from 'next/link';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SplashScreen from '@/components/layout/splash-screen';
import { motion } from 'framer-motion';
import { GraduationCap, Bike, Store, ArrowRight, Shield } from 'lucide-react';

const roles = [
  {
    id: 'student',
    title: 'Estudiante',
    subtitle: 'Marketplace & Beneficios',
    description: 'Accedé a descuentos, pedidos y el club exclusivo.',
    href: '/signup',
    icon: GraduationCap,
    gradient: 'from-estuclub-rosa to-rose-600',
    border: 'border-estuclub-rosa/20 hover:border-estuclub-rosa/40',
    glow: 'group-hover:shadow-[0_0_60px_rgba(217,59,100,0.15)]',
    accent: 'text-estuclub-rosa',
    bg: 'bg-estuclub-rosa/10',
  },
  {
    id: 'rider',
    title: 'Rider',
    subtitle: 'Logística & Ganancias',
    description: 'Hacé entregas, generá ingresos y manejá tu billetera.',
    href: '/signup-rider',
    icon: Bike,
    gradient: 'from-cyan-400 to-cyan-600',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    glow: 'group-hover:shadow-[0_0_60px_rgba(6,182,212,0.15)]',
    accent: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    id: 'cluber',
    title: 'Cluber',
    subtitle: 'Comercio & Ventas',
    description: 'Publicá tus productos y llegá a miles de estudiantes.',
    href: '/cluber',
    icon: Store,
    gradient: 'from-amber-400 to-amber-600',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    glow: 'group-hover:shadow-[0_0_60px_rgba(245,158,11,0.15)]',
    accent: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
];

export default function SignupChoicePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) router.push('/');
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) return <SplashScreen />;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-6 overflow-hidden">
      <div className="absolute top-[-5%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />

      <div className="w-full max-w-md z-10 space-y-8">
        <header className="text-center space-y-3">
          <Link href="/" className="inline-block mb-4 transition-transform hover:scale-105 duration-300">
            <div
              className="h-[48px] w-[160px] bg-primary [mask-image:url(/logo.svg)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center] mx-auto"
              aria-label="EstuClub Logo"
            />
          </Link>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground">¿Quién sos?</h1>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
            Elegí tu rol para comenzar
          </p>
        </header>

        <div className="space-y-4">
          {roles.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Link href={role.href} className="block group">
                <div className={`relative p-5 rounded-2xl border-2 ${role.border} bg-card transition-all duration-300 ${role.glow}`}>
                  <div className="flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-2xl ${role.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300`}>
                      <role.icon className={`h-7 w-7 ${role.accent}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black uppercase tracking-tight text-foreground">{role.title}</h2>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${role.accent} opacity-60`}>{role.subtitle}</span>
                      </div>
                      <p className="text-xs text-muted-foreground/70 font-medium mt-0.5">{role.description}</p>
                    </div>
                    <ArrowRight className={`h-5 w-5 ${role.accent} opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 shrink-0`} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center space-y-3 pt-4">
          <p className="text-xs font-bold text-muted-foreground tracking-wide">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest text-[10px] ml-1">
              Iniciar sesión
            </Link>
          </p>
          <div className="flex items-center justify-center gap-2 opacity-30">
            <Shield className="h-3 w-3" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Datos protegidos por EstuClub</span>
          </div>
        </div>
      </div>
    </div>
  );
}
