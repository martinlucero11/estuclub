'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL_APP_ERROR:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative bg-white/5 border border-white/10 rounded-[2rem] w-full h-full flex items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white font-montserrat">
                ¡Ups! Algo salió <span className="text-primary">de ruta</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm leading-relaxed px-4">
                La aplicación encontró un error inesperado. No te preocupes, tus datos están a salvo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <Button 
                onClick={() => window.location.reload()}
                className="h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/20"
              >
                <RefreshCcw className="mr-2 h-5 w-5" /> Reintentar Carga
              </Button>
              <Button 
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="h-14 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black uppercase tracking-widest hover:bg-white/10"
              >
                <Home className="mr-2 h-5 w-5" /> Volver al Inicio
              </Button>
            </div>

            <div className="pt-8 opacity-20">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Estuclub Safety Protocol 2026</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
