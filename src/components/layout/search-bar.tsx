'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsExpanded(false);
    }
  };

  return (
    <div className={cn("relative flex items-center", className)}>
        {/* Mobile/Desktop toggleable search */}
        <form 
            onSubmit={handleSearch}
            className={cn(
                "flex items-center transition-all duration-300 ease-in-out overflow-hidden bg-muted/50 rounded-full border border-border/50",
                isExpanded ? "w-48 sm:w-64 px-3" : "w-0 sm:w-48 sm:px-3 sm:border-border/50 border-transparent px-0"
            )}
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

        <Button 
            variant="ghost" 
            size="icon" 
            className="sm:hidden ml-1"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {isExpanded ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </Button>
    </div>
  );
}
