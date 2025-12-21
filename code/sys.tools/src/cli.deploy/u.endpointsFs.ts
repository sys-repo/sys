import { type t, Str } from './common.ts';

const ENDPOINTS_DIR = '-endpoints' satisfies t.DeployTool.EndpointsFs.DirName;
const ENDPOINTS_EXT = '.yaml' satisfies t.DeployTool.EndpointsFs.Ext;

export const EndpointsFs = {
  dir: ENDPOINTS_DIR,
  ext: ENDPOINTS_EXT,

  fileOf(name: string): t.StringPath {
    return `${ENDPOINTS_DIR}/${name}${ENDPOINTS_EXT}`;
  },

  /**
   * Canonical starting YAML for a new endpoint.
   * Keep this minimal and schema-aligned.
   */
  initialYaml(name: string): string {
    return Str.dedent(
      `
      # deploy endpoint: ${name}

      mappings: []
    `,
    ).trimStart();
  },
} as const;
