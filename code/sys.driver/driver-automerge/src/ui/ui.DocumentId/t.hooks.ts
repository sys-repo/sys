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
};
/** A <DocumentId> controller hook instance. */
export type DocumentIdHook = {
  readonly ready: boolean;
  readonly instance: t.StringId;
  readonly signals: t.DocumentIdHookSignals;
  readonly props: DocumentIdHookProps;
  readonly history: readonly t.StringId[];
  readonly transient: { kind?: 'Copy' | 'Error'; message?: string; timeout: t.Msecs };
  readonly handlers: {
    onAction: t.DocumentIdActionHandler;
    onTextChange: t.TextInputChangeHandler;
    onKeyDown: t.TextInputKeyHandler;
  };
};

/** Properties of the <DocumentId> hook. */
export type DocumentIdHookProps = {
  readonly action: t.DocumentIdAction;
  readonly docId?: string;
  readonly doc?: t.CrdtRef;
  readonly repo?: t.CrdtRepo;
  readonly is: {
    readonly valid: boolean;
    readonly spinning: boolean;
    readonly enabled: { readonly action: boolean; readonly input: boolean };
  };
};

/** Signals of the <DocumentId> hook. */
export type DocumentIdHookSignals = {
  readonly docId: t.Signal<string | undefined>;
  readonly doc: t.Signal<t.CrdtRef | undefined>;
  readonly spinning: t.Signal<boolean>;
  toValues(): DocumentIdHookSignalValues;
};

/** Snapshot of the <DocumentId> signals converted to values. */
export type DocumentIdHookSignalValues = {
  readonly docId: t.SignalValue<DocumentIdHookSignals['docId']>;
  readonly doc: t.SignalValue<DocumentIdHookSignals['doc']>;
  readonly spinning: t.SignalValue<DocumentIdHookSignals['spinning']>;
};
