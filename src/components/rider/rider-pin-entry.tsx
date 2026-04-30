'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, 
    X, 
    Delete, 
    ShieldCheck, 
    Lock,
    KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

    isOpen: boolean;
    onClose: () => void;
    correctPin: string;
    onSuccess: () => void;
    amountToCollect?: number;
}

export function RiderPinEntry({ isOpen, onClose, correctPin, onSuccess, amountToCollect = 0 }: RiderPinEntryProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [hasConfirmedCollection, setHasConfirmedCollection] = useState(amountToCollect <= 0);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError(false);
            setSuccess(false);
            setHasConfirmedCollection(amountToCollect <= 0);
        }
    }, [isOpen, amountToCollect]);

    useEffect(() => {
        if (pin.length === 4) {
            if (pin === correctPin) {
                handleSuccess();
            } else {
                handleError();
            }
        }
    }, [pin, correctPin]);

    const handleSuccess = () => {
        setSuccess(true);
        haptic.vibrateSuccess();
        setTimeout(() => {
            onSuccess();
            setPin('');
            setSuccess(false);
        }, 1500);
    };

    const handleError = () => {
        setError(true);
        haptic.vibrateError();
        setTimeout(() => {
            setError(false);
            setPin('');
        }, 600);
    };

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            haptic.vibrateSubtle();
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (pin.length > 0) {
            haptic.vibrateSubtle();
            setPin(prev => prev.slice(0, -1));
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[150] flex items-end justify-center bg-black/40 backdrop-blur-sm p-6"
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="w-full max-w-md bg-white rounded-[3rem] border border-zinc-200 p-8 pb-12 shadow-2xl relative overflow-hidden"
                    >
                        {/* Collection Warning Screen */}
                        {!hasConfirmedCollection ? (
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="bg-red-500/10 p-6 rounded-[2rem] border-2 border-red-500 w-full animate-pulse">
                                    <p className="text-red-600 font-black uppercase tracking-widest text-xs mb-2">Acción Requerida</p>
                                    <p className="text-2xl font-black italic text-red-600 leading-tight">DEBES COBRAR AL CLIENTE:</p>
                                    <p className="text-5xl font-black tracking-tighter text-red-600 mt-2">${amountToCollect.toLocaleString()}</p>
                                    <p className="text-red-500/80 font-bold uppercase text-[10px] mt-4">(Efectivo / Transferencia)</p>
                                </div>
                                
                                <p className="text-sm font-medium text-zinc-500 px-4">
                                    No entregues el pedido ni pidas el PIN de seguridad sin haber recibido el pago del envío.
                                </p>
                                
                                <Button 
                                    onClick={() => {
                                        haptic.vibrateMedium();
                                        setHasConfirmedCollection(true);
                                    }}
                                    className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                                >
                                    YA COBRÉ EL ENVÍO
                                </Button>
                                
                                <Button 
                                    variant="ghost" 
                                    onClick={onClose}
                                    className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600"
                                >
                                    Cancelar Entrega
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="flex flex-col items-center text-center space-y-4 mb-10">
                                    <div className={cn(
                                        "h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                                        success ? "bg-emerald-500 shadow-lg shadow-emerald-500/30" : "bg-[#cb465a]/10 border border-[#cb465a]/20"
                                    )}>
                                        {success ? <ShieldCheck className="h-8 w-8 text-white" /> : <Lock className="h-8 w-8 text-[#cb465a]" />}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-zinc-900">Validación de Entrega</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Pedile el PIN de 4 dígitos al cliente</p>
                                    </div>
                                </div>

                                {/* PIN Display */}
                                <div className="flex justify-center gap-4 mb-10">
                                    {[0, 1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ 
                                                scale: pin.length === i ? 1.2 : 1,
                                                borderColor: pin.length > i ? '#cb465a' : '#f4f4f5',
                                                x: error ? [0, -10, 10, -10, 10, 0] : 0
                                            }}
                                            className={cn(
                                                "w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-colors",
                                                pin.length > i ? "bg-[#cb465a]/5 text-[#cb465a]" : "bg-zinc-50 text-zinc-200",
                                                error && "border-red-500 text-red-600 bg-red-50"
                                            )}
                                        >
                                            {pin[i] ? "•" : ""}
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Keypad */}
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => handleNumberClick(num)}
                                            className="h-16 rounded-2xl bg-zinc-50 border border-zinc-100 text-xl font-black text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <div />
                                    <button
                                        onClick={() => handleNumberClick('0')}
                                        className="h-16 rounded-2xl bg-zinc-50 border border-zinc-100 text-xl font-black text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all"
                                    >
                                        0
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="h-16 rounded-2xl bg-[#cb465a]/5 border border-[#cb465a]/10 text-[#cb465a] flex items-center justify-center hover:bg-[#cb465a]/10 active:scale-95 transition-all"
                                    >
                                        <Delete className="h-6 w-6" />
                                    </button>
                                </div>

                                <Button 
                                    variant="ghost" 
                                    onClick={onClose}
                                    className="w-full text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600"
                                >
                                    Cancelar
                                </Button>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
