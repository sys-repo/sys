import type { t } from './common.ts';

/** Pure policy helpers for bounded Files views. */
export const Policy: t.Files.Policy.Lib = {
  readonly(allow, options = {}) {
    return {
      list: allow,
      stat: allow,
      read: allow,
      ...(options.watch === false ? {} : { watch: options.watch ?? allow }),
      manifest: true,
      ...(options.deny === undefined ? {} : { deny: options.deny }),
      ...(options.maxReadBytes === undefined ? {} : { maxReadBytes: options.maxReadBytes }),
    };
  },
};
