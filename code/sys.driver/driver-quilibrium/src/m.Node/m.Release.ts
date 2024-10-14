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
  async pull(options: { os?: string; arch?: string; outDir?: string } = {}) {
    const env = Release.env;
    const os = options.os ?? env.os;
    const arch = options.os ?? env.arch;
    const outDir = Fs.resolve(options.outDir ? options.outDir : './.bin/q/');

    const res: t.ReleasePullResponse = {
      is: { newRelease: false },
      version: '',
      files: [],
      env,
    };

    const spinner = Cli.spinner('retrieving releases').start();
    const url = 'https://releases.quilibrium.com/release';
    const httpResponse = await fetch(url);

    const text = await httpResponse.text();
    const lines = text.split('\n');
    const files = lines.filter((line) => line.includes(`${os}-${arch}`));

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

      const basename = Fs.basename(path);
      const printBasename = isFirst ? c.white(basename) : c.gray(basename);
      const printPath = c.gray(`${c.dim(Fs.dirname(path))}/${printBasename}`);
      const printSize = c.gray(`(${fileSize})`);
      spinner.succeed(`Saved ${printSize} ${printPath}`);
    };

    const downloadIfNotLocal = async (file: string, i: number) => {
      try {
        await Deno.stat(`./${file}`); // Success: found locally (when no error).
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          // The file does not exist, download it now...
          await download(file, i);
          res.is.newRelease = true;
        } else {
          throw err;
        }
      }
    };

    // Check each file and download if it doesn't exist locally.
    for (const [i, file] of files.entries()) {
      await downloadIfNotLocal(file, i);
    }

    /**
     * Log footer.
     */
    console.info();
    if (res.is.newRelease) {
      const title = c.white(`${c.brightGreen('Quilibrium')} ${res.version}`);
      const line = c.green(`New ${c.bold(title)} release downloaded.`);
      console.info(line);
    } else {
      console.info(c.gray('No new releases found.'));
    }
    console.info();

    // Finish up.
    return res;
  },
};
