import { type t, describe, expect, expectTypeOf, it, Yaml } from '../../-test.ts';
import { AliasResolver } from '../mod.ts';

describe(`AliasResolver`, () => {
  const yamlIndex = `
    # :index
    # crdt:28k1CyQUNXnx74LhBoyvP2kif4GF
    #
    alias:
      :core:   /slug/data/prog.core
      :p2p:    /slug/data/prog.p2p
      :assets: fs:/Users/rowanyeoman/Documents/All-docs/TeamDB/Design/Video/P2P-program/Oct-2025/publish/

    slug:
      traits:
        - of: slug-tree
          as: prog.core
        - of: slug-tree
          as: prog.p2p

      data:
        prog.core:
        prog.p2p:
  `;

  const yamlSlug = `
    alias:
      :index:       crdt:28k1CyQUNXnx74LhBoyvP2kif4GF
      :core-slugs:  /:index/alias/:core
      :p2p-slugs:   /:index/alias/:p2p

      :core-assets: /:index/alias/:assets/core-3.0-business-model-design-2025
      :p2p-assets:  /:index/alias/:assets/p2p-3.0-business-model-design-2025

      :core-images: /:core-assets/images
      :p2p-images:  /:p2p-assets/images

      :core-videos: /:core-assets/videos
      :p2p-videos:  /:p2p-assets/videos

      not-an-alias: 🐷

    data:
      sequence:
        - video: /:p2p-videos/p2p 3.1 understanding-business-model-design1.webm.02.mp4.webm
          slice: 00:00..01:15
  `;

  it('expand nested alias chains from yaml', async () => {
    // NB: simulate the root path to the object-value on the CRDT document
    const doc = {
      index: { ['slug.parsed']: Yaml.toJS(Yaml.parseAst(yamlIndex)).data },
      local: { ['slug.parsed']: Yaml.toJS(Yaml.parseAst(yamlSlug)).data },
    };

    const resolver = AliasResolver.make(doc.local, { root: ['slug.parsed'] });
    expect(resolver.root).to.eql(doc.local['slug.parsed']);

    expect((resolver.alias as any)['not-an-alias']).to.eql(undefined);
    expect(resolver.alias[':index']).to.eql('crdt:28k1CyQUNXnx74LhBoyvP2kif4GF');
    expect(resolver.alias[':core-slugs']).to.eql('/:index/alias/:core');
  });
});
