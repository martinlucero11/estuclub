'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, QrCode, CalendarDays, Building, Trophy, ShoppingCart, ShoppingBag, User, Search, ShieldCheck, Wallet, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';
import { CartSheet } from '../delivery/cart-sheet';
import { useCart } from '@/context/cart-context';

export function BottomNav() {
  const pathname = usePathname();
  const { roles, userData } = useUser();
  
  const { totalItems } = useCart();
  const isStudent = userData?.isStudent || false;
  const isPrivileged = roles.includes('admin') || roles.includes('supplier');

  // ─── CONTEXT DETECTION ──────────────────────────────────
  const isInDeliveryContext = pathname.startsWith('/delivery') || pathname.startsWith('/orders');
  const isRider = roles.includes('rider');
  const isInRiderContext = pathname.startsWith('/rider') || (isRider && pathname.startsWith('/verify'));
  const isInTurneroView = pathname.includes('/turnos') || pathname.includes('/mis-turnos');
  const authRoutes = ['/signup', '/login', '/be-cluber', '/be-rider', '/signup-choice', '/signup-rider', '/auth'];
  const isAuthPage = authRoutes.some(route => pathname === route || pathname?.startsWith(`${route}/`));
  if (isAuthPage) return null;


  // Determine Center Button for Benefits Context
  let benefitsCenterBtn;
  if (isPrivileged) {
      benefitsCenterBtn = { href: '/panel-cluber/scanner', label: 'Escanear', icon: QrCode, special: true };
  } else {
      benefitsCenterBtn = { href: '/leaderboard', label: 'Ranking', icon: Trophy, special: true };
  }

  // Define Navigation Sets
  const benefitsNav = [
    { href: '/', label: 'Inicio', icon: Home },
    ...(isStudent ? [{ href: '/benefits', label: 'Beneficios', icon: Ticket }] : []),
    benefitsCenterBtn,
    { href: isPrivileged ? '/panel-cluber/supplier-profile' : '/profile', label: 'Perfil', icon: User },
    { href: '#cart', label: 'Carrito', icon: ShoppingCart },
  ].filter(Boolean);

  const deliveryNav = [
    { href: '/delivery', label: 'Tienda', icon: ShoppingBag },
    { href: '/delivery', label: 'Explorar', icon: Search },
    { href: '#cart', label: 'Carrito', icon: ShoppingCart, special: true },
    { href: '/orders', label: 'Pedidos', icon: CalendarDays },
    { href: isPrivileged ? '/panel-cluber/supplier-profile' : '/profile', label: 'Perfil', icon: User },
  ];

  const riderNav = [
    { href: '/rider', label: 'Inicio', icon: Home },
    { href: '/rider/orders', label: 'Entregas', icon: ShoppingBag },
    { href: '/rider', label: 'Mapa', icon: Navigation, special: true },
    { href: '/rider/wallet', label: 'Billetera', icon: Wallet },
    { href: '/profile', label: 'Perfil', icon: User },
  ];

  // Determine which nav to show
  let navItems = isInRiderContext ? riderNav : (isInDeliveryContext ? deliveryNav : benefitsNav);

  // If normal user is in root path, ensure they see a proper nav (no benefits)
  if (!isStudent && !isInDeliveryContext && !isInRiderContext && !isInTurneroView) {
    navItems = benefitsNav; // benefitsNav was already filtered above
  }

  // ─── CART RESTRICTION ───────────────────────────────────
  if (isInTurneroView) {
    navItems = navItems.filter(item => item.href !== '#cart');
  }

  // Add Switch Button for dual-role users
  if (isStudent && isPrivileged) {
      const switchItem = isInDeliveryContext 
        ? { href: '/', label: 'Beneficios', icon: Ticket, highlight: true }
        : { href: '/delivery', label: 'Delivery', icon: ShoppingBag, highlight: true };
      
      // Replace one of the items or add to it. Let's replace the "Categories/Search" (index 1) or "Profile" (index 4)
      // Actually, let's keep it consistent: [Home, ContextSwitch, Cart, Special, Profile]
      navItems = [...navItems];
      navItems[1] = switchItem;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-t border-black/5 dark:border-white/10">
      <div className="grid h-16 grid-cols-5 border-t border-black/5">
        {navItems.map((item: any, index: number) => {
          const isActive = pathname === item.href;
          
          if (item.special) {
            const specialButtonContent = (
              <button
                onClick={() => haptic.vibrateSubtle()}
                className="relative flex flex-col items-center justify-center text-foreground transition-colors duration-300"
              >
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative -top-5 flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 ring-4 ring-background z-10"
                >
                  <item.icon className="h-7 w-7" />
                  {item.href === '#cart' && totalItems > 0 && (
                      <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.2 }}
                          className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[11px] font-black h-6 w-6 rounded-full flex items-center justify-center shadow-lg border-2 border-black z-20"
                      >
                          <motion.span
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                          >
                              {totalItems}
                          </motion.span>
                      </motion.div>
                  )}
                </motion.div>
                {/* Fallback label for screen readers or forced display */}
                <span className="sr-only mt-3 text-[9px] font-black uppercase tracking-[0.05em] text-primary">{item.label}</span>
              </button>
            );

            if (item.href === '#cart') {
                return (
                  <div key="cart-sheet" className="relative flex flex-col items-center justify-center w-full h-full">
                    <CartSheet>
                      {specialButtonContent}
                    </CartSheet>
                  </div>
                );
            }

            return (
              <Link key={`${item.href}-${index}`} href={item.href} className="relative flex flex-col items-center justify-center w-full h-full">
                  {specialButtonContent}
              </Link>
            );
          }

          if (item.href === '#cart' && !item.special) {
              const cartContent = (
                <button
                  onClick={() => haptic.vibrateSubtle()}
                  className={cn(
                    'relative flex flex-col items-center justify-center text-foreground transition-colors duration-300 w-full h-full',
                    isActive ? 'text-primary' : 'hover:text-primary'
                  )}
                >
                    <motion.div animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }} className="flex flex-col items-center relative">
                        <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                        {totalItems > 0 && (
                            <div className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                                {totalItems}
                            </div>
                        )}
                        <span className={cn(
                            "text-[9px] mt-1 font-black uppercase tracking-[0.05em] transition-all text-center px-1 font-montserrat",
                            isActive ? "text-primary scale-105" : "text-foreground opacity-60"
                        )}>
                            {item.label}
                        </span>
                    </motion.div>
                </button>
              );
              
              return (
                  <div key="cart-sheet-normal" className="relative flex flex-col items-center justify-center w-full h-full">
                      <CartSheet>
                          {cartContent}
                      </CartSheet>
                  </div>
              );
          }

          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              onClick={() => haptic.vibrateSubtle()}
              className={cn(
                'relative flex flex-col items-center justify-center text-foreground transition-colors duration-300 w-full h-full',
                isActive ? 'text-primary' : 'hover:text-primary',
                item.highlight && "text-primary/80"
              )}
            >
                <motion.div
                animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                className="flex flex-col items-center"
                >
                <item.icon className={cn("h-5 w-5", (isActive || item.highlight) && "stroke-[2.5px]")} />
                <span className={cn(
                    "text-[9px] mt-1 font-black uppercase tracking-[0.05em] transition-all text-center px-1 font-montserrat",
                    isActive ? "text-primary scale-105" : "text-foreground opacity-60"
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;

