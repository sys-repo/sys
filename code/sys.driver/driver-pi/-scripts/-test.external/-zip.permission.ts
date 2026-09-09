import { Fixture as ArchiveFixture } from '../../../../sys/archive/src/m.Zip/-test/u.fixture.ts';
import { describe, Err, expect, Fs, it, Process } from '../common.ts';

/** Keep process authority outside ordinary unit discovery and leave the test-host preset unchanged. */
describe('Pi: ZIP narrow runtime', () => {
  it('source/destination fixture reads and destination-only writes → no run, net, FFI, env or sys', async () => {
    const tmp = Fs.resolve(import.meta.dirname ?? '.', '../../.tmp');
    await Fs.ensureDir(tmp);
    let unsettled = false;
    await using fixture = {
      root: (await Fs.makeTempDir({ dir: tmp, prefix: 'zip-permission.' })).absolute,
      async [Symbol.asyncDispose]() {
        if (unsettled) {
          throw Err.std(`Child settlement unconfirmed; fixture retained at ${this.root}`);
        }
        await Fs.remove(this.root);
      },
    };
    const source = Fs.join(fixture.root, 'source');
    const destination = Fs.join(fixture.root, 'destination');
    await Fs.write(
      Fs.join(source, 'a.zip'),
      ArchiveFixture.zip([{ name: 'a.txt', data: 'hello', method: 8 }]).bytes,
      { throw: true },
    );
    await Fs.ensureDir(destination);
    unsettled = true;
    const output = await Process.capture({
      args: [
        'run',
        '--frozen',
        '--cached-only',
        '--no-prompt',
        `--allow-read=${source},${destination}`,
        `--allow-write=${destination}`,
        `--deny-write=${source}`,
        '--deny-run',
        '--deny-net',
        '--deny-ffi',
        '--deny-env',
        '--deny-sys',
        new URL('./u.zip.permission.ts', import.meta.url).href,
        source,
        destination,
      ],
      clearEnv: true,
      executionTimeout: 30_000,
      maxStdoutBytes: 8_192,
      maxStderrBytes: 16_384,
    });
    unsettled = output.outcome !== 'failed-to-start' && output.status === null;
    expect(output.outcome, output.text.stderr).to.eql('exited');
    expect(output.success, output.text.stderr).to.eql(true);
    expect(output.stdoutTruncated).to.eql(false);
    expect(output.stderrTruncated).to.eql(false);
    expect(output.text.stdout.trim()).to.eql('ZIP_NARROW_OK');
  });
});
