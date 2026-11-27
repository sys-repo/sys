export type {
  FC,
  JSX,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';

/**
 * @system:
 */
export type * from '@sys/types';
export type { Color } from '@sys/color/t';
export type { EventWithKind } from '@sys/event/t';
export type { Markdown } from '@sys/markdown/t';
export type { MediaResolver, Timecode } from '@sys/std/t';
export type { SpecImports } from '@sys/testing/t';
export type { TextFilter } from '@sys/text/t';
export type { CssDom, CssEdges, CssTmpl, Style, WebFont } from '@sys/ui-css/t';
export type { Keyboard, LocalStorage } from '@sys/ui-dom/t';
export type {
  PointerDragdropSnapshot,
  PointerDragSnapshot,
  PointerEventsArg,
  PointerEventsHandler,
  PointerHookFlags,
  ReactChildren,
} from '@sys/ui-react/t';
export type { TimecodeState } from '@sys/ui-state/t';

/**
 * @local:
 */
export type * from '../types.ts';
