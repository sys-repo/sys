import { default as denojson } from '../deno.json' with { type: 'json' };
export { Path } from '@sys/std';

export const Paths = {
  workspace: denojson.workspace,

  /**
   * (namespace "@sys")
   */
  modules: [
    /** Abstract types: */
    'code/sys/types',
    'code/sys/crdt.t',

    /**
     * sys:
     */
    'code/sys/std',
    'code/sys/color',
    'code/sys/cli',
    'code/sys/crypto',
    'code/sys/fs',
    'code/sys/schema',

    'code/sys/testing',
    'code/sys/process',

    'code/sys/http',
    'code/sys/cmd',
    'code/sys/text',
    'code/sys/tmpl-engine',
    'code/sys/jsr',

    /**
     * sys.ui:
     */
    'code/sys.ui/ui-css',
    'code/sys.ui/ui-dom',
    'code/sys.ui/ui-react',
    'code/sys.ui/ui-react-devharness',
    'code/sys.ui/ui-react-components',
    'code/sys.ui/ui-factory',

    /**
     * sys.driver:
     */
    'code/sys.driver/driver-automerge',
    'code/sys.driver/driver-deno',
    'code/sys.driver/driver-farcaster',
    'code/sys.driver/driver-mastra',
    'code/sys.driver/driver-monaco',
    'code/sys.driver/driver-vite',
    'code/sys.driver/driver-peerjs',
    'code/sys.driver/driver-prosemirror',

    /**
     * system → surfacing driver(s) namespaces:
     */
    'code/sys/crdt',

    /**
     * sys.dev: (programming system)
     */
    'code/-tmpl',
    'code/sys.dev',

    /**
     * Instance (conceptually: "an app"):
     */
    'deploy/@tdb.fs',
    'deploy/@tdb.slc',
    'deploy/@tdb.slc.fs',
  ],
} as const;
