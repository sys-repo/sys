import {
  afterAll,
  describe,
  DomMock,
  expect,
  hostFixture,
  it,
  storageFixture,
} from '../../../-test.ts';
import { STORAGE_KEY } from '../common.ts';
import { SAMPLE } from '../-spec/-SAMPLE.dist.json.ts';

const factories = [
  { name: 'Dist', load: () => import('../-spec/-SPEC.Debug.tsx') },
  { name: 'Dist.Browser', load: () => import('../-spec.browser/-SPEC.Debug.tsx') },
] as const;

describe('Dist specimen: explicit clear takes precedence over pending sample changes', () => {
  afterAll(() => DomMock.unpolyfill());
  for (const { name, load } of factories) {
    it(`${name}: detached mode change → later clear survives reconnect`, async () => {
      using storage = storageFixture();
      storage.seed(STORAGE_KEY.DEV, { sampleFilesMode: 'short', dist: SAMPLE.HelloWorld() });
      const { createDebugSignals } = await load();
      const debug = await createDebugSignals();
      const p = debug.props;
      using host = await hostFixture();
      const life = debug.attach(host.ctx, {});

      life.dispose();
      p.sampleFilesMode.value = 'long';
      debug.selectDist(undefined);
      debug.attach(host.ctx, {});
      expect(p.dist.value).to.eql(undefined);
      expect(storage.read(STORAGE_KEY.DEV)?.dist).to.eql(undefined);
      p.sampleFilesMode.value = 'short';
      expect(p.dist.value).to.eql(SAMPLE.HelloWorld({ files: 'short' }));
    });
  }

  it('Dist: detached view change → later clear survives reconnect', async () => {
    using storage = storageFixture();
    storage.seed(STORAGE_KEY.DEV, { debugView: 'UI', dist: SAMPLE.HelloWorld() });
    const { createDebugSignals } = await import('../-spec/-SPEC.Debug.tsx');
    const debug = await createDebugSignals();
    const p = debug.props;
    using host = await hostFixture();
    const life = debug.attach(host.ctx, {});

    life.dispose();
    p.debugView.value = 'UI.Browser';
    debug.selectDist(undefined);
    debug.attach(host.ctx, {});
    expect(p.dist.value).to.eql(undefined);
    expect(storage.read(STORAGE_KEY.DEV)?.dist).to.eql(undefined);
    p.debugView.value = 'UI';
    expect(p.dist.value).to.eql(SAMPLE.HelloWorld({ files: p.sampleFilesMode.value }));
  });
});
