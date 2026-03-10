import { describe, expect, it, stripAnsi } from '../../src/-test.ts';
import { registryErrorLines, releaseGuideLines } from '../task.smoke.ts';

describe('driver-vite smoke guidance', () => {
  it('renders a loud release block for an unpublished version on main', () => {
    const text = stripAnsi(
      releaseGuideLines({
        repoRoot: '/repo',
        moduleDir: '/repo/code/sys.driver/driver-vite',
        pkgName: '@sys/driver-vite',
        version: '0.0.303',
        latest: '0.0.302',
        publishTask: 'deno task publish:jsr',
      }).join('\n'),
    );

    expect(text.includes('SMOKE BLOCKED')).to.eql(true);
    expect(text.includes(' What  │ @sys/driver-vite@0.0.303 is not yet visible via JSR package metadata')).to.eql(true);
    expect(text.includes(' Fix   │ ')).to.eql(true);
    expect(text.includes('       │   cd /repo')).to.eql(true);
    expect(text.includes('       │   deno task publish:jsr')).to.eql(true);
    expect(text.includes(' Retry │ ')).to.eql(true);
    expect(text.includes('       │   cd /repo/code/sys.driver/driver-vite')).to.eql(true);
    expect(text.includes('       │   deno task smoke')).to.eql(true);
  });

  it('renders a branch-specific release block off main', () => {
    const text = stripAnsi(
      releaseGuideLines({
        repoRoot: '/repo',
        moduleDir: '/repo/code/sys.driver/driver-vite',
        pkgName: '@sys/driver-vite',
        version: '0.0.303',
        latest: '0.0.302',
        publishTask: 'deno task publish:jsr:branch',
      }).join('\n'),
    );

    expect(text.includes('       │   deno task publish:jsr:branch')).to.eql(true);
  });

  it('renders a fallback preflight block when jsr metadata is unreachable', () => {
    const text = stripAnsi(
      registryErrorLines({
        repoRoot: '/repo',
        message: 'dns error',
        publishTask: 'deno task publish:jsr:branch',
      }).join('\n'),
    );

    expect(text.includes('SMOKE PREFLIGHT FAILED')).to.eql(true);
    expect(text.includes(' Fix   │ ')).to.eql(true);
    expect(text.includes('       │   cd /repo')).to.eql(true);
    expect(text.includes('       │   deno task publish:jsr:branch')).to.eql(true);
    expect(text.includes(' Error │ dns error')).to.eql(true);
  });
});
