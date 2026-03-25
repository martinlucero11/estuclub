'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Save, Loader2 } from 'lucide-react';

const MICAH_BASE = 'https://api.dicebear.com/9.x/micah/svg';

const DEFAULT_CONFIG = {
  skin: 'ffd1b1',
  hair: 'dannyPhantom',
  hcolor: '000000',
  bcolor: '000000',
  beard: 'none',
  mouth: 'smile',
  bg: 'b6e3f4',
};

const OPTS = {
  skin: [
    { v: 'ffd1b1', label: 'Clara' },
    { v: 'f1c27d', label: 'Trigueña' },
    { v: 'be9f75', label: 'Morena' },
    { v: 'ae5d29', label: 'Oscura' },
  ],
  hair: [
    { v: 'full', label: 'Largo' },
    { v: 'pixie', label: 'Pixie' },
    { v: 'dannyPhantom', label: 'Danny' },
    { v: 'fonze', label: 'Fonze' },
    { v: 'mrT', label: 'Corto' },
    { v: 'mrClean', label: 'Calvo' },
  ],
  hairColor: [
    { v: '000000', label: 'Negro' },
    { v: '77311d', label: 'Castaño' },
    { v: 'ac6651', label: 'Cobrizo' },
    { v: 'f9c666', label: 'Rubio' },
    { v: 'e8e1e1', label: 'Cano' },
  ],
  beard: [
    { v: 'none', label: 'Ninguna' },
    { v: 'beard', label: 'Barba' },
    { v: 'scruff', label: 'Sombra' },
  ],
  mouth: [
    { v: 'smile', e: '😊', label: 'Sonrisa' },
    { v: 'laughing', e: '😄', label: 'Risa' },
    { v: 'smirk', e: '😏', label: 'Serio' },
    { v: 'surprised', e: '😮', label: 'Ehh' },
    { v: 'nervous', e: '😬', label: 'Nervio' },
    { v: 'sad', e: '😞', label: 'Triste' },
  ],
  bg: [
    { v: 'transparent', label: 'Sin fondo', hex: null },
    { v: 'b6e3f4', label: 'Celeste', hex: '#b6e3f4' },
    { v: 'ffdfbf', label: 'Crema', hex: '#ffdfbf' },
    { v: 'd1d4f9', label: 'Lavanda', hex: '#d1d4f9' },
    { v: 'ffd5dc', label: 'Rosa', hex: '#ffd5dc' },
    { v: 'c0adef', label: 'Lila', hex: '#c0adef' },
  ],
};

function buildUrl(c: typeof DEFAULT_CONFIG) {
  return `${MICAH_BASE}?baseColor=${c.skin}&hair=${c.hair}&hairColor=${c.hcolor}&facialHair=${c.beard === 'none' ? '' : c.beard}&facialHairProbability=${c.beard === 'none' ? 0 : 100}&facialHairColor=${c.bcolor}&mouth=${c.mouth}&backgroundColor=${c.bg === 'transparent' ? '' : c.bg}&hatProbability=0`;
}

function parseConfig(seed?: string): typeof DEFAULT_CONFIG {
  if (!seed || !seed.includes('|')) return { ...DEFAULT_CONFIG };
  const parsed: any = { ...DEFAULT_CONFIG };
  seed.split('|').forEach(part => {
    const [key, value] = part.split(':');
    if (key && value) parsed[key] = value;
  });
  return parsed;
}

function toSeed(c: typeof DEFAULT_CONFIG) {
  return `skin:${c.skin}|hair:${c.hair}|hcolor:${c.hcolor}|bcolor:${c.bcolor}|beard:${c.beard}|mouth:${c.mouth}|bg:${c.bg}`;
}

interface Props {
  selectedSeed?: string;
  onSelect: (seed: string) => void;
  onSave?: (seed: string) => Promise<void>;
}

