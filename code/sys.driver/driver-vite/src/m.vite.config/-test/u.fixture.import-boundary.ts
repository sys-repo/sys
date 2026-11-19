import { Path } from '@sys/fs/path';
import { Is } from '@sys/std/is';
import { INITIALIZATION_ERROR } from './u.fixture.import-boundary.error.ts';

const [mode] = Deno.args;
for (const name of ['write', 'net', 'run', 'ffi', 'sys'] as const) {
  const status = await Deno.permissions.query({ name });
  if (status.state === 'granted') throw new Error(`Unexpected ${name} authority.`);
}

if (mode === 'root' || mode === 'config') {
  const { ViteConfig } = await import('@sys/driver-vite/config');
  const cwd = Path.dirname(Path.fromFileUrl(import.meta.url));
  const config = { root: cwd };
  if (ViteConfig.define(config) !== config) throw new Error('define changed config identity.');
  const paths = ViteConfig.paths({ cwd });
  if (paths.cwd !== cwd || !ViteConfig.Is.paths(paths)) {
    throw new Error('Path helpers changed their contract.');
  }
  if (mode === 'root') {
    const driver = await import('@sys/driver-vite');
    if (driver.ViteConfig !== ViteConfig || driver.Vite.Config !== ViteConfig) {
      throw new Error('Root exports changed configuration identity.');
    }
    const plugins = driver.ViteTransport.denoPlugin();
    if (!Is.array(plugins) || plugins.length !== 2) {
      throw new Error('Transport factory changed its synchronous contract.');
    }
  }
} else {
  let failure: unknown;
  try {
    switch (mode) {
      case 'app': {
        const { ViteConfig } = await import('@sys/driver-vite/config');
        await ViteConfig.app();
        break;
      }
      case 'fromFile': {
        const { ViteConfig } = await import('@sys/driver-vite/config');
        const config = new URL(
          '../../-test/vite.sample-config/simple/vite.config.ts',
          import.meta.url,
        );
        await ViteConfig.fromFile(Path.fromFileUrl(config));
        break;
      }
      case 'resolver': {
        const { DenoLoaderResolver } = await import('../../m.vite.transport/u.resolve/u.loader.ts');
        await DenoLoaderResolver.create();
        break;
      }
      case 'load': {
        const { loadDenoModule } = await import('../../m.vite.transport/u/u.load.ts');
        const { toDenoSpecifier } = await import('../../m.vite.transport/u/u.specifier.ts');
        const path = Path.fromFileUrl(import.meta.url);
        await loadDenoModule(toDenoSpecifier('TypeScript', import.meta.url, path));
        break;
      }
      default:
        throw new Error(`Unknown boundary mode: ${mode}`);
    }
  } catch (cause) {
    failure = cause;
  }
  if (failure !== INITIALIZATION_ERROR) {
    throw new Error(`Expected dependency initialization rejection for ${mode}.`, {
      cause: failure,
    });
  }
}

console.info(`import-boundary:${mode}:ok`);
