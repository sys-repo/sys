import { Sample } from '../-samples/mod.ts';
import { type t } from './common.ts';
import { renderer } from './-ui.renderer.tsx';

type Options = { theme?: t.CommonTheme };

export function renderSamples(debug: t.DebugSignals, opts: Options = {}) {
  const { items, push, hr } = renderer(debug, opts);

  push(Sample.Foo);
  hr();
  push(Sample.create('My Sample'));

  return items;
}
