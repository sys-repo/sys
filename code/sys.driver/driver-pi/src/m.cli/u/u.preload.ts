import { Fs, Json, Str } from '../common.ts';
import { PI_AGENT_IMPORT_BASE } from './u.resolve.pkg.ts';

// Complete entry contract: no other imports or work can run before synchronous deregistration.
// Match source, not a release number; dependency upgrades need no adapter-version maintenance.
const BOOTSTRAP = Str.dedent(`
  #!/usr/bin/env node
  import { createRequire, enableCompileCache } from "node:module";

  enableCompileCache();
  createRequire(import.meta.url)("./cli-runtime.js");
`);

/** Materialize for the official package; the child checks capability and bootstrap before hooking. */
export async function writePreload(tmp: string, pkg: string) {
  if (pkg !== PI_AGENT_IMPORT_BASE && !pkg.startsWith(`${PI_AGENT_IMPORT_BASE}@`)) return undefined;
  await Fs.ensureDir(tmp);
  const dir = (await Fs.makeTempDir({ dir: tmp, prefix: 'pi-preload.' })).absolute;
  try {
    const sources = preloadSources({ lifetime: 'startup', trace: false });
    const path = Fs.join(dir, 'preload.mjs');
    await Fs.write(Fs.join(dir, 'facade.mjs'), sources.facade, { throw: true });
    await Fs.write(path, sources.preload, { throw: true });
    return { dir, path } as const;
  } catch (error) {
    // No child can exist while its adapter is still being materialized.
    await removePreload(dir);
    throw error;
  }
}

/** Only call before spawn or after confirmed child exit; preserve the original outcome. */
export async function removePreload(dir: string) {
  try {
    await Fs.remove(dir);
  } catch (error) {
    console.info(`Could not remove Pi preload directory: ${dir}`, error);
  }
}

/** Shared generator; alternate lifetime/module/bootstrap and tracing are diagnostic seams only. */
export function preloadSources(options: {
  lifetime: 'persistent' | 'startup';
  module?: string;
  bootstrap?: string;
  trace?: boolean;
}) {
  const module = Json.stringify(options.module ?? 'node:module');
  const bootstrap = Json.stringify(
    (options.bootstrap ?? BOOTSTRAP).replaceAll('\r\n', '\n').trim(),
  );
  const trace = options.trace !== false;
  // Native JSON is the isolated child's diagnostic wire format; add no loader dependencies.
  const resolveTrace = trace
    ? "console.info('PRELOAD resolve ' + JSON.stringify({ specifier, parent: context.parentURL }));"
    : '';
  const disableStatement = options.lifetime === 'startup'
    ? 'disable();'
    : '// Persistent lifetime is a falsification control, not a production default.';

  const preload = Str.dedent(`
    // The namespace is required: a missing named import fails before inspection;
    // the default export does not describe the ESM named-export surface.
    import * as Module from ${module};

    const main = Deno.mainModule;
    const bootstrap = ${bootstrap};
    const facade = new URL('./facade.mjs', import.meta.url).href;
    let hook;
    export function disable() {
      if (hook === undefined) return;
      hook.deregister();
      hook = undefined;
      ${trace ? "console.info('PRELOAD deregistered');" : ''}
    }

    ${trace ? "console.info('PRELOAD main ' + main);" : ''}
    // Approved native-read boundary: keep this isolated preload dependency-free.
    // Inspect only the actual entry, under existing permissions, before any hook exists.
    if ('enableCompileCache' in Module) {
      // Preserve present values, including invalid ones: the original caller owns their errors.
      ${trace ? "console.info('PRELOAD present');" : ''}
    } else if (Deno.readTextFileSync(new URL(main)).replaceAll('\\r\\n', '\\n').trim() !== bootstrap) {
      // Unknown entries run natively; never open an unbounded loader window.
      ${trace ? "console.info('PRELOAD unmatched bootstrap');" : ''}
    } else {
      if (!('registerHooks' in Module)) throw new Error('Missing node:module.registerHooks');
      hook = Module.registerHooks({
        resolve(specifier, context, nextResolve) {
          ${resolveTrace}
          if (specifier === 'node:module' && context.parentURL === main) {
            return { url: facade, shortCircuit: true };
          }
          return nextResolve(specifier, context);
        },
      });
      ${trace ? "console.info('PRELOAD registered');" : ''}
    }
  `);
  const facade = Str.dedent(`
    export * from ${module};
    export { default } from ${module};
    import { disable } from './preload.mjs';

    export function enableCompileCache(...args) {
      if (args.length !== 0) throw new TypeError('Only zero-argument enableCompileCache is supported');
      ${disableStatement}
      return { status: 3 };
    }
  `);
  return { preload, facade } as const;
}
