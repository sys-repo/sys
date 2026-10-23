import { describe, expect, Fs, it } from '../../-test.ts';
import { Fmt } from '../u.fmt.ts';

describe('m.tmpl/u.fmt', () => {
  it('finalCommit formats pkg scaffold summary from explicit inputs', () => {
    const cwd = '/tmp';
    const targetDir = Fs.join(cwd, 'yolo');
    const text = Fmt.finalCommit({
      tmpl: 'pkg',
      targetDir,
      cwd,
      ops: [{ kind: 'create', path: Fs.join(targetDir, 'deno.json') }],
      options: { pkgName: '@foo/yolo' },
    });

    expect(text.includes('commit msg:')).to.eql(true);
    expect(text.includes('chore(tmpl:pkg): scaffold yolo for @foo/yolo (1 file)')).to.eql(true);
  });

  it('finalCommit formats pkg.help as an additive help-resource change', () => {
    const cwd = '/tmp';
    const targetDir = Fs.join(cwd, 'yolo');
    const text = Fmt.finalCommit({
      tmpl: 'pkg.help',
      targetDir,
      cwd,
      ops: [{ kind: 'create', path: Fs.join(targetDir, 'src/m.help/mod.ts') }],
    });

    expect(text.includes('docs(tmpl:pkg.help): add help resources to yolo (1 file)')).to.eql(
      true,
    );
  });
});
