import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background dark:bg-background/95 pb-20 pt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="grid grid-cols-2 lg:flex lg:items-center lg:justify-between gap-10">
          <div className="space-y-4">
               <div className="h-7 w-28 relative">
                   <Image 
                     src="/logo-white.svg" 
                     alt="Estuclub" 
                     fill
                     className="object-contain brightness-100 dark:invert-0 invert transition-all"
                   />
               </div>
               <p className="text-[10px] font-bold text-foreground uppercase tracking-widest max-w-[200px] leading-loose opacity-40">Potenciando el beneficio estudiantil en todo el país.</p>
          </div>
          
          <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#cb465a]">PLATAFORMA</span>
              <div className="flex flex-col gap-2">
                <Link href="/support" className="text-xs font-bold text-foreground/60 hover:text-[#cb465a] transition-colors uppercase tracking-widest">SOPORTE</Link>
                <Link href="/be-cluber" className="text-xs font-bold text-foreground/60 hover:text-[#cb465a] transition-colors uppercase tracking-widest">SER CLUBER</Link>
                <Link href="/be-rider" className="text-xs font-bold text-foreground/60 hover:text-[#cb465a] transition-colors uppercase tracking-widest">SER RIDER</Link>
              </div>
          </div>

          <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#cb465a]">LEGAL</span>
              <div className="flex flex-col gap-2">
                <Link href="/privacidad" className="text-xs font-bold text-foreground/60 hover:text-[#cb465a] transition-colors uppercase tracking-widest">PRIVACIDAD</Link>
                <Link href="/terminos" className="text-xs font-bold text-foreground/60 hover:text-[#cb465a] transition-colors uppercase tracking-widest">TÉRMINOS</Link>
              </div>
          </div>
        </div>

        <div className="pt-10 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
           <p className="text-[10px] font-black text-foreground uppercase tracking-widest opacity-40">
              © {new Date().getFullYear()} ESTUCLUB | TODOS LOS DERECHOS RESERVADOS.
           </p>
           <div className="flex items-center gap-6 group">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cb465a] animate-pulse" />
              <p className="text-[10px] font-black italic tracking-tighter text-[#cb465a] group-hover:drop-shadow-[0_0_8px_rgba(203,70,90,0.5)] transition-all">HECHO CON ❤️ EN ARGENTINA</p>
           </div>
        </div>
      </div>
    </footer>
  );
}

