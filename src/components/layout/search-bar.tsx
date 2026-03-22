'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsExpanded(false);
      setQuery('');
    }
  };

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <>
      {/* Mobile: icon-only trigger */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="sm:hidden text-white hover:bg-white/20 hover:text-white"
        onClick={() => setIsExpanded(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Mobile: full-width overlay search */}
      {isExpanded && (
        <div className="sm:hidden fixed inset-x-0 top-0 z-50 h-16 bg-primary border-b border-white/10 shadow-premium flex items-center px-3 gap-2 animate-fade-in">
          <form onSubmit={handleSearch} className="flex-1 flex items-center bg-white/10 rounded-full border border-white/20 px-3 transition-colors focus-within:bg-white/20">
            <Search className="h-4 w-4 text-white/80 shrink-0" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Buscar beneficios..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-sm text-white placeholder:text-white/60"
            />
          </form>
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 text-white hover:bg-white/20"
            onClick={() => { setIsExpanded(false); setQuery(''); }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Desktop: inline search bar */}
      <div className={cn("hidden sm:flex relative items-center", className)}>
        <form 
          onSubmit={handleSearch}
          className="flex items-center bg-white/10 hover:bg-white/20 transition-colors rounded-full border border-white/20 w-48 px-3"
        >
          <Search className="h-4 w-4 text-white/80 shrink-0" />
          <Input
            type="text"
            placeholder="Buscar beneficios..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 text-sm text-white placeholder:text-white/60"
          />
        </form>
      </div>
    </>
  );
}
