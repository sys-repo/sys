import { type t, describe, expect, Fs, it, Str } from '../../../-test.ts';
import { Provider } from '../../u.providers/mod.ts';
import { pushCapabilityOf } from '../u/u.pushCapability.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';

describe('Deploy: pushCapabilityOf', () => {
  it('skips provider probe when render-time probe is disabled', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = './-config/deploy/foo.yaml';
      await Fs.ensureDir(`${tmp}/-config/deploy`);
      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(
        Fs.join(tmp, yamlPath),
        Str.dedent(`
        provider:
          kind: deno
          app: my-app
        source:
          dir: .
        staging:
          dir: ${tmp}/stage
        mapping:
          dir:
            source: ./pkg
            staging: .
        `),
      );

      let probeCalls = 0;
      const originalProbe = Provider.probe;
      const mutable = Provider as { probe: typeof Provider.probe };

      try {
        mutable.probe = async () => {
          probeCalls += 1;
          return { ok: false, reason: 'failed' };
        };

        const res = await pushCapabilityOf({
          cwd: tmp as t.StringDir,
          yamlPath: yamlPath as t.StringRelativeDir,
          checkOk: true,
          probe: false,
        });

        expect(res.show).to.eql(true);
        if (!res.show) throw new Error('expected push capability to be shown');
        expect(res.enabled).to.eql(true);
        expect(probeCalls).to.eql(0);
      } finally {
        mutable.probe = originalProbe;
      }
    });
  });
});
