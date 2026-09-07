import { describe, expect, Fs, it, Process } from '../common.ts';

const CWD = Fs.Path.fromFileUrl(new URL('../../', import.meta.url));

describe('driver-pi/scripts/release launcher process', () => {
  it('cold import → succeeds without ambient filesystem or environment grants', async () => {
    const result = await Process.capture({
      cmd: Deno.execPath(),
      cwd: CWD,
      args: [
        'run',
        '--frozen',
        '--cached-only',
        '--no-prompt',
        '-P=test-release-launch',
        './-scripts/-test.external/-test.release.launch.ts',
      ],
      executionTimeout: 10_000,
      maxStdoutBytes: 16 * 1024,
      maxStderrBytes: 16 * 1024,
    });
    expect(result.outcome).to.eql('exited');
    expect(result.code, result.text.stderr).to.eql(0);
    expect(result.text.stdout.trim()).to.eql(
      'release launcher: cold import and narrow authority verified',
    );
    expect(result.stdoutTruncated).to.eql(false);
    expect(result.stderrTruncated).to.eql(false);
  });
});
