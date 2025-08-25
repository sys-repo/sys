export const SAMPLES = [
  'Hello World',
  'Slots',
  'Factory Error',
  'State',
  'Composed Recursive',
  'Schema Validation',
] as const;

export type Sample = (typeof SAMPLES)[number];
export type SampleDoc = { count?: number };
