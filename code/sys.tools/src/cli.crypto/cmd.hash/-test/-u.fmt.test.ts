import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs } from '../../common.ts';
import { HashFmt } from '../mod.ts';

describe('cli.crypto/cmd.hash/u.fmt', () => {
  it('renders combined dir rows for files and dist metadata', () => {
    const text = Cli.stripAnsi(HashFmt.result(
      {
        targetDir: '/tmp/example',
        digest: 'sha256-818e82c98cf3f552f58c7feb87b1ea1f72b3bd31820bb669503bb6c535c74119',
        fileCount: 750,
        bytesTotal: 87700000,
        computedAt: 0,
        dist: {} as never,
      },
      {
        elapsed: '593ms',
        dirLabel: './',
        dist: { path: Fs.join(Fs.cwd(), 'dist.json'), sizeBytes: 27000, status: 'created' },
      },
    ));

    expect(text.includes('dir:files')).to.eql(true);
    expect(text.includes('750 files, 87.7 MB')).to.eql(true);
    expect(text.includes('dir:dist')).to.eql(true);
    expect(text.includes('./dist.json #74119 (created), 27 kB')).to.eql(true);
  });
});
