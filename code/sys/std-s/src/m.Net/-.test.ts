import { describe, expect, it, Testing } from '../-test.ts';
import { R } from './common.ts';
import { Net, Port } from './mod.ts';

describe('Net', () => {
  it('API', () => {
    expect(Net.Port).to.equal(Port);
    expect(Net.port).to.equal(Port.get);
  });

  describe('Net.Port', () => {
    it('Port.random()', () => {
      Testing.retry(3, () => {
        const ports = [...Array(50)].map(() => Port.random());
        expect(R.equals(R.uniq(ports), ports)).to.eql(true);
        expect(ports.every((v) => typeof v === 'number')).to.eql(true);
      });
    });

    it('Port.inUse: false', () => {
      Testing.retry(3, () => {
        // NB: check that none of the randomly generated ports are in use.
        const ports = [...Array(10)].map(() => Port.random());
        expect(ports.every((p) => !Port.inUse(p))).to.eql(true);
      });
    });

    it('Port.inUse: true', () => {
      Testing.retry(3, () => {
        const port = Port.random();
        const listener = Deno.listen({ port });
        expect(Port.inUse(port)).to.eql(true);
        listener.close();
      });
    });

    describe('Port.get', () => {
      it('returns preference port (not in use)', () => {
        const pref = Port.random();
        const res = Port.get(pref);
        expect(res).to.eql(pref);
      });

      it('port in use → increments', async () => {
        await Testing.retry(3, () => {
          const a = Port.random();
          const b = a + 1;
          const listener1 = Deno.listen({ port: a });
          const listener2 = Deno.listen({ port: b });

          const res = Port.get(a);
          listener1.close();
          listener2.close();

          expect(res).to.eql(a + 2);
        });
      });

      it('port in use → {throw: true}', () => {
        const port = Port.random();
        const listener = Deno.listen({ port });
        const fn = () => Port.get(port, { throw: true });
        expect(fn).to.throw(`Port already in use: ${port}`);
        listener.close();
      });

      it('no port specified, random unused port returned', () => {
        const res = Port.get();
        expect(res).to.not.eql(0);
        expect(typeof res).to.eql('number');
        expect(Port.inUse(res)).to.eql(false);
      });
    });
  });
});
