import { DEFAULTS, PatchState, R, type t } from './common.ts';
type O = Record<string, unknown>;

/**
 * Standard location for {.meta} data on a CRDT document.
 */
export const DocMeta = {
  key: '.meta',

  get default() {
    return R.clone(DEFAULTS.initial.meta);
  },

  /**
   * Retrieves, and optionally force inserts, the {.meta} data object.
   */
  get<T extends t.DocMeta, F extends boolean = false>(
    doc: O,
    options: { mutate?: F; initial?: T } = {},
  ): F extends true ? T : T | undefined {
    if (typeof doc !== 'object' || doc === null) return undefined as any;
    if (!(DocMeta.key in doc) && !options.mutate) return undefined as any;

    if (options.mutate) {
      const { initial = DocMeta.default } = options;
      doc[DocMeta.key] = initial;
    }

    type TReturn = F extends true ? T : T | undefined;
    return doc[DocMeta.key] as TReturn;
  },

  /**
   * Ensures the {.meta} data object is on the document.
   */
  ensure<T extends t.DocMeta>(doc: O, initial?: T) {
    if (DocMeta.exists(doc)) return false;
    DocMeta.get(doc, { mutate: true, initial });
    return true;
  },

  /**
   * Determine if the given document has {.meta} data.
   */
  exists(input: O | t.Doc<O>) {
    if (typeof input !== 'object' || input === null) return false;
    const doc = PatchState.Is.state(input) ? input.current : input;
    return Boolean(doc[DocMeta.key]);
  },
} as const;
