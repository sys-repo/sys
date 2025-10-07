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
  slug,
  Str,
  Time,
  Timestamp,
  Url,
} from '@sys/std';
export { Schedule } from '@sys/std/async';
export { Rx } from '@sys/std/rx';

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
  useObservableRev,
  usePointer,
  useRev,
  useSizeObserver,
} from '@sys/ui-react';
