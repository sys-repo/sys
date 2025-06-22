import type { t } from './common.ts';

export type CardProps = {
  syncUrl?: t.StringUrl;
  localstorage?: t.StringKey;
  textMaxLength?: number;

  //
  signals?: Partial<CardSignals>;
  factory?: t.RepoHookFactory;

  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  headerStyle?: { topOffset?: number };

  //
  onChange?: CardChangedHandler;
};

export type CardSignals = Omit<t.RepoHookSignals, 'toValues'> &
  Omit<t.DocumentIdHookSignals, 'toValues'>;

/**
 * Events:
 */
export type CardChangedHandler = (e: CardChangedArgs) => void;
export type CardChangedArgs = {
  readonly is: { readonly head: boolean };
  readonly signals: CardSignals;
  readonly repo: t.CrdtRepo;
};
