import React from 'react';
import { type t } from './common.ts';
import { asArray, normalize } from './u.ts';

export function useSplitRatios(args: {
  n: number;
  value?: t.Percent[];
  defaultValue?: t.Percent[];
  min?: t.Percent | t.Percent[];
  max?: t.Percent | t.Percent[];
}): t.SplitPaneRatios {
  const { n, value, defaultValue, min = 0, max = 1 } = args;
  const isControlled = Array.isArray(value);

  // Uncontrolled state seeded from defaultValue (normalized to length n):
  const initial = React.useMemo(() => normalize(defaultValue ?? [], n), [defaultValue, n]);
  const [ratiosUnc, setRatiosUnc] = React.useState<t.Percent[]>(initial);

  // Keep uncontrolled state in sync if n/defaultValue change.
  React.useEffect(() => {
    if (!isControlled) setRatiosUnc(normalize(defaultValue ?? [], n));
  }, [isControlled, defaultValue, n]);

  // Effective ratios (normalize and ensure correct length):
  const ratios = React.useMemo(() => {
    const source = isControlled ? (value ?? []) : ratiosUnc;
    const normalized = normalize(source as number[], n);
    return normalized.length === n ? normalized : normalize([], n);
  }, [isControlled, value, ratiosUnc, n]);

  // Per-pane bounds, expanded to arrays:
  const mins = React.useMemo(() => asArray(min, n, 0), [min, n]);
  const maxs = React.useMemo(() => asArray(max, n, 1), [max, n]);

  if (isControlled) {
    // Controlled: external source of truth; no setter:
    return {
      isControlled: true,
      ratios,
      mins,
      maxs,
    };
  }

  // Uncontrolled: expose a setter with value-or-updater ergonomics.
  const set: t.UpdateRatios = (next) => {
    const nextArray = typeof next === 'function' ? next(ratios) : next;
    setRatiosUnc(normalize((nextArray ?? []) as number[], n));
  };

  return {
    isControlled: false,
    ratios,
    mins,
    maxs,
    set,
  };
}
