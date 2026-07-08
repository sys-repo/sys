import { Is, type t } from '../common.ts';

export function toRowOpacity(
  raw: t.KeyValue.Opacity | undefined,
  base: { k: t.Percent; v: t.Percent },
): { k: t.Percent; v: t.Percent } {
  if (Is.nil(raw)) {
    return { k: base.k, v: base.v };
  }

  if (Is.number(raw)) {
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
