import { default as denojson } from '../deno.json' with { type: 'json' };
export { Path } from '@sys/std';

export const Paths = {
  workspace: denojson.workspace,
  modules: [
    /**
     * Monorepo:
     */
    'code/-tmpl',

    /**
     * @sys: standard-libs:
     */
    'code/sys/types',
    'code/sys/std',
    'code/sys/color',
    'code/sys/cli',
    'code/sys/fs',
    'code/sys/schema',

    'code/sys/testing',
    'code/sys/process',
    'code/sys/crypto',

    'code/sys/http',
    'code/sys/cmd',
    'code/sys/text',
    'code/sys/tmpl',
    'code/sys/jsr',

    /**
     * UI:
     */
    'code/sys.ui/ui-css',
    'code/sys.ui/ui-dom',
    'code/sys.ui/ui-react',
    'code/sys.ui/ui-react-devharness',
    'code/sys.ui/ui-react-components',

    /**
     * Drivers:
     */
    'code/sys.driver/driver-automerge',
    'code/sys.driver/driver-deno',
    'code/sys.driver/driver-farcaster',
    'code/sys.driver/driver-immer',
    'code/sys.driver/driver-monaco',
    'code/sys.driver/driver-vite',
    'code/sys.driver/driver-peerjs',
    'code/sys.driver/driver-prosemirror',

    //
    'code/sys.driver/driver-ollama',
    'code/sys.driver/driver-orbiter',


    /**
     * Instance Apps:
     */
    'deploy/@tdb.fs',
    'deploy/@tdb.slc',
    'deploy/@tdb.slc.fs',

    /**
     * Samples:
     */
    'code/-sample/@sample.tmp',
  ],
} as const;
