export * from '../../common.ts';
export * from './libs.ts';

export { Signal } from '@sys/ui-react';

/**
 * Local
 */
export * from '../ui.Icons.ts';

/**
 * Common Video Refs:
 */
const tubes = 499921561;
export const TUBES = { id: tubes, src: `vimeo/${tubes}` };

export const v = (id: number) => {
  const src = `https://fs.socialleancanvas.com/video/540p/${id}.mp4`;
  return { id, src } as const;
};
