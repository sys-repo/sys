import React from 'react';
import { type t } from './common.ts';

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
  const [running, setRunning] = React.useState(false);
  const [status, setStatus] = React.useState<Record<string, t.HttpOrigin.VerifyStatus>>({});

  React.useEffect(() => {
    setRunning(false);
    setStatus({});
  }, [args.env, args.origin, args.verify]);

  const onVerify = React.useCallback(() => {
    if (!verifyEnabled || args.rows.length === 0) return;
    setRunning(true);
    setStatus(
      args.rows.reduce<Record<string, t.HttpOrigin.VerifyStatus>>((acc, row) => {
        acc[row.key] = 'running';
        return acc;
      }, {}),
    );
  }, [args.rows, verifyEnabled]);

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
