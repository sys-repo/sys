import { pkg } from '../../pkg.ts';
export { Signal } from '@sys/ui-react';

export * from '../../common.ts';
export * from '../ui.Icons.ts';
export * from './libs.ts';

/**
 * Common Video Refs:
 */
const tubes = 499921561;
export const TUBES = { id: tubes, src: `vimeo/${tubes}` };

export const videoUrl = (id: number) => {
  const src = `https://fs.socialleancanvas.com/video/540p/${id}.mp4`;
  return { id, src } as const;
};

/**
 * CRDT/local-storage:
 */
export const STORAGE_KEY = {
  DEV: `dev:${pkg.name}:crdt`,
} as const;
