import type { t } from './common.ts';

export function toRowOpacity(
  raw: t.KeyValueOpacity | undefined,
  base: { k: t.Percent; v: t.Percent },
): { k: t.Percent; v: t.Percent } {
  if (raw == null) {
    return { k: base.k, v: base.v };
  }

  if (typeof raw === 'number') {
    return {
      k: base.k * raw,
      v: base.v * raw,
    };
  }

  return {
    k: raw.k != null ? raw.k : base.k,
    v: raw.v != null ? raw.v : base.v,
  };
}
