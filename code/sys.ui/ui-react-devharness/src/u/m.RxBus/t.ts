import type { t } from './common.ts';
export type * from './t.promise.ts';

type O = Record<string, unknown>;

/**
 * The canonical event structure.
 */
export type Event<P extends O = O> = { type: string; payload: P };
/**
 * A structure that exposes an observable and can fire events.
 */
export type EventBus<E extends t.Event = t.Event> = {
  readonly $: t.Observable<E>;
  fire<E extends t.Event = t.Event>(event: E): void;
};

/**
 * EventBus generator function:
 */
export type RxBusFactory = <T extends t.Event = t.Event>(
  input?: t.Subject<any> | t.EventBus<any>,
) => t.EventBus<T>;

/** Bus related methods. */
export type RxBus = RxBusFactory & {
  isBus<T extends t.Event = t.Event>(input?: any): input is t.EventBus<T>;
  isObservable<T = any>(input?: any): input is t.Observable<T>;
  asType<T extends t.Event>(bus: t.EventBus<any>): t.EventBus<T>;
  instance(bus?: t.EventBus<any>): string;
  connect<T extends t.Event>(
    buses: t.EventBus<any>[],
    options?: t.BusConnectOptions,
  ): t.BusConnection<T>;

  asPromise: t.RxAsPromise;
  event<Ev extends t.Event>($: t.Observable<unknown>, type: Ev['type']): t.Observable<Ev>;
  payload<Ev extends t.Event>(
    $: t.Observable<unknown>,
    type: Ev['type'],
  ): t.Observable<Ev['payload']>;
};

/**
 * 2-way Event Bus Connection.
 */
export type BusConnection<E extends t.Event> = t.Disposable & {
  readonly isDisposed: boolean;
  readonly buses: t.EventBus<E>[];
};
/** Options passed to bus connect. */
export type BusConnectOptions = { async?: boolean; dispose$?: t.Observable<any> };
