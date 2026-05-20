import { D, Num, type t } from './common.ts';
import { fail } from './u.error.ts';

export type ReadonlyCapabilitiesArgs = {
  readonly policy: t.FilesPolicy.Shape;
  readonly maxReadBytes?: t.NumberBytes;
};

/**
 * Resolve the strictest configured read-size cap.
 */
export const effectiveMaxReadBytes = (
  ...values: readonly (t.NumberBytes | undefined)[]
): t.NumberBytes | undefined => {
  let max: t.NumberBytes | undefined;
  for (const value of values) {
    if (value === undefined) continue;
    if (!Num.Is.safeInt(value) || value < 0) {
      throw fail('FilesFsError.InvalidPath', 'Invalid Files read byte limit');
    }
    max = max === undefined ? value : Math.min(max, value);
  }
  return max;
};

/**
 * Capability facts for a readonly files/fs backing.
 */
export const readonlyCapabilities = (args: ReadonlyCapabilitiesArgs): t.Files.Capabilities => {
  return Object.freeze({
    list: true,
    stat: true,
    read: true,
    watch: false,
    manifest: args.policy.manifest === true,
    ...(args.maxReadBytes === undefined ? {} : { maxReadBytes: args.maxReadBytes }),
    encodings: D.encodings,
  });
};
