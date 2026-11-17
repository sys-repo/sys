import { describe, expect, it, specimenFixture } from '../../../-test.ts';
import { D } from '../common.ts';
import type { DebugSignals } from '../-spec/-SPEC.Debug.tsx';

describe('ActionProbe specimen', () => {
  it('retirement stops automatic effects, not explicit commands', async () => {
    await using specimen = await specimenFixture<DebugSignals>(
      `dev:${D.displayName}`,
      () => import('../-spec/-SPEC.tsx'),
    );
    const { host, debug } = specimen;
    const p = debug.props;
    const attached = specimen.observe();
    expect(attached.size?.mode).to.eql('fill');

    p.sizeMode.value = 'auto';
    p.theme.value = 'Light';
    const changed = specimen.observe();
    expect(changed.size).to.eql(undefined);
    expect(changed.paint).not.to.eql(attached.paint);
    expect(changed.redraws).to.be.greaterThan(attached.redraws);
    expect(specimen.read()?.sizeMode).to.eql('auto');

    await host.reset();
    const retired = specimen.observe();
    p.sizeMode.value = 'fill';
    p.theme.value = 'Dark';
    expect(specimen.observe()).to.eql(retired);

    debug.action.resultVisible(false);
    expect(specimen.read()?.[D.Persist.key]).to.eql({ resultVisible: false });
    debug.reset();
    expect(specimen.read()?.[D.Persist.key]).to.eql({ resultVisible: true });
    const commands = specimen.observe();
    expect(commands).to.eql({ ...retired, writes: retired.writes + 2 });

    await host.run();
    const reconnected = specimen.observe();
    const retained = await host.debug<DebugSignals>();
    expect(retained.props).to.equal(p);
    expect(reconnected.size).to.eql(attached.size);
    expect(reconnected.paint).to.eql(attached.paint);
    expect(reconnected.redraws).to.be.greaterThan(commands.redraws);
    expect(reconnected.writes).to.eql(commands.writes + 1);
    expect(specimen.read()?.sizeMode).to.eql('fill');
  });
});
