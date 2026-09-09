import { c, type t, Time } from '../common.ts';

export type ElapsedSuffixOptions = {
  readonly startedAt?: t.UnixTimestamp;
  readonly now?: t.UnixTimestamp;
  readonly prefix?: string;
};

export function elapsedSuffix(options: ElapsedSuffixOptions): string {
  if (options.startedAt === undefined) return '';
  const elapsed = Time.elapsed(options.startedAt, options.now ?? Time.now.timestamp);
  if (elapsed.msec < 1000) return '';
  return c.gray(c.dim(`${options.prefix ?? ' '}${elapsed.toString()}`));
}
