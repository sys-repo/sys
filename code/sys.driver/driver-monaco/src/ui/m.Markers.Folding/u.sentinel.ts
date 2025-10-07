import { type t, Obj } from './common.ts';

export type SentinelIdentity = {
  readonly docId?: string;
  readonly modelUri?: string;
  readonly pathKey: number;
};
type TextModel = t.Monaco.TextModel;
type Args = { doc?: t.CrdtRef; model?: TextModel; path?: t.ObjectPath };

/**
 * A re-arming sentinal to track changes.
 */
export const Sentinel = {
  make(args: Args): SentinelIdentity {
    return {
      docId: args.doc?.id,
      modelUri: args.model?.uri?.toString(),
      pathKey: Obj.hash(args.path),
    };
  },

  eq(a: SentinelIdentity, b: SentinelIdentity) {
    return a.docId === b.docId && a.modelUri === b.modelUri && a.pathKey === b.pathKey;
  },

  rearmIfChanged(
    last: SentinelIdentity,
    current: Args,
    fn: (e: { next: SentinelIdentity }) => void,
  ) {
    const next = Sentinel.make(current);
    if (!Sentinel.eq(last, next)) fn({ next });
  },
} as const;
