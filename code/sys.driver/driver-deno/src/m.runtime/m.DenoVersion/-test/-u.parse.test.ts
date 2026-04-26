import { describe, expect, it } from '../../../-test.ts';
import { parseCurrentVersion, parseUpgradeRun, parseUpgradeStatus } from '../u.parse.ts';
import { procOutput } from './u.fixture.ts';

describe('DenoVersion.parse', () => {
  it('parses current version from `deno --version` output', () => {
    const res = parseCurrentVersion(procOutput([
      'deno 2.7.13 (stable, release, aarch64-apple-darwin)',
      'v8 14.7.173.20-rusty',
      'typescript 5.9.2',
    ].join('\n')));

    expect(res).to.eql('2.7.13');
  });

  it('parses current stable upgrade status when already current', () => {
    const res = parseUpgradeStatus(procOutput([
      'Current Deno version: v2.7.13',
      '\u001b[0m\u001b[38;5;245mLooking up stable version\u001b[0m',
      '',
      'Local deno version \u001b[32m2.7.13\u001b[39m is the most recent release',
    ].join('\n')));

    expect(res).to.eql({
      current: '2.7.13',
      latest: '2.7.13',
      needed: false,
      source: 'deno-upgrade-dry-run',
      output: res?.output,
    });
  });

  it('parses stable upgrade status when a newer release is available', () => {
    const out = procOutput([
      'Current Deno version: v2.7.13',
      'Looking up stable version',
      '',
      'Found latest stable version v2.8.0',
      '',
      'Downloading https://github.com/denoland/deno/releases/download/v2.8.0/deno-aarch64-apple-darwin.zip',
      'Deno is upgrading to version 2.8.0',
      'Upgraded successfully (dry run)',
    ].join('\n'));

    const res = parseUpgradeStatus(out);

    expect(res).to.eql({
      current: '2.7.13',
      latest: '2.8.0',
      needed: true,
      source: 'deno-upgrade-dry-run',
      output: out,
    });
  });

  it('parses upgrade run facts', () => {
    const out = procOutput([
      'Current Deno version: v2.7.13',
      'Downloading https://github.com/denoland/deno/releases/download/v2.7.12/deno-aarch64-apple-darwin.zip',
      'Deno is upgrading to version 2.7.12',
      'Upgraded successfully (dry run)',
    ].join('\n'));

    const res = parseUpgradeRun(out, { dryRun: true });

    expect(res).to.eql({
      from: '2.7.13',
      to: '2.7.12',
      success: true,
      dryRun: true,
      output: out,
    });
  });
});
