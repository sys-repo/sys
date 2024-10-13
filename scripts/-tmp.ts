import { c, Cli, Env, Fs, Path } from '@sys/std-s';
const env = await Env.load();

// const match = await Fs.glob().find('code/**/-test.*');
// console.log('match', match);

/**
 * TODO 🐷 move to module: drivers → @sys/driver-quilibrium
 */

/**
 * Quilbrium tools.
 */
export const Q = {
  Release: {
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
      const env = Q.Release.env;
      const os = options.os ?? env.os;
      const arch = options.os ?? env.arch;
      const outDir = Fs.resolve(options.outDir ? options.outDir : './.bin/q/');

      const spinner = Cli.spinner('retrieving releases').start();
      const url = 'https://releases.quilibrium.com/release';
      const res = await fetch(url);

      const text = await res.text();
      const lines = text.split('\n');
      const files = lines.filter((line) => line.includes(`${os}-${arch}`));

      // Derive version.
      const versionMatch = lines[0]?.match(/node-(\d+\.\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : '-';

      let _isNewRelease = false;
      spinner.succeed(`Manifest retrieved. ${c.dim(url)}`);

      console.info(c.gray(`  Version ${c.white(version)}`));
      console.info(c.green(`  ↓`));

      const download = async (file: string, index: t.Index) => {
        const isFirst = index === 0;
        const fileUrl = `https://releases.quilibrium.com/${file}`;
        const spinner = Cli.spinner(`${c.bold('Downloading')}: ${c.cyan(fileUrl)}`);

        const path = Path.join(outDir, file);
        const fileRes = await fetch(fileUrl);
        const fileBuffer = await fileRes.arrayBuffer();
        const fileData = new Uint8Array(fileBuffer);
        const fileSize = Cli.Text.bytes(fileData.byteLength);

        await Fs.ensureDir(Fs.dirname(path));
        await Deno.writeFile(path, fileData);

        const basename = Path.basename(path);
        const printBasename = isFirst ? c.white(basename) : c.gray(basename);
        const printPath = c.gray(`${c.dim(Path.dirname(path))}/${printBasename}`);
        const printSize = c.dim(c.gray(`(${fileSize})`));
        spinner.succeed(`Saved ${printPath}  ${printSize}`);
      };

      // Check each file and download if it doesn't exist locally
      for (const [i, file] of files.entries()) {
        try {
          // Found locally.
          await Deno.stat(`./${file}`);
        } catch (err) {
          if (err instanceof Deno.errors.NotFound) {
            // File does not exist, download it now...
            await download(file, i);
            _isNewRelease = true;
          } else {
            throw err;
          }
        }
      }

      /**
       * Log footer.
       */
      console.info();
      if (_isNewRelease) {
        const title = c.white(`${c.brightGreen('Quilibrium')} ${version}`);
        const line = c.green(`New ${c.bold(title)} release downloaded.`);
        console.info(line);
      } else {
        console.info(c.gray('No new releases found.'));
      }
      console.info();
    },
  },
};

await Q.Release.pull();

/**
 * Finish up.
 */
Deno.exit(0);
