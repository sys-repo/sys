import { Cmd } from '../mod.ts';
import type { t } from './common.ts';
import type { C } from './t.ts';

const Is = Cmd.Is;

export function flagsTests(setup: t.CmdTestSetup, args: t.TestArgs) {
  const { describe, it, expect } = args;

  describe('Cmd.Is', () => {
    const log = Cmd.DEFAULTS.log();
    const NON = [null, undefined, 123, 'abc', {}, [], Symbol('foo'), BigInt(0)];

    it('Is.state.cmd', () => {
      NON.forEach((invalid) => expect(Is.state.cmd(invalid)).to.eql(false));
      expect(Is.state.cmd({ queue: [], log })).to.eql(true);

      const item = { name: 'foo', params: { foo: 123 }, tx: '123', id: 'abc' };
      expect(Is.state.cmd({ queue: [item], log })).to.eql(true);
      NON.forEach((invalid) => expect(Is.state.cmd({ queue: [item, invalid], log })).to.eql(false));
    });

    it('Is.state.item', () => {
      NON.forEach((invalid) => expect(Is.state.item(invalid)).to.eql(false));
      expect(Is.state.item({ name: '', params: {}, tx: '', id: '' })).to.eql(true);
    });

    it('Is.state.total', () => {
      NON.forEach((invalid) => expect(Is.state.item(invalid)).to.eql(false));
      expect(Is.state.log(log)).to.eql(true);
    });

    it('Is.cmd', async () => {
      const { dispose, doc } = await setup();
      const cmd = Cmd.create<C>(doc);
      NON.forEach((v) => expect(Is.cmd(v)).to.eql(false));
      expect(Is.cmd(cmd)).to.eql(true);
      dispose();
    });
  });
}
