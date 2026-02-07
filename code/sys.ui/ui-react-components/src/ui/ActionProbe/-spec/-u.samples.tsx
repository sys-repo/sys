import type { t } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

import { Sample } from '../-spec.samples/mod.ts';
import { renderer } from './-ui.renderer.tsx';

type Options = { theme?: t.CommonTheme };

export function renderSamples(debug: DebugSignals, opts: Options = {}) {
  const { items, push, hr } = renderer(debug, opts);

  push(Sample.Foo);
  hr();
  push(Sample.create('My Sample'));

  return items;
}
