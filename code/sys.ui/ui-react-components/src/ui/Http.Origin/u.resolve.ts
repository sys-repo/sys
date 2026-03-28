import { type t } from './common.ts';

/**
 * Resolve a kind into a fully-qualified {origin} object.
 */
export function resolveOrigin(props: { env?: t.HttpOrigin.Env; defaults?: t.HttpOriginSpecMap }) {
  const { env = 'localhost', defaults = {} } = props;
  const origin = defaults[env];
  return {
    env,
    origin,
  } as const;
}
