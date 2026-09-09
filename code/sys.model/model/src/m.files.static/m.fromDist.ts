import { validatePageInput } from '../m.files/u/u.page.ts';
import { D, Is, type t } from './common.ts';
import { authorityHandlerOptions, resolveStaticAuthority } from './u/u.authority.ts';
import { invalidPath } from './u/u.error.ts';
import { handlers } from './u/u.handlers.ts';
import { staticIndex } from './u/u.index.ts';

/** Create a bounded static Files backing from canonical dist metadata. */
export const fromDist: t.FilesStatic.Lib['fromDist'] = (options) => {
  if (!Is.plainObject(options)) throw invalidPath('Static dist options must be a plain object');

  const authority = resolveStaticAuthority({ policy: options.policy });
  const policy = authority.policy;
  const capabilities = authority.capabilities;
  const defaultLimit = options.defaultLimit ?? D.defaultLimit;
  validatePageInput({ kind: 'list', defaultLimit }, invalidPath);
  const index = staticIndex({ dist: options.dist, baseUrl: options.baseUrl });
  const baseHandlers = handlers({ index, policy, capabilities, defaultLimit });

  return {
    kind: 'files/static:dist',
    policy,
    capabilities,
    handlers: authority.handlers(baseHandlers, authorityHandlerOptions),
  };
};
