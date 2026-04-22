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
    if (bootstrap.viteMajor(vite) < 8) return undefined;

    const authority = await ViteStartup.Projection.create({
      cwd: cwd as t.StringAbsoluteDir,
      vite,
    });
    return await ViteStartup.Delivery.create({ authority });
  },
} as const;

const bootstrap = {
  viteMajor(specifier: string) {
    const match = specifier.match(/^npm:vite@(\d+)/);
    return match ? Number(match[1]) : 0;
  },
} as const;
