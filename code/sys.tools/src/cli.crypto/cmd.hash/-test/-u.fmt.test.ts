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
        manifest: {
          integrity: 'sha256-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      },
      {
        elapsed: '593ms',
        dirLabel: './',
        dist: { path: Fs.join(Fs.cwd(), 'dist.json'), sizeBytes: 27000, status: 'created' },
        showManifestIntegrity: true,
      },
    ));

    expect(text.includes('dist:integrity')).to.eql(true);
    expect(
      text.includes('sha256-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
    ).to.eql(true);
    expect(text.includes('dir:files')).to.eql(true);
    expect(text.includes('750 files, 87.7 MB')).to.eql(true);
    expect(text.includes('dir:dist')).to.eql(true);
    expect(text.includes('./dist.json #74119 (created), 27 kB')).to.eql(true);
  });

  it('does not present unsaved serialization as published integrity', () => {
    const text = Cli.stripAnsi(HashFmt.result({
      targetDir: '/tmp/example',
      digest: 'sha256-818e82c98cf3f552f58c7feb87b1ea1f72b3bd31820bb669503bb6c535c74119',
      fileCount: 1,
      bytesTotal: 1,
      computedAt: 0,
      dist: {} as never,
      manifest: {
        integrity: 'sha256-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      },
    }));

    expect(text.includes('dist:integrity')).to.eql(false);
  });

  it('renders pre-clean junk-file guidance', () => {
    const text = Cli.stripAnsi(HashFmt.preflightJunk({
      targetDir: Fs.cwd(),
      fileCount: 2,
      bytesTotal: 12,
      junkFiles: [Fs.join(Fs.cwd(), '.DS_Store'), Fs.join(Fs.cwd(), 'sub/.DS_Store')],
      junk: [
        {
          kind: '.DS_Store',
          label: '.DS_Store',
          files: [Fs.join(Fs.cwd(), '.DS_Store'), Fs.join(Fs.cwd(), 'sub/.DS_Store')],
        },
      ],
    }));

    expect(text.includes('Delete before calculating:')).to.eql(true);
    expect(text.includes('./.DS_Store')).to.eql(true);
    expect(text.includes('./sub/.DS_Store')).to.eql(true);
  });
});
