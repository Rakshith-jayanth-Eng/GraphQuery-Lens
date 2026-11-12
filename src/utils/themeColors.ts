import { EntityType } from '../types/graph';

export interface TypeStyle {
  primary: string;
  glow: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  ringClass: string;
  hex: string;
}

export const ENTITY_TYPE_STYLES: Record<string, TypeStyle> = {
  SERVICE: {
    primary: '#06b6d4', // cyan-500
    glow: 'rgba(6, 182, 212, 0.45)',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/40',
    textClass: 'text-cyan-400',
    ringClass: 'ring-cyan-500/50',
    hex: '#06b6d4',
  },
  DATABASE: {
    primary: '#f59e0b', // amber-500
    glow: 'rgba(245, 158, 11, 0.45)',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/40',
    textClass: 'text-amber-400',
    ringClass: 'ring-amber-500/50',
    hex: '#f59e0b',
  },
  QUEUE: {
    primary: '#10b981', // emerald-500
    glow: 'rgba(16, 185, 129, 0.45)',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/40',
    textClass: 'text-emerald-400',
    ringClass: 'ring-emerald-500/50',
    hex: '#10b981',
  },
  GATEWAY: {
    primary: '#8b5cf6', // violet-500
    glow: 'rgba(139, 92, 246, 0.45)',
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/40',
    textClass: 'text-violet-400',
    ringClass: 'ring-violet-500/50',
    hex: '#8b5cf6',
  },
  CACHE: {
    primary: '#f43f5e', // rose-500
    glow: 'rgba(244, 63, 94, 0.45)',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/40',
    textClass: 'text-rose-400',
    ringClass: 'ring-rose-500/50',
    hex: '#f43f5e',
  },
  CLIENT: {
    primary: '#3b82f6', // blue-500
    glow: 'rgba(59, 130, 246, 0.45)',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/40',
    textClass: 'text-blue-400',
    ringClass: 'ring-blue-500/50',
    hex: '#3b82f6',
  },
  INFRASTRUCTURE: {
    primary: '#94a3b8', // slate-400
    glow: 'rgba(148, 163, 184, 0.35)',
    bgClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/40',
    textClass: 'text-slate-300',
    ringClass: 'ring-slate-500/50',
    hex: '#94a3b8',
  },
  MONITORING: {
    primary: '#f97316', // orange-500
    glow: 'rgba(249, 115, 22, 0.45)',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/40',
    textClass: 'text-orange-400',
    ringClass: 'ring-orange-500/50',
    hex: '#f97316',
  },
  STORAGE: {
    primary: '#6366f1', // indigo-500
    glow: 'rgba(99, 102, 241, 0.45)',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/40',
    textClass: 'text-indigo-400',
    ringClass: 'ring-indigo-500/50',
    hex: '#6366f1',
  },
  COMPONENT: {
    primary: '#ec4899', // pink-500
    glow: 'rgba(236, 72, 153, 0.45)',
    bgClass: 'bg-pink-500/10',
    borderClass: 'border-pink-500/40',
    textClass: 'text-pink-400',
    ringClass: 'ring-pink-500/50',
    hex: '#ec4899',
  },
  EXTERNAL_API: {
    primary: '#14b8a6', // teal-500
    glow: 'rgba(20, 184, 166, 0.45)',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/40',
    textClass: 'text-teal-400',
    ringClass: 'ring-teal-500/50',
    hex: '#14b8a6',
  },
  INCIDENT_EVENT: {
    primary: '#ef4444', // red-500
    glow: 'rgba(239, 68, 68, 0.55)',
    bgClass: 'bg-red-500/15',
    borderClass: 'border-red-500/50',
    textClass: 'text-red-400',
    ringClass: 'ring-red-500/60',
    hex: '#ef4444',
  },
};

export function getTypeStyle(type: EntityType | string): TypeStyle {
  const normalized = (type || 'SERVICE').toUpperCase();
  return (
    ENTITY_TYPE_STYLES[normalized] || {
      primary: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.45)',
      bgClass: 'bg-cyan-500/10',
      borderClass: 'border-cyan-500/40',
      textClass: 'text-cyan-400',
      ringClass: 'ring-cyan-500/50',
      hex: '#06b6d4',
    }
  );
}
