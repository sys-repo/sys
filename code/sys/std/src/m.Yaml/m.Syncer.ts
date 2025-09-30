import { YAMLError } from 'yaml';
import { type t, Arr, Immutable, Is, Obj, Rx } from './common.ts';
import { parseAst } from './u.parse.ts';

type O = Record<string, unknown>;
type S = t.YamlLib['syncer'];

/**
 * Factory:
 */
const make: S = <T = unknown>(input: t.YamlSyncArgsInput) => {
  const { debounce, life, doc, path } = wrangle.args(input);
  const errors = new Set<t.YamlError>();

  /**
   * Observables/Events:
   */
  const events = doc.source.events(life);
  const pathEvents = events.path(path.source ?? []);
  const source$ = debounce > 0 ? pathEvents.$.pipe(Rx.debounceTime(debounce)) : pathEvents.$;

  type TParser = t.YamlSyncParser<T>;
  type TResult = t.YamlSyncParseResult<T>;
  const $$ = Rx.subject<TResult>();
  const $ = $$.pipe(Rx.takeUntil(life.dispose$));

  /** Returns true if no error is present and the error list is empty. */
  const isOk = (e?: Partial<TResult>): TResult['ok'] => {
    return e ? !!(!e.error && (e.errors?.length ?? 0) === 0) : errors.size === 0;
  };

  // Unified snapshot for `.current`
  let rev = 0; // Monotonic revision counter.
  let _current: TResult = {
    rev: 0,
    ok: isOk(),
    parsed: undefined,
    ops: [],
    path,
    text: { before: '', after: '' },
    errors: [],
  };
  const emitChange = (e: Omit<TResult, 'rev' | 'ok'>) => {
    rev += 1;
    _current = { ...e, ok: isOk(e), rev } satisfies TResult;
    $$.next(_current);
  };

  /**
   * Data:
   */
  const get = <T>(doc: O, path: t.ObjectPath | null) => {
    if (path == null) return;
    return Obj.Path.get<T>(doc, path);
  };

  /**
   * Structural errors (path validation) - persist on every update.
   * Rules:
   *  - if source is empty (even if target is also empty) → one "The source path is empty" error
   *  - empty target is allowed (event-emitter-only mode)
   */
  const addPathErrors = () => {
    const srcEmpty = path.source == null || path.source.length === 0;
    if (srcEmpty) {
      const msg = 'The source path is empty';
      const err = new YAMLError('YAMLParseError', [0, 0], 'IMPOSSIBLE', msg);
      errors.add(err);
      return;
    }
    // NB: an empty target is valid → no error.
  };

  /**
   * Listen:
   */
  const update = () => {
    // Setup initial conditions.
    const sourceInput = get<string>(doc.source?.current, path.source) ?? '';
    const before = _before;
    const after = sourceInput;
    _before = after;

    errors.clear();
    addPathErrors(); // re-assert structural errors every time

    // Attempt to parse data:
    const ast = parseAst(after);
    if (ast.errors.length > 0) ast.errors.forEach((err) => errors.add(err));

    let ops: t.ObjDiffOp[] = [];
    const data = ast.errors.length === 0 ? (ast.toJS() as T) : undefined;

    const targetPath = path.target ?? [];
    if (ast.errors.length === 0 && targetPath.length > 0) {
      const currentOutput = get<t.YamlSyncParsed<T>>(doc.target?.current, path.target);
      const isEqual = Obj.eql(data, currentOutput);
      if (!isEqual) {
        doc.target.change((d) => {
          const targetValue = Obj.Path.Mutate.ensure(d, path.target!, {});
          if (Is.record(data) && Is.record(targetValue)) {
            const diff = Obj.Path.Mutate.diff(data, targetValue);
            ops.push(...diff.ops);
          } else {
            // Replace (any value other than {object} which is diff'd):
            const op = Obj.Path.Mutate.set(d, targetPath, data);
            if (op) ops.push(op);
          }
        });
      }
    }

    // Alert listeners:
    emitChange({
      parsed: ast.errors.length === 0 ? (data as t.YamlSyncParsed<T>) : undefined,
      ops,
      path,
      text: { before, after },
      errors: [...errors],
    });
  };

  /**
   * API:
   */
  const api = Rx.toLifecycle<TParser>(life, {
    get ok() {
      return isOk();
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
    get current() {
      return _current;
    },
    get errors() {
      return [...errors];
    },
  });

  /**
   * Initialize:
   */
  let _before = get<string>(doc.source?.current, path.source) ?? '';
  // Seed structural error state before the first update (deduped by Set).
  addPathErrors();
  update();
  source$.subscribe(update);

  // Finish up.
  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  args(input: t.YamlSyncArgsInput): t.YamlSyncArgs {
    const { debounce = 0 } = input;
    const life = Rx.lifecycle(input.dispose$);
    const doc = wrangle.doc(input.doc);
    const path = wrangle.path(doc, input.path);
    return { life, doc, path, debounce };
  },

  doc(input: t.YamlSyncArgsInput['doc']): t.YamlSyncParserDocs {
    type P = t.ImmutableRef;
    const done = (source: P, target: P): t.YamlSyncParserDocs => ({ source, target });
    if (Immutable.Is.immutableRef(input)) return done(input, input);
    return done(input.source, input.target ?? input.source);
  },

  path(doc: t.YamlSyncParserDocs, input: t.YamlSyncArgsInput['path']): t.YamlSyncParserPaths {
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

/**
 * Library:
 */
export const Syncer: t.YamlSyncLib = { make };
