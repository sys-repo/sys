import { describe, expect, it } from './-test.ts';
import { Pkg } from './common.ts';
import { pkg } from './pkg.ts';

import { SlugClient } from './m.client/mod.ts';
import { SlugSchema } from './m.schema/mod.ts';
import { SlugTreeFs } from './m.fs/mod.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('API', async () => {
    const schema = await import('@sys/model-slug/schema');
    const client = await import('@sys/model-slug/client');
    const treeFs = await import('@sys/model-slug/fs');
    expect(client.SlugClient).to.equal(SlugClient);
    expect(schema.SlugSchema).to.equal(SlugSchema);
    expect(treeFs.SlugTreeFs).to.equal(SlugTreeFs);
  });
});
