import { default as denojson } from '../deno.json' with { type: 'json' };
export { Path } from '@sys/std';

export const Paths = {
  workspace: denojson.workspace,
  modules: [
    /**
     * @sys: standard libs.
     */
    'code/sys/types',
    'code/sys/std',
    'code/sys/color',

    'code/sys/testing',
    'code/sys/fs',
    'code/sys/cli',
    'code/sys/process',
    'code/sys/crypto',

    'code/sys/http',
    'code/sys/cmd',
    'code/sys/text',
    'code/sys/tmpl',
    'code/sys/jsr',

    /**
     * →| dev/null
     */
    'code/sys.tmp',

    /**
     * UI
     */
    'code/sys.ui/ui-css',
    'code/sys.ui/ui-dom',
    'code/sys.ui/ui-react',
    'code/sys.ui/ui-react-devharness',
    'code/sys.ui/ui-react-components',

    /**
     * Drivers
     */
    // 'code/sys.driver/driver-automerge',
    'code/sys.driver/driver-deno',
    'code/sys.driver/driver-immer',
    'code/sys.driver/driver-vite',
    'code/sys.driver/driver-vitepress',

    //
    'code/sys.driver/driver-obsidian',
    'code/sys.driver/driver-ollama',
    'code/sys.driver/driver-orbiter',
    'code/sys.driver/driver-quilibrium',

    /**
     * Barrels
     */
    'code/sys/sys',
    'code/sys/main',
  ],
} as const;
