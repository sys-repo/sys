import { vimeo, TUBES } from './common.ts';

/**
 * Index of Video IDs.
 */
export const VIDEO = {
  Tubes: TUBES,
  GroupScale: vimeo(727951677),
  Trailer: vimeo(1068502644),
  Overview: vimeo(1068653222),
  Programme: {
    Intro: {
      About: vimeo(577856505),
    },
  },
} as const;
