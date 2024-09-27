import { describe, expect, it } from '../-test.ts';
import { Cmd } from './mod.ts';

describe('Cmd', () => {
  describe('Cmd.sh', () => {
    it('run: "echo"', async () => {
      const sh = Cmd.sh({ silent: true });
      const res = await sh.run('echo foo');
      expect(res.code).to.eql(0);
      expect(res.success).to.eql(true);
      expect(res.text.stdout).to.eql('foo\n');
    });
  });

  describe('Cmd.invoke', () => {
    it('invoke → stdout', async () => {
      const args = ['eval', 'console.log("👋 hello world")'];
      const res = await Cmd.invoke({ args, silent: true });
      expect(res.code).to.eql(0);
      expect(res.success).to.eql(true);

      expect(res.toString()).to.include('👋 hello world');
      expect(res.text.stdout).to.eql(res.toString());
      expect(res.text.stderr).to.eql('');
    });

    it('invoke → stderr', async () => {
      const args = ['eval', 'throw new Error("my-error")'];
      const res = await Cmd.invoke({ args, silent: true });

      expect(res.code).to.eql(1);
      expect(res.success).to.eql(false);

      expect(res.toString()).to.include('my-error');
      expect(res.text.stdout).to.eql('');
      expect(res.text.stderr).to.eql(res.toString());
    });
  });
});
