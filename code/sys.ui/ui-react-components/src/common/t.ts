export type {
  FC,
  JSX,
  ReactNode,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from 'react';

/**
 * @system:
 */
export type * from '@sys/types';
export type * from '@sys/ui-css/t';

export type { ColorTheme } from '@sys/color/t';
export type { MediaResolver, Timecode } from '@sys/std/t';
export type { SpecImports } from '@sys/testing/t';
export type { TextFilter } from '@sys/text/t';
export type { KeyboardModifierFlags, LocalStorageImmutable } from '@sys/ui-dom/t';
export type {
  PointerDragdropSnapshot,
  PointerDragSnapshot,
  PointerEventsArg,
  PointerEventsHandler,
  PointerHookFlags,
  ReactChildrenDepsKey,
} from '@sys/ui-react/t';
export type { TimecodeState } from '@sys/ui-state/t';

/**
 * @local:
 */
export type * from '../types.ts';
