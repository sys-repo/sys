import { describe, expect, it } from '../../../../-test.ts';
import { DenoDeploy } from '../../mod.ts';

describe('DenoDeploy.pipeline', () => {
  describe('lifecycle', () => {
    it('creates a lifecycle handle from the root api', () => {
      const deployment = DenoDeploy.pipeline({
        pkgDir: '/repo/code/projects/foo',
        config: { app: 'sample' },
      });

      expect(deployment.disposed).to.eql(false);
      expect(deployment.request.verify).to.eql(undefined);
      expect(typeof deployment.dispose).to.eql('function');
      expect(typeof deployment.run).to.eql('function');
      expect(deployment.$).to.exist;

      deployment.dispose();
    });

    it('disposes once and exposes the disposed state', () => {
      const deployment = DenoDeploy.pipeline({
        pkgDir: '/repo/code/projects/foo',
        config: { app: 'sample' },
      });

      let count = 0;
      deployment.dispose$.subscribe(() => count++);

      expect(deployment.disposed).to.eql(false);

      deployment.dispose();
      deployment.dispose();

      expect(deployment.disposed).to.eql(true);
      expect(count).to.eql(1);
    });

    it('rejects a second run on the same deployment handle', async () => {
      const deployment = DenoDeploy.pipeline({
        pkgDir: '/repo/code/projects/missing',
        config: { app: 'sample' },
      });

      let first: unknown;
      try {
        await deployment.run();
      } catch (error) {
        first = error;
      }

      let second: unknown;
      try {
        await deployment.run();
      } catch (error) {
        second = error;
      }

      expect(first).to.be.instanceOf(Error);
      expect(second).to.be.instanceOf(Error);
      expect((second as Error).message).to.eql(
        'DenoDeploy.pipeline.run(): deployment handles are single-use.',
      );

      deployment.dispose();
    });
  });
});
