import { type t, Str, Fs } from './common.ts';

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

  async ensureInitialYaml(path: t.StringPath, filename: string) {
    await Fs.ensureDir(Fs.dirname(path));
    if (await Fs.exists(path)) return;
    await Fs.write(path, EndpointsFs.initialYaml(filename), { force: false });
  },
} as const;
