import { R, type t } from '../common.ts';
import { Util } from '../u.ts';

/**
 * Helper wrapper for manipulating controlled spec-runner state.
 */
export async function State(initial?: t.TestPropListData) {
  const res = await Wrangle.initialState(initial);
  const groups = res.groups;
  let _current = res.data;

  const api = {
    /**
     * State properties:
     */
    get current() {
      return _current;
    },

    get specs() {
      return _current.specs ?? (_current.specs = {});
    },

    get results() {
      const specs = api.specs;
      return specs.results ?? (specs.results = {});
    },

    get groups() {
      return groups;
    },

    get suites() {
      return Util.groupsToSuites(groups);
    },

    selectAll() {
      api.suites.forEach((spec) => api.selectSpec(spec.hash()));
    },

    /**
     * Mutation methods:
     */
    selectSpec(hash: string) {
      const selected = api.specs.selected ?? [];
      if (!selected.includes(hash)) {
        _current.specs = {
          ..._current.specs,
          selected: [...selected, hash],
        };
      }
    },

    unselectSpec(hash: string) {
      const selected = api.specs.selected ?? [];
      api.specs.selected = selected.filter((item) => item !== hash);
    },

    runStart(spec: t.TestSuiteModel) {
      const hash = spec.hash();
      api.results[hash] = true;
    },

    runComplete(spec: t.TestSuiteModel, res: t.TestSuiteRunResponse) {
      const hash = spec.hash();
      api.results[hash] = res;
    },

    clearResults() {
      api.specs.results = undefined;
    },
  } as const;

  return api;
}

/**
 * Helpers
 */
const Wrangle = {
  async initialState(initial?: t.TestPropListData) {
    const data = R.clone<t.TestPropListData>(initial ?? {});
    const specs = data.specs ?? (data.specs = {});
    data.run ?? (data.run = {});
    specs.selected = specs.selected ?? [];

    if (typeof data.modules === 'function') data.modules = await data.modules();
    const groups = await Util.importAndInitialize(data);

    return {
      data,
      groups,
    };
  },
};
