import { type t, Str, Button, SlugClient, Time } from './common.ts';

export const DescriptorSample: t.SlugLoaderView.FetchSample = {
  title: 'Descriptor',
  render(e) {
    e.item({ k: 'foo', v: 'bar' });
    e.item({ k: 'foo2', v: '456' });

    return <div>{Str.Lorem.words(18)}</div>;
  },
  async run(e) {
    console.log(`-------------------------------------------`);
    console.log('run', e);
  },
};

/**
 * Tmp 🐷
 */

async function tmpLoad(e: t.SlugLoaderView.ProbeRenderArgs) {
  const path = e.is.local ? 'staging/cdn.slc.db.team/kb/-manifests' : 'kb/-manifests';
  const res = await SlugClient.FromEndpoint.Descriptor.load(e.origin.cdn.default, path);
  // e.result(res);
  console.log('res', res);
}
