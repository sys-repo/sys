import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Controller Hook:
 */

/** Instantiation factor fo the <DocumentId> hook. */
export type UseDocumentIdHook = (args?: UseDocumentIdHookArgs | DocumentIdHook) => DocumentIdHook;
/** Arguments passed to the <DocumentId> controller hook. */
export type UseDocumentIdHookArgs<T = O> = {
  repo?: t.CrdtRepo;
  signals?: Partial<DocumentIdHookSignals>;
  localstorage?: t.StringKey;
  initial?: T | (() => T);
  url?: t.DocumentIdUrlFactory | boolean;
  urlKey?: t.StringKey;
  readOnly?: boolean;
};

/** A <DocumentId> controller hook instance. */
export type DocumentIdHook = Readonly<{
  ready: boolean;
  instance: t.StringId;
  signals: t.DocumentIdHookSignals;
  props: DocumentIdHookProps;
  history: readonly t.StringId[];
  transient: { kind?: 'Copy' | 'Error'; message?: string; timeout: t.Msecs };
  handlers: {
    onAction: t.DocumentIdActionHandler;
    onTextChange: t.TextInputChangeHandler;
    onKeyDown: t.TextInputKeyHandler;
  };
}>;

/** Properties of the <DocumentId> hook. */
export type DocumentIdHookProps = Readonly<{
  action: t.DocumentIdActionArgs;
  textbox?: string;
  docId?: t.StringDocumentId;
  doc?: t.CrdtRef;
  repo?: t.CrdtRepo;
  url: t.DocumentIdUrlFactory | boolean;
  urlKey: string;
  readOnly?: boolean;
  is: Readonly<{
    valid: boolean;
    spinning: boolean;
    enabled: { readonly action: boolean; readonly input: boolean };
  }>;
}>;

/** Signals of the <DocumentId> hook. */
export type DocumentIdHookSignals = Readonly<{
  textbox: t.Signal<string | undefined>;
  doc: t.Signal<t.CrdtRef | undefined>;
  path: t.Signal<t.ObjectPath | undefined>;
  spinning: t.Signal<boolean>;
  toValues(): DocumentIdHookSignalValues;
}>;

/** Snapshot of the <DocumentId> signals converted to values. */
export type DocumentIdHookSignalValues = Readonly<{
  textbox: t.UnwrapSignals<DocumentIdHookSignals['textbox']>;
  doc: t.UnwrapSignals<DocumentIdHookSignals['doc']>;
  spinning: t.UnwrapSignals<DocumentIdHookSignals['spinning']>;
}>;
