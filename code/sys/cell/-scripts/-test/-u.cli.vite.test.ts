import { describe, expect, expectError, it, type t } from '../../src/-test.ts';
import { runVite } from '../u.cli.vite.ts';

describe('@sys/cell Vite launcher signal setup', () => {
  const signals = Deno.build.os === 'windows'
    ? ['SIGINT'] as const
    : ['SIGINT', 'SIGWINCH'] as const;
  for (const target of signals) {
    for (const mode of ['unsupported', 'throw'] as const) {
      it(`${target} ${mode} → releases earlier attachments without acquiring a child`, async () => {
        const failure = new Error('registration failed');
        const requested: t.Process.Signal.Name[] = [];
        const released: t.Process.Signal.Name[] = [];
        const error = await expectError(() =>
          runVite([], {
            on(name) {
              requested.push(name);
              if (name !== target) return { kind: 'attached', dispose: () => released.push(name) };
              if (mode === 'throw') throw failure;
              return { kind: 'unsupported' };
            },
            spawnChild() {
              throw new Error('Child acquired before required signals attached.');
            },
          })
        );
        if (mode === 'throw') expect(error).to.equal(failure);
        else expect(error.message).to.eql(`Cell Vite launcher requires ${target}.`);
        const earlier = target === 'SIGWINCH' ? ['SIGINT', 'SIGTERM', 'SIGHUP'] : [];
        expect(requested).to.eql([...earlier, target]);
        expect(released).to.eql(earlier);
      });
    }
  }

  if (Deno.build.os !== 'windows') {
    it('registration and rollback fail → releases the remaining attachments and reports both failures', async () => {
      const registration = new Error('SIGWINCH registration failed');
      const release = new Error('SIGINT release failed');
      const released: t.Process.Signal.Name[] = [];
      let spawns = 0;
      const error = await expectError(() =>
        runVite([], {
          on(name) {
            if (name === 'SIGWINCH') throw registration;
            return {
              kind: 'attached',
              dispose() {
                released.push(name);
                if (name === 'SIGINT') throw release;
              },
            };
          },
          spawnChild() {
            spawns++;
            throw new Error('Unexpected spawn.');
          },
        })
      );
      expect(spawns).to.eql(0);
      expect(released).to.eql(['SIGINT', 'SIGTERM', 'SIGHUP']);
      expect(error).to.be.instanceOf(AggregateError);
      expect(error.cause).to.equal(registration);
      expect(error.errors).to.have.length(2);
      expect(error.errors[0]).to.equal(registration);
      expect(error.errors[1]).to.equal(release);
    });
  }
});
