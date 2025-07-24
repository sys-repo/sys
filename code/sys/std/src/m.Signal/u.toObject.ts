import { type t } from './common.ts';
import { Is } from './m.Is.ts';

export const toObject: t.SignalLib['toObject'] = <T>(input: T): t.UnwrapSignals<T> => {
  if (Is.signal(input)) {
    return input.value as t.UnwrapSignals<T>;
  }

  if (Array.isArray(input)) {
    return input.map((item) => toObject(item)) as t.UnwrapSignals<T>;
  }

  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      out[k] = toObject(v);
    }
    return out as t.UnwrapSignals<T>;
  }

  return input as t.UnwrapSignals<T>;
};
