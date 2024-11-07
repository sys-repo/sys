import { describe, expect, it } from '../-test.ts';
import { R } from './common.ts';
import { Net, Port } from './mod.ts';

describe('Net', () => {
  it('API', () => {
    expect(Net.Port).to.equal(Port);
  });

  describe('Net.Port', () => {
    it('Port.random()', () => {
      const ports = [...Array(50)].map(() => Port.random());
      expect(R.equals(R.uniq(ports), ports)).to.eql(true);
      expect(ports.every((v) => typeof v === 'number')).to.eql(true);
    });

    it('Port.inUse: false', () => {
      // NB: check that none of the randomly generated ports are in use.
      const ports = [...Array(10)].map(() => Port.random());
      expect(ports.every((p) => !Port.inUse(p))).to.eql(true);
    });

    it('Port.inUse: true', () => {
      const port = Port.random();
      const listener = Deno.listen({ port });
      expect(Port.inUse(port)).to.eql(true);
      listener.close();
    });
  });
});
