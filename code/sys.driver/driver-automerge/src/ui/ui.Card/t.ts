import type { t } from './common.ts';

/**
 * Component:
 */
export type CardProps = {
  localstorage?: t.StringKey;
  textMaxLength?: number;
  //
  signals?: Partial<CardSignals>;
  repo?: t.CrdtRepo;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  headerStyle?: { topOffset?: number };
  //
  onChange?: CardChangedHandler;
};

/** Signal wrapped props for the <Card>. */
export type CardSignals = Omit<t.DocumentIdHookSignals, 'toValues'>;

/**
 * Events:
 */

/** Change handler. */
export type CardChangedHandler = (e: CardChangedArgs) => void;
/** Change event. */
export type CardChangedArgs = {
  readonly is: { readonly head: boolean };
  readonly signals: CardSignals;
  readonly repo: t.CrdtRepo;
};
