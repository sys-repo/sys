import { default as Pkg } from '../deno.json' with { type: 'json' };
export { Path } from '@sys/std';

export const Paths = {
  modules: [
    /**
     * @sys: standard libs.
     */
    'code/sys/types',
    'code/sys/std',
    
    'code/sys/testing',
    'code/sys/fs',
    'code/sys/cli',
    'code/sys/proc',
    'code/sys/crypto',
    
    'code/sys/std-s',
    'code/sys.tmp',
    
    'code/sys/http',
    'code/sys/cmd',
    'code/sys/text',
    'code/sys/tmpl',
    
    /**
     * UI
     */
    'code/sys.ui/ui-dev-harness',
    'code/sys.ui/ui-dom',
    'code/sys.ui/ui-react',
    
    /**
     * Drivers
     */
    // 'code/sys.driver/driver-automerge',
    'code/sys.driver/driver-deno',
    'code/sys.driver/driver-immer',
    'code/sys.driver/driver-obsidian',
    'code/sys.driver/driver-ollama',    
    'code/sys.driver/driver-orbiter',    
    'code/sys.driver/driver-quilibrium',
    'code/sys.driver/driver-vite',
    'code/sys.driver/driver-vitepress',

    /**
     * Barrels
     */
    'code/sys/sys',
    'code/sys/main',

    /**
     * →| dev/null
     */
    'code/sys.tmp',
  ],

  workspace: Pkg.workspace
} as const;
