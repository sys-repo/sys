import { Json, Str } from '../common.ts';

/** Test-owned generator. The optional module surface is for controlled absence/presence cases only. */
export function preloadSources(options: {
  lifetime: 'persistent' | 'startup';
  module?: string;
}) {
  const module = Json.stringify(options.module ?? 'node:module');
  const preload = Str.dedent(`
    // Inspect ESM export presence without linking a possibly absent named export.
    // A default import is not the named-export surface being adapted.
    import * as Module from ${module};

    const main = Deno.mainModule;
    const facade = new URL('./facade.mjs', import.meta.url).href;
    let hook;
    export function disable() {
      if (hook === undefined) return;
      hook.deregister();
      hook = undefined;
      console.info('PRELOAD deregistered');
    }

    console.info('PRELOAD main ' + main);
    if ('enableCompileCache' in Module) {
      // Preserve present values, including invalid ones: the original caller owns their errors.
      console.info('PRELOAD present');
    } else {
      if (!('registerHooks' in Module)) throw new Error('Missing node:module.registerHooks');
      hook = Module.registerHooks({
        resolve(specifier, context, nextResolve) {
          // Native JSON is the isolated child diagnostic wire format, not a package helper.
          console.info('PRELOAD resolve ' + JSON.stringify({ specifier, parent: context.parentURL }));
          if (specifier === 'node:module' && context.parentURL === main) {
            return { url: facade, shortCircuit: true };
          }
          return nextResolve(specifier, context);
        },
      });
      console.info('PRELOAD registered');
    }
  `);
  const facade = Str.dedent(`
    export * from ${module};
    export { default } from ${module};
    import { disable } from './preload.mjs';

    export function enableCompileCache(...args) {
      if (args.length !== 0) throw new TypeError('Only zero-argument enableCompileCache is supported');
      ${
    options.lifetime === 'startup'
      ? 'disable();'
      : '// Persistent lifetime is a falsification control, not a production default.'
  }
      return { status: 3 };
    }
  `);
  return { preload, facade } as const;
}
