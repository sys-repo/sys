import { describe, expect, it } from '../../-test.ts';
import { ManifestSchema } from '../m.Manifest/mod.ts';
import { MediaCompositionSchema } from '../m.MediaComposition/mod.ts';
import { SlugTreeSchema } from '../m.SlugTree/mod.ts';
import { TraitsSchema } from '../m.Traits/mod.ts';
import { SlugSchema } from '../mod.ts';

describe(`schema/model/slug`, () => {
  it('API', async () => {
    const m = await import('@sys/model-slug');
    const mm = await import('@sys/model-slug/schema');
    expect(m.SlugSchema).to.equal(SlugSchema);
    expect(mm.SlugSchema).to.equal(SlugSchema);
    expect(SlugSchema.Tree).to.equal(SlugTreeSchema);
    expect(SlugSchema.Manifest).to.equal(ManifestSchema);
    expect(SlugSchema.MediaComposition).to.equal(MediaCompositionSchema);
    expect(SlugSchema.Traits).to.equal(TraitsSchema);
  });
});
