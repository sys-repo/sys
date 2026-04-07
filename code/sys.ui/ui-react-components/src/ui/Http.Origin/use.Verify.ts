import React from 'react';
import { type t, Http, Path, Pkg, Rx, Time } from './common.ts';
import { logVerifyResults } from './u.log.ts';

export type UseVerifyArgs = {
  env: t.HttpOrigin.Env;
  origin?: t.HttpOrigin.UrlTree;
  rows: readonly t.HttpOrigin.UrlRow[];
  verify?: t.HttpOrigin.Verify;
};

/**
 * Local verify-state plumbing for Http.Origin row verification.
 */
export function useVerify(args: UseVerifyArgs) {
  const verifyEnabled = !!args.verify;
  const life = React.useRef(Rx.lifecycle());
  const run = React.useRef<t.Lifecycle | undefined>(undefined);
  const [running, setRunning] = React.useState(false);
  const [actionLabel, setActionLabel] = React.useState('run verification');
  const [status, setStatus] = React.useState<Record<string, t.HttpOrigin.VerifyStatus>>({});
  const [digest, setDigest] = React.useState<Record<string, t.StringHash | undefined>>({});
  const [reserveStatusSpace, setReserveStatusSpace] = React.useState(false);

  React.useEffect(() => {
    return () => {
      run.current?.dispose();
      life.current.dispose();
    };
  }, []);

  React.useEffect(() => {
    run.current?.dispose();
    setRunning(false);
    setActionLabel('run verification');
    setStatus({});
    setDigest({});
    setReserveStatusSpace(false);
  }, [args.env, args.origin, args.verify]);

  const onVerify = React.useCallback(() => {
    if (!verifyEnabled || args.rows.length === 0) return;
    run.current?.dispose();

    const current = Rx.lifecycle(life.current.dispose$);
    const settled = toRunningStatus(args.rows);
    const digests: Record<string, t.StringHash | undefined> = {};
    const resolved = args.rows.reduce<Record<string, t.StringUrl>>((acc, row) => {
      acc[row.key] = wrangle.resolveUrl(args, row);
      return acc;
    }, {});
    run.current = current;
    setRunning(true);
    setStatus(settled);

    void (async () => {
      const tasks = args.rows.map(async (row) => {
        const url = resolved[row.key];
        const fetch = Http.fetcher();
        current.dispose$.subscribe(() => fetch.dispose());

        try {
          const res = await fetch.json(url);
          if (current.disposed || fetch.disposed) return;

          const dist = res.ok && Pkg.Is.dist(res.data) ? res.data : undefined;
          const next: t.HttpOrigin.VerifyStatus = dist ? 'ok' : 'error';
          digests[row.key] = dist?.hash.digest;
          settled[row.key] = next;
          setStatus({ ...settled });
          setDigest({ ...digests });
        } catch {
          if (current.disposed) return;
          digests[row.key] = undefined;
          settled[row.key] = 'error';
          setStatus({ ...settled });
          setDigest({ ...digests });
        } finally {
          fetch.dispose();
        }
      });

      await Promise.allSettled(tasks);
      if (current.disposed) return;
      if (Object.values(settled).some((value) => value === 'ok' || value === 'error')) {
        setReserveStatusSpace(true);
      }
      logVerifyResults({ env: args.env, rows: args.rows, resolved, status: settled });
      setRunning(false);
      setActionLabel(wrangle.actionLabel(settled));
      Time.until(current).delay(3000, () => {
        if (current.disposed) return;
        setActionLabel('run verification');
      });
    })();
  }, [args, verifyEnabled]);

  return {
    verifyEnabled,
    running,
    actionLabel,
    status,
    digest,
    reserveStatusSpace,
    onVerify,
  } as const;
}

/**
 * Helpers:
 */
const wrangle = {
  resolveUrl(args: UseVerifyArgs, row: t.HttpOrigin.UrlRow) {
    const verify = args.verify;
    if (typeof verify === 'object' && verify?.resolveUrl) {
      return verify.resolveUrl({ origin: row.url, key: row.key, env: args.env });
    }
    return new URL(Path.join(row.url, 'dist.json')).href;
  },
  actionLabel(status: Record<string, t.HttpOrigin.VerifyStatus>) {
    const values = Object.values(status);
    if (values.some((value) => value === 'error')) return 'has failures';
    if (values.some((value) => value === 'ok')) return 'success';
    return 'run verification';
  },
} as const;

function toRunningStatus(rows: readonly t.HttpOrigin.UrlRow[]) {
  return rows.reduce<Record<string, t.HttpOrigin.VerifyStatus>>((acc, row) => {
    acc[row.key] = 'running';
    return acc;
  }, {});
}
