import { Spec } from '@sys/ui-dev/react/devharness';
import { afterAll, describe, DomMock, expect, it, TestReact } from '../-test.ts';
import { Color, Signal } from '../common.ts';
import { D as Label, STORAGE_KEY } from '../ui.react/ui/Text.Label/common.ts';
import { D as Manuscript } from '../ui.react/ui/Prose.Manuscript/common.ts';
import type { DebugSignals as LabelDebug } from '../ui.react/ui/Text.Label/-spec/-SPEC.Debug.tsx';
import type { DebugSignals as ManuscriptDebug } from '../ui.react/ui/Prose.Manuscript/-spec/-SPEC.Debug.tsx';
import { hostFixture, projectionFixture, storageFixture } from './u.fixture.specimen-lifecycle.ts';

describe('Consumer specimens: attachment-owned effects', () => {
  afterAll(DomMock.unpolyfill);

  it('Text.Label: attach → share, retire and reconnect', async () => {
    using storage = storageFixture();
    const key = STORAGE_KEY.DEV;
    storage.seed(key, { debug: false, theme: 'Light', unrelated: 'keep' });
    using projection = projectionFixture(key);
    const { default: suite } = await import('../ui.react/ui/Text.Label/-spec/-SPEC.tsx');
    await suite.init();
    expect(projection.count, 'factory does not acquire reactive persistence').to.eql(0);
    using a = await hostFixture(suite);
    await a.run();
    const debug = await a.debug<LabelDebug>();
    const p = debug.props;
    const identities = { ...p };
    const initial = a.ctx.toObject().props;
    expect(projection.count).to.eql(1);
    expect(initial.subject.display).to.eql('grid');
    expect(initial.subject.size).to.eql(undefined);
    expect(initial.host.tracelineColor).to.eql(0.03);
    {
      using rendered = await TestReact.render(await a.subject());
      const { container } = rendered;
      const label = container.querySelector(`[data-component="${Label.displayName}"]`);
      expect(label).not.to.eql(null);
      expect(container.textContent).to.include('Current value / selected overflow');
    }

    // Absent size must not clear an inherited subject configuration on repeat init.
    a.ctx.subject.size([321, null]);
    const inheritedSize = a.ctx.toObject().props.subject.size;
    await a.init();
    expect(a.ctx.toObject().props.subject.size).to.eql(inheritedSize);
    expect(projection.count).to.eql(1);
    const repeated = a.redraws;
    p.width.value = 360;
    expect(a.redraws - repeated).to.eql(1);
    expect(projection.count).to.eql(2);

    using b = await hostFixture(suite);
    await b.run();
    const sharedDebug = await b.debug<LabelDebug>();
    expect(sharedDebug.props).to.include(identities);
    expect(projection.count, 'joining does not acquire a second projection').to.eql(2);
    a.ctx.host.backgroundColor('tomato').tracelineColor(0.7);
    a.ctx.subject.backgroundColor('gold');
    const counts = { a: a.redraws, b: b.redraws, projections: projection.count };
    p.debug.value = true;
    expect(a.redraws - counts.a).to.eql(1);
    expect(b.redraws - counts.b).to.eql(1);
    expect(projection.count - counts.projections).to.eql(1);
    const customPaint = a.ctx.toObject().props;
    expect(customPaint.host).to.include({ backgroundColor: 'tomato', tracelineColor: 0.7 });
    expect(customPaint.subject.backgroundColor).to.eql('gold');
    expect(storage.read(key)).to.include({ debug: true, width: 360, unrelated: 'keep' });

    const themeRedraws = { a: a.redraws, b: b.redraws };
    p.theme.value = 'Dark';
    expect(a.redraws - themeRedraws.a).to.eql(1);
    expect(b.redraws - themeRedraws.b).to.eql(1);
    const themed = a.ctx.toObject().props;
    expect(themed.host).to.include({ backgroundColor: Color.DARK, tracelineColor: 0.08 });
    expect(b.ctx.toObject().props.host.tracelineColor).to.eql(0.08);

    const reset = await a.controller.reset.fire();
    expect(reset.error).to.eql(undefined);
    expect(await a.controller.ctx.get()).to.equal(a.ctx);
    const retiredA = a.redraws;
    const liveB = b.redraws;
    const shared = projection.count;
    p.debug.value = false;
    expect(a.redraws).to.eql(retiredA);
    expect(b.redraws - liveB).to.eql(1);
    expect(projection.count - shared).to.eql(1);
    b.controller.dispose();

    // Stale preferences must not overwrite detached in-memory edits on reconnect.
    storage.seed(key, { debug: true, theme: 'Dark', value: 'stale', unrelated: 'external' });
    const beforeA = a.ctx.toObject().props;
    const beforeB = b.ctx.toObject().props;
    const detached = {
      projections: projection.count,
      redraws: { a: a.redraws, b: b.redraws },
      hostA: { ...beforeA.host },
      hostB: { ...beforeB.host },
      backgroundA: beforeA.subject.backgroundColor,
      backgroundB: beforeB.subject.backgroundColor,
    };
    p.value.value = 'Retained after detach';
    p.width.value = 180;
    p.theme.value = 'Light';
    const afterA = a.ctx.toObject().props;
    const afterB = b.ctx.toObject().props;
    expect(projection.count).to.eql(detached.projections);
    expect(a.redraws).to.eql(detached.redraws.a);
    expect(b.redraws).to.eql(detached.redraws.b);
    expect(afterA.host).to.eql(detached.hostA);
    expect(afterB.host).to.eql(detached.hostB);
    expect(afterA.subject.backgroundColor).to.eql(detached.backgroundA);
    expect(afterB.subject.backgroundColor).to.eql(detached.backgroundB);
    expect(storage.read(key)).to.include({ debug: true, theme: 'Dark', value: 'stale' });

    await a.run();
    const reconnected = await a.debug<LabelDebug>();
    expect(reconnected.props).to.include(identities);
    expect(projection.count - detached.projections).to.eql(1);
    expect(storage.read(key)).to.include({
      debug: false,
      theme: 'Light',
      value: 'Retained after detach',
      width: 180,
      unrelated: 'external',
    });
    expect(a.ctx.toObject().props.host.tracelineColor).to.eql(0.03);
    a.controller.dispose();
    const disposed = { projections: projection.count, a: a.redraws, b: b.redraws };
    p.width.value = 240;
    p.theme.value = 'Dark';
    expect(projection.count).to.eql(disposed.projections);
    expect(a.redraws).to.eql(disposed.a);
    expect(b.redraws).to.eql(disposed.b);
  });

  it('Prose.Manuscript: attach → reset, reconnect and replace', async () => {
    using storage = storageFixture();
    const key = `dev:${Manuscript.displayName}`;
    const { default: suite } = await import('../ui.react/ui/Prose.Manuscript/-spec/-SPEC.tsx');
    await suite.init();
    expect(storage.read(key)).to.eql({ debug: false, theme: 'Light' });
    using projection = projectionFixture(key);
    using host = await hostFixture(suite);
    await host.run();
    const debug = await host.debug<ManuscriptDebug>();
    const p = debug.props;
    const identities = { ...p };
    expect(Signal.toObject(p)).to.eql({ debug: false, theme: 'Light' });
    expect(projection.count).to.eql(1);
    const initial = host.ctx.toObject().props;
    expect(initial.subject).to.include({ display: 'grid' });
    expect(initial.subject.size).to.eql({
      mode: 'fill',
      x: true,
      y: true,
      margin: [50, 50, 50, 50],
    });
    {
      using rendered = await TestReact.render(await host.subject());
      const { container } = rendered;
      const manuscript = container.querySelector(`[data-component="${Manuscript.componentAttr}"]`);
      const heading = container.querySelector('h1');
      expect(manuscript).not.to.eql(null);
      expect(heading?.textContent).to.eql('Heading-1');
    }
    await host.init();
    expect(projection.count).to.eql(1);
    storage.seed(key, { debug: false, theme: 'Light', unrelated: 'keep' });
    host.ctx.host.backgroundColor('tomato');
    host.ctx.subject.backgroundColor('gold');
    const counts = { redraws: host.redraws, projections: projection.count };
    p.debug.value = true;
    expect(host.redraws - counts.redraws).to.eql(1);
    expect(projection.count - counts.projections).to.eql(1);
    const customPaint = host.ctx.toObject().props;
    expect(customPaint.host.backgroundColor).to.eql('tomato');
    expect(customPaint.subject.backgroundColor).to.eql('gold');

    p.theme.value = 'Dark';
    const themed = host.ctx.toObject().props;
    expect(themed.host.backgroundColor).to.eql(Color.DARK);
    expect(themed.subject.backgroundColor).to.eql(0);
    debug.reset();
    expect(p).to.include(identities);
    expect(Signal.toObject(p)).to.eql({ debug: false, theme: 'Light' });
    expect(storage.read(key)).to.eql({ debug: false, theme: 'Light', unrelated: 'keep' });
    expect(host.ctx.toObject().props.subject.backgroundColor).to.eql(1);

    const reset = await host.controller.reset.fire();
    expect(reset.error).to.eql(undefined);
    const detached = { redraws: host.redraws, projections: projection.count };
    p.theme.value = 'Dark';
    p.debug.value = true;
    expect(host.redraws).to.eql(detached.redraws);
    expect(projection.count).to.eql(detached.projections);
    expect(storage.read(key)).to.eql({ debug: false, theme: 'Light', unrelated: 'keep' });
    await host.run();
    const reconnected = await host.debug<ManuscriptDebug>();
    expect(reconnected.props).to.include(identities);
    expect(projection.count - detached.projections).to.eql(1);
    expect(storage.read(key)).to.eql({ debug: true, theme: 'Dark', unrelated: 'keep' });

    const successor = Spec.describe('successor', (e) => {
      e.it('init', (e) => {
        const ctx = Spec.ctx(e);
        ctx.host.backgroundColor('tomato');
        ctx.subject.backgroundColor('gold').render(() => <div>successor</div>);
      });
    });
    const loaded = await host.controller.load.fire(successor);
    expect(loaded.error).to.eql(undefined);
    await host.run();
    const replaced = { redraws: host.redraws, projections: projection.count };
    p.theme.value = 'Light';
    p.debug.value = false;
    const successorPaint = host.ctx.toObject().props;
    expect(host.redraws).to.eql(replaced.redraws);
    expect(projection.count).to.eql(replaced.projections);
    expect(successorPaint.host.backgroundColor).to.eql('tomato');
    expect(successorPaint.subject.backgroundColor).to.eql('gold');
    expect(storage.read(key)).to.eql({ debug: true, theme: 'Dark', unrelated: 'keep' });
  });
});
