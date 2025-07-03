import { type t, Arr, Err, Immutable, Is, Obj, rx } from './common.ts';

type O = Record<string, unknown>;
type S = t.YamlLib['syncer'];

export const syncer: S = <T = unknown>(
  docInput: Parameters<S>[0],
  pathInput: Parameters<S>[1],
  options?: Parameters<S>[2],
) => {
  const life = rx.lifecycle(options?.dispose$);
  const doc = wrangle.doc(docInput);
  const path = wrangle.path(doc, pathInput);

  const errors = new Set<t.StdError>();
  const $$ = rx.subject<t.YamlSyncParserChange<T>>();
  const $ = $$.pipe(rx.takeUntil(life.dispose$));

  const events = doc.source.events(life);


  const get = (doc: O, path: t.ObjectPath | null) => {
    if (path == null) return;
    return Obj.Path.get<string>(doc, path);
  };
  const current = {
    yaml: () => get(doc.source?.current, path.source),
    parsed: () => get(doc.target?.current, path.target),
  } as const;

  // Check for error state.
  if ((path.source || []).length === 0) errors.add(Err.std('The source path is empty'));

  /**
   * Event Monitor:
   */
  const update = () => {
  };

  /**
   * API:
   */
  return rx.toLifecycle<t.YamlSyncParser<T>>(life, {
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
    get errors() {
      return [...errors];
    },
  });
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
