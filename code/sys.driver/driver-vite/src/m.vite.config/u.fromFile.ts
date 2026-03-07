import { loadConfigFromFile } from 'vite';
import { type t, Delete, Err, Fs, Path, PATHS } from './common.ts';

/**
 * Attempts to dynamically load a `vite.config.ts` module.
 */
export const fromFile: t.ViteConfigLib['fromFile'] = async (input) => {
  const errors = Err.errors();
  const { configRoot, configFile } = wrangle.configDir(input);

  /**
   * TODO 🐷 change configRoot to ./.tmp/sample/<vite.config.ts>
   */
  if (configFile && !(await Fs.exists(configFile))) {
    const root = Path.dirname(configFile);
    errors.push(`A config file could not be found in directory: ${root}`);
    return Delete.undefined<t.ViteConfigFromFile>({
      exists: false,
      paths: undefined,
      error: errors.toError(),
    });
  }

  const command = 'build';
  const mode = 'production';
  const fromFile = await loadConfigFromFile(
    { command, mode }, // param: configEnv
    configFile, //        param: configFile
    configRoot, //        param: configRoot
    undefined, //         param: logLevel
    undefined, //         param: customLogger
    'native', //          param: configLoader
  );

  const exists = fromFile !== null;
  if (!exists) {
    const root = configFile ? Path.dirname(configFile) : configRoot;
    errors.push(`A config file could not be found in directory: ${root}`);
  }

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
    if (typeof input !== 'string') return { configRoot: Path.cwd(), configFile: undefined };
    if (input.endsWith('vite.config.ts')) {
      return { configRoot: Path.dirname(input), configFile: input };
    }
    return { configRoot: input, configFile: undefined };
  },
} as const;
