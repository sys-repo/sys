export const SAMPLES = [
  'Hello World',
  'Slots',
  'State',
  'Composed Recursive',
  'Factory Error',
  'Schema Validation',
] as const;

export type Sample = (typeof SAMPLES)[number];
export type SampleDoc = { count?: number };
