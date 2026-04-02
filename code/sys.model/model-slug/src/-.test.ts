import { describe, expect, it } from './-test.ts';
import { Pkg, pkg } from './common.ts';

import { SlugClient } from './m.client/mod.ts';
import { SlugTree } from './m.core/mod.ts';
import { SlugTreeFs } from './m.fs/mod.ts';
import { SlugSchema } from './m.schema/mod.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('API', async () => {
    const m = await import('@sys/model-slug');
    const core = await import('@sys/model-slug/core');
    const schema = await import('@sys/model-slug/schema');
    const client = await import('@sys/model-slug/client');
    const fs = await import('@sys/model-slug/fs');

    expect(m.pkg).to.equal(pkg);
    expect(core.SlugTree).to.equal(SlugTree);
    expect(client.SlugClient).to.equal(SlugClient);
    expect(schema.SlugSchema).to.equal(SlugSchema);
    expect(fs.SlugTreeFs).to.equal(SlugTreeFs);
  });
});
