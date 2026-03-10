import { describe, expect, it, stripAnsi } from '../../src/-test.ts';
import { registryErrorLines, releaseGuideLines } from '../task.smoke.ts';

describe('driver-vite smoke guidance', () => {
  it('renders a loud release block for an unpublished version', () => {
    const text = stripAnsi(
      releaseGuideLines({
        repoRoot: '/repo',
        moduleDir: '/repo/code/sys.driver/driver-vite',
        pkgName: '@sys/driver-vite',
        version: '0.0.303',
        latest: '0.0.302',
      }).join('\n'),
    );

    expect(text.includes('SMOKE BLOCKED')).to.eql(true);
    expect(text.includes('WHAT  │ @sys/driver-vite@0.0.303 is not published on JSR')).to.eql(true);
    expect(text.includes('RUN   │ deno task publish:jsr:main')).to.eql(true);
    expect(text.includes('RETRY │ cd /repo/code/sys.driver/driver-vite && deno task smoke')).to.eql(true);
  });

  it('renders a fallback preflight block when jsr metadata is unreachable', () => {
    const text = stripAnsi(
      registryErrorLines({
        repoRoot: '/repo',
        message: 'dns error',
      }).join('\n'),
    );

    expect(text.includes('SMOKE PREFLIGHT FAILED')).to.eql(true);
    expect(text.includes('FIX   │ cd /repo')).to.eql(true);
    expect(text.includes('RUN   │ deno task publish:jsr:main')).to.eql(true);
    expect(text.includes('ERROR │ dns error')).to.eql(true);
  });
});
