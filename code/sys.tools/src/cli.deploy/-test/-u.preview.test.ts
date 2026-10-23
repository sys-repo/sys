import { describe, expect, Fs, it } from '../../-test.ts';
import { previewStatus } from '../u.menu/u/u.previewStatus.ts';
import { withPreviewDist } from './u.preview.fixture.ts';

describe('Deploy: preview status', () => {
  it('derives fresh endpoint status and invalidates changed, undeclared, and malformed roots', async () => {
    await withPreviewDist(async ({ root }) => {
      const initial = await previewStatus(root);
      expect(initial.kind).to.eql('verified');
      if (initial.kind !== 'verified') return;
      expect(Object.isFrozen(initial)).to.eql(true);
      expect(Object.isFrozen(initial.evidence)).to.eql(true);

      const cancelled = new AbortController();
      cancelled.abort('test.cancel');
      expect(await previewStatus(root, cancelled.signal)).to.eql({
        kind: 'unavailable',
        reason: 'cancelled',
      });

      await Fs.write(`${root}/assets/app.js`, 'export const changed = true;\n');
      expect(await previewStatus(root)).to.eql({
        kind: 'unavailable',
        reason: 'content-mismatch',
      });

      await Fs.write(`${root}/assets/app.js`, 'export const ready = true;\n');
      expect((await previewStatus(root)).kind).to.eql('verified');

      await Fs.write(`${root}/undeclared.txt`, 'undeclared\n');
      expect(await previewStatus(root)).to.eql({
        kind: 'unavailable',
        reason: 'unexpected-entry',
      });
      await Fs.remove(`${root}/undeclared.txt`);

      await Fs.write(`${root}/dist.json`, '{ malformed');
      expect(await previewStatus(root)).to.eql({ kind: 'unavailable', reason: 'malformed' });
    });
  });
});
