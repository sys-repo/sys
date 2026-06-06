import { Json, Path, type t } from '../common.ts';
import { repairConcreteRemoteAuthorityDelimiter } from '../u/u.specifier.ts';

export const DenoInfoMemo = {
  requestKey(id: string, cwd: string) {
    return Json.stringify([Path.normalize(cwd), repairConcreteRemoteAuthorityDelimiter(id)]);
  },

  canonicalKey(key: string, memo?: t.ResolveMemo) {
    return memo?.alias.get(key) ?? key;
  },

  memoizeResolved(
    memo: t.ResolveMemo | undefined,
    args: {
      canonical: string;
      input: string;
      actualId: string;
      redirected: string;
      cwd: string;
      resolved: t.DenoResolved;
    },
  ) {
    if (!memo) return;
    memo.settled.set(args.canonical, args.resolved);
    for (const key of DenoInfoMemo.aliasKeys(args)) {
      memo.alias.set(key, args.canonical);
    }
  },

  aliasKeys(args: { input: string; actualId: string; redirected: string; cwd: string }) {
    return [
      ...new Set([
        args.input,
        DenoInfoMemo.requestKey(args.actualId, args.cwd),
        DenoInfoMemo.requestKey(args.redirected, args.cwd),
      ]),
    ];
  },
} as const;
