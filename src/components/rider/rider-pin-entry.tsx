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

interface RiderPinEntryProps {
    isOpen: boolean;
    onClose: () => void;
    correctPin: string;
    onSuccess: () => void;
}

export function RiderPinEntry({ isOpen, onClose, correctPin, onSuccess }: RiderPinEntryProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);

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
                    className="fixed inset-0 z-[150] flex items-end justify-center bg-black/80 backdrop-blur-xl p-6"
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="w-full max-w-md bg-[#0a0a0a] rounded-[3rem] border border-[#cb465a]/20 p-8 pb-12 shadow-[0_-20px_50px_rgba(203,70,90,0.2)]"
                    >
                        {/* Header */}
                        <div className="flex flex-col items-center text-center space-y-4 mb-10">
                            <div className={cn(
                                "h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                                success ? "bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]" : "bg-[#cb465a]/10 border border-[#cb465a]/20"
                            )}>
                                {success ? <ShieldCheck className="h-8 w-8 text-white" /> : <Lock className="h-8 w-8 text-[#cb465a]" />}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Validación de Entrega</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Pedile el PIN de 4 dígitos al cliente</p>
                            </div>
                        </div>

                        {/* PIN Display */}
                        <div className="flex justify-center gap-4 mb-10">
                            {[0, 1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ 
                                        scale: pin.length === i ? 1.2 : 1,
                                        borderColor: pin.length > i ? '#cb465a' : 'rgba(255,255,255,0.1)',
                                        x: error ? [0, -10, 10, -10, 10, 0] : 0
                                    }}
                                    className={cn(
                                        "w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-colors",
                                        pin.length > i ? "bg-[#cb465a]/10 text-[#cb465a]" : "bg-white/5 text-white/20",
                                        error && "border-red-500 text-red-500 bg-red-500/10"
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
                                    className="h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-black hover:bg-white/10 active:scale-95 transition-all"
                                >
                                    {num}
                                </button>
                            ))}
                            <div />
                            <button
                                onClick={() => handleNumberClick('0')}
                                className="h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-black hover:bg-white/10 active:scale-95 transition-all"
                            >
                                0
                            </button>
                            <button
                                onClick={handleDelete}
                                className="h-16 rounded-2xl bg-[#cb465a]/10 border border-[#cb465a]/20 text-[#cb465a] flex items-center justify-center hover:bg-[#cb465a]/20 active:scale-95 transition-all"
                            >
                                <Delete className="h-6 w-6" />
                            </button>
                        </div>

                        <Button 
                            variant="ghost" 
                            onClick={onClose}
                            className="w-full text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-white"
                        >
                            Cancelar
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
