'use client';

import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Fraunces, Space_Grotesk } from 'next/font/google';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsBodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-settings-body',
});

const settingsDisplayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-settings-display',
});

export const settingsCardClass =
  'rounded-2xl border-[color:var(--settings-border)] bg-white/90 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]';

const pageVars = {
  '--settings-ink': '#0b1b2b',
  '--settings-accent': '#0f766e',
  '--settings-accent-strong': '#0b4f4e',
  '--settings-accent-soft': '#e6f6f4',
  '--settings-border': '#e5e7eb',
  '--settings-subtle': '#f6f8fb',
} as CSSProperties;

interface SettingsShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
  children: ReactNode;
}

export function SettingsShell({
  title,
  subtitle,
  actions,
  eyebrow = 'Settings & Security',
  children,
}: SettingsShellProps) {
  return (
    <div
      className={cn(
        settingsBodyFont.className,
        settingsDisplayFont.variable,
        'relative mx-auto space-y-6 px-4 pb-10 pt-6 md:px-8 max-w-6xl text-[color:var(--settings-ink)]'
      )}
      style={pageVars}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.22),rgba(15,118,110,0))]" />
        <div className="absolute -bottom-36 -left-12 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(29,78,216,0.18),rgba(29,78,216,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(248,250,252,0.96),rgba(248,250,252,0.7))]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-[color:var(--settings-border)] bg-white/90 p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.6)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.24),rgba(15,118,110,0))]" />
            <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(29,78,216,0.18),rgba(29,78,216,0))]" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.92),rgba(248,250,252,0.72))]" />
          </div>

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--settings-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--settings-accent-strong)]">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-[var(--font-settings-display)] tracking-tight md:text-4xl">
                  {title}
                </h1>
                {subtitle && <p className="max-w-2xl text-sm text-slate-600">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
