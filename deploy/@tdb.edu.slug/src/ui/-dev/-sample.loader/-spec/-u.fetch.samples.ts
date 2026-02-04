import { type t, SlugClient } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';
import { type FetchAction, fetchButton } from './-u.fetch.btn.tsx';

export function fetchSamples(debug: DebugSignals) {
  const items: t.ReactNode[] = [];
  const btn = (label: string, fn: FetchAction) => {
    items.push(fetchButton(debug, label, fn, items.length - 1));
  };

  btn('FromEndpoint.Descriptor.load', async (e) => {
    let path = e.local ? 'staging/cdn.slc.db.team/kb/-manifests' : 'kb/-manifests';
    const host = e.origin.cdn.default;
    const res = await SlugClient.FromEndpoint.Descriptor.load(host, path);
    e.result(res);
  });

  return items;
}
