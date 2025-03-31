import type { t } from './common.ts';

export type * from './t.Player.ts';
export type * from './t.Stack.ts';

/**
 * Library for working with the [AppSignals] model.
 */
export type AppSignalsLib = {
  readonly Player: t.AppSignalsPlayer;

  /** Create a new instance of the application-state signals API. */
  create(dispose$?: t.UntilObservable): t.AppSignals;
};

/**
 * Global application-state signals API.
 */
export type AppSignals = t.Lifecycle & {
  readonly props: {
    readonly stack: t.Signal<t.Content[]>;
    readonly dist: t.Signal<t.DistPkg | undefined>;
    readonly screen: { readonly breakpoint: t.Signal<t.BreakpointName> };
    readonly players: { [id: string]: t.VideoPlayerSignals };
    readonly background: {
      readonly video: {
        readonly src: t.Signal<string>;
        readonly opacity: t.Signal<number | undefined>;
        readonly playing: t.Signal<boolean>;
      };
    };
  };

  /** API for interacting with the stack. */
  readonly stack: t.AppSignalsStack;

  /** Hook into all relevant value listeners. */
  listen(): void;
};
