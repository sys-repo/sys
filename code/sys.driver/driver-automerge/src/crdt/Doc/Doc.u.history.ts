import { A, DEFAULTS, Time, Value, type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Retrieve the history of the given document.
 */
export function history<T extends O>(doc?: t.Doc<T>): t.DocHistory<T> {
  const commits = wrangle.commits(doc);
  let _genesis: t.DocHistoryGenesis<T> | false | undefined;

  /**
   * History
   */
  return {
    commits,

    get total() {
      return commits.length;
    },

    get latest() {
      return commits[commits.length - 1];
    },

    get genesis() {
      if (_genesis === false) return undefined;
      if (_genesis) return _genesis;

      const initial = commits.find(isInitial);
      if (!initial) {
        _genesis = false;
        return undefined;
      }

      const now = Time.now.timestamp;
      const elapsed = Time.duration(now - initial.change.time);
      return (_genesis = { initial, elapsed });
    },

    page(index, limit, order = DEFAULTS.page.sort) {
      const list = index < 0 ? [] : commits.map((commit, index) => ({ index, commit }));
      if (order === 'desc') list.reverse();

      const total = commits.length;
      const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
      const items = Value.Array.page(list, index, limit);
      let _commits: t.DocHistoryCommit<T>[] | undefined;

      type S = t.DocHistoryPageScope;
      const is: S['is'] = { first: index === 0, last: index + 1 === totalPages };
      const res: t.DocHistoryPage<T> = {
        scope: { index, total, limit, order, is },
        items,
        get commits() {
          return _commits ?? (_commits = items.map((m) => m.commit));
        },
      };
      return res;
    },
  };
}

/**
 * Retrieve the list of hashes for the current HEAD.
 */
export function heads<T extends O>(doc: t.Doc<T> | undefined): t.HashString[] {
  return doc?.current ? A.getHeads(doc.current as A.Doc<T>) : [];
}

/**
 * Helpers
 */
function isInitial(item: t.DocHistoryCommit) {
  const { change } = item;
  const message = DEFAULTS.genesis.message;
  return change.time > 0 && change.message === message;
}

const wrangle = {
  commits<T extends O>(doc?: t.Doc<T>): t.DocHistoryCommit<T>[] {
    try {
      const current = doc?.current;
      return current ? A.getHistory<T>(current) : [];
    } catch (_err: any) {
      return [];
    }
  },
} as const;
