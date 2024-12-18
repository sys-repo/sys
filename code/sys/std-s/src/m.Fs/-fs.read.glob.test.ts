import { describe, expect, it } from '../-test.ts';
import { Fs } from './mod.ts';

describe('Fs.glob', () => {
  it('glob.find("**") ← default params', async () => {
    const base = Fs.resolve();
    const glob = Fs.glob(base);
    expect(glob.base).to.eql(base);

    const matches = await glob.find('**');
    expect(matches.length).to.be.greaterThan(10);
    expect(matches.some((m) => m.isDirectory === true)).to.be.true; // NB: includes directories by default.

    const self = matches.find((item) => item.path === import.meta.filename);
    expect(self?.isFile).to.eql(true);
    expect(self?.name).to.eql(Fs.Path.basename(import.meta.filename ?? ''));
  });

  it('option → includeDirs: false', async () => {
    const glob = Fs.glob(Fs.resolve());
    const a = await glob.find('**', {});
    const b = await glob.find('**', { includeDirs: false });
    expect(a.some((m) => m.isDirectory === true)).to.be.true; //  Default param.
    expect(b.some((m) => m.isDirectory === true)).to.be.false; // Directories excluded.
  });
});
