import { type t, SlugClient, Url } from './-common.ts';

export const SampleFileContentGet: t.FetchSample = {
  label: 'FromEndpoint.FileContent.get',

  /**
   * Load file-content by hash.
   */
  async run(e) {
    const basePath = e.is.local ? 'staging/slc.cdn/kb' : 'kb';
    const manifestsDir = '-manifests';
    const origin = e.origin.cdn.default;
    const docid = 'kb';
    const ref = 'crdt:2YYWV7C84bEyva9sBd6Jpt4Z9Pnk';

    const baseUrl = Url.parse(origin).join(basePath);
    const index = await SlugClient.FromEndpoint.FileContent.index(baseUrl, docid, {
      layout: { manifestsDir },
    });
    if (!index.ok) return e.result(index);
    const entry = index.value.entries.find((item) => {
      if (item.frontmatter?.ref === ref) return true;
      if (item.path === ref) return true;
      return false;
    });
    const hash = entry?.hash;
    if (!hash) {
      return e.result({
        ok: false,
        error: { kind: 'schema', message: `Missing hash for ref: ${ref}` },
      });
    }
    const res = await SlugClient.FromEndpoint.FileContent.get(baseUrl, hash);
    e.result(res);
  },
};
