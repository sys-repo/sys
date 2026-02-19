import { describe, expect, Fs, it, slug } from '../../../-test.ts';
import { OpenTargets } from '../u.openTargets.ts';

describe('OpenTargets', () => {
  it('discover: includes root and only folders that have both index.html + dist.json', async () => {
    const dir = Fs.resolve(`./.tmp/test/open-targets/${slug()}`);
    await Fs.remove(dir);
    await Fs.ensureDir(dir);

    await Fs.ensureDir(`${dir}/ok`);
    await Fs.write(`${dir}/ok/index.html`, '<html></html>');
    await Fs.write(`${dir}/ok/dist.json`, '{}');

    await Fs.ensureDir(`${dir}/missing-dist`);
    await Fs.write(`${dir}/missing-dist/index.html`, '<html></html>');

    await Fs.ensureDir(`${dir}/missing-index`);
    await Fs.write(`${dir}/missing-index/dist.json`, '{}');

    const targets = await OpenTargets.discover(dir);
    const paths = targets.map((m) => m.path);
    expect(paths).to.eql(['', 'ok']);
  });

  it('menuOptions: emits open-prefixed command values', async () => {
    const dir = Fs.resolve(`./.tmp/test/open-targets/${slug()}`);
    await Fs.remove(dir);
    await Fs.ensureDir(`${dir}/releases`);
    await Fs.write(`${dir}/releases/index.html`, '<html></html>');
    await Fs.write(`${dir}/releases/dist.json`, '{}');

    const options = await OpenTargets.menuOptions({ name: 'test', dir });
    const values = options.map((m) => m.value);
    expect(values).to.eql([
      { cmd: 'open', path: '' },
      { cmd: 'open', path: 'releases' },
    ]);
  });
});
