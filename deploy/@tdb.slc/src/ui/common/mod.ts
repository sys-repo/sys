export * from '../../common.ts';
export * from './libs.ts';

export { Signal } from '@sys/ui-react';

/**
 * Local
 */
export * from '../ui.Icons.ts';

/**
 * Common Video Refs
 */
export const vimeo = (id: number) => ({ id, src: `vimeo/${id}` } as const);
export const TUBES = vimeo(499921561);
