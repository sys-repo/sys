import { Perf } from '../common/u.perf.ts';
import { type t } from './common.ts';
import { ViteStartup } from '../m.vite.startup/mod.ts';

type BootstrapResult = {
  readonly path: string;
  readonly cleanup: () => Promise<void>;
};

/**
 * Shapes the Deno bootstrap authority for the child Vite CLI.
 * This is intentionally separate from app/plugin resolution.
 */
export const Bootstrap = {
  async create(cwd: string, vite: string): Promise<BootstrapResult | undefined> {
    const end = Perf.section('bootstrap.create', { cwd, vite });
    if (bootstrap.viteMajor(vite) < 8) {
      end({ skipped: true, reason: 'vite<8' });
      return undefined;
    }

    const authority = await Perf.measure('startup.projection.create', async () => await ViteStartup.Projection.create({
      cwd: cwd as t.StringAbsoluteDir,
      vite,
    }), { cwd, vite });
    const handle = await Perf.measure('startup.delivery.create', async () => await ViteStartup.Delivery.create({ authority }), {
      cwd,
      imports: Object.keys(authority.imports).length,
    });
    end({ path: handle.path, imports: Object.keys(authority.imports).length });
    return handle;
  },
} as const;

const bootstrap = {
  viteMajor(specifier: string) {
    const match = specifier.match(/^npm:vite@(\d+)/);
    return match ? Number(match[1]) : 0;
  },
} as const;
