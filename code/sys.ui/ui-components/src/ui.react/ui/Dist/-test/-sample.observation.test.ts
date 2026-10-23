import { describe, expect, it } from '../../../-test.ts';
import { Pkg } from '../common.ts';
import { SAMPLE, SAMPLE_FILES_MODES } from '../-spec/-SAMPLE.dist.json.ts';

// Display fixtures must have a supported shape; this supplies no payload or trusted-pin evidence.
describe('Dist display samples: unpinned observations', () => {
  for (const files of SAMPLE_FILES_MODES) {
    it(`${files} inventory → ${files === 'none' ? 'empty-layout state, not an artifact' : 'supported observation'}`, () => {
      // Canonical inventories are nonempty; a UI empty-state fixture does not change that contract.
      expect(Pkg.Is.dist(SAMPLE.HelloWorld({ files }))).to.eql(files !== 'none');
    });
  }
});
