import { createRoot } from 'react-dom/client';
import { DomMock, act, describe, expect, it } from '../../-test.ts';
import { Cropmarks } from './mod.ts';

describe('<Cropmarks> percent mode', { sanitizeResources: false, sanitizeOps: false }, () => {
  DomMock.polyfill();

  it('emits host vars and subject uses cqi/cqb sizing', async () => {
    const mount = document.createElement('div');
    mount.style.width = '1000px';
    mount.style.height = '600px';
    document.body.appendChild(mount);

    const root = createRoot(mount);
    await act(async () => {
      root.render(
        <Cropmarks size={{ mode: 'percent', width: 80, height: 60 }}>
          <div />
        </Cropmarks>,
      );
      await Promise.resolve();
    });

    // Subject is the middle cell (index 4) in the 3×3 grid:
    const host = mount.firstElementChild as HTMLElement;
    const subject = host.children.item(4) as HTMLElement;
    expect(subject).to.exist;

    const hostCS = window.getComputedStyle(host);
    const subjCS = window.getComputedStyle(subject);

    // Host exposes variables:
    expect(hostCS.getPropertyValue('--pct-w').trim()).to.equal('80');
    expect(hostCS.getPropertyValue('--pct-h').trim()).to.equal('60');

    // Subject sizes via container query units (Happy DOM resolves var() in computed styles):
    const norm = (s: string) => s.replace(/\s+/g, '');
    expect(norm(subjCS.getPropertyValue('inline-size'))).to.equal('calc(80*1cqi)');
    expect(norm(subjCS.getPropertyValue('block-size'))).to.equal('calc(60*1cqb)');

    root.unmount();
    mount.remove();
  });
});
