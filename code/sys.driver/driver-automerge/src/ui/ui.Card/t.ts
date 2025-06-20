import type { t } from './common.ts';

export type CardProps = {
  syncUrl?: t.StringUrl;
  localstorageKey?: string;
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
  readonly isHead: boolean;
  readonly signals: CardSignals;
};
