import { describe, expect, Fs, Is, it, Testing } from '../../-test.ts';
import { removeStores, runPipeline } from '../-test.external/u.dist.pipeline.cleanup.ts';

type Phase = 'body' | 'close' | 'dispose' | 'stores' | 'root';
type DrainPhase = Exclude<Phase, 'close'> | 'first:close' | 'second:start' | 'second:end';
type FailureCase = {
  readonly name: string;
  readonly rejected: readonly Phase[];
  readonly calls: readonly Phase[];
  readonly failures: readonly Phase[];
};

describe('Dist pipeline cleanup', () => {
  describe('partial setup ownership', () => {
    const cases = [
      { phase: 'root', disposed: 0 },
      { phase: 'source', disposed: 1 },
    ] as const;
    for (const { phase, disposed } of cases) {
      it(`failure after ${phase} allocation → settle owned resources and preserve cause`, async () => {
        const fixture: { root?: string; source?: ReturnType<typeof Testing.Http.server> } = {};
        const original = new Error(`Setup failed after ${phase}.`);
        let disposals = 0;
        let actual: unknown;
        try {
          await runPipeline(async () => {
            fixture.root = (await Fs.makeTempDir({ prefix: 'pipeline-setup-' })).absolute;
            if (phase === 'source') {
              fixture.source = Testing.Http.server(() => new Response('setup control'));
            }
            throw original;
          }, {
            hosts: [],
            async dispose() {
              if (Is.object(fixture.source)) {
                await fixture.source.dispose();
                disposals++;
              }
            },
            async removeStores() {
              if (Is.str(fixture.root)) await removeStores(fixture.root);
            },
            async removeRoot() {
              if (Is.str(fixture.root)) await Fs.remove(fixture.root);
            },
          });
        } catch (cause) {
          actual = cause;
        }
        expect(actual).to.equal(original);
        expect(disposals).to.eql(disposed);
        if (!Is.str(fixture.root)) throw new Error('Expected an allocated fixture root.');
        expect(await Fs.exists(fixture.root)).to.eql(false);
      });
    }
  });

  describe('host drainage', () => {
    it('synchronous close failure → drain the other host before disposing shared resources', async () => {
      const started = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const original = new Error('First host close failed.');
      const calls: DrainPhase[] = [];
      const phase = (name: DrainPhase) => {
        calls.push(name);
        return Promise.resolve();
      };
      const settled = (async () => {
        try {
          await runPipeline(() => phase('body'), {
            hosts: [{
              close() {
                calls.push('first:close');
                throw original;
              },
            }, {
              async close() {
                calls.push('second:start');
                started.resolve();
                await release.promise;
                calls.push('second:end');
              },
            }],
            dispose: () => phase('dispose'),
            removeStores: () => phase('stores'),
            removeRoot: () => phase('root'),
          });
        } catch (cause) {
          return cause;
        }
      })();
      try {
        await started.promise;
        expect(calls).to.eql(['body', 'first:close', 'second:start']);
      } finally {
        release.resolve();
        await settled;
      }
      expect(await settled).to.equal(original);
      expect(calls).to.eql([
        'body',
        'first:close',
        'second:start',
        'second:end',
        'dispose',
        'stores',
        'root',
      ]);
    });
  });

  describe('cleanup order and cause preservation', () => {
    // Callback refusals do not inject failures into actual Tree.remove or lease release.
    const cases: readonly FailureCase[] = [
      {
        name: 'success → complete ordered cleanup',
        rejected: [],
        calls: ['body', 'close', 'dispose', 'stores', 'root'],
        failures: [],
      },
      {
        name: 'body and host failures → preserve both and complete cleanup',
        rejected: ['body', 'close'],
        calls: ['body', 'close', 'dispose', 'stores', 'root'],
        failures: ['body', 'close'],
      },
      {
        name: 'host and source-disposal failures → preserve both and remove the root',
        rejected: ['close', 'dispose'],
        calls: ['body', 'close', 'dispose', 'stores', 'root'],
        failures: ['close', 'dispose'],
      },
      {
        name: 'single host failure → preserve cause identity and complete cleanup',
        rejected: ['close'],
        calls: ['body', 'close', 'dispose', 'stores', 'root'],
        failures: ['close'],
      },
      {
        name: 'body and source-disposal failures → preserve both and complete cleanup',
        rejected: ['body', 'dispose'],
        calls: ['body', 'close', 'dispose', 'stores', 'root'],
        failures: ['body', 'dispose'],
      },
      {
        name: 'store-removal refusal → preserve cause and do not remove the root',
        rejected: ['stores'],
        calls: ['body', 'close', 'dispose', 'stores'],
        failures: ['stores'],
      },
      {
        name: 'body, host and store failures → preserve all three without root deletion',
        rejected: ['body', 'close', 'stores'],
        calls: ['body', 'close', 'dispose', 'stores'],
        failures: ['body', 'close', 'stores'],
      },
      {
        name: 'root-removal failure → preserve cause after eligible cleanup',
        rejected: ['root'],
        calls: ['body', 'close', 'dispose', 'stores', 'root'],
        failures: ['root'],
      },
    ];
    for (const { name, rejected, calls: expectedCalls, failures } of cases) {
      it(name, async () => {
        const calls: Phase[] = [];
        const causes = new Map(rejected.map((phase): [Phase, Error] => [phase, new Error(phase)]));
        const invoke = (phase: Phase) => {
          calls.push(phase);
          return causes.has(phase) ? Promise.reject(causes.get(phase)) : Promise.resolve();
        };
        let failure: unknown;
        try {
          await runPipeline(() => invoke('body'), {
            hosts: [{ close: () => invoke('close') }],
            dispose: () => invoke('dispose'),
            removeStores: () => invoke('stores'),
            removeRoot: () => invoke('root'),
          });
        } catch (cause) {
          failure = cause;
        }
        expect(calls).to.eql(expectedCalls);
        const expectedFailures = failures.map((phase) => causes.get(phase));
        if (expectedFailures.length === 0) expect(failure).to.eql(undefined);
        else if (expectedFailures.length === 1) expect(failure).to.equal(expectedFailures[0]);
        else {
          expect(failure).to.be.instanceOf(AggregateError);
          if (!Is.object(failure) || !('errors' in failure) || !Is.array(failure.errors)) {
            throw new Error('Expected aggregate failure errors.');
          }
          expect(failure.errors).to.eql(expectedFailures);
          for (const [index, cause] of expectedFailures.entries()) {
            expect(failure.errors[index]).to.equal(cause);
          }
        }
      });
    }
  });
});
