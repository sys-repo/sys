import { default as Pkg } from '../deno.json' with { type: 'json' };
export { Path } from '@sys/std';

export const Paths = {
  modules: [
    // Standard Libs.
    'code/sys/std',
    'code/sys/std-s',
    
    // User Interface.
    'code/sys.ui/ui-react',
    'code/sys.ui/ui-vite',
    
    // Drivers.
    'code/sys.driver/driver-deno',
    'code/sys.driver/driver-automerge',

    // →| dev/null
    'code/sys.tmp',
  ],

  workspace: Pkg.workspace
} as const;
