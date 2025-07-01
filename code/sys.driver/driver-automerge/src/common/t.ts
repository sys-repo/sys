/**
 * @external
 */
export type {
  AutomergeUrl,
  DocHandle,
  DocumentId,
  NetworkAdapterInterface,
  PeerId,
  Repo,
  StorageAdapterInterface,
} from '@automerge/automerge-repo';

export namespace Automerge {
  export type Url = import('@automerge/automerge-repo').AutomergeUrl;
  export type DocHandle<T> = import('@automerge/automerge-repo').DocHandle<T>;
  export type DocumentId = import('@automerge/automerge-repo').DocumentId;
  export type NetworkAdapterInterface = import('@automerge/automerge-repo').NetworkAdapterInterface;
  export type PeerId = import('@automerge/automerge-repo').PeerId;
  export type StorageAdapterInterface = import('@automerge/automerge-repo').StorageAdapterInterface;
}

export type { ReactElement, MouseEventHandler as ReactMouseEventHandler, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type { ColorTheme } from '@sys/color/t';
export type { ExtractSignalValue, HistoryStack, Signal, SignalValue } from '@sys/std/t';
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
