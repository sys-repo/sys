import { default as denojson } from '../deno.json' with { type: 'json' };
export { Path } from '@sys/std';

export const Paths = {
  workspace: denojson.workspace,

  /**
   * System Module Graph (ESM):
   */
  get modules() {
    // return Paths.single; // 🐷 NARROW
    return Paths.all;
  },
  single: [
    'code/sys.driver/driver-vite',
    //
  ],
  all: [
    // generated:start workspace-topological
    'code/sys/types',
    'code/sys/std',
    'code/sys/color',
    'code/sys.ui/ui-css',
    'code/sys/cli',
    'code/sys/crdt.t',
    'code/sys/crypto',
    'code/sys/event',
    'code/sys.ui/ui-state',
    'code/sys/immutable',
    'code/sys.ui/ui-dom',
    'code/sys/fs',
    'code/sys/net',
    'code/sys/process',
    'code/sys.driver/driver-process',
    'code/sys.driver/driver-signer',
    'code/sys/http',
    'code/sys/registry',
    'code/sys/skills',
    'code/sys/testing',
    'code/sys.ui/ui-react',
    'code/sys.ui/ui-react-devharness',
    'code/sys/text',
    'code/sys/tmpl-engine',
    'code/sys/yaml',
    'code/sys/esm',
    'code/sys/schema',
    'code/sys.model/model',
    'code/sys.model/model-slug',
    'code/sys.ui/ui-react-components',
    'code/sys.driver/driver-automerge',
    'code/sys.driver/driver-monaco',
    'code/sys.driver/driver-prosemirror',
    'code/sys.driver/driver-stripe',
    'code/sys.ui/ui-factory',
    'code/sys.dev',
    'code/sys/crdt',
    'code/sys/workspace',
    'code/sys.driver/driver-deno',
    'code/-tmpl',
    'code/sys.driver/driver-vite',
    'code/sys.tools',
    'deploy/@tdb.slc.data',
    'deploy/@tdb.slc.fs',
    'deploy/@tdb.slc.std',
    'deploy/@tdb.edu.slug',
    'deploy/sample.proxy',
    // generated:end workspace-topological
  ],
} as const;
