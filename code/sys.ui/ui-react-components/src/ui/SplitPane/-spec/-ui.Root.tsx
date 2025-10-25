import React from 'react';

import { Arr, Signal } from '../common.ts';
import { SplitPane } from '../mod.ts';

import type { DebugSignals } from './-SPEC.Debug.tsx';
import { normalize } from './-u.ts';
import { Dummy } from './-ui.Dummy.tsx';

export function Root(props: { debug: DebugSignals }) {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  const n = v.childCount ?? 2;

  Signal.useRedrawEffect(debug.listen);

  // Ensure stored controlled-ratios has correct length:
  const ratios = React.useMemo(() => {
    const stored = p.controlledRatios.value;
    const def = v.defaultValue;

    if (Arr.isArray(stored) && stored.length === n) return normalize(stored, n);
    if (Arr.isArray(def) && def.length === n) return normalize(def, n);

    const next = normalize([], n); // fallback → even split
    p.controlledRatios.value = next;
    return next;
  }, [n, v.defaultValue, p.controlledRatios.value]);

  const elChildren = Array.from({ length: n }).map((_, i) => {
    return (
      <Dummy key={i} theme={v.theme}>
        {String.fromCharCode((i % 26) + 65) /* ← letter from index, eg. "A" */}
      </Dummy>
    );
  });

  return (
    <SplitPane
      debug={v.debug}
      theme={v.theme}
      value={v.isControlled ? ratios : undefined}
      defaultValue={v.defaultValue}
      enabled={v.enabled}
      orientation={v.orientation}
      min={v.min}
      max={v.max}
      gutter={v.gutter}
      onlyIndex={v.onlyIndex}
      onDragStart={(e) => console.info(`⚡️ onDragStart`, e)}
      onDragEnd={(e) => console.info(`⚡️ onDragEnd`, e)}
      onChange={(e) => {
        console.info(`⚡️ onChange`, e);
        p.controlledRatios.value = e.ratios;
      }}
    >
      {elChildren}
    </SplitPane>
  );
}
