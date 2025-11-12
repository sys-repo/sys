export type { FC, JSX, ReactNode } from 'react';

/**
 * @system:
 */
export type * from '@sys/types';
export type * from '@sys/ui-css/t';

export type { ColorTheme } from '@sys/color/t';
export type {
  TimecodeCompositeLib,
  TimecodeCompositePiece,
  TimecodeCompositionResolved,
  TimecodeCompositionSpec,
  TimecodeDurationMap,
  TimecodeResolved,
  TimecodeResolvedSegment,
  TimecodeSlice,
  TimecodeSliceString,
  TimecodeSliceStringInput,
  TimecodeVTime,
  VirtualClock,
  VirtualClockState,
} from '@sys/std/t';
export type { SpecImports } from '@sys/testing/t';
export type { KeyboardModifierFlags, LocalStorageImmutable } from '@sys/ui-dom/t';
export type {
  PointerDragSnapshot,
  PointerDragdropSnapshot,
  PointerEventsArg,
  PointerEventsHandler,
  PointerHookFlags,
  ReactChildrenDepsKey,
} from '@sys/ui-react/t';

/**
 * @local:
 */
export type * from '../types.ts';
