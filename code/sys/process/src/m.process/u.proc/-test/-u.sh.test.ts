import { describe, expect, it } from '../../../-test.ts';
import { Process } from '../../mod.ts';

describe('Process.sh', () => {
  it('run: "echo"', async () => {
    const sh = Process.sh({ silent: true });
    const res = await sh.run('echo foo');
    expect(res.code).to.eql(0);
    expect(res.success).to.eql(true);
    expect(res.text.stdout).to.eql('foo\n');
  });

  it('stderr does NOT flip success (strict default true)', async () => {
    const sh = Process.sh({ silent: true }); // strict:true adds set -e only
    const res = await sh.run('echo "oops" 1>&2; echo "still-ok"');
    expect(res.code).to.eql(0);
    expect(res.success).to.eql(true);
    expect(res.text.stderr.trim()).to.eql('oops');
    expect(res.text.stdout.trim()).to.eql('still-ok');
  });

  it('strict:true → set -e stops on failing simple command', async () => {
    const sh = Process.sh({ silent: true, strict: true });
    // `false` fails; with set -e the shell exits immediately and does not echo "two"
    const res = await sh.run('false; echo "two"');
    expect(res.code).to.not.eql(0);
    expect(res.success).to.eql(false);
    expect(res.text.stdout.includes('two')).to.eql(false);
  });

  it('strict:false → no set -e, continues after failure', async () => {
    const sh = Process.sh({ silent: true, strict: false });
    // Without set -e, the script continues past `false` and exits with the last command's code (0)
    const res = await sh.run('false; echo "two"');
    expect(res.code).to.eql(0);
    expect(res.success).to.eql(true);
    expect(res.text.stdout.includes('two')).to.eql(true);
  });
});
