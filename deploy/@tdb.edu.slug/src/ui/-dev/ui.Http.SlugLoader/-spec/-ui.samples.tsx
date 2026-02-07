import { Sample } from '../-samples.FromEndpoint/mod.ts';
import { type t } from './common.ts';
import { renderer } from './-ui.renderer.tsx';

type Options = { theme?: t.CommonTheme };

export function renderSamples(debug: t.DebugSignals, opts: Options = {}) {
  const { items, push, hr } = renderer(debug, opts);

  push(Sample.Descriptor);
  push(Sample.Descriptor);
  // hr();

  return items;
}
