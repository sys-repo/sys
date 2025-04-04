import { Context } from '../m.Ctx/mod.ts';
import { BusEvents } from './Bus.Events.ts';
import { BusMemoryState } from './Bus.MemoryState.ts';
import { type t, Obj, DEFAULTS, Id, Is, R, Test, rx } from './common.ts';

/**
 * Start the controller and return an event API.
 */
export function BusController(args: {
  instance: t.DevInstance;
  env?: t.DevEnvVars;
  filter?: (e: t.DevEvent) => boolean;
  dispose$?: t.UntilObservable;
}): t.DevEvents {
  const { env } = args;
  const bus = rx.bus.asType<t.DevEvent>(args.instance.bus);
  const instance = args.instance.id;

  const events = BusEvents({
    instance: args.instance,
    filter: args.filter,
    dispose$: args.dispose$,
  });
  const { dispose$ } = events;

  const state = BusMemoryState({
    instance: args.instance,
    env,
    onChanged(e) {
      const { message, info } = e;
      bus.fire({
        type: 'sys.dev/info:changed',
        payload: { instance, message, info },
      });
    },
  });

  const Ctx = {
    _: undefined as t.DevContext | undefined,
    async current() {
      return Ctx._ || (Ctx._ = await Ctx.init());
    },
    async init() {
      const context = await Context.init(args.instance, { env, dispose$ });
      await state.change('context:init', (draft) => Ctx.resetInfo(draft));
      return context;
    },
    resetInfo(draft: t.DevInfo) {
      draft.render.props = undefined;
      draft.render.state = undefined;
      draft.render.revision = { props: 0, state: 0 };
      draft.run = { count: 0 };
    },
  };

  /**
   * Info (Module)
   */
  events.info.req$.subscribe((e) => {
    const { tx } = e;
    const info = state.current;
    bus.fire({
      type: 'sys.dev/info:res',
      payload: { tx, instance, info },
    });
  });

  /**
   * Context: {ctx}
   */
  events.ctx.req$.subscribe(async (e) => {
    const { tx } = e;
    const { ctx } = await Ctx.current();
    bus.fire({
      type: 'sys.dev/ctx:res',
      payload: { tx, instance, ctx },
    });
  });

  /**
   * Load root spec
   */
  events.load.req$.subscribe(async (e) => {
    const { tx } = e;
    let error: string | undefined;

    try {
      const spec = e.bundle ? await Test.bundle(e.bundle) : undefined;
      await events.reset.fire();
      await state.change('spec:load', (draft) => (draft.spec = spec));
    } catch (err: any) {
      error = err.message;
    }

    const info = state.current;
    bus.fire({
      type: 'sys.dev/load:res',
      payload: { tx, instance, info, error },
    });
  });

  /**
   * Context: Reset.
   */
  events.reset.req$.subscribe(async (e) => {
    const { tx } = e;

    await state.change('reset', (draft) => {
      draft.instance.session = Id.ctx.create();
      Ctx.resetInfo(draft);
    });
    await Ctx.current();

    bus.fire({
      type: 'sys.dev/reset:res',
      payload: { tx, instance, info: state.current },
    });
  });

  /**
   * Run the test suite.
   */
  events.run.req$.subscribe(async (e) => {
    const { tx, only } = e;
    const spec = state.current.spec;
    let error: string | undefined;
    try {
      if (spec) {
        const context = await Ctx.current();
        await context.refresh();

        const ctx = context.ctx;
        const results = await spec.run({ ctx, only });
        await context.flush(); // Flush the results from the {ctx} into the state tree: {render.props}.

        results.tests
          .filter((test) => Boolean(test.error))
          .forEach((test) => console.error(test.error));

        /**
         * Update the state tree with the run results.
         */
        const message: t.DevInfoChangeMessage = only ? 'run:subset' : 'run:all';
        await state.change(message, (draft) => {
          draft.run.count++;
          draft.run.results = results;
        });
      }
    } catch (err: any) {
      error = err.message;
    }

    bus.fire({
      type: 'sys.dev/run:res',
      payload: { tx, instance, info: state.current, error },
    });
  });

  /**
   * State: Write.
   */
  events.state.change.req$.subscribe(async (e) => {
    const { tx } = e;
    let error: string | undefined;

    await state.change('state:write', async (draft) => {
      const state = draft.render.state || (draft.render.state = { ...e.initial });

      if (typeof e.mutate === 'function') {
        const res = e.mutate(state);
        if (Is.promise(res)) await res;
      }

      if (typeof e.mutate === 'object') {
        draft.render.state = R.clone(e.mutate); // 🐷 TEMP | SLOW (potentially too slow). Not needed when using immutability plugin.
      }

      draft.render.revision.state += 1;
    });

    bus.fire({
      type: 'sys.dev/state/change:res',
      payload: { tx, instance, info: state.current, error },
    });
  });

  /**
   * Props: Write.
   */
  events.props.change.req$.subscribe(async (e) => {
    const { tx } = e;
    let error: string | undefined;

    state.change('props:write', async (draft) => {
      const props = draft.render.props || (draft.render.props = DEFAULTS.props);
      const res = e.mutate(props);
      if (Is.promise(res)) await res;
      draft.render.revision.props += 1;
    });

    bus.fire({
      type: 'sys.dev/props/change:res',
      payload: { tx, instance, info: state.current, error },
    });
  });

  /**
   * Props: Ensure props changes flushed.
   */
  events.props.flush.pending$.pipe(rx.debounceTime(10)).subscribe(async (e) => {
    await (await Ctx.current()).flush();
  });

  /**
   * API
   */
  return events;
}
