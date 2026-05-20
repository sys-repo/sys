import { validatePageInput } from '../m.files/u/u.page.ts';
import { snapshotPolicy } from '../m.files/u/u.policy.ts';
import { D, Is, type t } from './common.ts';
import { invalidPath } from './u/u.error.ts';
import { handlers } from './u/u.handlers.ts';
import { staticIndex } from './u/u.index.ts';

/** Create a bounded static Files backing from canonical dist metadata. */
export const fromDist: t.FilesStatic.Lib['fromDist'] = (options) => {
  if (!Is.plainObject(options)) throw invalidPath('Static dist options must be a plain object');

  const policy = snapshotPolicy(options.policy, invalidPath);
  const defaultLimit = options.defaultLimit ?? D.defaultLimit;
  validatePageInput({ kind: 'list', defaultLimit }, invalidPath);
  const index = staticIndex({ dist: options.dist, baseUrl: options.baseUrl });
  const capabilities = Object.freeze(
    {
      list: true,
      stat: true,
      read: true,
      write: false,
      remove: false,
      watch: false,
      manifest: policy.manifest === true,
      fidelity: D.fidelity,
    } satisfies t.Files.Capabilities,
  );

  return {
    kind: 'files/static:dist',
    policy,
    capabilities,
    handlers: handlers({ index, policy, capabilities, defaultLimit }),
  };
};
