import { describe, it } from '../../-test.ts';
import { proveVitePty } from './u.fixture.cli.vite.ts';

// Separate follow-up, not part of test:proofs: animated OS signals have a recorded post-exit
// kill EPERM failure. Keep the real reproduction and every cleanup assertion; do not ignore it.
// Run explicitly with: deno task test:cli:vite:signals
// Owner: -agent/-plan/@sys.driver-vite/linux-wsl-probe.plan.md, E.2.
describe('@sys/cell development CLI Vite animated signals PTY', () => {
  for (const mode of ['sigint', 'sigterm'] as const) {
    it(`real PTY → screen resize and ${mode} shutdown restore input mode`, async () => {
      await proveVitePty(mode);
    });
  }
});
