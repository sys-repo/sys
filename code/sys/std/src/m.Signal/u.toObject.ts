import { type t } from './common.ts';
import { Is } from './m.Is.ts';

export const toObject: t.SignalLib['toObject'] = <T>(input: T): t.SignalValue<T> => {
  if (Is.signal(input)) {
    return input.value as t.SignalValue<T>;
  }

  if (Array.isArray(input)) {
    return input.map((item) => toObject(item)) as t.SignalValue<T>;
  }

  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      out[k] = toObject(v);
    }
    return out as t.SignalValue<T>;
  }

  return input as t.SignalValue<T>;
};
