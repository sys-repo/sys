import { ContextState } from '../m.Ctx/Context.State.ts';
import { asArray, rx, slug, type t } from './common.ts';

const DEFAULT = { TIMEOUT: 500 };
type O = Record<string, unknown>;

/**
 * Event API.
 */
export function BusEvents(args: {
  instance: { bus: t.EventBus<any>; id: t.StringId };
  filter?: (e: t.DevEvent) => boolean;
  dispose$?: t.UntilObservable;
}): t.DevEvents {
  let _disposed = false;
  const { dispose, dispose$ } = rx.disposable(args.dispose$);
  dispose$.subscribe(() => (_disposed = true));

  const bus = rx.bus.asType<t.DevEvent>(args.instance.bus);
  const instance = args.instance.id;
  const is = DevEventsIs;

  const $ = bus.$.pipe(
    rx.takeUntil(dispose$),
    rx.filter((e) => is.instance(e, instance)),
    rx.filter((e) => args.filter?.(e) ?? true),
  );

  /**
   * Base information about the module.
   */
  const info: t.DevEvents['info'] = {
    req$: rx.payload<t.DevInfoReqEvent>($, 'sys.dev/info:req'),
    res$: rx.payload<t.DevInfoResEvent>($, 'sys.dev/info:res'),
    changed$: rx.payload<t.DevInfoChangedEvent>($, 'sys.dev/info:changed'),
    async fire(options = {}) {
      const { timeout = DEFAULT.TIMEOUT } = options;
      const tx = slug();
      const op = 'info';
      const res$ = info.res$.pipe(rx.filter((e) => e.tx === tx));
      const first = rx.asPromise.first<t.DevInfoResEvent>(res$, { op, timeout });

      bus.fire({
        type: 'sys.dev/info:req',
        payload: { tx, instance },
      });

      const res = await first;
      if (res.payload) return res.payload;

      const error = res.error?.message ?? 'Failed';
      return { tx, instance, error };
    },

    async get(options) {
      const res = await info.fire(options);
      if (res.error) throw new Error(res.error);
      if (!res.info) throw new Error(`Status: info not available`);
      return res.info;
    },
  };

  const ctx: t.DevEvents['ctx'] = {
    req$: rx.payload<t.DevCtxReqEvent>($, 'sys.dev/ctx:req'),
    res$: rx.payload<t.DevCtxResEvent>($, 'sys.dev/ctx:res'),
    async fire(options = {}) {
      const { timeout = DEFAULT.TIMEOUT } = options;
      const tx = slug();
      const op = 'ctx';
      const res$ = ctx.res$.pipe(rx.filter((e) => e.tx === tx));
      const first = rx.asPromise.first<t.DevCtxResEvent>(res$, { op, timeout });

      bus.fire({
        type: 'sys.dev/ctx:req',
        payload: { tx, instance },
      });

      const res = await first;
      if (res.payload) return res.payload;

      const error = res.error?.message ?? 'Failed';
      return { tx, instance, error };
    },

    async get(options) {
      const res = await ctx.fire(options);
      if (res.error) throw new Error(res.error);
      if (!res.ctx) throw new Error(`Status: {ctx} not available`);
      return res.ctx;
    },
  };

  /**
   * Load ("describe/it" specification bundle).
   */
  const load: t.DevEvents['load'] = {
    req$: rx.payload<t.DevLoadReqEvent>($, 'sys.dev/load:req'),
    res$: rx.payload<t.DevLoadResEvent>($, 'sys.dev/load:res'),
    async fire(bundle, options = {}) {
      const { timeout = DEFAULT.TIMEOUT } = options;
      const tx = slug();
      const op = 'load';
      const res$ = load.res$.pipe(rx.filter((e) => e.tx === tx));
      const first = rx.asPromise.first<t.DevLoadResEvent>(res$, { op, timeout });

      bus.fire({
        type: 'sys.dev/load:req',
        payload: { tx, instance, bundle },
      });

      const res = await first;
      if (res.payload) return res.payload;

      const error = res.error?.message ?? 'Failed';
      return { tx, instance, error };
    },
  };

  /**
   * Run.
   */
  const run: t.DevEvents['run'] = {
    req$: rx.payload<t.DevRunReqEvent>($, 'sys.dev/run:req'),
    res$: rx.payload<t.DevRunResEvent>($, 'sys.dev/run:res'),
    async fire(options = {}) {
      const { timeout = DEFAULT.TIMEOUT } = options;
      const only = options.only ? asArray(options.only) : undefined;
      const tx = slug();
      const op = 'run';
      const res$ = run.res$.pipe(rx.filter((e) => e.tx === tx));
      const first = rx.asPromise.first<t.DevRunResEvent>(res$, { op, timeout });

      bus.fire({
        type: 'sys.dev/run:req',
        payload: { tx, instance, only },
      });

      const res = await first;
      if (res.payload) return res.payload;

      const error = res.error?.message ?? 'Failed';
      return { tx, instance, error };
    },
  };

  /**
   * Reset (unload).
   */
  const reset: t.DevEvents['reset'] = {
    req$: rx.payload<t.DevResetReqEvent>($, 'sys.dev/reset:req'),
    res$: rx.payload<t.DevResetResEvent>($, 'sys.dev/reset:res'),
    async fire(options = {}) {
      const { timeout = DEFAULT.TIMEOUT } = options;
      const tx = slug();
      const op = 'reset';
      const res$ = reset.res$.pipe(rx.filter((e) => e.tx === tx));
      const first = rx.asPromise.first<t.DevRunResEvent>(res$, { op, timeout });

      bus.fire({
        type: 'sys.dev/reset:req',
        payload: { tx, instance },
      });

      const res = await first;
      if (res.payload) return res.payload;

      const error = res.error?.message ?? 'Failed';
      return { tx, instance, error };
    },
  };

  /**
   * State (immutable).
   */
  const state: t.DevEvents['state'] = {
    changed$: info.changed$.pipe(
      rx.filter((e) => {
        const match: t.DevInfoChangeMessage[] = ['state:write', 'context:init'];
        return match.includes(e.message);
      }),
    ),
    change: {
      req$: rx.payload<t.DevStateChangeReqEvent>($, 'sys.dev/state/change:req'),
      res$: rx.payload<t.DevStateChangeResEvent>($, 'sys.dev/state/change:res'),
      async fire(initial, change, options = {}) {
        const { timeout = DEFAULT.TIMEOUT } = options;
        const tx = slug();
        const op = 'state.change';
        const res$ = state.change.res$.pipe(rx.filter((e) => e.tx === tx));
        const first = rx.asPromise.first<t.DevStateChangeResEvent>(res$, { op, timeout });

        bus.fire({
          type: 'sys.dev/state/change:req',
          payload: { tx, instance, mutate: change as any, initial },
        });

        const res = await first;
        if (res.payload) return res.payload;

        const error = res.error?.message ?? 'Failed';
        return { tx, instance, error };
      },
    },
    object<T extends O = O>(initial: T) {
      return ContextState({ events, initial });
    },
  };

  /**
   * Props (display/harness configuration state).
   * Modified by specs (within "it" statements) using the {ctx} object methods.
   */
  const props: t.DevEvents['props'] = {
    changed$: info.changed$.pipe(
      rx.filter((e) => {
        const match: t.DevInfoChangeMessage[] = ['props:write', 'reset', 'context:init'];
        return match.includes(e.message);
      }),
    ),
    change: {
      req$: rx.payload<t.DevPropsChangeReqEvent>($, 'sys.dev/props/change:req'),
      res$: rx.payload<t.DevPropsChangeResEvent>($, 'sys.dev/props/change:res'),
      async fire(mutate, options = {}) {
        const { timeout = DEFAULT.TIMEOUT } = options;
        const tx = slug();
        const op = 'props.change';
        const res$ = props.change.res$.pipe(rx.filter((e) => e.tx === tx));
        const first = rx.asPromise.first<t.DevPropsChangeResEvent>(res$, { op, timeout });

        bus.fire({
          type: 'sys.dev/props/change:req',
          payload: { tx, instance, mutate },
        });

        const res = await first;
        if (res.payload) return res.payload;

        const error = res.error?.message ?? 'Failed';
        return { tx, instance, error };
      },
    },
    flush: {
      pending$: rx.payload<t.DevPropsFlushPendingEvent>($, 'sys.dev/props/flush:pending'),
      pending(revision) {
        bus.fire({
          type: 'sys.dev/props/flush:pending',
          payload: { instance, revision },
        });
      },
    },
  };

  const Renderers = {
    async get(fn: (e: { props: t.DevRenderProps; push(id?: string): void }) => void) {
      const props = (await info.fire()).info?.render.props;
      const res: string[] = [];
      if (props) fn({ props, push: (id) => (id ? res.push(id) : null) });
      return res.filter(Boolean);
    },
    subject() {
      return Renderers.get((e) => e.push(e.props.subject.renderer?.id));
    },
    debug() {
      return Renderers.get((e) => {
        e.props.debug.body.renderers.forEach(({ id }) => e.push(id));
        e.push(e.props.debug.header.renderer?.id);
        e.push(e.props.debug.footer.renderer?.id);
      });
    },
    host() {
      return Renderers.get((e) => {
        e.push(e.props.host.header.renderer?.id);
        e.push(e.props.host.footer.renderer?.id);
        Object.values(e.props.host.layers)
          .filter((value) => typeof value.renderer === 'object')
          .forEach((value) => e.push(value.renderer?.id));
      });
    },
    async harness() {
      const debug = await Renderers.debug();
      const host = await Renderers.host();
      return [...debug, ...host];
    },
    fire(target: t.DevRedrawTarget, renderers: string[]) {
      redraw.fire({ renderers, target });
      return renderers;
    },
  } as const;

  /**
   * Redraw (re-render component).
   */
  const redraw: t.DevEvents['redraw'] = {
    $: rx
      .payload<t.DevRedrawEvent>($, 'sys.dev/redraw')
      .pipe(rx.observeOn(rx.animationFrameScheduler)),
    fire(args) {
      const { renderers = [], target } = args;
      if (target || renderers.length > 0) {
        bus.fire({
          type: 'sys.dev/redraw',
          payload: { instance, renderers, target },
        });
      }
    },
    subject: async () => Renderers.fire('subject', await Renderers.subject()),
    debug: async () => Renderers.fire('debug', await Renderers.debug()),
    harness: async () => Renderers.fire('harness', await Renderers.harness()),
  };

  /**
   * API.
   */
  const events: t.DevEvents = {
    instance: { bus, id: instance },
    $,
    dispose,
    dispose$,
    get disposed() {
      return _disposed;
    },
    is,
    info,
    ctx,
    load,
    run,
    reset,
    state,
    props,
    redraw,
  };

  return events;
}

/**
 * Event matching.
 */
const matcher = (startsWith: string) => (input: any) => rx.Is.event(input, { startsWith });

export const DevEventsIs = {
  base: matcher('sys.dev/'),
  instance(e: t.Event, instance: t.StringId) {
    return DevEventsIs.base(e) && e.payload?.instance === instance;
  },
} as const;
