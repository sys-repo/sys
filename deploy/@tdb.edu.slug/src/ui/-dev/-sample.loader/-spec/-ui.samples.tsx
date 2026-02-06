import { type t } from './-common.ts';
import { ProbeContainer } from './-ui.sample.ProbeContainer.tsx';

/** Samples */
import { Sample } from '../-samples.FromEndpoint/mod.ts';

export function renderSamples(debug: t.DebugSignals) {
  const { items, push, hr } = renderers(debug);

  push(Sample.Descriptor);
  hr();

  return items;
}

/**
 * Helpers
 */
function renderers(debug: t.DebugSignals) {
  type T = t.FetchSample;
  const items: t.ReactNode[] = [];
  const create = (sample: T) => render(debug, sample, items.length - 1);
  const push = (sample: T) => items.push(create(sample));
  const hr = () => items.push(<hr key={items.length} />);
  return { items, push, hr } as const;
}

function render(debug: t.DebugSignals, sample: t.FetchSample, index: t.Index) {
  return <ProbeContainer key={index} debug={debug} sample={sample} />;
}
