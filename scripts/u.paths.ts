import { default as Pkg } from '../deno.json' with { type: 'json' };
export { Path } from '@sys/std';

export const Paths = {
  modules: [
    /**
     * @sys: standard libs.
     */
    'code/sys/std',
    'code/sys/std-s',
    'code/sys/cmd',
    'code/sys/testing',
    'code/sys/types',
    
    /**
     * UI
     */
    // 'code/sys.ui/ui-react',
    'code/sys.ui/ui-dom',
    
    /**
     * Drivers
     */
    // 'code/sys.driver/driver-automerge',
    'code/sys.driver/driver-deno',
    'code/sys.driver/driver-immer',
    'code/sys.driver/driver-quilibrium',
    'code/sys.driver/driver-vite',

    /**
     * →| dev/null
     */
    'code/sys.tmp',
  ],

  workspace: Pkg.workspace
} as const;
