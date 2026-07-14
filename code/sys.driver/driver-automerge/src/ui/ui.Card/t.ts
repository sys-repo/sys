import type { t } from './common.ts';

/**
 * CRDT document card component props.
 */
export type CardProps = {
  /** Local-storage key used by the document-id controller. */
  storageKey?: t.StringKey;
  /** Maximum text length shown in the document object preview. */
  textMaxLength?: number;
  //
  /** External signals to bind into the document-id controller. */
  signals?: Partial<CardSignals>;
  /** Repository used to create and load CRDT documents. */
  repo?: t.CrdtRepo;
  //
  /** Reserved debug flag on the card prop surface. */
  debug?: boolean;
  /** System theme used for rendering. */
  theme?: t.CommonTheme;
  /** Style override applied to the card root. */
  style?: t.CssInput;
  /** Header layout style overrides. */
  headerStyle?: { topOffset?: number };
  //
  /** Callback fired when the selected document changes. */
  onChange?: CardChangedHandler;
};

/** Signal wrapped props for the <Card>. */
export type CardSignals = Omit<t.Crdt.DocumentId.Hook.Signals, 'toValues'>;

/**
 * Events:
 */

/** Change handler. */
export type CardChangedHandler = (e: CardChangedArgs) => void;
/** Change event. */
export type CardChangedArgs = {
  /** Derived state for the currently selected document. */
  readonly is: { readonly head: boolean };
  /** Active controller signals. */
  readonly signals: CardSignals;
  /** Repository backing the card. */
  readonly repo: t.CrdtRepo;
};
