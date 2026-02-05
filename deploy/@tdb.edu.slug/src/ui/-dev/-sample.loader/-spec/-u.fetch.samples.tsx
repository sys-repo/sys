import { type DebugSignals, type t } from './-common.ts';
import { fetchButton } from './-u.fetch.btn.tsx';

/** Samples */
import {
  SampleAssets,
  SampleBundle,
  SampleDescriptor,
  SampleFileContentGet,
  SamplePlayback,
  SampleTree,
} from '../-samples.FromEndpoint/mod.ts';

export function fetchSamples(debug: DebugSignals) {
  const items: t.ReactNode[] = [];
  const btn = (label: t.ReactNode | (() => t.ReactNode), fn: t.FetchAction) => {
    const i = items.length - 1;
    items.push(fetchButton(debug, label, fn, i));
  };

  const hr = () => items.push(<hr key={items.length} />);

  btn(SampleBundle.label, SampleBundle.run);
  btn(SampleDescriptor.label, SampleDescriptor.run);

  hr();
  btn(SampleTree.label, SampleTree.run);
  btn(SampleFileContentGet.label, SampleFileContentGet.run);

  hr();
  btn(SamplePlayback.label, SamplePlayback.run);
  btn(SampleAssets.label, SampleAssets.run);

  return items;
}
