import { TUBES, videoUrl } from './common.ts';
import { VIDEO as Programme } from './ui.Programme.v/-VIDEO.ts';

/**
 * Index of Video IDs.
 */
export const VIDEO = {
  Tubes: TUBES,
  GroupScale: videoUrl(727951677),
  Trailer: videoUrl(1068502644),
  Overview: videoUrl(1068653222),
  Programme,
} as const;
