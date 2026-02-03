import { type t, D } from './common.ts';

/**
 * Resolve a kind into a fully-qualified {origin} object.
 */
export function resolveOrigin(props: { kind?: t.DevOriginKind; defaults?: t.DevOriginDefaults }) {
  const { kind = D.kind.default, defaults = {} } = props;

  const origins = {
    local: defaults?.local ?? D.kind.local,
    prod: defaults?.prod ?? D.kind.prod,
  } as const;

  const origin = kind === 'localhost' ? origins.local : origins.prod;

  return {
    kind,
    origin,
    origins,
  } as const;
}
