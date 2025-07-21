import { motion as Motion } from 'motion/react';
export { AnimatePresence } from 'motion/react';
export { Motion as M, Motion };

/**
 * System
 */
export {
  Arr,
  Err,
  Is,
  isRecord,
  JsrUrl,
  Num,
  Obj,
  Path,
  Pkg,
  R,
  rx,
  slug,
  Str,
  Time,
  Timestamp,
  Url,
} from '@sys/std';

export { Http } from '@sys/http/client';
export { Color, css, Style } from '@sys/ui-css';
export { Dom, Keyboard, LocalStorage } from '@sys/ui-dom';
export { UserAgent } from '@sys/ui-dom/user-agent';
export {
  FC,
  ReactChildren,
  ReactString,
  Signal,
  useIsTouchSupported,
  usePointer,
  useRedraw,
  useSizeObserver,
} from '@sys/ui-react';
