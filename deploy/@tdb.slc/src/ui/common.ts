import { motion as Motion } from 'motion/react';
export { AnimatePresence } from 'motion/react';
export { Motion as M, Motion };

/**
 * System
 */
export { Color, css, Style } from '@sys/ui-css';
export { Keyboard } from '@sys/ui-dom';
export { Signal, useDist, useIsTouchSupported, useSizeObserver } from '@sys/ui-react';
export {
  Button,
  Cropmarks,
  Obj,
  Player,
  Sheet as SheetBase,
  Svg,
  VimeoBackground,
} from '@sys/ui-react-components';

/**
 * Local
 */
export * from '../common.ts';

/**
 * Common Video Refs
 */
export const vimeo = (id: number) => ({ id, src: `vimeo/${id}` } as const);
export const TUBES = vimeo(499921561);
