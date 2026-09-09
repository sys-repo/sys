import { c, describe, expect, it } from '../../../-test.ts';
import { Process } from '../../mod.ts';
import { ProcessTest } from '../../-test/u.fixture.ts';

describe('Process.invoke', () => {
  it('invoke → stdout', async () => {
    const args = ProcessTest.evalArgs(`console.log("👋 hello ${c.green('world')}")`);
    const res = await Process.invoke({ args, silent: false });

    expect(res.code).to.eql(0);
    expect(res.success).to.eql(true);

    expect(res.toString()).to.include('👋 hello');
    expect(res.text.stdout).to.eql(res.toString());
    expect(res.text.stderr).to.eql('');
  });

  it('invoke → stderr', async () => {
    const args = ProcessTest.evalArgs('throw new Error("my-error")');
    const res = await Process.invoke({ args, silent: true });

    expect(res.code).to.eql(1);
    expect(res.success).to.eql(false);

    expect(res.toString()).to.include('my-error');
    expect(res.text.stdout).to.eql('');
    expect(res.text.stderr).to.eql(res.toString());
  });
});
