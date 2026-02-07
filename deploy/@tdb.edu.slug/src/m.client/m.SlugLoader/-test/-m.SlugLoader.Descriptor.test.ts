import { describe, expect, it } from '../../../-test.ts';
import { Descriptor } from '../m.Descriptor.ts';

describe('SlugLoader.Descriptor', () => {
  describe('target', () => {
    it('maps filesystem descriptor target', () => {
      const result = Descriptor.target('slug-tree:fs');
      expect(result).to.eql({
        ok: true,
        value: {
          kind: 'slug-tree:fs',
          descriptorPath: 'kb/-manifests',
          basePath: 'kb/-manifests',
        },
      });
    });

    it('maps media descriptor target', () => {
      const result = Descriptor.target('slug-tree:media:seq');
      expect(result).to.eql({
        ok: true,
        value: {
          kind: 'slug-tree:media:seq',
          descriptorPath: 'program/-manifests',
          basePath: 'program',
        },
      });
    });
  });
});
