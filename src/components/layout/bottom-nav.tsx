'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, QrCode, CalendarDays, Building, Trophy, ShoppingCart, ShoppingBag, User, Search } from 'lucide-react';
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
  
  // Detect current context
  const isInDeliveryContext = pathname.startsWith('/delivery') || pathname.startsWith('/orders');

  // Define Navigation Sets
  const benefitsNav = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/perks', label: 'Beneficios', icon: Ticket },
    { href: '#cart', label: 'Carrito', icon: ShoppingCart, special: true },
    { href: '/turnos', label: 'Turnos', icon: CalendarDays },
    { href: '/profile', label: 'Perfil', icon: User },
  ];

  const deliveryNav = [
    { href: '/delivery', label: 'Tienda', icon: ShoppingBag },
    { href: '/delivery/explorar', label: 'Explorar', icon: Search },
    { href: '#cart', label: 'Carrito', icon: ShoppingCart, special: true },
    { href: '/orders', label: 'Pedidos', icon: CalendarDays },
    { href: '/profile', label: 'Perfil', icon: User },
  ];

  // Determine which nav to show
  let navItems = isInDeliveryContext ? deliveryNav : benefitsNav;

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass glass-dark shadow-premium ring-1 ring-primary/5 pb-safe">
      <div className="grid h-16 grid-cols-5 border-t border-primary/5">
        {navItems.map((item: any, index: number) => {
          const isActive = pathname === item.href;
          
          if (item.special) {
            return (
              <CartSheet key="cart-sheet">
                <button
                  onClick={() => haptic.vibrateSubtle()}
                  className="relative flex flex-col items-center justify-center text-muted-foreground transition-colors duration-300"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative -top-5 flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 ring-4 ring-background z-10"
                  >
                    <item.icon className="h-7 w-7" />
                    {totalItems > 0 && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.2 }}
                            className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[11px] font-black h-6 w-6 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-primary z-20"
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
                </button>
              </CartSheet>
            );
          }

          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              onClick={() => haptic.vibrateSubtle()}
              className={cn(
                'relative flex flex-col items-center justify-center text-muted-foreground transition-colors duration-300',
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
                    "text-[9px] mt-1 font-black uppercase tracking-[0.05em] transition-opacity text-center px-1",
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
