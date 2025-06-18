import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Controller Hook:
 */
export type UseDocumentIdHook = (args?: UseDocumentIdHookArgs | DocumentIdHook) => DocumentIdHook;
export type UseDocumentIdHookArgs<T = O> = {
  repo?: t.CrdtRepo;
  signals?: Partial<DocumentIdHookSignals>;
  localstorageKey?: t.StringId;
  initial?: T | (() => T);
};
export type DocumentIdHook = {
  readonly ready: boolean;
  readonly instance: t.StringId;
  readonly signals: t.DocumentIdHookSignals;
  readonly props: DocumentIdHookProps;
  readonly history: readonly t.StringId[];
  readonly transient: { kind?: 'Copy' | 'Error'; message?: string; timeout: t.Msecs };
  readonly handlers: {
    onAction: t.DocumentIdInputActionHandler;
    onTextChange: t.TextInputChangeHandler;
    onKeyDown: t.TextInputKeyHandler;
  };
};

export type DocumentIdHookProps = {
  readonly action: t.DocumentIdInputAction;
  readonly id?: string;
  readonly doc?: t.CrdtRef;
  readonly repo?: t.CrdtRepo;
  readonly is: {
    readonly valid: boolean;
    readonly enabled: { readonly action: boolean; readonly input: boolean };
    readonly spinning: boolean;
  };
};
export type DocumentIdHookSignals = {
  readonly id: t.Signal<string | undefined>;
  readonly doc: t.Signal<t.CrdtRef | undefined>;
  readonly spinning: t.Signal<boolean>;
  toValues(): DocumentIdHookSignalValues;
};

export type DocumentIdHookSignalValues = {
  id: t.SignalValue<DocumentIdHookSignals['id']>;
  doc?: t.SignalValue<DocumentIdHookSignals['doc']>;
  spinning: t.SignalValue<DocumentIdHookSignals['spinning']>;
};
