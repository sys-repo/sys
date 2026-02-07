import { type t, Str, SlugClient } from './common.ts';

type Params = {
  readonly path: string;
};
type Env = {
  readonly is: { readonly local: boolean };
  readonly origin: t.SlugUrlOrigin;
};

export const DescriptorSample: t.ActionProbe.ProbeSpec<Env, Params> = {
  title: 'Descriptor',
  render(e) {
    const path = e.is.local ? 'staging/cdn.slc.db.team/kb/-manifests' : 'kb/-manifests';
    e.params({ path });
    e.item({ k: 'foo', v: 'bar' });
    e.item({ k: 'foo2', v: '456' });
    e.item({ k: 'path', v: path });

    return <div>{Str.Lorem.words(18)}</div>;
  },
  async run(e) {
    const params = e.params<Params>();
    const path = params?.path;
    if (!path) {
      e.item({ k: 'error', v: 'Missing params.path' });
      return e.result({ ok: false, error: { message: 'Missing params.path' } });
    }

    e.item({ k: 'origin', v: e.origin.cdn.default });
    e.item({ k: 'path', v: path });
    const res = await SlugClient.FromEndpoint.Descriptor.load(e.origin.cdn.default, path);
    e.result(res);
  },
};
