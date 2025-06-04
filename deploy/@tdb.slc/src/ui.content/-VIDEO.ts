import { TUBES, v } from './common.ts';
import { VIDEO as Programme } from './ui.Programme.v/-VIDEO.ts';

/**
 * Index of Video IDs.
 */
export const VIDEO = {
  Tubes: TUBES,
  GroupScale: v(727951677),
  Trailer: v(1068502644),
  Overview: v(1068653222),
  Programme,
} as const;
