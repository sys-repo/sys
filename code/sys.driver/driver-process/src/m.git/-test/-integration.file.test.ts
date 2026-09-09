import { describe, expect, Fs, it, Process } from '../../-test.ts';
import { Git } from '../mod.ts';

async function invoke(cwd: string, args: string[]) {
  const res = await Process.invoke({ cmd: 'git', args, cwd, silent: true });
  if (!res.success) throw new Error(res.text.stderr || res.text.stdout || res.toString());
  return res;
}

describe('Git.fileAtRef (integration)', () => {
  it('reads a file blob from a tree-ish ref', async () => {
    const probe = await Git.probe();
    if (!probe.ok) return;

    const dir = await Fs.makeTempDir({ prefix: 'git-file-at-ref-' });
    const cwd = dir.absolute;
    try {
      await invoke(cwd, ['init']);
      await Fs.ensureDir(Fs.join(cwd, 'data'));
      await Fs.write(Fs.join(cwd, 'data/state.json'), '{"version":"1.2.3"}\n');
      await invoke(cwd, ['add', 'data/state.json']);
      const tree = (await invoke(cwd, ['write-tree'])).text.stdout.trim();

      await Fs.write(Fs.join(cwd, 'data/state.json'), '{"version":"9.9.9"}\n');

      const res = await Git.fileAtRef({ cwd, ref: tree, path: 'data/state.json' });
      expect(res.ok).to.eql(true);
      if (res.ok) expect(res.text).to.eql('{"version":"1.2.3"}\n');
    } finally {
      await Fs.remove(cwd);
    }
  });
});
