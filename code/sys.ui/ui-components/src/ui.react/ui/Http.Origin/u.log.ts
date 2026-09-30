import type { t } from './common.ts';

export type LogVerifyResultsArgs = {
  env: t.HttpOrigin.Env;
  rows: readonly t.HttpOrigin.UrlRow[];
  resolved: Record<string, t.StringUrl>;
  status: Record<string, t.HttpOrigin.VerifyStatus>;
};

/**
 * Log unpinned manifest observations, not payload verification evidence.
 */
export function logVerifyResults(args: LogVerifyResultsArgs) {
  const items = args.rows.map((row) => ({
    key: row.key,
    origin: row.url,
    resolvedUrl: args.resolved[row.key],
    status: args.status[row.key] ?? 'idle',
  }));

  const total = items.length;
  const ok = items.filter((item) => item.status === 'ok').length;
  const error = items.filter((item) => item.status === 'error').length;
  console.info(
    `[Http.Origin.observe] unpinned env=${args.env} total=${total} observed=${ok} error=${error}`,
  );
  console.table(items);
}
