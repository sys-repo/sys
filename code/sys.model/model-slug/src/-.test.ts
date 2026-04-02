import { describe, expect, it } from './-test.ts';
import { Pkg, pkg } from './common.ts';

import { SlugClient } from './m.client/mod.ts';
import { SlugSchema } from './m.schema/mod.ts';
import { SlugTreeFs } from './m.fs/mod.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('API', async () => {
    const schema = await import('@sys/model-slug/schema');
    const client = await import('@sys/model-slug/client');
    const fs = await import('@sys/model-slug/fs');
    expect(client.SlugClient).to.equal(SlugClient);
    expect(schema.SlugSchema).to.equal(SlugSchema);
    expect(fs.SlugTreeFs).to.equal(SlugTreeFs);
  });
});
