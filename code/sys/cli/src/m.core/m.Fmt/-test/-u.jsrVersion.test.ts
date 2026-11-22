import { c, describe, expect, it } from '../../../-test.ts';
import { Cli } from '../../mod.ts';
import { Fmt, stripAnsi } from '../mod.ts';

const release = { name: '@sys/example', version: '1.2.3-rc.1' };

describe('Cli.Fmt.jsrVersion', () => {
  it('links the exact prerelease using the active underline style', () => {
    expect(Cli.Fmt.jsrVersion).to.equal(Fmt.jsrVersion);
    const actual = Fmt.jsrVersion(release, { link: true });
    const url = 'https://jsr.io/@sys/example@1.2.3-rc.1';

    expect(actual).to.eql(`\x1b]8;;${url}\x1b\\${c.underline(release.version)}\x1b]8;;\x1b\\`);
    expect(stripAnsi(actual)).to.eql(release.version);
  });

  it('links a stable release without emitting underline codes when ANSI styling is off', () => {
    const enabled = c.getColorEnabled();
    try {
      c.setColorEnabled(false);
      const actual = Fmt.jsrVersion({ name: '@other/tool', version: '2.0.0' }, { link: true });
      expect(actual).to.eql('\x1b]8;;https://jsr.io/@other/tool@2.0.0\x1b\\2.0.0\x1b]8;;\x1b\\');
    } finally {
      c.setColorEnabled(enabled);
    }
  });

  it('preserves build metadata in both the release address and the visible version', () => {
    const actual = Fmt.jsrVersion({ ...release, version: '1.2.3+build.7' }, { link: true });
    const url = 'https://jsr.io/@sys/example@1.2.3+build.7';
    expect(actual).to.eql(`\x1b]8;;${url}\x1b\\${c.underline('1.2.3+build.7')}\x1b]8;;\x1b\\`);
  });

  it('leaves the version plain when links are disabled', () => {
    expect(Fmt.jsrVersion(release, { link: false })).to.eql(release.version);
  });

  it('leaves ranges, padded versions, and non-JSR roots plain', () => {
    const cases = [
      { ...release, version: '^1.2.3' },
      { ...release, version: 'v1.2.3' },
      { ...release, version: ' 1.2.3 ' },
      { ...release, name: 'example' },
      { ...release, name: '@sys/example/ui' },
    ];
    for (const input of cases) {
      expect(Fmt.jsrVersion(input, { link: true })).to.eql(input.version);
    }
  });

  it('does not echo terminal controls or line breaks in either output mode', () => {
    const versions = ['1.2.3\x1b', '1.2.3\u009d', '1.2.3\n', '1.2.3\u202e'];
    for (const version of versions) {
      for (const link of [true, false]) {
        expect(Fmt.jsrVersion({ ...release, version }, { link })).to.eql('invalid version');
      }
    }
  });
});
