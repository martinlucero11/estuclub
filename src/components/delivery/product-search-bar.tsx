'use client';

import { useState } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

export function ProductSearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      haptic.vibrateSubtle();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <form 
            onSubmit={handleSearch}
            className="group relative flex items-center bg-card/40 backdrop-blur-xl rounded-[2rem] border-2 border-white/5 hover:border-primary/30 transition-all duration-500 shadow-premium hover:shadow-[0_20px_50px_rgba(203,70,90,0.15)] overflow-hidden"
        >
            <div className="pl-6 text-primary/50 group-hover:text-primary transition-colors duration-500">
                <Search className="h-5 w-5" />
            </div>
            
            <Input
                type="text"
                placeholder="¿Qué querés comer hoy? Buscá productos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-16 text-sm font-bold text-foreground placeholder:text-foreground/30 px-4"
            />

            <Button 
                type="submit"
                className="mr-2 h-12 px-6 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
                <ShoppingBag className="h-4 w-4 mr-2" /> BUSCAR
            </Button>
        </form>
        
        <p className="mt-3 px-6 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30 italic text-center">
            Buscá hamburguesas, pizzas, bebidas y más entre todos los Clubers
        </p>
    </div>
  );
}
