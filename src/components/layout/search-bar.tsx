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
        className="sm:hidden"
        onClick={() => setIsExpanded(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Mobile: full-width overlay search */}
      {isExpanded && (
        <div className="sm:hidden fixed inset-x-0 top-0 z-50 h-16 bg-background border-b flex items-center px-3 gap-2 animate-fade-in">
          <form onSubmit={handleSearch} className="flex-1 flex items-center bg-muted/50 rounded-full border border-border/50 px-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Buscar beneficios..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-sm"
            />
          </form>
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0"
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
          className="flex items-center bg-muted/50 rounded-full border border-border/50 w-48 px-3"
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="text"
            placeholder="Buscar beneficios..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 text-sm"
          />
        </form>
      </div>
    </>
  );
}
