import { type t, D } from './common.ts';

/**
 * Resolve a kind into a fully-qualified {origin} object.
 */
export function resolveOrigin(props: { kind?: t.HttpOriginEnv; defaults?: t.HttpOriginDefaults }) {
  const { kind = D.kind.default, defaults = {} } = props;

  const origins = {
    localhost: defaults?.localhost ?? D.kind.local,
    production: defaults?.production ?? D.kind.prod,
  } as const;

  const origin = kind === 'localhost' ? origins.localhost : origins.production;

  return {
    kind,
    origin,
    origins,
  } as const;
}
