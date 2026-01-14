import { default as denojson } from '../deno.json' with { type: 'json' };
export { Path } from '@sys/std';

export const Paths = {
  workspace: denojson.workspace,

  /**
   * System Module Graph (ESM):
   */
  get modules() {
    return Paths.all;
    // return Paths.single; // 🐷 NARROW
  },
  single: [
    //
    'code/sys.tools',
    'code/sys.driver/driver-process',
  ],
  all: [
    // types:
    'code/sys/types',

    /**
     * sys:
     */
    'code/sys/std',
    'code/sys/crdt.t',
    'code/sys/color',
    'code/sys/cli',
    'code/sys/crypto',
    'code/sys/immutable',
    'code/sys/fs',

    'code/sys/testing',
    'code/sys/process',
    'code/sys/net',
    'code/sys/event',
    'code/sys/http',
    'code/sys/yaml',
    'code/sys/schema',

    'code/sys/jsr',
    'code/sys/text',
    'code/sys/tmpl-engine',

    /**
     * sys.ui:
     */
    'code/sys.ui/ui-state',
    'code/sys.ui/ui-css',
    'code/sys.ui/ui-dom',
    'code/sys.ui/ui-react',
    'code/sys.ui/ui-react-devharness',
    'code/sys.ui/ui-react-components',
    'code/sys.ui/ui-factory',

    /**
     * sys.driver:
     */
    'code/sys.driver/driver-deno',
    'code/sys.driver/driver-vite',
    'code/sys.driver/driver-automerge',
    'code/sys.driver/driver-farcaster',
    'code/sys.driver/driver-process',
    'code/sys.driver/driver-mastra',
    'code/sys.driver/driver-monaco',
    'code/sys.driver/driver-prosemirror',

    /**
     * Curated (named) entry points and
     * higher-order bundles of system functionality:
     */
    'code/sys/crdt',

    /**
     * sys.dev: (programming system)
     */
    'code/-tmpl',
    'code/sys.tools',
    'code/sys.dev',

    /**
     * Instance (conceptually: "an app"):
     */
    'deploy/@tdb.slc',
    'deploy/@tdb.slc.fs',
  ],
} as const;
