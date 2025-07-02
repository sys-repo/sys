import { type t, Arr, Err, Immutable, Is, Obj, rx } from './common.ts';

type S = t.YamlLib['syncer'];

export const syncer: S = <T = unknown>(
  docInput: Parameters<S>[0],
  pathInput: Parameters<S>[1],
  options?: { dispose$?: t.UntilInput },
) => {
  const life = rx.lifecycle(options?.dispose$);
  const doc = wrangle.doc(docInput);
  const path = wrangle.path(pathInput);

  const errors = new Set<t.StdError>();
  const events = doc.source.events(life);
  const $$ = rx.subject<t.YamlSyncParserChange<T>>();
  const $ = $$.pipe(rx.takeUntil(life.dispose$));


  if (path.source.length === 0) errors.add(Err.std('The source path is empty'));
  if (path.target.length === 0) errors.add(Err.std('The target path is empty'));

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
  path(input: Parameters<S>[1]): t.YamlSyncParserPaths {
    type P = t.ObjectPath;
    const done = (source: P, target: P): t.YamlSyncParserPaths => {
      if (source.length > 0 && target.length > 0 && Arr.equal(source, target)) {
        source = [...source];
        target = [...target];
        const lastSource = source[source.length - 1];
        const lastTarget = target[target.length - 1] ?? '';
        const index = target.length === 0 ? 0 : target.length - 1;
        target[index] = lastTarget ? `${lastTarget}.parsed` : `${lastSource}.parsed`;
      }
      return { source, target };
    };
    if (Is.objectPath(input)) return done(input, input);
    return done(input.source, input.target ?? input.source);
  },
} as const;
