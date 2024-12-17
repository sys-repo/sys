import { type t, Fs, pkg, Tmpl } from './common.ts';

export async function runTemplate(args: {
  inDir: t.StringDir;
  srcDir?: t.StringDir;
  version?: t.StringSemver;
  force?: boolean;
}) {
  const { force = false, srcDir = './docs' } = args;
  const templatesDir = Fs.resolve('./src/-tmpl/files');
  const targetDir = args.inDir;

  const tmpl = Tmpl.create(templatesDir, (e) => {
    const file = e.file.target;
    const subpath = file.path.slice(args.inDir.length + 1);

    if (file.exists && is.userspace(subpath)) {
      return e.exclude('user-space');
    }

    if (file.name === 'deno.json') {
      const self = pkg;
      const version = args.version ?? self.version;
      const importUri = `jsr:${self.name}@${version}`;
      const text = e.text
        .replace(/<ENTRY>/g, `${importUri}/main`)
        .replace(/<SELF_IMPORT_URI>/, importUri)
        .replace(/<SELF_IMPORT_NAME>/, self.name);
      e.modify(text);
    }

    if (file.path.endsWith('/.vitepress/config.ts')) {
      const text = e.text.replace(/<SRC_DIR>/, srcDir);
      e.modify(text);
    }
  });

  const res = await tmpl.copy(targetDir, { force });
  return res;
}

/**
 * Helpers
 */
const is = {
  withinHiddenDir(path: string): boolean {
    const dirs = path.split('/').slice(0, -1);
    return dirs.some((dir) => dir.startsWith('.'));
  },
  userspace(path: string): boolean {
    if (is.withinHiddenDir(path)) return false;
    const ignore = ['.gitignore', 'deno.json', 'package.json'];
    const isIgnored = ignore.some((m) => path.split('/').slice(-1)[0] === m);
    return !isIgnored;
  },
} as const;
