import type { Prop } from '../logic/sceneTypes';

/** Typed readers for a prop's free-form parameters. A leaf module on purpose: the builder tables import these, and builders.ts imports the tables, so keeping them in builders.ts made a cycle that failed with a TDZ error depending on module load order (dev server). */
export const num = (p: Prop, key: string, d: number): number => { const v = p.p?.[key]; return typeof v === 'number' ? v : d; };
export const col = (p: Prop, key: string, d: number): number => { const v = p.p?.[key]; return typeof v === 'number' ? v : d; };
export const str = (p: Prop, key: string, d: string): string => { const v = p.p?.[key]; return typeof v === 'string' ? v : d; };
export const flag = (p: Prop, key: string, d = false): boolean => { const v = p.p?.[key]; return typeof v === 'boolean' ? v : d; };
