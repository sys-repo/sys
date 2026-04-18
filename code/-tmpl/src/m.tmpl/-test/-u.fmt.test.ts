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
});
