import React from 'react';
import { D, Http, Is, Path, Pkg, Rx, type t, Time } from './common.ts';
import { logVerifyResults } from './u.log.ts';

export type UseVerifyArgs = {
  env: t.HttpOrigin.Env;
  origin?: t.HttpOrigin.UrlTree;
  rows: readonly t.HttpOrigin.UrlRow[];
  verify?: t.HttpOrigin.Verify;
};

/**
 * Observe remote manifest shapes and self-reported digests without authenticating payloads.
 */
export function useVerify(args: UseVerifyArgs) {
  const verifyEnabled = !!args.verify;
  const life = React.useRef(Rx.lifecycle());
  const run = React.useRef<t.Lifecycle | undefined>(undefined);
  const [running, setRunning] = React.useState(false);
  const [actionLabel, setActionLabel] = React.useState<string>(D.observationAction);
  const [status, setStatus] = React.useState<Record<string, t.HttpOrigin.VerifyStatus>>(
    () => observationMap(),
  );
  const [digest, setDigest] = React.useState<Record<string, t.StringHash | undefined>>(
    () => observationMap(),
  );
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
    setActionLabel(D.observationAction);
    setStatus(observationMap());
    setDigest(observationMap());
    setReserveStatusSpace(false);
  }, [args.env, args.origin, args.verify]);

  const onVerify = React.useCallback(() => {
    if (!verifyEnabled || args.rows.length === 0) return;
    run.current?.dispose();

    const current = Rx.lifecycle(life.current.dispose$);
    const settled = toRunningStatus(args.rows);
    const digests = observationMap<t.StringHash | undefined>();
    const resolved = observationMap<t.StringUrl>();
    run.current = current;
    setRunning(true);
    setActionLabel(D.observationAction);
    setStatus(observationMap(settled));
    setDigest(observationMap());

    void (async () => {
      const tasks = args.rows.map(async (row) => {
        try {
          const url = wrangle.resolveUrl(args, row);
          resolved[row.key] = url;
          const origin = new URL(url).origin;
          using fetch = Http.fetcher({
            until: current,
            policy: {
              maxBytes: 16 * 1024 * 1024,
              timeout: 30_000,
              maxRedirects: 3,
              progressInterval: 100,
              sourceOrigins: [origin],
              credentialOrigins: [],
            },
          });
          const res = await fetch.json(url);
          if (current.disposed || fetch.disposed) return;

          const dist = res.ok && Pkg.Is.dist(res.data) ? res.data : undefined;
          const next: t.HttpOrigin.VerifyStatus = dist ? 'ok' : 'error';
          digests[row.key] = dist?.hash.digest;
          settled[row.key] = next;
          setStatus(observationMap(settled));
          setDigest(observationMap(digests));
        } catch {
          if (current.disposed) return;
          digests[row.key] = undefined;
          settled[row.key] = 'error';
          setStatus(observationMap(settled));
          setDigest(observationMap(digests));
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
        setActionLabel(D.observationAction);
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
    if (Is.object(verify) && verify?.resolveUrl) {
      return verify.resolveUrl({ origin: row.url, key: row.key, env: args.env });
    }
    return new URL(Path.join(row.url, 'dist.json')).href;
  },
  actionLabel(status: Record<string, t.HttpOrigin.VerifyStatus>) {
    const values = Object.values(status);
    if (values.some((value) => value === 'error')) return 'has failures';
    if (values.some((value) => value === 'ok')) return 'observed (unpinned)';
    return D.observationAction;
  },
} as const;

/** Observation keys are own data; absent keys never resolve through Object.prototype. */
function observationMap<T>(values: Record<string, T> = {}): Record<string, T> {
  return Object.assign(Object.create(null), values);
}

function toRunningStatus(rows: readonly t.HttpOrigin.UrlRow[]) {
  return rows.reduce<Record<string, t.HttpOrigin.VerifyStatus>>((acc, row) => {
    acc[row.key] = 'running';
    return acc;
  }, observationMap());
}
