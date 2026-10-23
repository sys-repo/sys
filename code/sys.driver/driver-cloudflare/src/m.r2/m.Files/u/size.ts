import { Num, type t } from '../common.ts';
import { fail } from './error.ts';

/** Validate a byte count/limit in the Files/R2 domain. */
export function assertByteCount(value: unknown, message: string): asserts value is t.NumberBytes {
  if (!Num.Is.safeInt(value) || value < 0) throw fail('FilesR2Error.InvalidPath', message);
}

/** Resolve the tightest optional max-byte limit. */
export function minByteLimit(
  message: string,
  ...values: readonly (t.NumberBytes | undefined)[]
): t.NumberBytes | undefined {
  let limit: t.NumberBytes | undefined;
  for (const value of values) {
    if (value === undefined) continue;
    assertByteCount(value, message);
    limit = limit === undefined || value < limit ? value : limit;
  }
  return limit;
}

/** Assert a byte count does not exceed an optional max. */
export function assertMaxBytes(args: {
  readonly size: t.NumberBytes;
  readonly max?: t.NumberBytes;
  readonly kind: Extract<
    t.R2.Files.Error.Kind,
    'FilesR2Error.ReadTooLarge' | 'FilesR2Error.WriteTooLarge'
  >;
  readonly message: string;
}): void {
  assertByteCount(args.size, 'Invalid Files byte count');
  if (args.max !== undefined && args.size > args.max) throw fail(args.kind, args.message);
}
