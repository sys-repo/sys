import { type t, Str, SlugClient } from './common.ts';

type Params = {
  path: string;
};

export const Descriptor: t.ActionProbe.ProbeSpec<t.TEnv, Params> = {
  title: 'Descriptor',
  render(e) {
    const path = e.is.local ? 'staging/cdn.slc.db.team/kb/-manifests' : 'kb/-manifests';
    e.params({ path });
    e.element(
      <div>
        Loads <code>dist.client.json</code> and validates descriptor bundles
        (kind/docid/basePath/layout).
      </div>,
    );
    e.item({ k: 'path', v: path });
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
