import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  hostFixture,
  it,
  storageFixture,
} from '../../../-test.ts';
import { D } from '../common.ts';

type DebugModule = typeof import('../-spec/-SPEC.Debug.tsx');
const storageKey = `dev:${D.displayName}`;

describe('Anchor spec: persisted view', () => {
  let storage: ReturnType<typeof storageFixture>;
  let host: Awaited<ReturnType<typeof hostFixture>>;
  let debugModule: DebugModule;
  beforeAll(async () => {
    storage = storageFixture();
    debugModule = await import('../-spec/-SPEC.Debug.tsx');
  });
  beforeEach(async () => void (host = await hostFixture()));
  afterEach(() => host[Symbol.dispose]());
  afterAll(async () => {
    storage[Symbol.dispose]();
    await DomMock.unpolyfill();
  });

  it('reopens the selected view and drops retired flags on reset', () => {
    storage.seed(storageKey, { linkExamples: true });
    const debug = debugModule.createDebugSignals();
    using _attachment = debug.attach(host.ctx, {});
    expect(debug.props.examples.value).to.eql('links');
    debug.props.examples.value = 'button';
    expect(debugModule.createDebugSignals().props.examples.value).to.eql('button');
    debug.reset();
    expect(debugModule.createDebugSignals().props.examples.value).to.eql('none');
    expect(storage.read(storageKey)).not.to.have.property('linkExamples');
  });
});
