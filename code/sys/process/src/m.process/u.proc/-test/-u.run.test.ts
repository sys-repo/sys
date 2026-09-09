import { describe, expect, it } from '../../../-test.ts';
import { Process } from '../../mod.ts';

describe('Process.run', () => {
  it('runs a dedented multiline script (auto trim) → stdout', async () => {
    const res = await Process.run(
      `
      echo "one"
      echo "two"
    `,
      { silent: true },
    );

    expect(res.code).to.eql(0);
    expect(res.success).to.eql(true);
    expect(res.text.stdout).to.eql('one\ntwo\n');
    expect(res.text.stderr).to.eql('');
  });

  it('dedent removes leading/trailing blank lines', async () => {
    const res = await Process.run(
      `

        echo "ok"

    `,
      { silent: true },
    );

    expect(res.code).to.eql(0);
    expect(res.text.stdout).to.eql('ok\n');
  });

  it('stderr does NOT flip success (strict default true)', async () => {
    const res = await Process.run(
      `
      echo "oops" 1>&2
      echo "still-ok"
    `,
      { silent: true },
    );

    expect(res.code).to.eql(0);
    expect(res.success).to.eql(true);
    expect(res.text.stderr.trim()).to.eql('oops');
    expect(res.text.stdout.trim()).to.eql('still-ok');
  });

  it('strict:true (default) stops on failure', async () => {
    const res = await Process.run(
      `
      false
      echo "should-not-print"
    `,
      { silent: true },
    ); // default strict:true

    expect(res.code).to.not.eql(0);
    expect(res.success).to.eql(false);
    expect(res.text.stdout.includes('should-not-print')).to.eql(false);
  });

  it('strict:false continues after failure', async () => {
    const res = await Process.run(
      `
      false
      echo "continued"
    `,
      { silent: true, strict: false },
    );

    expect(res.code).to.eql(0);
    expect(res.success).to.eql(true);
    expect(res.text.stdout.includes('continued')).to.eql(true);
  });

  it('path option sets working directory (shell $PWD)', async () => {
    // Create a temp dir and run `pwd` there.
    const tmp = await Deno.makeTempDir();
    const res = await Process.run(`pwd`, { silent: true, path: tmp });
    const pwd = res.text.stdout.trim();

    // On some shells pwd may resolve symlinks/normalization; just assert suffix.
    expect(pwd.endsWith(tmp)).to.eql(true);
  });
});
