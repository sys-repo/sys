import { loadConfigFromFile } from 'vite';
import { type t, Delete, Err, Path, PATHS } from './common.ts';

/**
 * Attempts to dynamically load a `vite.config.ts` module.
 */
export const fromFile: t.ViteConfigLib['fromFile'] = async (input) => {
  const errors = Err.errors();
  const configRoot = wrangle.configDir(input);

  /**
   * TODO 🐷 change configRoot to ./.tmp/sample/<vite.config.ts>
   */

  const command = 'build';
  const mode = 'production';
  const fromFile = await loadConfigFromFile(
    { command, mode }, // param: configEnv
    undefined, //         param: configFile
    configRoot, //        param: configRoot
    undefined, //         param: logLevel
    undefined, //         param: customLogger
    'native', //          param: configLoader
  );

  const exists = fromFile !== null;
  if (!exists) errors.push(`A config file could not be found in directory: ${configRoot}`);

  let paths: t.ViteConfigPaths | undefined;
  if (exists) {
    paths = {
      cwd: Path.dirname(fromFile.path),
      app: {
        entry: Path.trimCwd(Path.join(fromFile.config.root ?? '', PATHS.html.index)),
        outDir: Path.trimCwd(fromFile.config.build?.outDir ?? PATHS.dist),
        base: fromFile.config.base ?? PATHS.base,
      },
    };
  }

  return Delete.undefined<t.ViteConfigFromFile>({
    exists,
    paths,
    error: errors.toError(),
  });
};

/**
 * Helpers
 */
const wrangle = {
  configDir(input?: string) {
    if (typeof input !== 'string') return Path.cwd();
    if (input.endsWith('vite.config.ts')) return Path.dirname(input);
    return input;
  },
} as const;
