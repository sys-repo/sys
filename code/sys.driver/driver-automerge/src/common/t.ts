/**
 * @external
 */
export type {
  AutomergeUrl,
  DocHandle,
  DocumentId,
  NetworkAdapterInterface,
  PeerId,
  StorageAdapterInterface,
} from '@automerge/automerge-repo';

export type { ReactElement, MouseEventHandler as ReactMouseEventHandler, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type { ColorTheme } from '@sys/color/t';
export type { ExtractSignalValue, HistoryStack, Signal } from '@sys/std/t';
export type { SpecImports } from '@sys/testing/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { KeyboardModifierFlags, LocalStorageImmutable } from '@sys/ui-dom/t';
export type {
  TextInputChangeHandler,
  TextInputKeyHandler,
  TextInputProps,
} from '@sys/ui-react-components/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';
export type { PointerEventsHandler } from '@sys/ui-react/t';

/**
 * @local
 */
export type * from '../types.ts';
