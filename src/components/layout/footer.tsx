import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t-2 border-black bg-white pb-20 pt-16">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="grid grid-cols-2 lg:flex lg:items-center lg:justify-between gap-10">
          <div className="space-y-4">
               <Image 
                 src="/logo-rosa.svg" 
                 alt="Estuclub" 
                 width={110} 
                 height={28} 
                 className="h-7 w-auto"
               />
               <p className="text-[10px] font-bold text-foreground uppercase tracking-widest max-w-[200px] leading-loose">Potenciando el beneficio estudiantil en todo el país.</p>
          </div>
          
          <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-black">PLATAFORMA</span>
              <div className="flex flex-col gap-2">
                <Link href="/support" className="text-xs font-bold text-foreground hover:text-[#cb465a] transition-colors">SOPORTE</Link>
                <Link href="/be-cluber" className="text-xs font-bold text-foreground hover:text-[#cb465a] transition-colors">SER CLUBER</Link>
                <Link href="/be-rider" className="text-xs font-bold text-foreground hover:text-[#cb465a] transition-colors">SER RIDER</Link>
              </div>
          </div>

          <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-black">LEGAL</span>
              <div className="flex flex-col gap-2">
                <Link href="/privacidad" className="text-xs font-bold text-foreground hover:text-[#cb465a] transition-colors">PRIVACIDAD</Link>
                <Link href="/terminos" className="text-xs font-bold text-foreground hover:text-[#cb465a] transition-colors">TÉRMINOS</Link>
              </div>
          </div>
        </div>

        <div className="pt-10 border-t-2 border-black flex flex-col md:flex-row items-center justify-between gap-6">
           <p className="text-[10px] font-black text-black uppercase tracking-widest">
              © {new Date().getFullYear()} ESTUCLUB | TODOS LOS DERECHOS RESERVADOS.
           </p>
           <div className="flex items-center gap-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <p className="text-[10px] font-black italic tracking-tighter text-primary">HECHO CON ❤️ EN ARGENTINA</p>
           </div>
        </div>
      </div>
    </footer>
  );
}