export function AvatarSelector({ selectedSeed, onSelect, onSave }: Props) {
  const config = useMemo(() => parseConfig(selectedSeed), [selectedSeed]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (key: string, value: string) => {
    const next = { ...config, [key]: value };
    onSelect(toSeed(next));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    await onSave(toSeed(config));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const previewUrl = buildUrl(config);
  const bgStyle = config.bg !== 'transparent' ? `#${config.bg}` : 'hsl(var(--muted)/0.5)';

  return (
    <div className="w-full space-y-6 pt-2">

      {/* ─── PREVIEW ─── */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-[2.5rem] bg-primary/20 blur-2xl scale-75 translate-y-4" />
          <motion.div
            key={previewUrl}
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative h-40 w-40 rounded-[2.5rem] border-4 border-white/80 dark:border-white/10 shadow-2xl overflow-hidden"
            style={{ backgroundColor: bgStyle }}
          >
            <img
              src={previewUrl}
              alt="Tu Estu"
              className="w-full h-full object-contain p-1"
              onError={(e) => { (e.target as HTMLImageElement).src = `${MICAH_BASE}?seed=fallback&hatProbability=0`; }}
            />
          </motion.div>
        </div>
      </div>

      {/* ─── SECCIONES ─── */}
      <div className="space-y-5">

        {/* Tono de piel */}
        <PickerRow label="Tono de piel">
          <div className="flex gap-2.5 flex-wrap">
            {OPTS.skin.map(o => (
              <SkinSwatch key={o.v} color={`#${o.v}`} label={o.label} active={config.skin === o.v} onClick={() => update('skin', o.v)} />
            ))}
          </div>
        </PickerRow>

        {/* Peinado */}
        <PickerRow label="Peinado">
          <div className="flex flex-wrap gap-2">
            {OPTS.hair.map(o => (
              <Chip key={o.v} label={o.label} active={config.hair === o.v} onClick={() => update('hair', o.v)} />
            ))}
          </div>
        </PickerRow>

        {/* Color de pelo */}
        <PickerRow label="Color de pelo">
          <div className="flex gap-2.5 flex-wrap">
            {OPTS.hairColor.map(o => (
              <ColorSwatch key={o.v} color={`#${o.v}`} label={o.label} active={config.hcolor === o.v} onClick={() => update('hcolor', o.v)} />
            ))}
          </div>
        </PickerRow>

        {/* Barba */}
        <PickerRow label="Barba">
          <div className="flex gap-2 flex-wrap">
            {OPTS.beard.map(o => (
              <Chip key={o.v} label={o.label} active={config.beard === o.v} onClick={() => update('beard', o.v)} />
            ))}
          </div>
          <AnimatePresence>
            {config.beard !== 'none' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 mt-3">Color de barba</p>
                <div className="flex gap-2 flex-wrap">
                  {OPTS.hairColor.map(o => (
                    <ColorSwatch key={o.v} color={`#${o.v}`} label={o.label} active={config.bcolor === o.v} onClick={() => update('bcolor', o.v)} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </PickerRow>

        {/* Expresión */}
        <PickerRow label="Expresión">
          <div className="flex gap-2 flex-wrap">
            {OPTS.mouth.map(o => (
              <motion.button
                key={o.v}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => update('mouth', o.v)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border-2 transition-all text-center min-w-[3.5rem]',
                  config.mouth === o.v
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border/50 hover:border-primary/40 bg-background/40'
                )}
              >
                <span className="text-lg leading-none">{o.e}</span>
                <span className={cn('text-[9px] font-black uppercase tracking-wide', config.mouth === o.v ? 'text-primary' : 'text-muted-foreground')}>{o.label}</span>
              </motion.button>
            ))}
          </div>
        </PickerRow>

        {/* Fondo */}
        <PickerRow label="Fondo">
          <div className="flex gap-2 flex-wrap">
            {OPTS.bg.map(o => (
              <motion.button
                key={o.v}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => update('bg', o.v)}
                title={o.label}
                className={cn(
                  'h-9 w-9 rounded-xl border-2 transition-all relative flex items-center justify-center overflow-hidden',
                  config.bg === o.v ? 'border-primary scale-110 shadow-md' : 'border-border/50 hover:border-primary/40'
                )}
                style={{ backgroundColor: o.hex || 'transparent' }}
              >
                {o.v === 'transparent' && <span className="text-[8px] font-black text-muted-foreground">OFF</span>}
                {config.bg === o.v && o.v !== 'transparent' && (
                  <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white drop-shadow" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </PickerRow>
      </div>

      {/* ─── BOTÓN GUARDAR ─── */}
      {onSave && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'w-full h-12 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 transition-all shadow-lg',
            saved
              ? 'bg-green-500 text-white shadow-green-500/30'
              : 'bg-primary text-white hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99]'
          )}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
          ) : saved ? (
            <><Check className="h-4 w-4" /> Avatar guardado!</>
          ) : (
            <><Save className="h-4 w-4" /> Guardar Avatar</>
          )}
        </motion.button>
      )}
    </div>
  );
}

/* ─── Sub-componentes ─── */

function PickerRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">{label}</p>
      {children}
      <div className="border-b border-border/30" />
    </div>
  );
}

function SkinSwatch({ color, label, active, onClick }: { color: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button type="button" title={label} whileTap={{ scale: 0.9 }} onClick={onClick}
      className={cn('h-9 w-9 rounded-full border-2 transition-all relative flex items-center justify-center',
        active ? 'border-primary ring-4 ring-primary/20 scale-110 shadow-md' : 'border-border/30 hover:border-primary/40'
      )}
      style={{ backgroundColor: color }}
    >
      {active && <Check className="h-3 w-3 text-white/90 drop-shadow" />}
    </motion.button>
  );
}

function ColorSwatch({ color, label, active, onClick }: { color: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button type="button" title={label} whileTap={{ scale: 0.9 }} onClick={onClick}
      className={cn('h-7 w-7 rounded-lg border-2 transition-all relative flex items-center justify-center',
        active ? 'border-primary ring-4 ring-primary/20 scale-110 shadow-md' : 'border-border/30 hover:border-primary/40'
      )}
      style={{ backgroundColor: color }}
    >
      {active && <Check className="h-2.5 w-2.5 text-white/90 drop-shadow" />}
    </motion.button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onClick}
      className={cn(
        'px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border-2 transition-all',
        active
          ? 'bg-foreground text-background border-foreground shadow-sm'
          : 'bg-background/40 text-muted-foreground border-border/40 hover:border-foreground/30 hover:text-foreground'
      )}
    >
      {label}
    </motion.button>
  );
}

export function AvatarFallbackFachero({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center bg-gradient-to-br from-primary via-accent to-primary-foreground shadow-inner overflow-hidden', className)}>
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-white font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] select-none">?</span>
      </motion.div>
    </div>
  );
}
