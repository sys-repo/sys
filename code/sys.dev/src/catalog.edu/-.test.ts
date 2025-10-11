import { describe, expect, it } from './-test.ts';
import { Slug } from './m.slug/mod.ts';
import { YamlPipeline } from './m.yaml/mod.ts';

describe('module: catalog.edu', () => {
  it('API', async () => {
    const m = await import('@sys/dev/catalog.edu');
    expect(m.Slug).to.equal(Slug);
    expect(m.YamlPipeline).to.equal(YamlPipeline);
  });
});
