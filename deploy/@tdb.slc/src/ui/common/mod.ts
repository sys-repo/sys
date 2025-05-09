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
const tubes = 499921561;
export const vimeo = (id?: number) => ({ id, src: `vimeo/${id ?? tubes}` } as const);
export const TUBES = vimeo(tubes);
