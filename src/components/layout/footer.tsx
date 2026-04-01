import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-100/10 bg-transparent pb-20 pt-16">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="grid grid-cols-2 lg:flex lg:items-center lg:justify-between gap-10">
          <div className="space-y-4">
               <h3 className="text-xl font-black uppercase italic tracking-tighter text-[#d93b64] font-montserrat">Estuclub</h3>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[200px] leading-loose">Potenciando el beneficio estudiantil en todo el país.</p>
          </div>
          
          <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400/30">PLATAFORMA</span>
              <div className="flex flex-col gap-2">
                <Link href="/support" className="text-xs font-bold text-slate-500 hover:text-[#d93b64] transition-colors">SOPORTE</Link>
                <Link href="/be-cluber" className="text-xs font-bold text-slate-500 hover:text-[#d93b64] transition-colors">SER CLUBER</Link>
                <Link href="/be-rider" className="text-xs font-bold text-slate-500 hover:text-[#d93b64] transition-colors">SER RIDER</Link>
              </div>
          </div>

          <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400/30">LEGAL</span>
              <div className="flex flex-col gap-2">
                <Link href="/privacidad" className="text-xs font-bold text-slate-500 hover:text-[#d93b64] transition-colors">PRIVACIDAD</Link>
                <Link href="/terminos" className="text-xs font-bold text-slate-500 hover:text-[#d93b64] transition-colors">TÉRMINOS</Link>
              </div>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100/5 flex flex-col md:flex-row items-center justify-between gap-6">
           <p className="text-[10px] font-bold text-slate-400/40 uppercase tracking-widest">
              © {new Date().getFullYear()} ESTUCLUB | TODOS LOS DERECHOS RESERVADOS.
           </p>
           <div className="flex items-center gap-6">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400/10" />
              <p className="text-[10px] font-black italic tracking-tighter text-slate-400/40">HECHO CON ❤️ EN ARGENTINA</p>
           </div>
        </div>
      </div>
    </footer>
  );
}
