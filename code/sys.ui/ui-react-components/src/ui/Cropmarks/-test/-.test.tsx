import { act, afterEach, beforeEach, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Cropmarks } from '../mod.ts';

describe('<Cropmarks> percent mode', () => {
  DomMock.init({ beforeEach, afterEach });

  it('emits host vars and subject uses cqi/cqb sizing', async () => {
    const rendered = await TestReact.render(
      <Cropmarks size={{ mode: 'percent', width: 80, height: 60 }}>
        <div />
      </Cropmarks>,
    );

    // Subject is the middle cell (index 4) in the 3×3 grid:
    const container = rendered.container as HTMLElement;
    const host = container.firstElementChild as HTMLElement;
    const subject = host.children.item(4) as HTMLElement;
    expect(subject).to.exist;

    const hostCS = window.getComputedStyle(host);
    const subjCS = window.getComputedStyle(subject);

    // Host exposes variables:
    expect(hostCS.getPropertyValue('--pct-w').trim()).to.equal('80');
    expect(hostCS.getPropertyValue('--pct-h').trim()).to.equal('60');

    // Subject sizes via container query units (Happy DOM resolves var() in computed styles):
    const norm = (s: string) => s.replace(/\s+/g, '');
    expect(norm(subjCS.getPropertyValue('inline-size'))).to.equal('calc(min(80,100)*1cqi)');
    expect(norm(subjCS.getPropertyValue('block-size'))).to.equal('calc(min(60,100)*1cqb)');

    act(() => rendered.dispose());
    rendered.disposed;

    await Promise.resolve();
  });
});
