import { type t } from './-common.ts';
import { fetchButton } from './-u.fetch.btn.tsx';
import { createEntry } from './-ui.sample.tsx';

/** Samples */
import { SampleDescriptor__, SampleTree, Sample } from '../-samples.FromEndpoint/mod.ts';

export function fetchSamples(debug: t.DebugSignals) {
  const items: t.ReactNode[] = [];
  const push = (sample: t.FetchSample) => items.push(createEntry(debug, sample, items.length - 1));
  const hr = () => items.push(<hr key={items.length} />);

  const btn = (label: t.ReactNode | (() => t.ReactNode), fn: t.FetchAction__) => {
    const i = items.length - 1;
    items.push(fetchButton(debug, label, fn, i));
  };

  btn(SampleDescriptor__.label, SampleDescriptor__.run);
  hr();
  btn(SampleTree.label, SampleTree.run);

  hr();
  push(Sample.Descriptor);

  return items;
}
