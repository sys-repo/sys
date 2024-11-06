import { rx, type t } from '../common.ts';
import { State } from './Controller.State.ts';

/**
 * Default controller for the test runner PropList component.
 */
export async function TestPropListController(initial?: t.TestPropListData) {
  const lifecycle = rx.lifecycle();
  const { dispose, dispose$ } = lifecycle;

  const $ = new rx.Subject<t.TestPropListChange>();
  const state = await State(initial);

  const fire = (op: t.TestPropListChange['op']) => {
    const data = { ...api.current };
    const results = Object.values(data.specs?.results ?? []);
    $.next({
      op,
      selected: api.selected.hashes,
      get results() {
        return results
          .filter((result) => typeof result === 'object')
          .filter(Boolean) as t.TestSuiteRunResponse[];
      },
    });
  };

  /**
   * Handle selection <Switch> being toggled.
   */
  const onSelect: t.SpecsSelectionHandler = (e) => {
    initial?.specs?.onSelect?.(e); // Bubble event.

    // Update selection state.
    const hash = e.suite.hash();
    if (e.to) state.selectSpec(hash);
    if (!e.to) state.unselectSpec(hash);

    // Bubble event.
    fire('selection');
  };

  const onRunSingleInternal = async (e: t.SpecRunClickHandlerArgs) => {
    initial?.run?.onRunSingle?.(e); // Bubble event.

    const hash = e.suite.hash();
    state.selectSpec(hash); // NB: Additive to the selection (when run).

    // Pre-run state update.
    state.runStart(e.suite);
    fire('run:single:start');

    // Execute the spec.
    const ctx = Wrangle.ctx(state.current);
    const res = await e.suite.run({ ctx });
    state.runComplete(e.suite, res);

    // Complete.
    fire('run:single:complete');
  };

  /**
   * Handle "run" button being clicked.
   */
  const onRunSingle: t.SpecRunClickHandler = async (e) => {
    state.clearResults();
    await onRunSingleInternal(e);
  };

  /**
   * Handle the "run all" button being clicked.
   */
  const onRunAll: t.SpecRunAllClickHandler = async (e) => {
    initial?.run?.onRunAll?.(e); // Bubble event.
    fire('run:all:start');

    const { modifiers } = e;
    const forceAll = modifiers.meta;
    const totalSelected = state.specs.selected?.length ?? 0;

    state.clearResults();
    if (forceAll || totalSelected === 0) state.selectAll();

    const specs = forceAll ? api.suites : api.selected.suites;
    for (const suite of specs) {
      await onRunSingleInternal({ suite, modifiers });
    }

    fire('run:all:complete');
  };

  /**
   * Handle "reset" button being clicked.
   */
  const onReset: t.SpecsSelectionResetHandler = async (e) => {
    initial?.specs?.onReset?.(e); // Bubble event.

    // Update selection state.
    const { select = 'all' } = e;
    const selected = select === 'none' ? [] : api.suites.map((spec) => spec.hash());

    state.current.specs = {
      ...state.current.specs,
      selected,
      results: undefined,
    };

    // Bubble event.
    fire('reset');
  };

  /**
   * Create a bundle of the currently selected specs.
   */
  const bundle: t.GetTestBundle = async () => {
    const specs = api.selected.suites;
    const ctx = Wrangle.ctx(state.current);
    return { specs, ctx };
  };

  /**
   * API
   */
  const api = {
    kind: 'Test.PropList.Controller',
    $: $.pipe(rx.takeUntil(dispose$)),

    /**
     * The current state of the component.
     */
    get current(): t.TestPropListData {
      return {
        ...state.current,
        run: {
          ...state.current.run,
          onRunSingle,
          onRunAll,
        },
        specs: {
          ...state.current.specs,
          onSelect,
          onReset,
        },
      };
    },

    /**
     * The list of selected specs (by "spec:hash" URI).
     */
    get selected() {
      const hashes = state.current.specs?.selected ?? [];
      let _suites: t.TestSuiteModel[] | undefined;
      return {
        hashes,
        bundle,
        get suites() {
          if (!_suites) _suites = api.suites.filter((spec) => hashes.includes(spec.hash()));
          return _suites;
        },
      };
    },

    /**
     * Retrieves the named-group list of initialized test suites.
     */
    get groups() {
      return state.groups;
    },

    /**
     * Retrieves a complete flat-list of initialized test suites.
     */
    get suites() {
      return state.suites;
    },

    /**
     * Lifecycle.
     */
    dispose,
    dispose$,
    get disposed() {
      return lifecycle.disposed;
    },
  } as const;

  return api;
}

/**
 * Helpers
 */
const Wrangle = {
  ctx(data: t.TestPropListData) {
    const ctx = (data.run ?? {}).ctx;
    return typeof ctx === 'function' ? ctx() : ctx;
  },
};
