import { describe, expect, it } from '../-test.ts';
import { Cmd } from './mod.ts';

describe('Cmd', () => {
  describe('Cmd.sh', () => {
    it('run: "echo"', async () => {
      const res = await Cmd.sh({ silent: true }).run('echo foo');
      expect(res.code).to.eql(0);
      expect(res.success).to.eql(true);
      expect(res.text.stdout).to.eql('foo\n');
    });
  });
});
