import { Sample } from '../-spec.samples/mod.ts';
import { type t } from './common.ts';
import { renderer } from './-ui.renderer.tsx';

type Options = { theme?: t.CommonTheme };

export function renderSamples(debug: t.DebugSignals, opts: Options = {}) {
  const { items, push } = renderer(debug, opts);

  push(Sample.Descriptor);

  return items;
}
