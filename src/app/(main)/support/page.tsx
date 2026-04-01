'use client';

import React from 'react';
import MainLayout from '@/components/layout/main-layout';
import { motion } from 'framer-motion';
import { 
    MessageCircle, 
    Mail, 
    HelpCircle, 
    ShieldCheck, 
    Bike, 
    Store, 
    ChevronRight,
    Headphones,
    ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const SUPPORT_CATEGORIES = [
    {
        title: "Estudiantes",
        description: "Ayuda con tu carnet digital, beneficios y puntos XP.",
        icon: Headphones,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        href: "https://wa.me/5493764218015?text=Hola!%20Necesito%20ayuda%20como%20estudiante"
    },
    {
        title: "Clubers (Comercios)",
        description: "Soporte para cobros, pedidos y gestión de local.",
        icon: Store,
        color: "text-[#d93b64]",
        bg: "bg-[#d93b64]/10",
        href: "https://wa.me/5493764218015?text=Hola!%20Necesito%20ayuda%20con%20mi%20comercio"
    },
    {
        title: "Riders (Repartidores)",
        description: "Asistencia en ruta, pagos y registro de vehículos.",
        icon: Bike,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        href: "https://wa.me/5493764218015?text=Hola!%20Necesito%20soporte%20como%20Rider"
    }
];

const FAQS = [
    { q: "¿Cómo vinculo mi cuenta de Mercado Pago?", a: "Podes hacerlo desde tu perfil en el botón 'Vincular Mercado Pago' usando el flujo oficial de OAuth." },
    { q: "¿Cuánto tardan en aprobar mi solicitud?", a: "El equipo de Verificación suele aprobar las cuentas en menos de 24hs hábiles." },
    { q: "¿Qué hago si tengo un problema con un pedido?", a: "Contactanos de inmediato por WhatsApp seleccionando la categoría correspondiente." }
];

export default function SupportPage() {
    return (
        <MainLayout>
            <div className="min-h-screen bg-white selection:bg-[#d93b64]/20 pb-32">
                {/* Hero Section */}
                <div className="relative pt-32 pb-20 overflow-hidden bg-slate-900">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#d93b64]/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />
                    
                    <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#d93b64]/20 rounded-full border border-[#d93b64]/30"
                        >
                            <HelpCircle className="h-4 w-4 text-[#d93b64]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d93b64]">Centro de Ayuda</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white italic font-montserrat leading-[0.85]"
                        >
                            ¿Cómo podemos <br/><span className="text-[#d93b64]">Ayudarte?</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-400 font-medium text-lg max-w-xl mx-auto leading-relaxed"
                        >
                            Estamos acá para que tu experiencia en Estuclub sea perfecta. Elegí tu perfil y hablá con nosotros.
                        </motion.p>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {SUPPORT_CATEGORIES.map((cat, i) => (
                            <motion.div
                                key={cat.title}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (i * 0.1) }}
                            >
                                <Card className="rounded-[3rem] border-none shadow-[0_20px_60px_rgba(0,0,0,0.1)] bg-white hover:scale-[1.03] transition-all group overflow-hidden h-full"> 
                                    <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
                                        <div className={`h-20 w-20 rounded-[2rem] ${cat.bg} flex items-center justify-center transition-transform group-hover:rotate-6`}>
                                            <cat.icon className={`h-10 w-10 ${cat.color}`} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tighter font-montserrat">{cat.title}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">{cat.description}</p>
                                        </div>
                                        <Button asChild className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl">
                                            <a href={cat.href} target="_blank" rel="noopener noreferrer">
                                                CHAT WHATSAPP <ExternalLink className="ml-2 h-4 w-4 opacity-40" />
                                            </a>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-4xl mx-auto px-6 mt-32 space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter font-montserrat">Preguntas <span className="text-[#d93b64]">Frecuentes</span></h2>
                        <div className="h-[2px] w-20 bg-[#d93b64] mx-auto rounded-full" />
                    </div>

                    <div className="grid gap-6">
                        {FAQS.map((faq, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-3"
                            >
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-3">
                                    <HelpCircle className="h-4 w-4 text-[#d93b64]" /> {faq.q}
                                </h4>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed ml-7">
                                    {faq.a}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Direct Contact Footer */}
                <div className="max-w-4xl mx-auto px-6 mt-32">
                    <Card className="rounded-[3rem] border-none bg-gradient-to-br from-[#d93b64] to-[#f46087] p-12 text-white text-center shadow-2xl shadow-[#d93b64]/30">
                        <CardContent className="space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter font-montserrat">¿Todavía tenés dudas?</h3>
                                <p className="text-white/80 font-bold text-xs uppercase tracking-widest">Escribinos directamente al mail oficial</p>
                            </div>
                            <Button variant="outline" asChild className="h-16 px-10 rounded-2xl bg-white text-[#d93b64] border-none font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-xl">
                                <a href="mailto:soporte@estuclub.com.ar">
                                    <Mail className="mr-2 h-5 w-5" /> SOPORTE@ESTUCLUB.COM.AR
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
