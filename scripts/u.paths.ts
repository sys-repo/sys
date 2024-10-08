import { default as Pkg } from '../deno.json' with { type: 'json' };
export { Path } from '@sys/std';

export const Paths = {
  modules: [
    // Standard Libs.
    'code/sys/std',
    'code/sys/std-s',
    'code/sys/types',
    
    // User Interface.
    'code/sys.ui/ui-react',
    
    // Drivers.
    'code/sys.driver/driver-automerge',
    'code/sys.driver/driver-deno',
    'code/sys.driver/driver-vite',

    // →| dev/null
    'code/sys.tmp',
  ],

  workspace: Pkg.workspace
} as const;
