'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, QrCode, CalendarDays, Building, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';

export function BottomNav() {
  const pathname = usePathname();
  const { roles, supplierData } = useUser();
  const showScanner = roles.includes('admin') || roles.includes('supplier');

  const turnosHref = (roles.includes('supplier') && supplierData?.appointmentsEnabled)
    ? '/panel-cluber/appointments'
    : '/turnos';

  // Dynamically generate nav items based on roles
  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/benefits', label: 'Beneficios', icon: Ticket },
    ...(showScanner 
      ? [{ href: '/panel-cluber/scanner', label: 'Escanear', icon: QrCode, special: true }] 
      : [{ href: '/leaderboard', label: 'Ranking', icon: Trophy, special: true }]
    ),
    { href: '/proveedores', label: 'Clubers', icon: Building },
    { href: turnosHref, label: 'Turnos', icon: CalendarDays },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass glass-dark shadow-premium ring-1 ring-primary/5 pb-safe">
      <div className="grid h-16 grid-cols-5 border-t border-primary/5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => haptic.vibrateSubtle()}
              className={cn(
                'relative flex flex-col items-center justify-center text-muted-foreground transition-colors duration-300',
                isActive && !item.special ? 'text-primary' : 'hover:text-primary'
              )}
            >
              {item.special ? (
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative -top-5 flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 ring-4 ring-background z-10"
                >
                  <item.icon className="h-7 w-7" />
                </motion.div>
              ) : (
                <>
                  <motion.div
                    animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                    <span className={cn(
                        "text-[11px] mt-1 font-black uppercase tracking-widest transition-opacity",
                        isActive ? "opacity-100" : "opacity-60"
                    )}>
                        {item.label}
                    </span>
                  </motion.div>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-pill"
                      className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
