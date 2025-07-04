import { type t, Arr, Err, Immutable, Is, Obj, rx } from './common.ts';
import { Is as YamlIs } from './m.Is.ts';
import { parse } from './u.parse.ts';

type O = Record<string, unknown>;
type S = t.YamlLib['syncer'];

export const syncer: S = <T = unknown>(
  docInput: Parameters<S>[0],
  pathInput: Parameters<S>[1],
  options?: Parameters<S>[2],
) => {
  const { debounce = 0 } = options ?? {};

  const life = rx.lifecycle(options?.dispose$);
  const doc = wrangle.doc(docInput);
  const path = wrangle.path(doc, pathInput);

  /**
   * Observables/Events:
   */
  const events = doc.source.events(life);
  const pathEvents = events.path(path.source ?? []);
  const source$ = debounce > 0 ? pathEvents.$.pipe(rx.debounceTime(debounce)) : pathEvents.$;

  const $$ = rx.subject<t.YamlSyncParserChange<T>>();
  const $ = $$.pipe(rx.takeUntil(life.dispose$));

  /**
   * Errors:
   */
  const errors = new Set<t.StdError>();
  const removeErrors = (predicate: (item: t.StdError) => boolean) => {
    for (const item of errors) {
      if (predicate(item)) errors.delete(item);
    }
  };

  /**
   * Data:
   */
  const get = <T>(doc: O, path: t.ObjectPath | null) => {
    if (path == null) return;
    return Obj.Path.get<T>(doc, path);
  };
  const current = {
    yaml: () => get<string>(doc.source?.current, path.source),
    parsed: () => get<t.YamSyncParsed<T>>(doc.target?.current, path.target),
  } as const;

  /**
   * Listen:
   */
  const update = () => {
    // Setup initial conditions.
    const before = _before;
    const after = current.yaml() ?? '';
    _before = after;
    removeErrors((err) => YamlIs.parseError(err)); // NB: reset errors.

    // Attempt to parse data.
    const parsed = parse(after);
    if (parsed.error) errors.add(parsed.error);

    let ops: t.ObjDiffOp[] = [];

    const targetPath = path.target ?? [];
    if (!parsed.error && targetPath.length > 0) {
      const isEqual = Obj.eql(parsed.data, current.parsed());
      if (!isEqual) {
        doc.target.change((d) => {
          const targetValue = Obj.Path.Mutate.ensure(d, path.target!, {});
          if (Is.record(parsed.data) && Is.record(targetValue)) {
            const diff = Obj.Path.Mutate.diff(parsed.data, targetValue);
            ops.push(...diff.ops);
          } else {
            // Replace (any value other than {object} which is diff'd).
            const op = Obj.Path.Mutate.set(d, targetPath, parsed.data);
            if (op) ops.push(op);
          }
        });
      }
    }

    // Alert listeners:
    $$.next({
      ops,
      yaml: { before, after },
      parsed: parsed.data ? (parsed.data as t.YamSyncParsed<T>) : undefined,
      error: parsed.error,
    });
  };

  /**
   * API:
   */
  const api = rx.toLifecycle<t.YamlSyncParser<T>>(life, {
    get ok() {
      return errors.size === 0;
    },
    get $() {
      return $;
    },
    doc: {
      get source() {
        return doc.source;
      },
      get target() {
        return doc.target;
      },
    },
    path,
    current,
    get errors() {
      return [...errors];
    },
  });

  /**
   * Initialize:
   */
  let _before = current.yaml() ?? '';
  if ((path.source || []).length === 0) errors.add(Err.std('The source path is empty'));
  update();
  source$.subscribe(update);

  // Finish up.
  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  doc(input: Parameters<S>[0]): t.YamlSyncParserDocs {
    type P = t.ImmutableRef;
    const done = (source: P, target: P): t.YamlSyncParserDocs => ({ source, target });
    if (Immutable.Is.immutableRef(input)) return done(input, input);
    return done(input.source, input.target ?? input.source);
  },

  path(doc: t.YamlSyncParserDocs, input: Parameters<S>[1]): t.YamlSyncParserPaths {
    type P = t.ObjectPath | null;

    const formatNull = (value: P) => {
      if (value !== null) value = value.length === 0 ? null : value;
      return value;
    };

    const formatTarget = (source: t.ObjectPath, target: t.ObjectPath) => {
      target = [...target];
      const isEqual = Arr.equal(source, target);
      if (isEqual && doc.source === doc.target) {
        const lastSource = source[source.length - 1];
        const lastTarget = target[target.length - 1] ?? '';
        const index = target.length === 0 ? 0 : target.length - 1;
        target[index] = lastTarget ? `${lastTarget}.parsed` : `${lastSource}.parsed`;
      }
      return target;
    };

    const done = (source: P, target: P): t.YamlSyncParserPaths => {
      if (source !== null && target !== null) {
        if (source.length > 0 && target.length > 0) {
          target = formatTarget(source, target);
        }
      }
      return {
        source: formatNull(source),
        target: formatNull(target),
      };
    };

    if (Is.objectPath(input)) return done(input, input);
    return done(input.source, input.target === undefined ? input.source : input.target);
  },
} as const;
