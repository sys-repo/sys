import { describe, expect, Is, it } from '../../../-test.ts';
import { SAMPLE, type SampleKind } from '../-spec/-samples.tsx';
import { toReorderModel } from '../u/u.reorder.ts';

describe('KeyValue', () => {
  describe('spec samples', () => {
    it('all visible samples provide stable reorder identity', () => {
      const samples: SampleKind[] = ['simple', 'comprehensive', 'opacity', 'links', 'recursive', 'reorder'];

      samples.forEach((sample) => {
        const items = SAMPLE.items(sample) ?? [];
        expect(items.every((item) => Is.string(item.id))).to.eql(true);
        expect(toReorderModel(items)?.ids.length).to.eql(items.length);
      });
    });
  });
});
