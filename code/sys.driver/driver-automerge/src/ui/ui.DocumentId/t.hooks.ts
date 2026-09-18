import type { t } from './common.ts';

type O = Record<string, unknown>;

/** Instantiation factory for the `<DocumentId>` hook. */
export type Use = (args?: Args | Instance) => Instance;

/** Arguments passed to the `<DocumentId>` controller hook. */
export type Args<T = O> = {
  repo?: t.CrdtRepo;
  signals?: Partial<Signals>;
  initial?: T | (() => T);
  readOnly?: boolean;
  url?: t.DocumentId.Url.Factory | boolean;
  urlKey?: t.StringKey;
  storageKey?: t.StringKey;
};

/** A `<DocumentId>` controller hook instance. */
export type Instance = Readonly<{
  ready: boolean;
  instance: t.StringId;
  signals: Signals;
  props: Props;
  history: readonly t.StringId[];
  transient: Readonly<{ kind?: 'Copy' | 'Error'; message?: string; timeout: t.Msecs }>;
  handlers: Readonly<{
    onAction: t.DocumentId.Action.Handler;
    onTextChange: t.TextInput.ChangeHandler;
    onKeyDown: t.TextInput.KeyHandler;
  }>;
}>;

/** Properties of the `<DocumentId>` hook. */
export type Props = Readonly<{
  action: t.DocumentId.Action.Args;
  textbox?: string;
  docId?: t.StringDocumentId;
  doc?: t.CrdtRef;
  repo?: t.CrdtRepo;
  url: t.DocumentId.Url.Factory | boolean;
  urlKey: string;
  readOnly?: boolean;
  is: Readonly<{
    valid: boolean;
    spinning: boolean;
    enabled: { readonly action: boolean; readonly input: boolean };
  }>;
}>;

/** Signals of the `<DocumentId>` hook. */
export type Signals = Readonly<{
  textbox: t.Signal<string | undefined>;
  doc: t.Signal<t.CrdtRef | undefined>;
  path: t.Signal<t.ObjectPath | undefined>;
  spinning: t.Signal<boolean>;
  toValues(): SignalValues;
}>;

/** Snapshot of the `<DocumentId>` signals converted to values. */
export type SignalValues = Readonly<{
  textbox: t.UnwrapSignals<Signals['textbox']>;
  doc: t.UnwrapSignals<Signals['doc']>;
  spinning: t.UnwrapSignals<Signals['spinning']>;
}>;
