import { describe, expect, it } from '../-test.ts';
import { Fs } from './mod.ts';

describe('Fs: GLOB operations', () => {
  it('Fs.glob', async () => {
    const base = Fs.resolve();
    const glob = Fs.glob(base);
    expect(glob.base).to.eql(base);

    const matches = await glob.find('**');
    expect(matches.length).to.be.greaterThan(3);

    const self = matches.find((item) => item.path === import.meta.filename);
    expect(self?.isFile).to.eql(true);
    expect(self?.name).to.eql(Fs.Path.basename(import.meta.filename ?? ''));
  });
});
