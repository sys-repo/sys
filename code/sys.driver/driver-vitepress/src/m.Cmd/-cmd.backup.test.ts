import { Fs, Ignore, PATHS, describe, expect, it } from '../-test.ts';

describe('cmd: backup', () => {
  const setup = async () => {
    const text = await Deno.readTextFile(Fs.join(PATHS.tmpl.source, '.gitignore'));
    const gitignore = Ignore.create(text);
    return { gitignore };
  };

  it('ignore: via ".gitignore"', async () => {
    const { gitignore } = await setup();

    const test = (path: string, expected: boolean) => {
      expect(gitignore.isIgnored(path)).to.eql(expected, path);
    };

    // Ignored (not backed up).
    test('.backup/', true);
    test('foo/.backup/', true);
    test('foo/.backup/xxx.000', true);
    test('.tmp/sample/.backup/1735782009153.u4toce/.vitepress', true);
    test('dist/index.html', true);
    test('.tmp/sample/dist/index.html', true);

    // Not ignored (is backed up).
    test('deno.json', false);
  });
});
