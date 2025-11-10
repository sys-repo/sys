import { motion as Motion } from 'motion/react';
export { AnimatePresence } from 'motion/react';
export { Motion as M, Motion };

/**
 * System
 */
export { Delete, Err, Is, Json, JsrUrl, Log, Pkg, R, slug, Try, Url } from '@sys/std';
export { Schedule } from '@sys/std/async';
export { Rx } from '@sys/std/rx';
export { Time, Timecode } from '@sys/std/time';
export { Arr, Num, Obj, Str } from '@sys/std/value';

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
