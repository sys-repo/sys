import { type t, c, Fs, Cli } from './common.ts';

/**
 * Tools for pulling and managing Quilbrium nodes releases.
 */
export const Release: t.ReleaseLib = {
  get env() {
    const os = Deno.build.os;
    let arch = Deno.build.arch as string;
    if (arch === 'x86_64') arch = 'amd64'; // Map Deno architecture labels to release architecture naming
    if (arch === 'aarch64') arch = 'arm64';
    return { os, arch };
  },

  /**
   * Source: @king's "V2 pull" script.
   *         https://www.snippets.so/snip/bafkreigs3ozrcezbcmbmkvuzgjkqfnn5ybt66loyuoketervc3c6xb7piu
   */
  async pull(options = {}) {
    const { rootDir, force = false } = options;
    const env = Release.env;
    const os = options.os ?? env.os;
    const arch = options.os ?? env.arch;
    const outDir = Fs.resolve(options.outDir ? options.outDir : './.bin/quilibrium/');

    const res: t.ReleasePullResponse = {
      version: '',
      is: { newRelease: false },
      env,
      files: [],
    };

    const spinner = Cli.spinner('retrieving releases').start();
    const url = 'https://releases.quilibrium.com/release';
    const httpResponse = await fetch(url);

    const text = await httpResponse.text();
    const lines = text.split('\n');
    const files = lines.filter((line) => line.includes(`${os}-${arch}`));
    res.files.push(...files);

    // Derive version.
    const versionMatch = lines[0]?.match(/node-(\d+\.\d+\.\d+(?:\.\d+)?)/);
    res.version = versionMatch ? versionMatch[1] : '';

    spinner.succeed(`Manifest retrieved. ${c.dim(url)}`);
    console.info(c.gray(`  Version ${c.white(res.version)}`));
    console.info(c.green(`  ↓`));

    const download = async (file: string, index: t.Index) => {
      const isFirst = index === 0;
      const fileUrl = `https://releases.quilibrium.com/${file}`;
      const spinner = Cli.spinner(`${c.bold('Downloading')}: ${c.cyan(fileUrl)}`);

      const path = Fs.join(outDir, file);
      const fileRes = await fetch(fileUrl);
      const fileBuffer = await fileRes.arrayBuffer();
      const fileData = new Uint8Array(fileBuffer);
      const fileSize = Cli.Text.bytes(fileData.byteLength);

      await Fs.ensureDir(Fs.dirname(path));
      await Deno.writeFile(path, fileData);

      const dirname = Fs.dirname(path);
      const basename = Fs.basename(path);
      const printDir = rootDir ? dirname.substring(rootDir?.length ?? 0) : dirname;
      const printBasename = isFirst ? c.white(basename) : c.gray(basename);
      const printPath = c.gray(`${c.dim(printDir)}/${printBasename}`);
      const printSize = c.gray(`(${fileSize})`);
      spinner.succeed(`Saved ${printSize} ${printPath}`);
    };

    const downloadIfNotLocal = async (file: string, i: number) => {
      const path = Fs.join(outDir, file);
      const exists = await Fs.exists(path);
      if (exists && !force) return;

      // The file does not exist, download it now...
      res.is.newRelease = true;
      await download(file, i);
    };

    // Check each file and download if it doesn't exist locally.
    for (const [i, file] of files.entries()) {
      await downloadIfNotLocal(file, i);
    }

    /**
     * Log footer.
     */
    if (res.is.newRelease) {
      const title = c.white(`${c.brightGreen('Quilibrium')} ${res.version}`);
      const line = c.green(`New ${c.bold(title)} release downloaded.`);
      console.info();
      console.info(line);
    } else {
      console.info(c.gray(`  ${c.green('•')} Latest release already exists.`));
      console.info();
    }

    // Finish up.
    return res;
  },
};
