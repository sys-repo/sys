import { D, Num, type t } from './common.ts';
import { fail } from './u.error.ts';

type CapabilitiesArgs = {
  readonly policy: t.FilesPolicy.Shape;
  readonly maxReadBytes?: t.NumberBytes;
};

/** Resolve the strictest configured read-size cap. */
export const effectiveMaxReadBytes = (
  ...values: readonly (t.NumberBytes | undefined)[]
): t.NumberBytes | undefined => {
  let max: t.NumberBytes | undefined;
  for (const value of values) {
    if (value === undefined) continue;
    if (!Num.Is.safeInt(value) || value < 0) {
      throw fail('FilesMemoryError.InvalidPath', 'Invalid Files read byte limit');
    }
    max = max === undefined || value < max ? value : max;
  }
  return max;
};

/** Capability facts for readonly in-memory Files backings. */
export const readonlyCapabilities = (args: CapabilitiesArgs): t.Files.Capabilities => {
  return Object.freeze({
    list: true,
    stat: true,
    read: true,
    write: false,
    remove: false,
    watch: false,
    manifest: args.policy.manifest === true,
    fidelity: 'snapshot',
    ...(args.maxReadBytes === undefined ? {} : { maxReadBytes: args.maxReadBytes }),
    encodings: D.encodings,
  });
};

/** Capability facts for writable in-memory Files backings. */
export const writableCapabilities = (base: t.Files.Capabilities): t.Files.Capabilities => {
  return Object.freeze({
    ...base,
    fidelity: 'dynamic',
    write: true,
    remove: true,
    watch: false,
  });
};

/** Capability facts for live in-memory Files backings with watch projection. */
export const liveCapabilities = (base: t.Files.Capabilities): t.Files.Capabilities => {
  return Object.freeze({
    ...base,
    fidelity: 'live',
    write: true,
    remove: true,
    watch: true,
  });
};
