import React from 'react';
import { type t, Http, Path, Pkg, Rx } from './common.ts';

export type UseVerifyArgs = {
  env: t.HttpOrigin.Env;
  origin?: t.UrlTree;
  rows: readonly t.UrlRow[];
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
  const [status, setStatus] = React.useState<Record<string, t.HttpOrigin.VerifyStatus>>({});

  React.useEffect(() => {
    return () => {
      run.current?.dispose();
      life.current.dispose();
    };
  }, []);

  React.useEffect(() => {
    run.current?.dispose();
    setRunning(false);
    setStatus({});
  }, [args.env, args.origin, args.verify]);

  const onVerify = React.useCallback(() => {
    if (!verifyEnabled || args.rows.length === 0) return;
    run.current?.dispose();

    const current = Rx.lifecycle(life.current.dispose$);
    run.current = current;
    setRunning(true);
    setStatus(toRunningStatus(args.rows));

    void (async () => {
      const tasks = args.rows.map(async (row) => {
        const url = wrangle.resolveUrl(args, row);
        const fetch = Http.fetcher();
        current.dispose$.subscribe(() => fetch.dispose());

        try {
          const res = await fetch.json(url);
          if (current.disposed || fetch.disposed) return;

          const next: t.HttpOrigin.VerifyStatus = res.ok && Pkg.Is.dist(res.data) ? 'ok' : 'error';
          setStatus((prev) => ({ ...prev, [row.key]: next }));
        } catch {
          if (current.disposed) return;
          setStatus((prev) => ({ ...prev, [row.key]: 'error' }));
        } finally {
          fetch.dispose();
        }
      });

      await Promise.allSettled(tasks);
      if (current.disposed) return;
      setRunning(false);
    })();
  }, [args, verifyEnabled]);

  const reserveStatusSpace = React.useMemo(() => {
    return args.rows.some((row) => {
      const next = status[row.key];
      return next === 'ok' || next === 'error';
    });
  }, [args.rows, status]);

  return {
    verifyEnabled,
    running,
    status,
    reserveStatusSpace,
    onVerify,
  } as const;
}

/**
 * Helpers:
 */
const wrangle = {
  resolveUrl(args: UseVerifyArgs, row: t.UrlRow) {
    const verify = args.verify;
    if (typeof verify === 'object' && verify?.resolveUrl) {
      return verify.resolveUrl({ origin: row.url, key: row.key, env: args.env });
    }
    return new URL(Path.join(row.url, 'dist.json')).href;
  },
} as const;

function toRunningStatus(rows: readonly t.UrlRow[]) {
  return rows.reduce<Record<string, t.HttpOrigin.VerifyStatus>>((acc, row) => {
    acc[row.key] = 'running';
    return acc;
  }, {});
}
