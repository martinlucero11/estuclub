'use client';

import { HomeHero as HomeHeroType } from '@/types/data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HomeHero({ hero }: { hero: HomeHeroType }) {
    if (!hero) return null;

    return (
        <section className="relative h-[100dvh] md:h-screen w-full flex flex-col justify-end p-8 md:p-16 overflow-hidden rounded-[3rem] md:rounded-[4rem] group">
            {/* Background Image with Parallax-ish feel */}
            {hero.bgImage ? (
                <div className="absolute inset-0 z-0">
                    <img 
                        src={hero.bgImage} 
                        alt="Hero background" 
                        className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-black/10 backdrop-grayscale-[0.2]" />
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-primary/20 to-black z-0" />
            )}

            {/* Content Overlay */}
            <div className="relative z-10 max-w-4xl space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-primary/20 backdrop-blur-3xl border border-primary/30 py-2 px-6 rounded-full w-fit shadow-[0_0_20px_rgba(255,0,127,0.2)] animate-pulse-slow">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Experiencia Premium</span>
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-[0.85] text-shadow-lg">
                        {hero.title || 'ESTUCLUB <br/> UNIVERSO'}
                    </h1>
                    
                    <p className="text-lg md:text-2xl text-white/80 font-bold uppercase tracking-widest italic max-w-2xl leading-relaxed">
                        {hero.subtitle || 'Red exclusiva de beneficios y conexión para la comunidad estudiantil.'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                    <Button asChild className="h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[12px] shadow-[0_15px_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 hover:bg-white/90 transition-all">
                        <Link href={hero.ctaLink || '/benefits'}>
                            {hero.ctaText || 'Explorar Ahora'} <ArrowRight className="ml-3 h-5 w-5" />
                        </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="h-16 px-12 rounded-2xl border-white/20 text-white font-black uppercase tracking-widest text-[11px] backdrop-blur-xl hover:bg-white/10 hover:border-white/40 transition-all">
                        <Link href="/solicitar-cluber">Únete como Comercio</Link>
                    </Button>
                </div>
            </div>

            {/* Branding Accent */}
            <div className="absolute top-10 right-10 z-10 hidden md:block">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.8em] vertical-rl h-40 flex items-center justify-center border-r border-white/10">
                    ESTUCLUB PLATFORM 2026
                </p>
            </div>
        </section>
    );
}
