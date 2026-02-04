import { type DebugSignals, type t } from './-common.ts';
import { fetchButton } from './-u.fetch.btn.tsx';

/** Samples */
import { SampleAssets } from './-u.sample.-assets-load.ts';
import { SampleBundle } from './-u.sample.-bundle-load.ts';
import { SampleDescriptor } from './-u.sample.-descriptor-load.ts';
import { SampleFileContentGet } from './-u.sample.-filecontent-get.ts';
import { SamplePlayback } from './-u.sample.-playback-load.ts';
import { SampleTree } from './-u.sample.-tree-load.ts';

export function fetchSamples(debug: DebugSignals) {
  const items: t.ReactNode[] = [];
  const btn = (label: string, fn: t.FetchAction) => {
    const i = items.length - 1;
    items.push(fetchButton(debug, label, fn, i));
  };
  btn(SampleDescriptor.label, SampleDescriptor.run);

  btn(SampleTree.label, SampleTree.run);
  btn(SamplePlayback.label, SamplePlayback.run);
  btn(SampleAssets.label, SampleAssets.run);
  btn(SampleBundle.label, SampleBundle.run);
  btn(SampleFileContentGet.label, SampleFileContentGet.run);

  return items;
}
