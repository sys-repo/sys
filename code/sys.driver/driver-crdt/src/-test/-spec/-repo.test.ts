import { Fs } from '@sys/fs';
import { Process } from '@sys/process';
import { describe, Err, expect, it, Json, type t } from '../-test.ts';

type Report = {
  readonly engine: string;
  readonly pid: number;
  readonly sameHandle: boolean;
  readonly value: t.FixtureNote;
  readonly ownerHeads: readonly string[];
  readonly mergedHeads: readonly string[];
};

describe('Repo control | supported import is a seam, not an admission protocol', () => {
  it('public Repo.import → peer text and owner title merge in the same handle; child exits naturally', async () => {
    // Pinned Repo.shutdown does not drain its sync throttle. Await a bounded natural exit;
    // do not claim immediate shutdown quiescence, disable sanitizers, or add a fixed sleep.
    const output = await Process.capture({
      cmd: 'deno',
      cwd: Fs.resolve(import.meta.dirname ?? '.', '../../..'),
      args: ['task', 'probe:repo'],
      executionTimeout: 20_000,
      maxStdoutBytes: 16_000,
      maxStderrBytes: 16_000,
    });
    if (output.text.stderr) console.info(`Repo native control stderr:\n${output.text.stderr}`);
    expect(output.outcome, output.text.stderr).to.equal('exited');
    expect(output.success, output.text.stderr).to.equal(true);
    expect(output.stdoutTruncated).to.equal(false);
    expect(output.stderrTruncated).to.equal(false);
    expect(output.termination.reason).to.equal(null);
    const report = Json.parse<Report>(output.text.stdout);
    if (!report) throw Err.std('Repo control returned no JSON report.');
    expect(report.engine).to.equal('repo');
    expect(report.pid).not.to.equal(Deno.pid);
    expect(report.sameHandle).to.equal(true);
    expect(report.value.title).to.equal('Owner title');
    expect(report.value.text).to.equal('abc');
    expect(report.ownerHeads.length).to.be.greaterThan(0);
    expect(report.mergedHeads).to.eql(report.ownerHeads);
  });
});
