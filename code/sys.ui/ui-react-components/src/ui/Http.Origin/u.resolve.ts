import { type t, D } from './common.ts';

/**
 * Resolve a kind into a fully-qualified {origin} object.
 */
export function resolveOrigin(props: { kind?: t.HttpOriginEnv; defaults?: t.HttpOriginDefaults }) {
  const { kind = D.env.default, defaults = {} } = props;

  const origins = {
    localhost: defaults?.localhost ?? D.env.local,
    production: defaults?.production ?? D.env.prod,
  } as const;

  const origin = kind === 'localhost' ? origins.localhost : origins.production;

  return {
    kind,
    origin,
    origins,
  } as const;
}
