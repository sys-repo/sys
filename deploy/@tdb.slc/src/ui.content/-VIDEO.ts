import { TUBES, vimeo } from './common.ts';
import { VIDEO as Programme } from './ui.Programme/-VIDEO.ts';

/**
 * Index of Video IDs.
 */
export const VIDEO = {
  Tubes: TUBES,
  GroupScale: vimeo(727951677),
  Trailer: vimeo(1068502644),
  Overview: vimeo(1068653222),
  Programme,
} as const;
