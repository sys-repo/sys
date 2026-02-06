import { type t } from './-common.ts';
import { fetchButton } from './-u.fetch.btn.tsx';

/** Samples */
import { SampleDescriptor, SampleTree } from '../-samples.FromEndpoint/mod.ts';

export function fetchSamples(debug: t.DebugSignals) {
  const items: t.ReactNode[] = [];
  const hr = () => items.push(<hr key={items.length} />);
  const btn = (label: t.ReactNode | (() => t.ReactNode), fn: t.FetchAction) => {
    const i = items.length - 1;
    items.push(fetchButton(debug, label, fn, i));
  };

  btn(SampleDescriptor.label, SampleDescriptor.run);
  hr();
  btn(SampleTree.label, SampleTree.run);

  return items;
}
